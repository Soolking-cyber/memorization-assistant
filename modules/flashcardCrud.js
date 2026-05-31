import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { ICONS } from './icons.js';
import { playUISound } from './sound.js';
import { renderEditorNodes } from './canvas.js';
import { updateDashboard, getSelectedTypes } from './dashboard.js';
import { validateExampleSentence } from './practice.js';
import { switchView } from './navigation.js';
import { renderStatistics } from './stats.js';
import { dbGet, dbSet, dbDelete } from './db.js';
import { queueTransaction } from './syncQueue.js';

import {
    handleCreateAddSentence,
    renderCreateSentencesList,
    deleteDraftCreateSentence,
    handleEditAddSentence,
    renderEditSentencesList,
    deleteEditSentence
} from './card/sentenceBuilder.js';

export {
    handleCreateAddSentence,
    renderCreateSentencesList,
    deleteDraftCreateSentence,
    handleEditAddSentence,
    renderEditSentencesList,
    deleteEditSentence
};

export function updateFormLabelsAndPlaceholders(isEdit, type) {
    const labelFront = document.querySelector(`label[for="${isEdit ? 'edit-card-front' : 'card-front'}"]`);
    const labelBack = document.querySelector(`label[for="${isEdit ? 'edit-card-back' : 'card-back'}"]`);
    const textareaFront = document.getElementById(isEdit ? 'edit-card-front' : 'card-front');
    const textareaBack = document.getElementById(isEdit ? 'edit-card-back' : 'card-back');
    const sentencesGroup = document.getElementById(isEdit ? 'edit-vocab-sentences-group' : 'create-vocab-sentences-group');

    if (type === 'Image Card') {
        if (labelFront) labelFront.textContent = "Concept Prompt (Front)";
        if (textareaFront) textareaFront.placeholder = "e.g. Tie a shoe sequence / Krebs cycle stages";
        if (labelBack) labelBack.textContent = "Numbered Sequence Steps (Back)";
        if (textareaBack) textareaBack.placeholder = "Type each step on a new line, numbered, e.g.:\n1. Make a loop\n2. Swoop and pull\n3. Tie tight";
        if (sentencesGroup) sentencesGroup.classList.add('hidden');
    } else {
        if (labelFront) labelFront.textContent = "Concept (Front)";
        if (textareaFront) textareaFront.placeholder = "What is the powerhouse of the cell?";
        if (labelBack) labelBack.textContent = "Recall (Back / Target Word)";
        if (textareaBack) textareaBack.placeholder = "Mitochondria";
        if (sentencesGroup) sentencesGroup.classList.remove('hidden');
    }
}

export async function fetchAndCacheReviewLogs() {
    if (!state.userSession || !supabase) return;
    const { data, error } = await supabase
        .from('review_logs')
        .select('card_id, score, grade, created_at')
        .eq('user_id', state.userSession.user.id);
        
    if (error) {
        console.error("Error loading review logs from DB:", error);
        return;
    }
    
    const formattedLogs = (data || []).map(log => ({
        timestamp: new Date(log.created_at).getTime(),
        cardId: log.card_id,
        grade: log.grade,
        score: log.score
    }));
    
    await dbSet('review_activity_logs', formattedLogs);
}

