import { state } from './state.js';
import { updateCardInDB } from './flashcardCrud.js';
import { dbGet } from './db.js';

export function getCategoryTuning(cardType, logs) {
    if (!logs || !Array.isArray(logs) || logs.length === 0 || !cardType) {
        return { retentionMultiplier: 1.0, easeAdjustment: 0.0, successRate: null };
    }

    const cardTypes = {};
    state.cards.forEach(c => {
        if (c.id && c.type) cardTypes[c.id] = c.type;
    });

    let totalAttempts = 0;
    let successfulAttempts = 0;

    logs.forEach(log => {
        const type = cardTypes[log.cardId];
        if (type === cardType) {
            totalAttempts++;
            if (log.grade >= 2) {
                successfulAttempts++;
            }
        }
    });

    if (totalAttempts >= 5) {
        const successRate = successfulAttempts / totalAttempts;
        let retentionMultiplier = 1.0;
        let easeAdjustment = 0.0;

        if (successRate >= 0.90) {
            retentionMultiplier = 1.15; // Space reviews further apart
            easeAdjustment = 0.10;      // Boost ease factor
        } else if (successRate <= 0.80) {
            retentionMultiplier = 0.80; // Space reviews closer together
            easeAdjustment = -0.15;     // Penalize ease factor
        }

        return { retentionMultiplier, easeAdjustment, successRate };
    }

    return { retentionMultiplier: 1.0, easeAdjustment: 0.0, successRate: null };
}

export async function applySM2Grade(gradeInt) {
    const cardId = state.reviewQueue[state.currentReviewIndex].id;
    const cardIndexInGlobal = state.cards.findIndex(c => c.id === cardId);
    if (cardIndexInGlobal === -1) return;
    
    let card = state.cards[cardIndexInGlobal];
    
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not load review logs for personalization:", e);
    }

    const tuning = getCategoryTuning(card.type, logs);
    if (tuning.successRate !== null) {
        console.log(`[Personalized SM-2] Type: ${card.type} | Success Rate: ${Math.round(tuning.successRate * 100)}% | Spacing Multiplier: ${tuning.retentionMultiplier}x | Ease Shift: ${tuning.easeAdjustment}`);
    }

    if (gradeInt === 0) {
        card.repetitions = 0;
        card.interval = 1 / (24 * 60); // 1 minute
        card.ease = Math.max(1.3, card.ease - 0.2 + tuning.easeAdjustment);
    } else {
        if (gradeInt === 1) { // Hard
            card.interval = Math.max(10 / (24 * 60), card.interval * 1.2 * tuning.retentionMultiplier); 
            card.ease = Math.max(1.3, card.ease - 0.15 + tuning.easeAdjustment);
        } 
        else if (gradeInt === 2) { // Good
            if (card.repetitions === 0) card.interval = (10 / (24 * 60)) * tuning.retentionMultiplier; 
            else if (card.repetitions === 1) card.interval = 0.5 * tuning.retentionMultiplier; 
            else if (card.repetitions === 2) card.interval = 1.0 * tuning.retentionMultiplier; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease * tuning.retentionMultiplier));
        }
        else if (gradeInt === 3) { // Easy
            if (card.repetitions === 0) card.interval = 1.0 * tuning.retentionMultiplier; 
            else if (card.repetitions === 1) card.interval = 4.0 * tuning.retentionMultiplier; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3 * tuning.retentionMultiplier));
            card.ease += 0.15 + tuning.easeAdjustment;
        }
        card.repetitions += 1;
    }

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}
