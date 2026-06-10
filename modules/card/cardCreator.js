import { state, isVocabularyType } from '../state.js';
import { validateExampleSentence } from '../practice.js';
import { supabase } from '../supabaseClient.js';
import { ICONS } from '../icons.js';
import { renderEditorNodes } from '../canvas.js';
import { switchView } from '../navigation.js';
import { dbSet } from '../db.js';
import { buildCustomDropdownUI } from '../uiHelpers.js';
import { renderEditSentencesList, renderCreateSentencesList } from './sentenceBuilder.js';
import { loadData } from './syncEngine.js';
import { renderManageView } from '../flashcardCrud.js';
import { parseVocabularyCard } from '../utils.js';

export function updateFormLabelsAndPlaceholders(isEdit, type) {
    const labelFront = document.querySelector(`label[for="${isEdit ? 'edit-card-front' : 'card-front'}"]`);
    const labelBack = document.querySelector(`label[for="${isEdit ? 'edit-card-back' : 'card-back'}"]`);
    const textareaFront = document.getElementById(isEdit ? 'edit-card-front' : 'card-front');
    const textareaBack = document.getElementById(isEdit ? 'edit-card-back' : 'card-back');
    const sentencesGroup = document.getElementById(isEdit ? 'edit-vocab-sentences-group' : 'create-vocab-sentences-group');

    const standardGroup = document.getElementById(isEdit ? 'edit-standard-fields' : 'create-standard-fields');
    const vocabularyGroup = document.getElementById(isEdit ? 'edit-vocabulary-fields' : 'create-vocabulary-fields');

    if (isVocabularyType(type)) {
        if (standardGroup) standardGroup.classList.add('hidden');
        if (vocabularyGroup) vocabularyGroup.classList.remove('hidden');
        if (sentencesGroup) sentencesGroup.classList.remove('hidden');
        
        // Ensure custom dropdown is built
        buildCustomDropdownUI(isEdit ? 'edit-vocab-type' : 'vocab-type');
    } else {
        if (standardGroup) standardGroup.classList.remove('hidden');
        if (vocabularyGroup) vocabularyGroup.classList.add('hidden');
        
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
    } else if (activeType === 'Zettelkasten') {
        const quote = document.getElementById('card-zettel-quote').value.trim();
        const reference = document.getElementById('card-zettel-reference').value.trim();
        const tagsInput = document.getElementById('card-zettel-tags').value.trim();
        
        if (!quote || !reference) {
            await window.alert("Please enter both a Quote and a Reference.");
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        const ztData = {
            mode: 'zettelkasten',
            quote: quote,
            tags: tags,
            links: state.createZettelLinks || []
        };
        frontText = JSON.stringify(ztData);
        backText = reference;
    } else if (isVocabularyType(activeType)) {
        const word = document.getElementById('vocab-word').value.trim();
        const meaning = document.getElementById('vocab-meaning').value.trim();
        if (!word || !meaning) {
            await window.alert("Please fill in both the Word and Description/Meaning.");
            return;
        }
        const selectEl = document.getElementById('vocab-type');
        const selectedTypes = (selectEl.selectedValues || []).filter(Boolean);
        const wordType = selectedTypes.join(', ');
        frontText = word;
        if (wordType) {
            frontText = `${frontText} ||| ${wordType}`;
        }
        backText = meaning;
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

    const frontImageFile = isVocabularyType(activeType)
        ? (document.getElementById('vocab-front-image') ? document.getElementById('vocab-front-image').files[0] : null)
        : (document.getElementById('card-front-image') ? document.getElementById('card-front-image').files[0] : null);
    const backImageFile = isVocabularyType(activeType)
        ? (document.getElementById('vocab-back-image') ? document.getElementById('vocab-back-image').files[0] : null)
        : (document.getElementById('card-back-image') ? document.getElementById('card-back-image').files[0] : null);

    const createLimit = (activeType === 'Image Card') ? 1024 * 1024 : 500 * 1024;
    const createLimitLabel = (activeType === 'Image Card') ? '1 MB' : '500 KB';

    if (frontImageFile && frontImageFile.size > createLimit) {
        await window.alert(`Front image exceeds ${createLimitLabel} limit for ${activeType} cards! Selected file: ${(frontImageFile.size / 1024).toFixed(1)} KB.`);
        return;
    }
    if (backImageFile && backImageFile.size > createLimit) {
        await window.alert(`Back image exceeds ${createLimitLabel} limit for ${activeType} cards! Selected file: ${(backImageFile.size / 1024).toFixed(1)} KB.`);
        return;
    }

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
        ease: 5.0,
        interval: 0,
        repetitions: 0,
        score: 39,
        example_sentences: activeType !== 'Memory Map' ? [...state.draftCreateSentences] : []
    };

    const { data, error } = await supabase.from('flashcards').insert([newCard]).select();

    if (!error && data) {
        const createdCard = data[0];
        if (state.draftCreateSentences.length > 0 && activeType !== 'Memory Map') {
            state.exampleSentences[createdCard.id] = [...state.draftCreateSentences];
            await dbSet('exampleSentences', state.exampleSentences);
        }
        state.cards.push(createdCard);
        await dbSet('cached_cards', state.cards);
        await loadData();
    } else {
        console.error("Failed to insert core memory:", error);
    }
    
    // Reset forms and selections
    const selectEl = document.getElementById('card-type');
    if (selectEl) {
        const nextType = [...selectEl.options].some(o => o.value === activeType) ? activeType : 'Vocabulary';
        selectEl.value = nextType;
        buildCustomDropdownUI('card-type');
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Clear vocab fields
    const vocabWord = document.getElementById('vocab-word');
    if (vocabWord) vocabWord.value = '';
    const vocabMeaning = document.getElementById('vocab-meaning');
    if (vocabMeaning) vocabMeaning.value = '';
    const vocabType = document.getElementById('vocab-type');
    if (vocabType) {
        vocabType.selectedValues = [];
        [...vocabType.options].forEach(o => {
            o.selected = false;
        });
        vocabType.value = '';
        buildCustomDropdownUI('vocab-type');
    }
    const vocabFrontImg = document.getElementById('vocab-front-image');
    if (vocabFrontImg) {
        vocabFrontImg.value = '';
        vocabFrontImg.dispatchEvent(new Event('change'));
    }
    const vocabBackImg = document.getElementById('vocab-back-image');
    if (vocabBackImg) {
        vocabBackImg.value = '';
        vocabBackImg.dispatchEvent(new Event('change'));
    }

    // Clear standard text areas and file inputs
    const frontEl = document.getElementById('card-front');
    if (frontEl) frontEl.value = '';
    
    const backEl = document.getElementById('card-back');
    if (backEl) backEl.value = '';
    
    const frontImgEl = document.getElementById('card-front-image');
    if (frontImgEl) {
        frontImgEl.value = '';
        frontImgEl.dispatchEvent(new Event('change'));
    }
    
    const backImgEl = document.getElementById('card-back-image');
    if (backImgEl) {
        backImgEl.value = '';
        backImgEl.dispatchEvent(new Event('change'));
    }

    const newSentenceEl = document.getElementById('create-new-sentence');
    if (newSentenceEl) newSentenceEl.value = '';

    // Clear draft sentences
    state.draftCreateSentences = [];
    renderCreateSentencesList();

    // Clear memory map states
    const createMapTitle = document.getElementById('create-map-title');
    if (createMapTitle) createMapTitle.value = '';
    state.createMapNodes = [];
    state.createMapLinks = [];
    renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
    
    // Clear Zettelkasten states
    const zQuote = document.getElementById('card-zettel-quote');
    if (zQuote) zQuote.value = '';
    const zRef = document.getElementById('card-zettel-reference');
    if (zRef) zRef.value = '';
    const zTags = document.getElementById('card-zettel-tags');
    if (zTags) zTags.value = '';
    state.createZettelLinks = [];
    renderZettelLinksList(false);
    
    btn.innerHTML = "Memory Uploaded! " + ICONS.check;
    btn.style.background = "var(--accent)";
    btn.style.borderColor = "var(--accent)";
    btn.style.color = "var(--btn-primary-text)";
    
    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
        btn.disabled = false;
    }, 1000);
}

