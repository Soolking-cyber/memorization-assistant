import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { ICONS } from './icons.js';
import { buildCustomDropdownUI } from './uiHelpers.js';
import { renderCategoryTabs, renderCategoryCards } from './stats.js';
import { updateFormLabelsAndPlaceholders } from './flashcardCrud.js';
import { renderEditorNodes } from './canvas.js';

export function renderTypeTags() {
    const createContainer = document.getElementById('create-type-tags');
    const editContainer = document.getElementById('edit-type-tags');
    const settingsContainer = document.getElementById('settings-type-tags');
    
    const tagHtml = state.customTypes.map(t => {
        const displayType = t === 'mixed' ? 'All Types (Mixed)' : t;
        if (t === 'mixed' || t === 'Vocabulary' || t === 'Memory Map') {
            return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType}</span>`;
        }
        return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType} <button type="button" onclick="removeType('${t}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; margin-left:6px; padding:0; display:inline-flex; align-items:center;">${ICONS.closeSmall}</button></span>`;
    }).join('');
    
    if (createContainer) createContainer.innerHTML = tagHtml;
    if (editContainer) editContainer.innerHTML = tagHtml;
    if (settingsContainer) settingsContainer.innerHTML = tagHtml;
}

export function updateTypeDatalists() {
    const types = new Set(state.customTypes);
    
    types.add('Vocabulary');
    types.add('Memory Map');
    types.add('Image Card');
    types.add('Unknown');
    
    let migrated = false;
    let migratedVocab = false;
    state.cards.forEach(c => {
        if (!c.type || c.type === 'General' || c.type === 'mixed') {
            c.type = 'Unknown';
            migrated = true;
        }
        if (c.type === 'vocabulary') {
            c.type = 'Vocabulary';
            migratedVocab = true;
        }
        types.add(c.type);
    });
    
    if (migrated && state.userSession && supabase) {
        supabase.from('flashcards').update({ type: 'Unknown' }).or('type.eq.General,type.eq.mixed,type.is.null').eq('user_id', state.userSession.user.id).then();
    }
    
    if (migratedVocab && state.userSession && supabase) {
        supabase.from('flashcards').update({ type: 'Vocabulary' }).eq('type', 'vocabulary').eq('user_id', state.userSession.user.id).then();
    }
    
    types.delete('General');
    types.delete('vocabulary');
    types.delete('mixed');
    
    state.customTypes = Array.from(types).filter(t => t !== 'vocabulary' && t !== 'mixed');
    localStorage.setItem('customTypes', JSON.stringify(state.customTypes));
    
    const populateSelect = (selectId, addMixed = false) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '';
        
        if (addMixed) {
            const optMixed = document.createElement('option');
            optMixed.value = 'mixed';
            optMixed.textContent = 'All Types (Mixed)';
            select.appendChild(optMixed);
        }
        
        state.customTypes.forEach(t => {
            if (t !== 'mixed' && t !== 'General') {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                select.appendChild(opt);
            }
        });
        
        if (!addMixed) {
            select.innerHTML += '<option value="add_new" style="font-weight: bold; color: var(--accent);">+ Add New Type...</option>';
        }
        
        if ([...select.options].some(o => o.value === currentVal)) {
            select.value = currentVal;
        } else if (!addMixed) {
            select.value = 'Vocabulary';
        } else {
            select.value = 'mixed';
        }
        
        buildCustomDropdownUI(selectId);
    };
    
    populateSelect('card-type', false);
    populateSelect('edit-card-type', false);
    populateSelect('practice-type-select', true);
    populateSelect('manage-type-select', true);
    
    renderTypeTags();
}

export function getSelectedTypes(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    
    if (!select.selectedValues) {
        const options = [...select.options].map(o => o.value).filter(v => v !== 'add_new');
        select.selectedValues = options;
    }
    
    return select.selectedValues.filter(v => v !== 'mixed' && v !== 'add_new');
}

