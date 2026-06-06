import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { ICONS } from './icons.js';
import { dbSet } from './db.js';
import { getSelectedTypes } from './dashboard.js';
import { validateExampleSentence } from './practice.js';

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
                        <div class="manage-sentence-item" data-card-id="${card.id}" data-index="${idx}" data-tooltip="Double-click to edit clue" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 8px; font-size: 0.85rem;">
                            <span class="manage-sentence-text" style="flex: 1; margin-right: 8px; line-height: 1.4;">${s}</span>
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

        const score = card.score !== undefined && card.score !== null ? card.score : 50;
        const scoreTooltip = `Memory Strength: ${score}%\nDetermines next review: (Score/20)² days\n• Easy: +40% gap (min +10)\n• Good: +25% gap (min +8)\n• Hard: -15% score (min -5)\n• Again/Timeout: -35% score (min -10)`;

        cardEl.innerHTML = `
            <input type="checkbox" class="card-checkbox" data-id="${card.id}" style="display: none;">
            <div class="manage-card-content" style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span class="type-tag" style="margin: 0;">${card.type === 'mixed' ? 'All Types' : (card.type || 'All Types')}</span>
                    <span class="card-score-badge" data-tooltip="${scoreTooltip}" style="font-size: 0.72rem; font-weight: 700; background: var(--bg-secondary); color: var(--accent); border: 1.5px solid var(--border-color); padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px; cursor: help; user-select: none;">
                        ⚡ ${score}%
                    </span>
                </div>
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

    document.querySelectorAll('.manage-sentence-item').forEach(item => {
        item.addEventListener('dblclick', (e) => {
            if (e.target.closest('button')) return; // ignore delete button click
            
            const textSpan = item.querySelector('.manage-sentence-text');
            if (!textSpan || item.classList.contains('editing')) return;
            
            item.classList.add('editing');
            const originalText = textSpan.textContent.trim();
            const cardId = item.dataset.cardId;
            const index = parseInt(item.dataset.index);
            const card = state.cards.find(c => c.id === cardId);
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-field edit-sentence-inline-input';
            input.value = originalText;
            input.style.flex = '1';
            input.style.fontSize = '0.85rem';
            input.style.padding = '4px 8px';
            input.style.background = 'var(--bg-card)';
            input.style.border = '1px solid var(--accent)';
            input.style.borderRadius = '6px';
            input.style.color = 'var(--text-primary)';
            
            const deleteBtn = item.querySelector('.delete-sentence-bank-btn');
            if (deleteBtn) deleteBtn.style.display = 'none';
            
            textSpan.replaceWith(input);
            input.focus();
            input.select();
            
            let finished = false;
            const saveEdit = async () => {
                if (finished) return;
                finished = true;
                
                const newText = input.value.trim();
                if (newText === originalText || newText === '') {
                    cancelEdit();
                    return;
                }
                
                if (card && !validateExampleSentence(newText, card.back)) {
                    input.style.borderColor = '#ef4444';
                    await window.alert(`Clue sentence must contain the target recall word "${card.back}"!`);
                    finished = false;
                    input.focus();
                    return;
                }
                
                input.disabled = true;
                await updateExampleSentence(cardId, index, newText);
            };
            
            const cancelEdit = () => {
                input.replaceWith(textSpan);
                if (deleteBtn) deleteBtn.style.display = '';
                item.classList.remove('editing');
            };
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
            
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    if (!finished) saveEdit();
                }, 100);
            });
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

async function updateExampleSentence(cardId, index, newText) {
    const savedSentences = state.exampleSentences[cardId];
    let sentencesArray = [];
    if (Array.isArray(savedSentences)) {
        sentencesArray = [...savedSentences];
    } else if (typeof savedSentences === 'string') {
        sentencesArray = [savedSentences];
    }
    
    sentencesArray[index] = newText;
    state.exampleSentences[cardId] = sentencesArray;
    
    await dbSet('exampleSentences', state.exampleSentences);
    
    const cardIndex = state.cards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
        state.cards[cardIndex].example_sentences = sentencesArray;
    }
    
    if (state.userSession && supabase) {
        try {
            await supabase
                .from('flashcards')
                .update({ example_sentences: sentencesArray })
                .eq('id', cardId)
                .eq('user_id', state.userSession.user.id);
        } catch (err) {
            console.error('Error syncing example sentence edit:', err);
        }
    }
    
    renderManageView();
}

