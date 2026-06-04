import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { ICONS } from './icons.js';
import { dbSet } from './db.js';
import { getSelectedTypes } from './dashboard.js';

import {
    handleCreateAddSentence,
    renderCreateSentencesList,
    deleteDraftCreateSentence,
    handleEditAddSentence,
    renderEditSentencesList,
    deleteEditSentence
} from './card/sentenceBuilder.js';

import {
    updateFormLabelsAndPlaceholders,
    handleCreateCard,
    openEditView,
    handleEditCardSubmit
} from './card/cardCreator.js';

import {
    loadData,
    fetchAndCacheReviewLogs,
    insertCardToDB,
    updateCardInDB,
    updateBatchUI,
    batchDeleteCards
} from './card/syncEngine.js';

export {
    handleCreateAddSentence,
    renderCreateSentencesList,
    deleteDraftCreateSentence,
    handleEditAddSentence,
    renderEditSentencesList,
    deleteEditSentence,
    
    updateFormLabelsAndPlaceholders,
    handleCreateCard,
    openEditView,
    handleEditCardSubmit,
    
    loadData,
    fetchAndCacheReviewLogs,
    insertCardToDB,
    updateCardInDB,
    updateBatchUI,
    batchDeleteCards
};

export function renderManageView() {
    const list = document.getElementById('manage-list');
    const toolbar = document.getElementById('manage-toolbar');
    const selectAllCb = document.getElementById('select-all-checkbox');
    const deleteBtn = document.getElementById('btn-delete-selected');
    if (!list) return;
    list.innerHTML = '';
    
    if (state.cards.length === 0) {
        list.innerHTML = '<p class="status-msg">No memories found.</p>';
        if (toolbar) toolbar.classList.add('hidden');
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
        if (toolbar) toolbar.classList.add('hidden');
        return;
    }

    if (toolbar) toolbar.classList.remove('hidden');
    if (selectAllCb) selectAllCb.checked = false;
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
        let cleanFront = card.front;
        let wordTypes = [];
        if (card.type === 'Vocabulary' && card.front.includes('|||')) {
            const parts = card.front.split('|||');
            cleanFront = parts[0].trim();
            wordTypes = parts[1].split(',').map(t => t.trim()).filter(Boolean);
        }

        if (cleanFront.startsWith('{"mode":"memory_map"')) {
            try {
                const mapData = JSON.parse(cleanFront);
                displayFront = `<strong style="color:var(--accent);">[Memory Map]</strong> ${mapData.title} (${mapData.nodes.length} nodes, ${mapData.links.length} connections)`;
            } catch (e) {
                displayFront = cleanFront;
            }
        } else if (card.type === 'Image Card') {
            displayFront = `<strong style="color:var(--accent);">[Image Card]</strong> ${cleanFront.replace(/\n/g, '<br>')}`;
        } else {
            displayFront = cleanFront.replace(/\n/g, '<br>');
        }

        if (wordTypes.length > 0) {
            const badgesHtml = wordTypes.map(t => `<span class="word-type-badge">${t}</span>`).join('');
            displayFront += ` <div class="word-types-container" style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">${badgesHtml}</div>`;
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

    const cardBoxes = document.querySelectorAll('.card-checkbox');
    cardBoxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateBatchUI();
            const allChecked = [...cardBoxes].every(b => b.checked);
            if (selectAllCb) selectAllCb.checked = allChecked;
        });
    });

    if (selectAllCb) {
        selectAllCb.onchange = () => {
            const checked = selectAllCb.checked;
            cardBoxes.forEach(cb => cb.checked = checked);
            updateBatchUI();
        };
    }

    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            const selected = [...document.querySelectorAll('.card-checkbox:checked')].map(cb => cb.dataset.id);
            if (selected.length === 0) return;
            if (!await window.confirm(`Permanently delete ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'}?`)) return;
            await batchDeleteCards(selected);
        };
    }
}

window.renderManageView = renderManageView;
