import { state } from '../state.js';
import { validateExampleSentence } from '../practice.js';
import { ICONS } from '../icons.js';

export function handleCreateAddSentence() {
    const sentenceInput = document.getElementById('create-new-sentence');
    const targetWordInput = document.getElementById('card-back');
    const errorSpan = document.getElementById('create-sentence-error');
    
    const sentenceText = sentenceInput.value.trim();
    const targetWord = targetWordInput.value.trim();
    
    if (!targetWord) {
        errorSpan.textContent = "Please specify a target word (Back) first!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!sentenceText) {
        errorSpan.textContent = "Please enter an example sentence!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!validateExampleSentence(sentenceText, targetWord)) {
        errorSpan.textContent = `The sentence must contain the target word "${targetWord}"!`;
        errorSpan.style.display = 'block';
        return;
    }
    
    errorSpan.style.display = 'none';
    state.draftCreateSentences.push(sentenceText);
    sentenceInput.value = '';
    renderCreateSentencesList();
}

export function renderCreateSentencesList() {
    const listDiv = document.getElementById('create-sentences-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    state.draftCreateSentences.forEach((sentence, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.background = 'var(--bg-card)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = '8px';
        row.style.fontSize = '0.9rem';
        
        row.innerHTML = `
            <span style="flex: 1; margin-right: 10px; line-height: 1.4;">${sentence}</span>
            <button type="button" onclick="deleteDraftCreateSentence(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center;">${ICONS.closeSmall}</button>
        `;
        listDiv.appendChild(row);
    });
}

export function deleteDraftCreateSentence(index) {
    state.draftCreateSentences.splice(index, 1);
    renderCreateSentencesList();
}

export function handleEditAddSentence() {
    const sentenceInput = document.getElementById('edit-new-sentence');
    const targetWordInput = document.getElementById('edit-card-back');
    const errorSpan = document.getElementById('edit-sentence-error');
    
    const sentenceText = sentenceInput.value.trim();
    const targetWord = targetWordInput.value.trim();
    
    if (!targetWord) {
        errorSpan.textContent = "Please specify a target word (Back) first!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!sentenceText) {
        errorSpan.textContent = "Please enter an example sentence!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!validateExampleSentence(sentenceText, targetWord)) {
        errorSpan.textContent = `The sentence must contain the target word "${targetWord}"!`;
        errorSpan.style.display = 'block';
        return;
    }
    
    errorSpan.style.display = 'none';
    state.editSentences.push(sentenceText);
    sentenceInput.value = '';
    renderEditSentencesList();
}

export function renderEditSentencesList() {
    const listDiv = document.getElementById('edit-sentences-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    state.editSentences.forEach((sentence, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.background = 'var(--bg-card)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = '8px';
        row.style.fontSize = '0.9rem';
        row.style.gap = '8px';
        
        row.innerHTML = `
            <span class="edit-sentence-text" style="flex: 1; margin-right: 10px; line-height: 1.4; cursor: pointer;" title="Double click to edit sentence">${sentence}</span>
            <button type="button" class="delete-edit-sentence-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center;">${ICONS.closeSmall}</button>
        `;
        
        const span = row.querySelector('.edit-sentence-text');
        const deleteBtn = row.querySelector('.delete-edit-sentence-btn');
        
        deleteBtn.addEventListener('click', () => {
            deleteEditSentence(index);
        });
        
        span.addEventListener('dblclick', () => {
            row.innerHTML = `
                <input type="text" class="input-field inline-edit-input" value="${sentence}" style="flex: 1; font-size: 0.9rem; padding: 6px 10px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); outline: none;">
                <button type="button" class="btn save-inline-btn" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700; border-radius: 8px; background: var(--accent); color: var(--btn-primary-text); border: none; cursor: pointer;">Save</button>
                <button type="button" class="btn cancel-inline-btn" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700; border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); border: 2px solid var(--border-color); cursor: pointer;">Cancel</button>
            `;
            
            const input = row.querySelector('.inline-edit-input');
            const saveBtn = row.querySelector('.save-inline-btn');
            const cancelBtn = row.querySelector('.cancel-inline-btn');
            
            input.focus();
            input.select();
            
            const saveChanges = () => {
                const newValue = input.value.trim();
                if (newValue) {
                    state.editSentences[index] = newValue;
                }
                renderEditSentencesList();
            };
            
            const cancelChanges = () => {
                renderEditSentencesList();
            };
            
            saveBtn.addEventListener('click', saveChanges);
            cancelBtn.addEventListener('click', cancelChanges);
            
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    saveChanges();
                } else if (evt.key === 'Escape') {
                    evt.preventDefault();
                    cancelChanges();
                }
            });
        });
        
        listDiv.appendChild(row);
    });
}

export function deleteEditSentence(index) {
    state.editSentences.splice(index, 1);
    renderEditSentencesList();
}

window.deleteDraftCreateSentence = deleteDraftCreateSentence;
window.deleteEditSentence = deleteEditSentence;