export function openEditView(cardId) {
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    state.editFrontImageDeleted = false;
    state.editBackImageDeleted = false;

    const btnDeleteFrontImg = document.getElementById('btn-delete-edit-front-img');
    if (btnDeleteFrontImg) {
        btnDeleteFrontImg.onclick = () => {
            state.editFrontImageDeleted = true;
            document.getElementById('edit-front-img-preview').classList.add('hidden');
            const fileInput = document.getElementById('edit-card-front-image');
            if (fileInput) {
                fileInput.value = '';
                fileInput.dispatchEvent(new Event('change'));
            }
        };
    }

    const btnDeleteBackImg = document.getElementById('btn-delete-edit-back-img');
    if (btnDeleteBackImg) {
        btnDeleteBackImg.onclick = () => {
            state.editBackImageDeleted = true;
            document.getElementById('edit-back-img-preview').classList.add('hidden');
            const fileInput = document.getElementById('edit-card-back-image');
            if (fileInput) {
                fileInput.value = '';
                fileInput.dispatchEvent(new Event('change'));
            }
        };
    }

    const btnDeleteVocabFrontImg = document.getElementById('btn-delete-edit-vocab-front-img');
    if (btnDeleteVocabFrontImg) {
        btnDeleteVocabFrontImg.onclick = () => {
            state.editFrontImageDeleted = true;
            document.getElementById('edit-vocab-front-img-preview').classList.add('hidden');
            const fileInput = document.getElementById('edit-vocab-front-image');
            if (fileInput) {
                fileInput.value = '';
                fileInput.dispatchEvent(new Event('change'));
            }
        };
    }

    const btnDeleteVocabBackImg = document.getElementById('btn-delete-edit-vocab-back-img');
    if (btnDeleteVocabBackImg) {
        btnDeleteVocabBackImg.onclick = () => {
            state.editBackImageDeleted = true;
            document.getElementById('edit-vocab-back-img-preview').classList.add('hidden');
            const fileInput = document.getElementById('edit-vocab-back-image');
            if (fileInput) {
                fileInput.value = '';
                fileInput.dispatchEvent(new Event('change'));
            }
        };
    }

    document.getElementById('edit-card-id').value = card.id;
    document.getElementById('edit-card-type').value = card.type || 'mixed';
    
    const editFrontImgInput = document.getElementById('edit-card-front-image');
    if (editFrontImgInput) {
        editFrontImgInput.value = '';
        editFrontImgInput.dispatchEvent(new Event('change'));
    }
    const editBackImgInput = document.getElementById('edit-card-back-image');
    if (editBackImgInput) {
        editBackImgInput.value = '';
        editBackImgInput.dispatchEvent(new Event('change'));
    }
    const editVocabFrontImgInput = document.getElementById('edit-vocab-front-image');
    if (editVocabFrontImgInput) {
        editVocabFrontImgInput.value = '';
        editVocabFrontImgInput.dispatchEvent(new Event('change'));
    }
    const editVocabBackImgInput = document.getElementById('edit-vocab-back-image');
    if (editVocabBackImgInput) {
        editVocabBackImgInput.value = '';
        editVocabBackImgInput.dispatchEvent(new Event('change'));
    }

    const vocabFields = document.getElementById('edit-vocab-fields');
    const mapFields = document.getElementById('edit-map-fields');
    const zettelkastenFields = document.getElementById('edit-zettelkasten-fields');
    
    let isMap = false;
    let isZettel = false;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            isMap = true;
        } else if (card.front.includes('"mode":"zettelkasten"')) {
            isZettel = true;
        }
    } catch (e) {}
    
    if (isMap || card.type === 'Memory Map') {
        document.getElementById('edit-card-type').value = 'Memory Map';
        vocabFields.classList.add('hidden');
        mapFields.classList.remove('hidden');
        if (zettelkastenFields) zettelkastenFields.classList.add('hidden');
        
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
    } else if (isZettel || card.type === 'Zettelkasten') {
        document.getElementById('edit-card-type').value = 'Zettelkasten';
        vocabFields.classList.add('hidden');
        mapFields.classList.add('hidden');
        if (zettelkastenFields) zettelkastenFields.classList.remove('hidden');
        
        let ztData = { quote: '', tags: [], links: [] };
        try {
            ztData = JSON.parse(card.front);
        } catch (e) {
            console.error("Error parsing zettelkasten front text:", e);
        }
        
        document.getElementById('edit-card-zettel-quote').value = ztData.quote || '';
        document.getElementById('edit-card-zettel-reference').value = card.back || '';
        document.getElementById('edit-card-zettel-tags').value = ztData.tags ? ztData.tags.join(', ') : '';
        state.editZettelLinks = ztData.links || [];
        
        renderZettelLinksList(true);
        populateZettelLinkDropdown(true, card.id);
    } else {
        vocabFields.classList.remove('hidden');
        mapFields.classList.add('hidden');
        if (zettelkastenFields) zettelkastenFields.classList.add('hidden');
        
        const isVocab = isVocabularyType(card.type);
        const editStandardFields = document.getElementById('edit-standard-fields');
        const editVocabFields = document.getElementById('edit-vocabulary-fields');
        
        if (isVocab) {
            if (editStandardFields) editStandardFields.classList.add('hidden');
            if (editVocabFields) editVocabFields.classList.remove('hidden');
            
            const parsed = parseVocabularyCard(card);
            
            document.getElementById('edit-vocab-word').value = parsed.targetWord;
            document.getElementById('edit-vocab-meaning').value = parsed.definition;
            
            const typeSelect = document.getElementById('edit-vocab-type');
            if (typeSelect) {
                typeSelect.selectedValues = [...parsed.wordTypes];
                [...typeSelect.options].forEach(o => {
                    o.selected = typeSelect.selectedValues.includes(o.value);
                });
                buildCustomDropdownUI('edit-vocab-type');
            }
            
            const frontPreviewDiv = document.getElementById('edit-vocab-front-img-preview');
            if (card.image_front_url) {
                frontPreviewDiv.classList.remove('hidden');
                frontPreviewDiv.querySelector('img').src = card.image_front_url;
            } else {
                frontPreviewDiv.classList.add('hidden');
            }

            const backPreviewDiv = document.getElementById('edit-vocab-back-img-preview');
            if (card.image_back_url) {
                backPreviewDiv.classList.remove('hidden');
                backPreviewDiv.querySelector('img').src = card.image_back_url;
            } else {
                backPreviewDiv.classList.add('hidden');
            }
        } else {
            if (editStandardFields) editStandardFields.classList.remove('hidden');
            if (editVocabFields) editVocabFields.classList.add('hidden');
            
            document.getElementById('edit-card-front').value = card.front;
            document.getElementById('edit-card-back').value = card.back;
            
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
        }
        
        updateFormLabelsAndPlaceholders(true, card.type);
        
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
    
    const btn = document.querySelector('#edit-card-form button[type="submit"]');
    const oldText = btn ? btn.textContent : 'Save Changes';
    if (btn) {
        btn.textContent = "Saving Changes...";
        btn.disabled = true;
    }
    
    let frontText = '';
    let backText = '';
    
    if (typeText === 'Memory Map') {
        const title = document.getElementById('edit-map-title').value.trim();
        if (!title) {
            await window.alert("Please enter a Memory Map Title.");
            if (btn) {
                btn.textContent = oldText;
                btn.disabled = false;
            }
            return;
        }
        if (state.editMapNodes.length === 0) {
            await window.alert("Please add at least one card to your Memory Map.");
            if (btn) {
                btn.textContent = oldText;
                btn.disabled = false;
            }
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
    } else if (typeText === 'Zettelkasten') {
        const quote = document.getElementById('edit-card-zettel-quote').value.trim();
        const reference = document.getElementById('edit-card-zettel-reference').value.trim();
        const tagsInput = document.getElementById('edit-card-zettel-tags').value.trim();
        
        if (!quote || !reference) {
            await window.alert("Please enter both a Quote and a Reference.");
            if (btn) {
                btn.textContent = oldText;
                btn.disabled = false;
            }
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        const ztData = {
            mode: 'zettelkasten',
            quote: quote,
            tags: tags,
            links: state.editZettelLinks || []
        };
        frontText = JSON.stringify(ztData);
        backText = reference;
    } else if (isVocabularyType(typeText)) {
        const word = document.getElementById('edit-vocab-word').value.trim();
        const meaning = document.getElementById('edit-vocab-meaning').value.trim();
        if (!word || !meaning) {
            await window.alert("Please fill in both the Word and Description/Meaning.");
            if (btn) {
                btn.textContent = oldText;
                btn.disabled = false;
            }
            return;
        }
        const typeSelect = document.getElementById('edit-vocab-type');
        const selectedTypes = (typeSelect.selectedValues || []).filter(Boolean);
        const wordType = selectedTypes.join(', ');
        frontText = word;
        if (wordType) {
            frontText = `${frontText} ||| ${wordType}`;
        }
        backText = meaning;
    } else {
        frontText = document.getElementById('edit-card-front').value.trim();
        backText = document.getElementById('edit-card-back').value.trim();
    }
    
    if (!frontText || !backText || !cardId) {
        if (btn) {
            btn.textContent = oldText;
            btn.disabled = false;
        }
        return;
    }

    const cardIndex = state.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        if (btn) {
            btn.textContent = oldText;
            btn.disabled = false;
        }
        return;
    }
    const existingCard = state.cards[cardIndex];

    const frontImageFile = isVocabularyType(typeText)
        ? (document.getElementById('edit-vocab-front-image') ? document.getElementById('edit-vocab-front-image').files[0] : null)
        : (document.getElementById('edit-card-front-image') ? document.getElementById('edit-card-front-image').files[0] : null);
    const backImageFile = isVocabularyType(typeText)
        ? (document.getElementById('edit-vocab-back-image') ? document.getElementById('edit-vocab-back-image').files[0] : null)
        : (document.getElementById('edit-card-back-image') ? document.getElementById('edit-card-back-image').files[0] : null);

    const editLimit = (typeText === 'Image Card') ? 1024 * 1024 : 500 * 1024;
    const editLimitLabel = (typeText === 'Image Card') ? '1 MB' : '500 KB';

    if (frontImageFile && frontImageFile.size > editLimit) {
        await window.alert(`Front image exceeds ${editLimitLabel} limit for ${typeText} cards! Selected file: ${(frontImageFile.size / 1024).toFixed(1)} KB.`);
        if (btn) {
            btn.textContent = oldText;
            btn.disabled = false;
        }
        return;
    }
    if (backImageFile && backImageFile.size > editLimit) {
        await window.alert(`Back image exceeds ${editLimitLabel} limit for ${typeText} cards! Selected file: ${(backImageFile.size / 1024).toFixed(1)} KB.`);
        if (btn) {
            btn.textContent = oldText;
            btn.disabled = false;
        }
        return;
    }

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

    if (state.editFrontImageDeleted) {
        if (existingCard.image_front_url) {
            await deleteOldImage(existingCard.image_front_url);
        }
        new_image_front_url = null;
    }

    if (frontImageFile) {
        if (existingCard.image_front_url && !state.editFrontImageDeleted) {
            await deleteOldImage(existingCard.image_front_url);
        }
        const uploaded = await uploadImage(frontImageFile, 'front');
        if (uploaded) new_image_front_url = uploaded;
    }

    if (state.editBackImageDeleted) {
        if (existingCard.image_back_url) {
            await deleteOldImage(existingCard.image_back_url);
        }
        new_image_back_url = null;
    }

    if (backImageFile) {
        if (existingCard.image_back_url && !state.editBackImageDeleted) {
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
        const updatedCard = data[0];
        const idx = state.cards.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            state.cards[idx] = updatedCard;
        }
        await dbSet('cached_cards', state.cards);

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

export function populateZettelLinkDropdown(isEdit, currentCardId = null) {
    const select = document.getElementById(isEdit ? 'edit-zettel-link-target' : 'create-zettel-link-target');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select Quote to Connect --</option>';
    
    state.cards.forEach(card => {
        if (card.type === 'Zettelkasten') {
            if (isEdit && card.id === currentCardId) return;
            
            let quote = '';
            try {
                const data = JSON.parse(card.front);
                quote = data.quote || card.front;
            } catch (e) {
                quote = card.front;
            }
            
            const opt = document.createElement('option');
            opt.value = card.id;
            const displayTitle = quote.length > 50 ? quote.substring(0, 50) + '...' : quote;
            opt.textContent = `"${displayTitle}" [${card.back}]`;
            select.appendChild(opt);
        }
    });
    
    buildCustomDropdownUI(isEdit ? 'edit-zettel-link-target' : 'create-zettel-link-target');
}

export function renderZettelLinksList(isEdit) {
    const listContainer = document.getElementById(isEdit ? 'edit-zettel-links-list' : 'create-zettel-links-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const links = isEdit ? state.editZettelLinks : state.createZettelLinks;
    
    if (links.length === 0) {
        listContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-secondary);">No connections added yet.</span>';
        return;
    }
    
    links.forEach((link, index) => {
        const targetCard = state.cards.find(c => c.id === link.targetId);
        let targetText = 'Unknown Card';
        if (targetCard) {
            try {
                const data = JSON.parse(targetCard.front);
                targetText = data.quote || targetCard.front;
            } catch (e) {
                targetText = targetCard.front;
            }
        }
        
        const truncatedText = targetText.length > 60 ? targetText.substring(0, 60) + '...' : targetText;
        
        const item = document.createElement('div');
        item.className = 'zettel-link-item';
        item.innerHTML = `
            <span class="zettel-link-text">"${truncatedText}"</span>
            <span class="zettel-link-label-badge">${link.label || 'connects to'}</span>
            <button type="button" class="btn-icon" data-index="${index}" style="color:var(--danger); cursor:pointer; background:none; border:none; padding:0; display:inline-flex; align-items:center;" title="Remove connection">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        item.querySelector('button').addEventListener('click', () => {
            links.splice(index, 1);
            renderZettelLinksList(isEdit);
        });
        
        listContainer.appendChild(item);
    });
}

export function initZettelkastenFormListeners() {
    const btnCreateAdd = document.getElementById('btn-create-add-zettel-link');
    if (btnCreateAdd) {
        btnCreateAdd.onclick = () => {
            const targetSelect = document.getElementById('create-zettel-link-target');
            const labelInput = document.getElementById('create-zettel-link-label');
            const targetId = targetSelect.value;
            const label = labelInput.value.trim();
            
            if (!targetId) {
                window.alert("Please select a target card to connect to.");
                return;
            }
            
            if (state.createZettelLinks.some(l => l.targetId === targetId)) {
                window.alert("This connection already exists.");
                return;
            }
            
            state.createZettelLinks.push({ targetId, label });
            renderZettelLinksList(false);
            
            targetSelect.value = '';
            labelInput.value = '';
            buildCustomDropdownUI('create-zettel-link-target');
        };
    }
    
    const btnEditAdd = document.getElementById('btn-edit-add-zettel-link');
    if (btnEditAdd) {
        btnEditAdd.onclick = () => {
            const targetSelect = document.getElementById('edit-zettel-link-target');
            const labelInput = document.getElementById('edit-zettel-link-label');
            const targetId = targetSelect.value;
            const label = labelInput.value.trim();
            const editCardId = document.getElementById('edit-card-id').value;
            
            if (!targetId) {
                window.alert("Please select a target card to connect to.");
                return;
            }
            
            if (targetId === editCardId) {
                window.alert("A card cannot connect to itself.");
                return;
            }
            
            if (state.editZettelLinks.some(l => l.targetId === targetId)) {
                window.alert("This connection already exists.");
                return;
            }
            
            state.editZettelLinks.push({ targetId, label });
            renderZettelLinksList(true);
            
            targetSelect.value = '';
            labelInput.value = '';
            buildCustomDropdownUI('edit-zettel-link-target');
        };
    }
}

window.populateZettelLinkDropdown = populateZettelLinkDropdown;
window.renderZettelLinksList = renderZettelLinksList;
window.initZettelkastenFormListeners = initZettelkastenFormListeners;

function removeWordFromDefinition(definition, word) {
    if (!definition || !word) return definition;
    
    const cleanWord = word.trim().toLowerCase();
    
    // Helper to get stem of the target word by stripping common suffixes
    function getStem(w) {
        const suffixes = [
            'atiousness', 'ativeness', 'fulness', 'lessness', 'iveness', 'abilities', 'ability', 'ibility', 
            'grouping', 'ization', 'isation', 'ational', 'iteness', 'iveness', 'ments', 'ment', 'nesses', 'ness', 
            'tions', 'sions', 'tion', 'sion', 'ances', 'ences', 'ance', 'ence', 'ships', 'ship', 'hoods', 'hood', 
            'ables', 'ibles', 'able', 'ible', 'als', 'ials', 'al', 'ial', 'ives', 'atives', 'itives', 'ive', 'ative', 'itive', 
            'ous', 'ious', 'uous', 'eous', 'fuls', 'ful', 'less', 'ish', 'ists', 'isms', 'ist', 'ism', 'ities', 'ity', 'ties', 'ty', 
            'izes', 'ises', 'ize', 'ise', 'ates', 'ate', 'ifies', 'ify', 'ests', 'est', 'ings', 'ing', 'eds', 'ed', 'lys', 'ly', 
            'es', 'ers', 'er', 'or', 's', 'y', 'e', 'd'
        ];
        
        // Sort suffixes descending by length
        suffixes.sort((a, b) => b.length - a.length);
        
        for (const suffix of suffixes) {
            if (w.endsWith(suffix) && (w.length - suffix.length) >= 4) {
                return w.slice(0, -suffix.length);
            }
        }
        return w;
    }
    
    const stem = getStem(cleanWord);
    
    // Mask any word in the definition that starts with the target word's stem
    const escapedStem = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escapedStem + '[a-zA-Z]*\\b', 'gi');
    
    // Exact word fallback just in case
    const escapedWord = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = new RegExp('\\b' + escapedWord + '(s|ed|ing|ly|es)?\\b', 'gi');
    
    let result = definition.replace(regex, '___');
    result = result.replace(exactRegex, '___');
    return result;
}

export async function fetchDictionaryDefinition(word) {
    if (!word || word.trim() === '') {
        await window.alert("Please type a word first!");
        return null;
    }
    
    const cleanWord = word.trim().toLowerCase();

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Word "${word}" not found in the dictionary.`);
            }
            throw new Error(`Dictionary API returned status ${response.status}`);
        }
        
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            const partsOfSpeech = [];
            const posGroups = {};
            
            data.forEach(entry => {
                if (entry.meanings) {
                    entry.meanings.forEach(meaning => {
                        const pos = meaning.partOfSpeech || 'definition';
                        const normalizedPos = pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
                        
                        if (normalizedPos && !partsOfSpeech.includes(normalizedPos)) {
                            partsOfSpeech.push(normalizedPos);
                        }
                        
                        if (!posGroups[normalizedPos]) {
                            posGroups[normalizedPos] = [];
                        }
                        
                        if (meaning.definitions) {
                            meaning.definitions.forEach(defObj => {
                                if (defObj.definition) {
                                    const cleanDef = removeWordFromDefinition(defObj.definition, word.trim());
                                    if (!posGroups[normalizedPos].includes(cleanDef)) {
                                        posGroups[normalizedPos].push(cleanDef);
                                    }
                                }
                            });
                        }
                    });
                }
            });
            
            let definitionText = '';
            Object.keys(posGroups).forEach(pos => {
                const defs = posGroups[pos];
                if (defs.length > 1) {
                    definitionText += `(${pos})\n`;
                    defs.forEach((def, index) => {
                        definitionText += `${index + 1}. ${def}\n`;
                    });
                    definitionText += `\n`;
                } else if (defs.length === 1) {
                    definitionText += `(${pos}) ${defs[0]}\n\n`;
                }
            });
            
            if (definitionText.trim().length > 0) {
                console.log(`Successfully fetched definition for "${cleanWord}" from Free Dictionary API`);
                return {
                    definition: definitionText.trim(),
                    partsOfSpeech: partsOfSpeech
                };
            }
        }
        throw new Error("No definitions found in the API response.");
    } catch (err) {
        console.error("Dictionary Fetch Error:", err);
        await window.alert(`Could not fetch meaning: ${err.message}`);
        return null;
    }
}