export async function loadData() {
    if (!state.userSession || !supabase) return;
    
    const syncInd = document.getElementById('sync-indicator');
    if (syncInd) syncInd.classList.remove('hidden');
    
    try {
        // 1. Fetch only lightweight metadata fields from Supabase
        const { data: metadataList, error: metadataError } = await supabase
            .from('flashcards')
            .select('id, user_id, type, nextReview, ease, interval, repetitions, created_at')
            .eq('user_id', state.userSession.user.id);

        if (metadataError) {
            console.error("Error loading card metadata:", metadataError);
            return;
        }

        const metadataMap = new Map(metadataList.map(m => [m.id, m]));
        let cacheChanged = false;

        // 2. Remove cards deleted from the remote DB from local state
        const originalLength = state.cards.length;
        state.cards = state.cards.filter(c => {
            const stillExists = metadataMap.has(c.id);
            if (!stillExists) cacheChanged = true;
            return stillExists;
        });

        const cardsMap = new Map(state.cards.map(c => [c.id, c]));
        const idsToFetch = [];

        // 3. Find cards that are new, modified, or missing full details in cache
        for (const meta of metadataList) {
            const cached = cardsMap.get(meta.id);
            if (!cached) {
                // New card
                idsToFetch.push(meta.id);
            } else {
                // Modified card or missing full body fields
                const metaChanged = 
                    cached.type !== meta.type ||
                    cached.nextReview !== meta.nextReview ||
                    cached.ease !== meta.ease ||
                    cached.interval !== meta.interval ||
                    cached.repetitions !== meta.repetitions;

                const hasFullBody = 
                    cached.front !== undefined && 
                    cached.back !== undefined;

                if (metaChanged || !hasFullBody) {
                    idsToFetch.push(meta.id);
                }
            }
        }

        // 4. Perform selective query to pull full details ONLY for targeted card IDs
        if (idsToFetch.length > 0) {
            console.log(`Selective sync: fetching full details for ${idsToFetch.length} new/changed cards.`);
            const { data: fullCards, error: fullError } = await supabase
                .from('flashcards')
                .select('*')
                .in('id', idsToFetch);

            if (fullError) {
                console.error("Error fetching full details for selective sync:", fullError);
            } else if (fullCards) {
                cacheChanged = true;
                
                // Merge fetched full records
                for (const fullCard of fullCards) {
                    const idx = state.cards.findIndex(c => c.id === fullCard.id);
                    if (idx !== -1) {
                        state.cards[idx] = fullCard;
                    } else {
                        state.cards.push(fullCard);
                    }
                }
            }
        }

        // 5. Complete type migrations and example sentence mapping
        let migratedCards = [];
        state.cards.forEach(card => {
            let needsUpdate = false;
            if (!card.type || card.type === 'General' || card.type === 'mixed') {
                card.type = 'Unknown';
                needsUpdate = true;
                cacheChanged = true;
            }
            if (needsUpdate) {
                migratedCards.push(card);
            }
            
            if (card.example_sentences) {
                state.exampleSentences[card.id] = card.example_sentences;
            } else {
                if (!state.exampleSentences[card.id]) {
                    state.exampleSentences[card.id] = [];
                }
            }
        });

        // 6. Write to DB/cache if any updates were made
        if (cacheChanged) {
            await dbSet('cached_cards', state.cards);
            await dbSet('exampleSentences', state.exampleSentences);
        }

        if (migratedCards.length > 0) {
            console.log(`Migrating ${migratedCards.length} cards with missing types...`);
            Promise.all(migratedCards.map(card => 
                supabase.from('flashcards')
                    .update({ type: card.type })
                    .eq('id', card.id)
                    .eq('user_id', state.userSession.user.id)
            )).then(() => {
                console.log("Database migration and synchronization complete!");
            }).catch(err => {
                console.error("Failed to sync migrated cards to database:", err);
            });
        }
        
        await fetchAndCacheReviewLogs();
        
        updateDashboard();
        const statsView = document.getElementById('view-stats');
        if (statsView && !statsView.classList.contains('hidden')) {
            renderStatistics();
        }
    } catch (err) {
        console.error("Critical error inside loadData background fetch:", err);
    } finally {
        if (syncInd) syncInd.classList.add('hidden');
    }
}

export async function insertCardToDB(card) {
    if (!state.userSession || !supabase) return;
    const { error } = await supabase
        .from('flashcards')
        .insert([{
            user_id: state.userSession.user.id,
            front: card.front,
            back: card.back,
            nextReview: card.nextReview,
            ease: card.ease,
            interval: card.interval,
            repetitions: card.repetitions
        }]);

    if (error) console.error("Error inserting:", error);
}

