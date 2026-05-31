import { state } from './state.js';
import { updateCardInDB } from './flashcardCrud.js';

export async function applySM2Grade(gradeInt) {
    const cardId = state.reviewQueue[state.currentReviewIndex].id;
    const cardIndexInGlobal = state.cards.findIndex(c => c.id === cardId);
    if (cardIndexInGlobal === -1) return;
    
    let card = state.cards[cardIndexInGlobal];
    
    if (gradeInt === 0) {
        card.repetitions = 0;
        card.interval = 1 / (24 * 60); // 1 minute
        card.ease = Math.max(1.3, card.ease - 0.2);
    } else {
        if (gradeInt === 1) { // Hard
            card.interval = Math.max(10 / (24 * 60), card.interval * 1.2); 
            card.ease = Math.max(1.3, card.ease - 0.15);
        } 
        else if (gradeInt === 2) { // Good
            if (card.repetitions === 0) card.interval = 10 / (24 * 60); 
            else if (card.repetitions === 1) card.interval = 0.5; 
            else if (card.repetitions === 2) card.interval = 1; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease));
        }
        else if (gradeInt === 3) { // Easy
            if (card.repetitions === 0) card.interval = 1; 
            else if (card.repetitions === 1) card.interval = 4; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
            card.ease += 0.15;
        }
        card.repetitions += 1;
    }

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}
