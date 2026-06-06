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

    // Ensure ease factor is initialized based on score if missing
    if (card.ease === undefined || card.ease === null) {
        card.ease = 1.3 + (card.score / 100) * 2.5;
    }

    // Ensure repetitions counter is initialized
    if (card.repetitions === undefined || card.repetitions === null) {
        card.repetitions = 0;
    }
    
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not load review logs for personalization:", e);
    }

    const tuning = getCategoryTuning(card.type, logs);

    // Calculate delta EF and handle repetitions based on SM-2 rules
    let deltaEF = 0.0;
    if (gradeInt === 3) { // Easy (q = 5)
        deltaEF = 0.10;
        card.repetitions += 1;
    } else if (gradeInt === 2) { // Good (q = 4)
        deltaEF = 0.00;
        card.repetitions += 1;
    } else if (gradeInt === 1) { // Hard (q = 3)
        deltaEF = -0.14;
        card.repetitions += 1; // Correct response, increment repetitions
    } else { // Fail/Again (gradeInt = 0, q = 0)
        deltaEF = -0.80;
        card.repetitions = 0; // Reset consecutive correct reviews
    }

    // Update Ease Factor (bounded to standard [1.3, 3.8])
    card.ease = Math.max(1.3, Math.min(3.8, card.ease + deltaEF));

    // Keep 1-100 score mathematically in sync with Ease Factor
    card.score = Math.max(1, Math.min(100, Math.round((card.ease - 1.3) / 2.5 * 100)));

    // Incorporate category ease adjustment for interval scaling
    let finalEase = card.ease + (tuning.easeAdjustment || 0.0);
    finalEase = Math.max(1.3, Math.min(3.8, finalEase));

    // Calculate next interval in days based on standard SM-2 rules
    if (gradeInt === 0) {
        // Failed: review again in 15 minutes (0.01 days)
        card.interval = 0.01;
    } else {
        if (card.repetitions === 1) {
            card.interval = (gradeInt === 3) ? 4.0 : 1.0;
        } else if (card.repetitions === 2) {
            card.interval = (gradeInt === 3) ? 8.0 : 6.0;
        } else {
            // Subsequent successful repetitions scale exponentially by final adjusted Ease Factor
            const baseInterval = card.interval && card.interval > 0.1 ? card.interval : 6.0;
            card.interval = Math.min(365, baseInterval * finalEase);
        }
    }

    // Apply category retentionMultiplier from logs tuning if active
    const multiplier = tuning.retentionMultiplier || 1.0;
    card.interval = card.interval * multiplier;

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}