export async function updateCardInDB(card) {
    if (!state.userSession || !supabase) return;

    // Immediately save local state to IndexedDB cache so changes reflect instantly
    await dbSet('cached_cards', state.cards);

    const payload = {
        id: card.id,
        nextReview: card.nextReview,
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions
    };

    if (!navigator.onLine) {
        console.log("[Offline] Queued card update transaction.");
        await queueTransaction('update_card', payload);
        return;
    }

    try {
        const { error } = await supabase
            .from('flashcards')
            .update({
                nextReview: card.nextReview,
                ease: card.ease,
                interval: card.interval,
                repetitions: card.repetitions
            })
            .eq('id', card.id)
            .eq('user_id', state.userSession.user.id);
            
        if (error) {
            console.error("Error updating card, queueing transaction:", error);
            await queueTransaction('update_card', payload);
        }
    } catch (err) {
        console.warn("Exception during card update, queueing transaction:", err);
        await queueTransaction('update_card', payload);
    }
}

export function updateBatchUI() {
    const selected = document.querySelectorAll('.card-checkbox:checked').length;
    const countEl = document.getElementById('selected-count');
    const deleteBtn = document.getElementById('btn-delete-selected');
    if (countEl) countEl.textContent = `${selected} selected`;
    if (selected > 0) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }
}

export async function batchDeleteCards(ids) {
    if (!state.userSession || !supabase) return;
    
    const deleteBtn = document.getElementById('btn-delete-selected');
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;

    const idSet = new Set(ids);
    const cardsToDelete = state.cards.filter(c => idSet.has(c.id));
    const imagePaths = [];
    
    cardsToDelete.forEach(card => {
        if (card.image_front_url) {
            const parts = card.image_front_url.split('/');
            imagePaths.push(parts[parts.length - 1]);
        }
        if (card.image_back_url) {
            const parts = card.image_back_url.split('/');
            imagePaths.push(parts[parts.length - 1]);
        }
    });

    const { error } = await supabase
        .from('flashcards')
        .delete()
        .in('id', ids)
        .eq('user_id', state.userSession.user.id);
        
    if (error) {
        console.error("Error deleting:", error);
        await window.alert("Failed to delete memories.");
        deleteBtn.textContent = 'Delete Selected';
        deleteBtn.disabled = false;
    } else {
        if (imagePaths.length > 0) {
            await supabase.storage.from('card_images').remove(imagePaths);
        }

        ids.forEach(id => {
            delete state.exampleSentences[id];
        });
        await dbSet('exampleSentences', state.exampleSentences);

        await loadData();
        renderManageView();
    }
}