export function initVocabFormListeners() {
    const btnCreateAddMeaning = document.getElementById('btn-vocab-add-meaning');
    if (btnCreateAddMeaning) {
        btnCreateAddMeaning.onclick = async () => {
            const wordInput = document.getElementById('vocab-word');
            const word = wordInput ? wordInput.value.trim() : '';
            
            const btnText = btnCreateAddMeaning.textContent;
            btnCreateAddMeaning.textContent = "Fetching...";
            btnCreateAddMeaning.disabled = true;
            
            const res = await fetchDictionaryDefinition(word);
            
            btnCreateAddMeaning.textContent = btnText;
            btnCreateAddMeaning.disabled = false;
            
            if (res) {
                const meaningTextarea = document.getElementById('vocab-meaning');
                if (meaningTextarea) {
                    meaningTextarea.value = res.definition;
                }
                
                // Auto-select type(s)
                if (res.partsOfSpeech && res.partsOfSpeech.length > 0) {
                    const vocabTypeSelect = document.getElementById('vocab-type');
                    if (vocabTypeSelect) {
                        vocabTypeSelect.selectedValues = [];
                        res.partsOfSpeech.forEach(pos => {
                            const matchingOption = [...vocabTypeSelect.options].find(
                                opt => opt.value.toLowerCase() === pos.toLowerCase()
                            );
                            if (matchingOption && !vocabTypeSelect.selectedValues.includes(matchingOption.value)) {
                                vocabTypeSelect.selectedValues.push(matchingOption.value);
                            }
                        });
                        [...vocabTypeSelect.options].forEach(o => {
                            o.selected = vocabTypeSelect.selectedValues.includes(o.value);
                        });
                        buildCustomDropdownUI('vocab-type');
                    }
                }
            }
        };
    }

    const btnEditAddMeaning = document.getElementById('btn-edit-vocab-add-meaning');
    if (btnEditAddMeaning) {
        btnEditAddMeaning.onclick = async () => {
            const wordInput = document.getElementById('edit-vocab-word');
            const word = wordInput ? wordInput.value.trim() : '';
            
            const btnText = btnEditAddMeaning.textContent;
            btnEditAddMeaning.textContent = "Fetching...";
            btnEditAddMeaning.disabled = true;
            
            const res = await fetchDictionaryDefinition(word);
            
            btnEditAddMeaning.textContent = btnText;
            btnEditAddMeaning.disabled = false;
            
            if (res) {
                const meaningTextarea = document.getElementById('edit-vocab-meaning');
                if (meaningTextarea) {
                    meaningTextarea.value = res.definition;
                }
                
                // Auto-select type(s)
                if (res.partsOfSpeech && res.partsOfSpeech.length > 0) {
                    const vocabTypeSelect = document.getElementById('edit-vocab-type');
                    if (vocabTypeSelect) {
                        vocabTypeSelect.selectedValues = [];
                        res.partsOfSpeech.forEach(pos => {
                            const matchingOption = [...vocabTypeSelect.options].find(
                                opt => opt.value.toLowerCase() === pos.toLowerCase()
                            );
                            if (matchingOption && !vocabTypeSelect.selectedValues.includes(matchingOption.value)) {
                                vocabTypeSelect.selectedValues.push(matchingOption.value);
                            }
                        });
                        [...vocabTypeSelect.options].forEach(o => {
                            o.selected = vocabTypeSelect.selectedValues.includes(o.value);
                        });
                        buildCustomDropdownUI('edit-vocab-type');
                    }
                }
            }
        };
    }
}
