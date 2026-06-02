import { state } from '../state.js';
import { supabase } from '../supabaseClient.js';
import { ICONS } from '../icons.js';
import { renderEditorNodes } from '../canvas.js';
import { validateExampleSentence } from '../practice.js';
import { switchView } from '../navigation.js';
import { dbSet } from '../db.js';
import { buildCustomDropdownUI } from '../uiHelpers.js';
import { renderEditSentencesList } from './sentenceBuilder.js';
import { loadData } from './syncEngine.js';
import { renderManageView } from '../flashcardCrud.js';

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
        const userId = state.userSession.user.id;
        const fileName = `${userId}/${cardId}_${side}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file, { upsert: true });
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            await window.alert(`Failed to upload ${side} image: ${uploadError.message}`);
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
    
    const sentenceList = document.getElementById('draft-sentences-list');
    if (sentenceList) sentenceList.innerHTML = '';
    state.draftCreateSentences = [];
    
    btn.textContent = "Memory Uploaded! " + ICONS.check;
    btn.style.background = "var(--accent)";
    btn.style.borderColor = "var(--accent)";
    btn.style.color = "var(--btn-primary-text)";
    
    setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
        btn.disabled = false;
        switchView('manage');
    }, 1000);
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
        const userId = state.userSession.user.id;
        const fileName = `${userId}/${cardId}_${side}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file, { upsert: true });
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            await window.alert(`Failed to upload ${side} image: ${uploadError.message}`);
            return null;
        }
        const { data: publicUrlData } = supabase.storage.from('card_images').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const deleteOldImage = async (url) => {
        if (!url) return;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/storage/v1/object/public/card_images/');
            if (pathParts.length > 1) {
                const filePath = decodeURIComponent(pathParts[1]);
                await supabase.storage.from('card_images').remove([filePath]);
            }
        } catch (e) {
            console.warn('Could not delete old image:', e);
        }
    };

    if (frontImageFile) {
        if (existingCard.image_front_url) {
            await deleteOldImage(existingCard.image_front_url);
        }
        const uploaded = await uploadImage(frontImageFile, 'front');
        if (uploaded) new_image_front_url = uploaded;
    }

    if (backImageFile) {
        if (existingCard.image_back_url) {
            await deleteOldImage(existingCard.image_back_url);
        }
        const uploaded = await uploadImage(backImageFile, 'back');
        if (uploaded) new_image_back_url = uploaded;
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