export function renderManageView() {
    const list = document.getElementById('manage-list');
    const toolbar = document.getElementById('manage-toolbar');
    const selectAllCb = document.getElementById('select-all-checkbox');
    const deleteBtn = document.getElementById('btn-delete-selected');
    list.innerHTML = '';
    
    if (state.cards.length === 0) {
        list.innerHTML = '<p class="status-msg">No memories found.</p>';
        toolbar.classList.add('hidden');
        return;
    }

    const activeTypes = getSelectedTypes('manage-type-select');
    let filteredCards = state.cards.filter(c => activeTypes.includes(c.type));

    const searchInput = document.getElementById('manage-search-input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQuery) {
        filteredCards = filteredCards.filter(c => {
            let frontMatchText = c.front.toLowerCase();
            if (c.front.startsWith('{"mode":"memory_map"')) {
                try {
                    const mapData = JSON.parse(c.front);
                    frontMatchText = `${mapData.title || ''} ${mapData.nodes ? mapData.nodes.map(n => n.text + ' ' + (n.explanation || '')).join(' ') : ''}`.toLowerCase();
                } catch (e) {}
            }
            const backMatchText = (c.back || '').toLowerCase();
            
            const savedSentences = state.exampleSentences[c.id];
            let sentencesString = '';
            if (Array.isArray(savedSentences)) {
                sentencesString = savedSentences.join(' ').toLowerCase();
            } else if (typeof savedSentences === 'string') {
                sentencesString = savedSentences.toLowerCase();
            }
            
            return frontMatchText.includes(searchQuery) || 
                   backMatchText.includes(searchQuery) || 
                   sentencesString.includes(searchQuery);
        });
    }
    
    if (filteredCards.length === 0) {
        if (searchQuery) {
            list.innerHTML = '<p class="status-msg">No memories found matching your search query.</p>';
        } else {
            list.innerHTML = '<p class="status-msg">No memories found for this type.</p>';
        }
        toolbar.classList.add('hidden');
        return;
    }

    toolbar.classList.remove('hidden');
    selectAllCb.checked = false;
    updateBatchUI();

    filteredCards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'glass manage-card';
        
        let frontImgHtml = card.image_front_url ? `<img src="${card.image_front_url}" class="manage-card-img" alt="Front">` : '';
        let backImgHtml = card.image_back_url ? `<img src="${card.image_back_url}" class="manage-card-img" alt="Back">` : '';

        const savedSentences = state.exampleSentences[card.id];
        let sentencesArray = [];
        if (Array.isArray(savedSentences)) {
            sentencesArray = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentencesArray = [savedSentences];
        }

        let sentencesHtml = '';
        if (sentencesArray.length > 0) {
            sentencesHtml = `
                <div class="manage-sentences-list" style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
                    <strong style="font-size: 0.8rem; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">Saved Clues:</strong>
                    ${sentencesArray.map((s, idx) => `
                        <div class="manage-sentence-item" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 8px; font-size: 0.85rem;">
                            <span style="flex: 1; margin-right: 8px; line-height: 1.4;">${s}</span>
                            <button type="button" class="delete-sentence-bank-btn" data-card-id="${card.id}" data-index="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 4px; display:inline-flex; align-items:center;" title="Delete Clue">${ICONS.trash}</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let displayFront = '';
        if (card.front.startsWith('{"mode":"memory_map"')) {
            try {
                const mapData = JSON.parse(card.front);
                displayFront = `<strong style="color:var(--accent);">[Memory Map]</strong> ${mapData.title} (${mapData.nodes.length} nodes, ${mapData.links.length} connections)`;
            } catch (e) {
                displayFront = card.front;
            }
        } else if (card.type === 'Image Card') {
            displayFront = `<strong style="color:var(--accent);">[Image Card]</strong> ${card.front.replace(/\n/g, '<br>')}`;
        } else {
            displayFront = card.front.replace(/\n/g, '<br>');
        }

        cardEl.innerHTML = `
            <input type="checkbox" class="card-checkbox" data-id="${card.id}" style="display: none;">
            <div class="manage-card-content" style="flex: 1;">
                <span class="type-tag">${card.type === 'mixed' ? 'All Types' : (card.type || 'All Types')}</span><br>
                <strong>Front:</strong> <br> ${displayFront} ${frontImgHtml} <br><br>
                <strong>Back:</strong> <br> ${card.back.replace(/\n/g, '<br>')} ${backImgHtml}
                ${sentencesHtml}
            </div>
            <div style="margin-left: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: flex-start; padding-top: 16px;">
                <button class="btn-icon edit-btn" data-id="${card.id}" title="Edit Memory">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon delete-btn" data-id="${card.id}" style="color: #ff4444;" title="Delete Memory">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;

        cardEl.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            const cb = cardEl.querySelector('.card-checkbox');
            if (cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
            }
        });

        list.appendChild(cardEl);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditView(e.currentTarget.dataset.id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (await window.confirm('Permanently delete this memory?')) {
                await batchDeleteCards([id]);
            }
        });
    });

    document.querySelectorAll('.delete-sentence-bank-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.currentTarget.dataset.cardId;
            const index = parseInt(e.currentTarget.dataset.index);
            
            const savedSentences = state.exampleSentences[cardId];
            let sentencesArray = [];
            if (Array.isArray(savedSentences)) {
                sentencesArray = [...savedSentences];
            } else if (typeof savedSentences === 'string') {
                sentencesArray = [savedSentences];
            }
            
            sentencesArray.splice(index, 1);
            
            if (sentencesArray.length > 0) {
                state.exampleSentences[cardId] = sentencesArray;
            } else {
                delete state.exampleSentences[cardId];
            }
            await dbSet('exampleSentences', state.exampleSentences);

            const cardIndex = state.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                state.cards[cardIndex].example_sentences = sentencesArray;
            }

            if (state.userSession && supabase) {
                try {
                    const { error } = await supabase
                        .from('flashcards')
                        .update({ example_sentences: sentencesArray })
                        .eq('id', cardId)
                        .eq('user_id', state.userSession.user.id);
                    if (error) {
                        console.error('Error updating example sentences in Supabase:', error);
                    }
                } catch (err) {
                    console.error('Error syncing example sentences update to DB:', err);
                }
            }
            
            renderManageView();
        });
    });

    document.querySelectorAll('.card-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            updateBatchUI();
            const allBoxes = document.querySelectorAll('.card-checkbox');
            const allChecked = [...allBoxes].every(b => b.checked);
            selectAllCb.checked = allChecked;
        });
    });

    selectAllCb.onchange = () => {
        const checked = selectAllCb.checked;
        document.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = checked);
        updateBatchUI();
    };

    deleteBtn.onclick = async () => {
        const selected = [...document.querySelectorAll('.card-checkbox:checked')].map(cb => cb.dataset.id);
        if (selected.length === 0) return;
        if (!await window.confirm(`Permanently delete ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'}?`)) return;
        await batchDeleteCards(selected);
    };
}