export function updateDashboard() {
    updateTypeDatalists();
    renderCategoryTabs();
    
    const totalElement = document.getElementById('stat-total');
    const dueElement = document.getElementById('stat-due');
    const btnPractice = document.getElementById('btn-practice');
    const statusMsg = document.getElementById('practice-status-msg');

    const activeTypes = getSelectedTypes('practice-type-select');

    const filteredCards = state.cards.filter(c => activeTypes.includes(c.type));
    const total = filteredCards.length;
    const now = Date.now();
    const dueCards = filteredCards.filter(c => c.nextReview <= now);

    if (totalElement) totalElement.textContent = state.cards.length;
    if (dueElement) {
        dueElement.textContent = dueCards.length;
        const duePill = dueElement.closest('.stat-pill');
        if (duePill) {
            if (dueCards.length === 0 && total > 0) {
                duePill.classList.add('streak-completed');
            } else {
                duePill.classList.remove('streak-completed');
            }
        }
    }

    const settingsStatCount = document.getElementById('settings-stat-count');
    if (settingsStatCount) settingsStatCount.textContent = state.cards.length;

    if (dueCards.length > 0) {
        if (btnPractice) btnPractice.style.display = 'inline-block';
        if (statusMsg) statusMsg.textContent = `${dueCards.length} memories are ready for retention mapping.`;
    } else if (total === 0) {
        if (btnPractice) btnPractice.style.display = 'none';
        if (statusMsg) statusMsg.textContent = "Start by creating your first memory card.";
    } else {
        if (btnPractice) btnPractice.style.display = 'none';
        
        const futureCards = filteredCards.filter(c => c.nextReview > now).sort((a,b) => a.nextReview - b.nextReview);
        if (futureCards.length > 0) {
            const msToNext = futureCards[0].nextReview - now;
            let timeStr = "";
            if (msToNext > 86400000) { timeStr = Math.ceil(msToNext / 86400000) + " days"; }
            else if (msToNext > 3600000) { timeStr = Math.ceil(msToNext / 3600000) + " hours"; }
            else { timeStr = Math.ceil(msToNext / 60000) + " minutes"; }
            if (statusMsg) statusMsg.textContent = `All caught up! Next memory unlocks in ${timeStr}.`;
        }
    }

    renderCategoryCards();
}

export async function removeType(typeToRemove) {
    if (typeToRemove === 'mixed') return;
    if (!await window.confirm(`Are you sure you want to delete the "${typeToRemove}" type? All cards with this type will be reassigned to "All Types".`)) return;
    
    if (state.userSession && supabase) {
        const { error } = await supabase
            .from('flashcards')
            .update({ type: 'mixed' })
            .eq('type', typeToRemove)
            .eq('user_id', state.userSession.user.id);
            
        if (error) {
            console.error("Error removing type:", error);
            await window.alert("Failed to remove type.");
            return;
        }
    }
    
    state.cards.forEach(c => {
        if (c.type === typeToRemove) c.type = 'mixed';
    });
    
    updateTypeDatalists();
    updateDashboard();
    
    const manageView = document.getElementById('view-manage');
    if (manageView && !manageView.classList.contains('hidden')) {
        // Render manage view dynamically (to be resolved at runtime)
        if (window.renderManageView) {
            window.renderManageView();
        }
    }
}

export async function handleTypeSelectChange(e) {
    let val = e.target.value;
    if (val === 'add_new') {
        const newType = await window.prompt("Enter new memory type:");
        if (newType && newType.trim() !== '') {
            const cleanType = newType.trim();
            if (!state.customTypes.includes(cleanType)) {
                state.customTypes.push(cleanType);
                localStorage.setItem('customTypes', JSON.stringify(state.customTypes));
            }
            updateTypeDatalists();
            e.target.value = cleanType;
            val = cleanType;
        } else {
            e.target.value = 'mixed';
            val = 'mixed';
        }
    }
    
    // Toggle the visible fields based on the selected type
    const isEdit = e.target.id === 'edit-card-type';
    const vocabFields = document.getElementById(isEdit ? 'edit-vocab-fields' : 'create-vocab-fields');
    const mapFields = document.getElementById(isEdit ? 'edit-map-fields' : 'create-map-fields');
    
    if (vocabFields && mapFields) {
        if (val === 'Memory Map') {
            vocabFields.classList.add('hidden');
            mapFields.classList.remove('hidden');
            
            // For Edit mode, if it's already rendered, we need to trigger links redraw
            if (isEdit) {
                setTimeout(() => {
                    renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
                }, 50);
            } else {
                setTimeout(() => {
                    renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
                }, 50);
            }
        } else {
            vocabFields.classList.remove('hidden');
            mapFields.classList.add('hidden');
            updateFormLabelsAndPlaceholders(isEdit, val);
        }
    }
}

window.removeType = removeType;
