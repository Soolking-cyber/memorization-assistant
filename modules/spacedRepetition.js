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

// FSRS v4 Default Parameters (Weights)
const w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

export async function applySM2Grade(gradeInt) {
    const cardId = state.reviewQueue[state.currentReviewIndex].id;
    const cardIndexInGlobal = state.cards.findIndex(c => c.id === cardId);
    if (cardIndexInGlobal === -1) return;
    
    let card = state.cards[cardIndexInGlobal];
    
    // Ensure card has a valid score initialized (default 39 matching 2.4-day Good starting stability)
    if (card.score === undefined || card.score === null) {
        card.score = 39;
    }

    // Ensure repetitions counter is initialized
    if (card.repetitions === undefined || card.repetitions === null) {
        card.repetitions = 0;
    }

    // Load Stability (S) from interval column. Fallback to score mapping if missing
    let S = card.interval;
    if (!S || S <= 0.01) {
        S = 0.1 * Math.exp((card.score / 100) * Math.log(3650));
    }

    // Load Difficulty (D) from ease column. Fallback to 5.0 if missing
    let D = card.ease;
    if (!D || D < 1.0 || D > 10.0) {
        D = 5.0;
    }
    
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not load review logs for personalization:", e);
    }

    const tuning = getCategoryTuning(card.type, logs);

    // Map 0-3 gradeInt to 1-4 FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy)
    const g = gradeInt + 1; 

    let S_new = S;
    let D_new = D;

    if (card.repetitions === 0) {
        // First review: Initialize Stability & Difficulty
        S_new = w[g - 1];
        D_new = Math.max(1.0, Math.min(10.0, w[4] - w[5] * (g - 3)));
        
        if (g > 1) {
            card.repetitions = 1;
            card.interval = S_new;
        } else {
            card.repetitions = 0;
            card.interval = 0.01; // Review in 15 mins
        }
    } else {
        // Subsequent review: calculate elapsed time and retrievability
        const MS_PER_DAY = 86400000;
        const lastReviewDate = card.nextReview - (card.interval || 1.0) * MS_PER_DAY;
        const elapsedDays = Math.max(0.01, (Date.now() - lastReviewDate) / MS_PER_DAY);
        
        // Retrievability: power function forgetting curve
        const R = Math.pow(1 + elapsedDays / (9 * S), -0.4);

        // Update Difficulty (mean-reverted)
        const d_prime = D - w[6] * (g - 3);
        D_new = Math.max(1.0, Math.min(10.0, w[7] * w[4] + (1 - w[7]) * d_prime));

        // Apply category ease adjustment to difficulty
        D_new = Math.max(1.0, Math.min(10.0, D_new - (tuning.easeAdjustment || 0.0) * 10));

        if (g === 1) {
            // Forget stability
            S_new = w[11] * Math.pow(D_new, -w[12]) * (Math.pow(S + 1, w[13]) - 1) * Math.exp((1 - R) * w[14]);
            card.repetitions = 0;
            card.interval = 0.01; // Review in 15 mins
        } else {
            // Recall stability
            const hard_penalty = (g === 2) ? w[15] : 1.0;
            const easy_bonus = (g === 4) ? w[16] : 1.0;
            S_new = S * (1 + Math.exp(w[8]) * (11 - D_new) * Math.pow(S, -w[9]) * (Math.exp((1 - R) * w[10]) - 1)) * hard_penalty * easy_bonus;
            card.repetitions += 1;
            card.interval = S_new;
        }
    }

    // Apply category retention multiplier (if correct recall) and bound stability
    if (g > 1) {
        const multiplier = tuning.retentionMultiplier || 1.0;
        S_new = S_new * multiplier;
    }
    S_new = Math.max(0.1, Math.min(365.0, S_new));

    // Save FSRS Difficulty, Stability, and Interval
    card.ease = D_new;
    if (g > 1) {
        card.interval = S_new;
    }

    // Update 1-100 score logarithmically based on Stability
    card.score = Math.max(1, Math.min(100, Math.round(100 * Math.log(S_new / 0.1) / Math.log(3650))));

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}