export async function handleCreateCard(e) {
    e.preventDefault();
    if (!state.userSession || !supabase) return await window.alert("Must be logged in to create cards.");

    const activeType = document.getElementById('card-type').value.trim() || 'mixed';
    let frontText = '';
    let backText = '';
    
    if (activeType === 'Memory Map') {
        const title = document.getElementById('create-map-title').value.trim();
        if (!title) {
            await window.alert("Please enter a Memory Map Title.");
            return;
        }
        if (state.createMapNodes.length === 0) {
            await window.alert("Please add at least one card to your Memory Map.");
            return;
        }
        
        const mapData = {
            mode: 'memory_map',
            title: title,
            nodes: state.createMapNodes,
            links: state.createMapLinks
        };
        frontText = JSON.stringify(mapData);
        backText = 'Memory Map';
    } else {
        frontText = document.getElementById('card-front').value.trim();
        backText = document.getElementById('card-back').value.trim();
        if (!frontText || !backText) return;
    }

    const btn = document.querySelector('#create-card-form button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = "Uploading Memory...";
    btn.disabled = true;

    const cardId = crypto.randomUUID();
    let image_front_url = null;
    let image_back_url = null;

    const uploadImage = async (file, side) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${cardId}_${side}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file);
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            return null;
        }
        const { data: publicUrlData } = supabase.storage.from('card_images').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const frontImageFile = document.getElementById('card-front-image').files[0];
    const backImageFile = document.getElementById('card-back-image').files[0];

    if (frontImageFile) image_front_url = await uploadImage(frontImageFile, 'front');
    if (backImageFile) image_back_url = await uploadImage(backImageFile, 'back');

    const sentenceInput = document.getElementById('create-new-sentence');
    if (sentenceInput && sentenceInput.value.trim() !== '') {
        const sentenceText = sentenceInput.value.trim();
        if (validateExampleSentence(sentenceText, backText)) {
            if (!state.draftCreateSentences.includes(sentenceText)) {
                state.draftCreateSentences.push(sentenceText);
            }
        }
    }

    const newCard = {
        user_id: state.userSession.user.id,
        type: activeType,
        front: frontText,
        back: backText,
        image_front_url: image_front_url,
        image_back_url: image_back_url,
        nextReview: Date.now(),
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        example_sentences: activeType !== 'Memory Map' ? [...state.draftCreateSentences] : []
    };

    const { data, error } = await supabase.from('flashcards').insert([newCard]).select();

    if (!error && data) {
        const createdCard = data[0];
        if (state.draftCreateSentences.length > 0 && activeType !== 'Memory Map') {
            state.exampleSentences[createdCard.id] = [...state.draftCreateSentences];
            await dbSet('exampleSentences', state.exampleSentences);
        }
        await loadData();
    } else {
        console.error("Failed to insert core memory:", error);
    }
    
    document.getElementById('card-type').value = 'mixed';
    document.getElementById('card-front').value = '';
    document.getElementById('card-back').value = '';
    document.getElementById('card-front-image').value = '';
    document.getElementById('card-back-image').value = '';
    
    document.getElementById('create-map-title').value = '';
    state.createMapNodes = [];
    state.createMapLinks = [];
    renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
    
    document.getElementById('create-vocab-fields').classList.remove('hidden');
    document.getElementById('create-map-fields').classList.add('hidden');

    const createSentencesInput = document.getElementById('create-new-sentence');
    if (createSentencesInput) createSentencesInput.value = '';
    const createError = document.getElementById('create-sentence-error');
    if (createError) createError.style.display = 'none';
    state.draftCreateSentences = [];
    renderCreateSentencesList();
    
    btn.innerHTML = "Memory Locked! " + ICONS.check;
    btn.style.background = "var(--accent)";
    btn.style.borderColor = "var(--accent)";
    btn.style.color = "var(--btn-primary-text)";
    btn.disabled = false;
    
    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
        if (document.getElementById('card-front')) document.getElementById('card-front').focus();
    }, 1500);
}

