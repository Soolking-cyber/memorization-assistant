import { state } from '../state.js';
import { supabase } from '../supabaseClient.js';
import { ICONS } from '../icons.js';
import { dbSet } from '../db.js';
import { validateExampleSentence } from './spellingEngine.js';

export async function saveIncorrectExampleSentence() {
    const card = state.reviewQueue[state.currentReviewIndex];
    if (!card) return;
    
    const sentenceInput = document.getElementById('incorrect-sentence-input');
    const sentenceText = sentenceInput.value.trim();
    const errorMsg = document.getElementById('sentence-error-msg');
    const saveBtn = document.getElementById('btn-save-sentence');
    
    if (!sentenceText) {
        errorMsg.textContent = "Please enter an example sentence!";
        errorMsg.style.color = "#ea4335";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    if (!validateExampleSentence(sentenceText, card.back)) {
        errorMsg.textContent = `The sentence must contain the target word "${card.back}"!`;
        errorMsg.style.color = "#ea4335";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    const savedSentences = state.exampleSentences[card.id];
    let sentencesArray = [];
    if (Array.isArray(savedSentences)) {
        sentencesArray = [...savedSentences];
    } else if (typeof savedSentences === 'string') {
        sentencesArray = [savedSentences];
    }
    
    sentencesArray.push(sentenceText);
    state.exampleSentences[card.id] = sentencesArray;
    await dbSet('exampleSentences', state.exampleSentences);

    card.example_sentences = sentencesArray;

    if (state.userSession && supabase) {
        try {
            const { error } = await supabase
                .from('flashcards')
                .update({ example_sentences: sentencesArray })
                .eq('id', card.id)
                .eq('user_id', state.userSession.user.id);
            if (error) {
                console.error('Error updating example sentences in Supabase:', error);
            }
        } catch (err) {
            console.error('Error syncing example sentences update to DB:', err);
        }
    }
    
    errorMsg.innerHTML = "Sentence saved as memory clue! " + ICONS.check;
    errorMsg.style.color = "#34a853";
    errorMsg.classList.remove('hidden');
    
    saveBtn.disabled = true;
    setTimeout(() => {
        saveBtn.disabled = false;
        errorMsg.classList.add('hidden');
        document.getElementById('incorrect-sentence-container').classList.add('hidden');
        document.getElementById('btn-next-card').classList.remove('hidden');
    }, 1500);
}
