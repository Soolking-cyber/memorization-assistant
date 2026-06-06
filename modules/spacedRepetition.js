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
    
    // Ensure card has a valid score initialized (1-100, default 50)
    if (card.score === undefined || card.score === null) {
        card.score = 50;
    }
    
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not load review logs for personalization:", e);
    }

    const tuning = getCategoryTuning(card.type, logs);

    // Update 1-100 score dynamically based on gradeInt
    if (gradeInt === 3) { // Easy
        card.score = Math.min(100, card.score + Math.max(10, Math.round((100 - card.score) * 0.4)));
    } else if (gradeInt === 2) { // Good
        card.score = Math.min(100, card.score + Math.max(8, Math.round((100 - card.score) * 0.25)));
    } else if (gradeInt === 1) { // Hard
        card.score = Math.max(1, card.score - Math.max(5, Math.round(card.score * 0.15)));
    } else { // Fail/Again (gradeInt = 0)
        card.score = Math.max(1, card.score - Math.max(10, Math.round(card.score * 0.35)));
    }

    // Spaced repetition interval is determined directly by this score:
    // interval = 0.01 + Math.pow(score / 20, 2)
    // Applying category retentionMultiplier from logs tuning if active
    const multiplier = tuning.retentionMultiplier || 1.0;
    card.interval = (0.01 + Math.pow(card.score / 20, 2)) * multiplier;
    
    card.repetitions += 1;

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}