export function openEditView(cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('edit-card-id').value = card.id;
    document.getElementById('edit-card-type').value = card.type || 'mixed';
    
    document.getElementById('edit-card-front-image').value = '';
    document.getElementById('edit-card-back-image').value = '';

    const frontPreviewDiv = document.getElementById('edit-front-img-preview');
    if (card.image_front_url) {
        frontPreviewDiv.classList.remove('hidden');
        frontPreviewDiv.querySelector('img').src = card.image_front_url;
    } else {
        frontPreviewDiv.classList.add('hidden');
    }

    const backPreviewDiv = document.getElementById('edit-back-img-preview');
    if (card.image_back_url) {
        backPreviewDiv.classList.remove('hidden');
        backPreviewDiv.querySelector('img').src = card.image_back_url;
    } else {
        backPreviewDiv.classList.add('hidden');
    }

    const vocabFields = document.getElementById('edit-vocab-fields');
    const mapFields = document.getElementById('edit-map-fields');
    
    let isMap = false;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            isMap = true;
        }
    } catch (e) {}
    
    if (isMap || card.type === 'Memory Map') {
        document.getElementById('edit-card-type').value = 'Memory Map';
        vocabFields.classList.add('hidden');
        mapFields.classList.remove('hidden');
        
        let mapData = { title: '', nodes: [], links: [] };
        try {
            mapData = JSON.parse(card.front);
        } catch (e) {
            console.error("Error parsing memory map front text:", e);
        }
        
        document.getElementById('edit-map-title').value = mapData.title || '';
        state.editMapNodes = mapData.nodes || [];
        state.editMapLinks = mapData.links || [];
        
        setTimeout(() => {
            renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        }, 100);
    } else {
        vocabFields.classList.remove('hidden');
        mapFields.classList.add('hidden');
        
        updateFormLabelsAndPlaceholders(true, card.type);
        
        document.getElementById('edit-card-front').value = card.front;
        document.getElementById('edit-card-back').value = card.back;
        
        const savedSentences = state.exampleSentences[card.id];
        if (Array.isArray(savedSentences)) {
            state.editSentences = [...savedSentences];
        } else if (typeof savedSentences === 'string') {
            state.editSentences = [savedSentences];
        } else {
            state.editSentences = [];
        }

        const editSentencesInput = document.getElementById('edit-new-sentence');
        if (editSentencesInput) editSentencesInput.value = '';
        const editError = document.getElementById('edit-sentence-error');
        if (editError) editError.style.display = 'none';
        renderEditSentencesList();
    }

    buildCustomDropdownUI('edit-card-type');
    switchView('edit');
}

export async function handleEditCardSubmit(e) {
    e.preventDefault();
    if (!state.userSession || !supabase) return await window.alert("Must be logged in to edit cards.");

    const cardId = document.getElementById('edit-card-id').value;
    const typeText = document.getElementById('edit-card-type').value.trim() || 'mixed';
    
    let frontText = '';
    let backText = '';
    
    if (typeText === 'Memory Map') {
        const title = document.getElementById('edit-map-title').value.trim();
        if (!title) {
            await window.alert("Please enter a Memory Map Title.");
            return;
        }
        if (state.editMapNodes.length === 0) {
            await window.alert("Please add at least one card to your Memory Map.");
            return;
        }
        
        const mapData = {
            mode: 'memory_map',
            title: title,
            nodes: state.editMapNodes,
            links: state.editMapLinks
        };
        frontText = JSON.stringify(mapData);
        backText = 'Memory Map';
    } else {
        frontText = document.getElementById('edit-card-front').value.trim();
        backText = document.getElementById('edit-card-back').value.trim();
    }
    
    if (!frontText || !backText || !cardId) return;

    const cardIndex = state.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const existingCard = state.cards[cardIndex];

    const btn = document.querySelector('#edit-card-form button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = "Saving Changes...";
    btn.disabled = true;

    const frontImageFile = document.getElementById('edit-card-front-image') ? document.getElementById('edit-card-front-image').files[0] : null;
    const backImageFile = document.getElementById('edit-card-back-image') ? document.getElementById('edit-card-back-image').files[0] : null;

    let new_image_front_url = existingCard.image_front_url;
    let new_image_back_url = existingCard.image_back_url;

    const uploadImage = async (file, side) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${cardId}_${side}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file);
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            return null;
        }
        const { data: publicUrlData } = supabase.storage.from('card_images').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const deleteOldImage = async (url) => {
        if (!url) return;
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        await supabase.storage.from('card_images').remove([fileName]);
    };

    if (frontImageFile) {
        if (existingCard.image_front_url) {
            await deleteOldImage(existingCard.image_front_url);
        }
        new_image_front_url = await uploadImage(frontImageFile, 'front');
    }

    if (backImageFile) {
        if (existingCard.image_back_url) {
            await deleteOldImage(existingCard.image_back_url);
        }
        new_image_back_url = await uploadImage(backImageFile, 'back');
    }

    const editSentenceInput = document.getElementById('edit-new-sentence');
    if (editSentenceInput && editSentenceInput.value.trim() !== '') {
        const sentenceText = editSentenceInput.value.trim();
        if (validateExampleSentence(sentenceText, backText)) {
            if (!state.editSentences.includes(sentenceText)) {
                state.editSentences.push(sentenceText);
            }
        }
    }

    const { data, error } = await supabase
        .from('flashcards')
        .update({
            type: typeText,
            front: frontText,
            back: backText,
            image_front_url: new_image_front_url,
            image_back_url: new_image_back_url,
            example_sentences: typeText !== 'Memory Map' ? [...state.editSentences] : []
        })
        .eq('id', cardId)
        .eq('user_id', state.userSession.user.id)
        .select();

    if (!error && data) {
        if (state.editSentences.length > 0) {
            state.exampleSentences[cardId] = [...state.editSentences];
        } else {
            delete state.exampleSentences[cardId];
        }
        await dbSet('exampleSentences', state.exampleSentences);
        
        await loadData();
        renderManageView();
        
        btn.innerHTML = "Changes Saved! " + ICONS.check;
        btn.style.background = "var(--accent)";
        btn.style.borderColor = "var(--accent)";
        btn.style.color = "var(--btn-primary-text)";
        
        setTimeout(() => {
            btn.innerHTML = oldText;
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.style.color = "";
            btn.disabled = false;
            switchView('manage');
        }, 1000);
    } else {
        console.error("Failed to update memory:", error);
        await window.alert("Failed to update memory.");
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

