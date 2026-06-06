import { state } from '../state.js';
import { dbGet } from '../db.js';
import { applySM2Grade } from '../spacedRepetition.js';
import { logReviewAttempt } from '../practice.js';
import { playUISound } from '../sound.js';
import { calculateCardStats } from '../gamification.js';
import { switchView } from '../navigation.js';
import { ICONS } from '../icons.js';

// Gameplay state
const scrambleState = {
    active: false,
    lives: 3,
    score: 0,
    streak: 0,
    maxStreak: 0,
    cards: [],
    currentIndex: 0,
    assembled: [], // array storing tile indexes corresponding to slots, or null
    tiles: [],     // array of objects: { letter, originalIndex, used }
    timerId: null,
    timeLeft: 0,
    totalDuration: 0,
    totalCorrect: 0,
    totalSeen: 0,
    totalTime: 0,
    wordStartTime: 0,
    currentTierKey: '',
    currentTierName: ''
};

/**
 * Initializes and renders the scramble difficulty selection decks.
 */
export async function initScrambleView() {
    scrambleState.active = false;
    clearGameTimer();

    // Toggle sub-views within scramble view container
    document.getElementById('scramble-decks-view')?.classList.remove('hidden');
    document.getElementById('scramble-play-view')?.classList.add('hidden');
    document.getElementById('scramble-results-view')?.classList.add('hidden');

    const grid = document.getElementById('scramble-decks-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align: center; padding: 40px; font-weight: 600; color: var(--text-secondary);">Preparing Decks...</div>';

    // Retrieve logs for calculating struggle index
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not retrieve review logs for Scramble:", e);
    }

    // Filter vocabulary cards and compute stats (now based on unified score)
    const vocabCards = state.cards
        .filter(card => card.type && card.type.toLowerCase() === 'vocabulary')
        .map(card => {
            const stats = calculateCardStats(card, logs);
            return { card, stats };
        });

    // Sort vocabulary cards ascending by score (lowest score first = study hardest words first)
    vocabCards.sort((a, b) => a.stats.score - b.stats.score);

    const legendaryCards = [];
    const ultraRareCards = [];
    const epicCards = [];
    const rareCards = [];
    const commonCards = [];

    vocabCards.forEach((cardObj) => {
        const stats = cardObj.stats;
        if (stats.tier.key === 'ultrarare') ultraRareCards.push(cardObj.card);
        else if (stats.tier.key === 'legendary') legendaryCards.push(cardObj.card);
        else if (stats.tier.key === 'epic') epicCards.push(cardObj.card);
        else if (stats.tier.key === 'rare') rareCards.push(cardObj.card);
        else commonCards.push(cardObj.card);
    });

    const decksConfig = [
        {
            key: 'ultrarare',
            name: 'Critical Focus',
            badge: 'Critical',
            class: 'scramble-deck-ultrarare',
            cards: ultraRareCards,
            desc: 'Top 10 absolute hardest cards.'
        },
        {
            key: 'legendary',
            name: 'High Struggle',
            badge: 'High Struggle',
            class: 'scramble-deck-legendary',
            cards: legendaryCards,
            desc: 'High difficulty recall cards.'
        },
        {
            key: 'epic',
            name: 'Medium Struggle',
            badge: 'Medium Struggle',
            class: 'scramble-deck-epic',
            cards: epicCards,
            desc: 'Struggling cards needing review.'
        },
        {
            key: 'rare',
            name: 'Low Struggle',
            badge: 'Low Struggle',
            class: 'scramble-deck-rare',
            cards: rareCards,
            desc: 'Moderate difficulty memories.'
        },
        {
            key: 'common',
            name: 'Mastered',
            badge: 'Mastered',
            class: 'scramble-deck-common',
            cards: commonCards,
            desc: 'Strong retention memories.'
        }
    ];

    grid.innerHTML = '';

    decksConfig.forEach(cfg => {
        const count = cfg.cards.length;
        const cardEl = document.createElement('div');
        cardEl.className = `scramble-deck-card ${cfg.class}`;

        const emptyText = count === 0 ? '<div class="scramble-deck-empty-badge">Deck Empty</div>' : '';

        cardEl.innerHTML = `
            <div>
                <span class="scramble-deck-badge">${cfg.badge}</span>
                <h4 class="scramble-deck-title">${cfg.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 6px;">${cfg.desc}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
                <span class="scramble-deck-count">${count} Cards</span>
                ${emptyText}
            </div>
        `;

        cardEl.addEventListener('click', () => {
            if (count === 0) {
                try { playUISound('fail'); } catch(e) {}
                alert(`No cards in the ${cfg.name} deck! Create or fail more cards to unlock this struggle deck.`);
                return;
            }
            try { playUISound('click'); } catch(e) {}
            startScrambleSession(cfg.key, cfg.name, cfg.cards);
        });

        grid.appendChild(cardEl);
    });
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Starts a new gameplay session.
 */
function startScrambleSession(tierKey, tierName, cards) {
    scrambleState.active = true;
    scrambleState.lives = 3;
    scrambleState.score = 0;
    scrambleState.streak = 0;
    scrambleState.maxStreak = 0;
    scrambleState.currentIndex = 0;
    scrambleState.totalCorrect = 0;
    scrambleState.totalSeen = 0;
    scrambleState.totalTime = 0;
    scrambleState.cards = shuffleArray(cards);
    scrambleState.currentTierKey = tierKey;
    scrambleState.currentTierName = tierName;

    // UI Switches
    document.getElementById('scramble-decks-view')?.classList.add('hidden');
    document.getElementById('scramble-results-view')?.classList.add('hidden');
    document.getElementById('scramble-play-view')?.classList.remove('hidden');

    const scoreVal = document.getElementById('scramble-score-val');
    if (scoreVal) scoreVal.textContent = '0';
    const streakVal = document.getElementById('scramble-streak-val');
    if (streakVal) streakVal.textContent = '0x';

    loadNextWord();
}

/**
 * Resets Scramble Game hooks and timers (safe navigation fallback).
 */
export function resetScrambleGame() {
    scrambleState.active = false;
    clearGameTimer();
}

function clearGameTimer() {
    if (scrambleState.timerId) {
        clearInterval(scrambleState.timerId);
        scrambleState.timerId = null;
    }
}

/**
 * Prepares and renders the current word/clue.
 */
function loadNextWord() {
    clearGameTimer();

    // Check if game is over or deck is cleared
    if (scrambleState.lives <= 0 || scrambleState.currentIndex >= scrambleState.cards.length) {
        endScrambleSession();
        return;
    }

    scrambleState.totalSeen++;
    const card = scrambleState.cards[scrambleState.currentIndex];
    const targetWord = card.back.trim();

    // Reset feedback
    const feedbackBox = document.getElementById('scramble-feedback-box');
    if (feedbackBox) {
        feedbackBox.className = 'scramble-feedback hidden';
        feedbackBox.innerHTML = '';
    }

    // Reset action button
    const actionBtn = document.getElementById('btn-scramble-action');
    if (actionBtn) {
        actionBtn.textContent = 'Check (Enter)';
        actionBtn.className = 'btn primary';
        actionBtn.style.background = '';
        delete actionBtn.dataset.nextMode;
    }

    // Update HUD progress & lives
    const progressVal = document.getElementById('scramble-progress-val');
    if (progressVal) {
        progressVal.textContent = `${scrambleState.currentIndex + 1} / ${scrambleState.cards.length}`;
    }
    updateLivesHUD();

    // Clue text
    const clueText = document.getElementById('scramble-clue-text');
    if (clueText) {
        clueText.textContent = card.front || 'Memory Clue';
    }

    // Render universal memory strength badge
    updateScrambleScoreBadge(card);

    // Scramble letters (only alphabetical/numeric characters)
    const rawLetters = [];
    for (let i = 0; i < targetWord.length; i++) {
        const char = targetWord[i];
        if (/[a-zA-Z0-9]/.test(char)) {
            rawLetters.push(char.toLowerCase());
        }
    }

    let scrambledLetters = shuffleArray(rawLetters);
    // Ensure the letters are actually scrambled, if word length is > 1
    if (rawLetters.length > 1 && scrambledLetters.join('') === rawLetters.join('')) {
        let attempts = 0;
        while (scrambledLetters.join('') === rawLetters.join('') && attempts < 15) {
            scrambledLetters = shuffleArray(rawLetters);
            attempts++;
        }
    }

    scrambleState.tiles = scrambledLetters.map((letter, idx) => ({
        letter,
        originalIndex: idx,
        used: false
    }));

    // Generate Slots
    const slotsContainer = document.getElementById('scramble-slots-container');
    if (slotsContainer) {
        slotsContainer.innerHTML = '';
        
        let slotCount = 0;
        let currentWordGroup = document.createElement('div');
        currentWordGroup.className = 'scramble-word-group';
        slotsContainer.appendChild(currentWordGroup);

        for (let i = 0; i < targetWord.length; i++) {
            const char = targetWord[i];
            if (/\s/.test(char)) {
                // End current word group, create space spacer, start new word group
                const space = document.createElement('span');
                space.className = 'scramble-space-divider';
                slotsContainer.appendChild(space);

                currentWordGroup = document.createElement('div');
                currentWordGroup.className = 'scramble-word-group';
                slotsContainer.appendChild(currentWordGroup);
            } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
                const punct = document.createElement('span');
                punct.className = 'letter-box-punctuation';
                punct.style.margin = '0 2px';
                punct.style.fontWeight = '800';
                punct.style.fontSize = '1.2rem';
                punct.style.color = 'var(--text-secondary)';
                punct.textContent = char;
                currentWordGroup.appendChild(punct);
            } else {
                const slot = document.createElement('div');
                slot.className = 'scramble-slot active-slot';
                slot.dataset.slotIndex = slotCount;
                currentWordGroup.appendChild(slot);
                slotCount++;
            }
        }
        scrambleState.assembled = Array(slotCount).fill(null);
    }

    // Generate Tiles
    const tilesContainer = document.getElementById('scramble-tiles-container');
    if (tilesContainer) {
        tilesContainer.innerHTML = '';
        scrambleState.tiles.forEach(tile => {
            const tileEl = document.createElement('div');
            tileEl.className = 'scramble-tile';
            tileEl.textContent = tile.letter.toUpperCase();
            tileEl.dataset.tileIndex = tile.originalIndex;
            
            tileEl.addEventListener('click', () => {
                handleTileClick(tile.originalIndex);
            });

            tilesContainer.appendChild(tileEl);
        });
    }

    // Set countdown timer duration: 5s base + 3s per letter
    const letterCount = rawLetters.length;
    const maxDuration = 5 + 3 * letterCount;
    scrambleState.timeLeft = maxDuration;
    scrambleState.totalDuration = maxDuration;

    const timerBar = document.getElementById('scramble-timer-bar');
    if (timerBar) {
        timerBar.style.width = '100%';
        timerBar.className = 'scramble-timer-bar';
    }

    // Start timer countdown (tick every 100ms for smooth bar scaling)
    scrambleState.wordStartTime = Date.now();
    scrambleState.timerId = setInterval(() => {
        scrambleState.timeLeft -= 0.1;
        
        const pct = Math.max(0, (scrambleState.timeLeft / scrambleState.totalDuration) * 100);
        if (timerBar) {
            timerBar.style.width = `${pct}%`;
            if (pct < 25) {
                timerBar.className = 'scramble-timer-bar danger';
            } else if (pct < 50) {
                timerBar.className = 'scramble-timer-bar warning';
            } else {
                timerBar.className = 'scramble-timer-bar';
            }
        }

        if (scrambleState.timeLeft <= 0) {
            handleWordTimeout();
        }
    }, 100);
}

/**
 * Handles tile clicks (placing them in slots).
 */
function handleTileClick(tileIndex) {
    if (!scrambleState.active) return;
    // Don't click if word evaluation is complete
    const actionBtn = document.getElementById('btn-scramble-action');
    if (actionBtn && actionBtn.dataset.nextMode === 'true') return;

    const tile = scrambleState.tiles.find(t => t.originalIndex === tileIndex);
    if (!tile || tile.used) return;

    // Find first empty slot index
    const firstEmptyIndex = scrambleState.assembled.findIndex(slot => slot === null);
    if (firstEmptyIndex === -1) return; // slots full

    // Place letter
    scrambleState.assembled[firstEmptyIndex] = tileIndex;
    tile.used = true;

    // Update UI
    const slotEl = document.querySelector(`.scramble-slot[data-slot-index="${firstEmptyIndex}"]`);
    if (slotEl) {
        slotEl.textContent = tile.letter.toUpperCase();
        slotEl.className = 'scramble-slot filled';
        // Add click listener to slot to remove letter
        slotEl.onclick = (e) => {
            e.stopPropagation();
            handleSlotClick(firstEmptyIndex);
        };
    }

    const tileEl = document.querySelector(`.scramble-tile[data-tile-index="${tileIndex}"]`);
    if (tileEl) {
        tileEl.classList.add('used');
    }

    try { playUISound('click'); } catch(e) {}
}

/**
 * Handles slot clicks (returning letter to active tiles list).
 */
function handleSlotClick(slotIndex) {
    if (!scrambleState.active) return;
    const actionBtn = document.getElementById('btn-scramble-action');
    if (actionBtn && actionBtn.dataset.nextMode === 'true') return;

    const tileIndex = scrambleState.assembled[slotIndex];
    if (tileIndex === null) return;

    const tile = scrambleState.tiles.find(t => t.originalIndex === tileIndex);
    if (tile) tile.used = false;

    scrambleState.assembled[slotIndex] = null;

    // Update UI
    const slotEl = document.querySelector(`.scramble-slot[data-slot-index="${slotIndex}"]`);
    if (slotEl) {
        slotEl.textContent = '';
        slotEl.className = 'scramble-slot active-slot';
        slotEl.onclick = null;
    }

    const tileEl = document.querySelector(`.scramble-tile[data-tile-index="${tileIndex}"]`);
    if (tileEl) {
        tileEl.classList.remove('used');
    }

    try { playUISound('click'); } catch(e) {}
}

/**
 * Updates hearts in the lives HUD.
 */
function updateLivesHUD() {
    const livesHud = document.getElementById('scramble-lives-hud');
    if (livesHud) {
        let html = '';
        for (let i = 0; i < 3; i++) {
            const isActive = i < scrambleState.lives;
            html += `<span class="game-life ${isActive ? 'active' : 'lost'}">${ICONS.heart}</span>`;
        }
        livesHud.innerHTML = html;
    }
}

/**
 * Evaluates spelling assembly logic.
 */
function checkSpelling() {
    clearGameTimer();

    const card = scrambleState.cards[scrambleState.currentIndex];
    const targetWord = card.back.trim().toLowerCase();

    // Reconstruct user spelled string
    let typedSpelling = '';
    let assembledCount = 0;

    // Reconstruct matching spaces and punctuations from the card back structure
    let letterIndex = 0;
    for (let i = 0; i < card.back.trim().length; i++) {
        const char = card.back.trim()[i];
        if (/\s/.test(char)) {
            typedSpelling += ' ';
        } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
            typedSpelling += char;
        } else {
            const tileIdx = scrambleState.assembled[letterIndex];
            if (tileIdx !== null) {
                const tile = scrambleState.tiles.find(t => t.originalIndex === tileIdx);
                typedSpelling += tile ? tile.letter : '';
                assembledCount++;
            }
            letterIndex++;
        }
    }

    const success = (typedSpelling.trim() === targetWord);

    // Sync progress metrics
    const elapsedSeconds = (Date.now() - scrambleState.wordStartTime) / 1000;
    scrambleState.totalTime += elapsedSeconds;

    const feedbackBox = document.getElementById('scramble-feedback-box');
    const actionBtn = document.getElementById('btn-scramble-action');

    // Handle SM-2 alignment safely
    const origQueue = state.reviewQueue;
    const origIndex = state.currentReviewIndex;
    state.reviewQueue = scrambleState.cards;
    state.currentReviewIndex = scrambleState.currentIndex;

    if (success) {
        scrambleState.totalCorrect++;
        scrambleState.streak++;
        if (scrambleState.streak > scrambleState.maxStreak) {
            scrambleState.maxStreak = scrambleState.streak;
        }

        // Calculate XP
        let baseXP = 20;
        if (scrambleState.currentTierKey === 'ultrarare') baseXP = 50;
        else if (scrambleState.currentTierKey === 'legendary') baseXP = 40;
        else if (scrambleState.currentTierKey === 'epic') baseXP = 35;
        else if (scrambleState.currentTierKey === 'rare') baseXP = 25;

        const timeRatio = scrambleState.timeLeft / scrambleState.totalDuration;
        const timeBonus = Math.round(15 * timeRatio);
        const streakBonus = Math.min(1.5, 1 + (scrambleState.streak * 0.1));
        const finalXP = Math.round((baseXP + timeBonus) * streakBonus);

        scrambleState.score += finalXP;

        // Sound & Confetti
        try { playUISound('success'); } catch(e) {}
        if (window.confetti) {
            window.confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.85 }
            });
        }

        const oldScore = card.score !== undefined && card.score !== null ? card.score : 50;

        // SM-2 sync
        applySM2Grade(3);
        logReviewAttempt(card.id, 3, 100);
        updateScrambleScoreBadge(card);

        const newScore = card.score !== undefined && card.score !== null ? card.score : 50;
        const diff = newScore - oldScore;
        const diffText = diff >= 0 ? `+${diff}%` : `${diff}%`;

        // Float Tag popup
        const playCard = document.getElementById('scramble-card-arena');
        if (playCard) {
            const floatTag = document.createElement('div');
            floatTag.className = 'scramble-floating-points';
            floatTag.textContent = `${diffText} Strength`;
            playCard.appendChild(floatTag);
            setTimeout(() => floatTag.remove(), 1200);
        }

        // Feedback UI
        if (feedbackBox) {
            feedbackBox.className = 'scramble-feedback success';
            feedbackBox.innerHTML = `
                <div class="scramble-feedback-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16" style="vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Spelling Correct!
                </div>
                <div style="font-size: 0.82rem;">Memory Strength increased to ${newScore}%.</div>
            `;
        }

        const streakVal = document.getElementById('scramble-streak-val');
        if (streakVal) streakVal.textContent = `${scrambleState.streak}x`;

    } else {
        // Shaking & flashing red animation
        const arena = document.getElementById('scramble-card-arena');
        if (arena) {
            arena.classList.add('scramble-card-shake', 'scramble-card-flash-red');
            setTimeout(() => {
                arena.classList.remove('scramble-card-shake', 'scramble-card-flash-red');
            }, 460);
        }

        try { playUISound('fail'); } catch(e) {}
        scrambleState.lives--;
        scrambleState.streak = 0;
        updateLivesHUD();

        if (feedbackBox) {
            feedbackBox.className = 'scramble-feedback danger';
            feedbackBox.innerHTML = `
                <div class="scramble-feedback-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16" style="vertical-align: middle;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Recall Failed
                </div>
                <div style="font-size: 0.8rem; margin-top: 2px;">Correct word:</div>
                <div class="scramble-feedback-correct">${card.back.toUpperCase()}</div>
            `;
        }

        const oldScore = card.score !== undefined && card.score !== null ? card.score : 50;

        // SM-2 sync
        applySM2Grade(0);
        logReviewAttempt(card.id, 0, 0);
        updateScrambleScoreBadge(card);

        const newScore = card.score !== undefined && card.score !== null ? card.score : 50;
        const diff = newScore - oldScore;
        const diffText = diff >= 0 ? `+${diff}%` : `${diff}%`;

        // Float Tag popup
        const playCard = document.getElementById('scramble-card-arena');
        if (playCard) {
            const floatTag = document.createElement('div');
            floatTag.className = 'scramble-floating-points';
            floatTag.style.color = 'var(--danger)';
            floatTag.style.borderColor = 'var(--danger)';
            floatTag.textContent = `${diffText} Strength`;
            playCard.appendChild(floatTag);
            setTimeout(() => floatTag.remove(), 1200);
        }

        const streakVal = document.getElementById('scramble-streak-val');
        if (streakVal) streakVal.textContent = '0x';
    }

    // Restore original practice session states
    state.reviewQueue = origQueue;
    state.currentReviewIndex = origIndex;

    // Toggle button mode to proceed
    if (actionBtn) {
        actionBtn.textContent = 'Proceed (Enter)';
        actionBtn.className = 'btn';
        actionBtn.style.background = 'var(--accent)';
        actionBtn.style.color = 'var(--btn-primary-text)';
        actionBtn.dataset.nextMode = 'true';
        actionBtn.focus();
    }
}

/**
 * Countdown timed out hook.
 */
function handleWordTimeout() {
    clearGameTimer();
    
    // Disable interactions
    const actionBtn = document.getElementById('btn-scramble-action');
    if (actionBtn && actionBtn.dataset.nextMode === 'true') return;

    const card = scrambleState.cards[scrambleState.currentIndex];

    // Shaking & red flash
    const arena = document.getElementById('scramble-card-arena');
    if (arena) {
        arena.classList.add('scramble-card-shake', 'scramble-card-flash-red');
        setTimeout(() => {
            arena.classList.remove('scramble-card-shake', 'scramble-card-flash-red');
        }, 460);
    }

    try { playUISound('fail'); } catch(e) {}
    scrambleState.lives--;
    scrambleState.streak = 0;
    updateLivesHUD();

    const feedbackBox = document.getElementById('scramble-feedback-box');
    if (feedbackBox) {
        feedbackBox.className = 'scramble-feedback danger';
        feedbackBox.innerHTML = `
            <div class="scramble-feedback-title">
                💔 Time Expired!
            </div>
            <div style="font-size: 0.8rem; margin-top: 2px;">Correct spelling was:</div>
            <div class="scramble-feedback-correct">${card.back.toUpperCase()}</div>
        `;
    }

    const oldScore = card.score !== undefined && card.score !== null ? card.score : 50;

    // Log SM-2 failure
    const origQueue = state.reviewQueue;
    const origIndex = state.currentReviewIndex;
    state.reviewQueue = scrambleState.cards;
    state.currentReviewIndex = scrambleState.currentIndex;
    applySM2Grade(0);
    logReviewAttempt(card.id, 0, 0);
    updateScrambleScoreBadge(card);
    state.reviewQueue = origQueue;
    state.currentReviewIndex = origIndex;

    const newScore = card.score !== undefined && card.score !== null ? card.score : 50;
    const diff = newScore - oldScore;
    const diffText = diff >= 0 ? `+${diff}%` : `${diff}%`;

    // Float Tag popup
    const playCard = document.getElementById('scramble-card-arena');
    if (playCard) {
        const floatTag = document.createElement('div');
        floatTag.className = 'scramble-floating-points';
        floatTag.style.color = 'var(--danger)';
        floatTag.style.borderColor = 'var(--danger)';
        floatTag.textContent = `${diffText} Strength`;
        playCard.appendChild(floatTag);
        setTimeout(() => floatTag.remove(), 1200);
    }

    const streakVal = document.getElementById('scramble-streak-val');
    if (streakVal) streakVal.textContent = '0x';

    if (actionBtn) {
        actionBtn.textContent = 'Proceed (Enter)';
        actionBtn.className = 'btn';
        actionBtn.style.background = 'var(--accent)';
        actionBtn.style.color = 'var(--btn-primary-text)';
        actionBtn.dataset.nextMode = 'true';
        actionBtn.focus();
    }
}

/**
 * Game Over or Victory deck completion.
 */
function endScrambleSession() {
    clearGameTimer();
    scrambleState.active = false;

    document.getElementById('scramble-play-view')?.classList.add('hidden');
    const resultsView = document.getElementById('scramble-results-view');
    if (resultsView) resultsView.classList.remove('hidden');

    const statusIcon = document.getElementById('scramble-result-status-icon');
    const titleEl = document.getElementById('scramble-result-title');
    const descEl = document.getElementById('scramble-result-desc');

    const totalSeen = Math.max(1, scrambleState.totalSeen);
    const solvedCount = scrambleState.totalCorrect;
    const accuracy = Math.round((solvedCount / totalSeen) * 100);
    
    // Play complete sound
    try { playUISound(solvedCount > 0 ? 'complete' : 'fail'); } catch(e) {}

    if (scrambleState.lives <= 0) {
        if (statusIcon) statusIcon.textContent = '💔';
        if (titleEl) titleEl.textContent = 'Game Over';
        if (descEl) descEl.textContent = 'You lost all your lives! Don\'t worry, practice makes perfect.';
    } else {
        if (statusIcon) statusIcon.textContent = '🏆';
        if (titleEl) titleEl.textContent = 'Victory!';
        if (descEl) descEl.textContent = 'Incredible! You cleared the entire struggle deck stack.';
        
        // Spawn win confetti
        if (window.confetti) {
            window.confetti({ particleCount: 80, spread: 80 });
        }
    }

    // Average time speed
    const avgTime = scrambleState.totalCorrect > 0 ? (scrambleState.totalTime / scrambleState.totalCorrect).toFixed(1) + 's' : '—';

    // Renders Stats
    const scoreVal = document.getElementById('scramble-stat-score');
    if (scoreVal) scoreVal.textContent = scrambleState.score;
    const streakVal = document.getElementById('scramble-stat-streak');
    if (streakVal) streakVal.textContent = `${scrambleState.maxStreak}x`;
    const solvedVal = document.getElementById('scramble-stat-solved');
    if (solvedVal) solvedVal.textContent = `${solvedCount} / ${totalSeen}`;
    const timeVal = document.getElementById('scramble-stat-time');
    if (timeVal) timeVal.textContent = avgTime;

    // Bind footer action buttons
    const btnRetry = document.getElementById('btn-scramble-retry');
    if (btnRetry) {
        btnRetry.onclick = () => {
            try { playUISound('click'); } catch(e) {}
            startScrambleSession(scrambleState.currentTierKey, scrambleState.currentTierName, scrambleState.cards);
        };
    }

    const btnBackToDecks = document.getElementById('btn-scramble-back-to-decks');
    if (btnBackToDecks) {
        btnBackToDecks.onclick = () => {
            try { playUISound('click'); } catch(e) {}
            initScrambleView();
        };
    }
}

/**
 * Handles global/scoped keydowns for scramble view.
 */
export function handleScrambleKeydown(e) {
    if (!scrambleState.active) return;

    // Block keyboard handling when settings modals or inputs are focused
    if (e.target.closest('#settings-modal') || e.target.closest('textarea') || e.target.closest('input')) {
        return;
    }

    const actionBtn = document.getElementById('btn-scramble-action');
    const isNextMode = actionBtn && actionBtn.dataset.nextMode === 'true';

    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (isNextMode) {
            scrambleState.currentIndex++;
            loadNextWord();
        } else {
            // Only check spelling if some letters are placed
            const isAnyPlaced = scrambleState.assembled.some(slot => slot !== null);
            if (isAnyPlaced) {
                checkSpelling();
            }
        }
        return;
    }

    if (isNextMode) return; // ignore letter inputs in feedback stage

    if (e.key === 'Backspace') {
        e.preventDefault();
        // Find rightmost filled slot index
        let lastFilledIdx = -1;
        for (let i = scrambleState.assembled.length - 1; i >= 0; i--) {
            if (scrambleState.assembled[i] !== null) {
                lastFilledIdx = i;
                break;
            }
        }
        if (lastFilledIdx !== -1) {
            handleSlotClick(lastFilledIdx);
        }
        return;
    }

    if (e.key === 'Escape') {
        e.preventDefault();
        // Return all letters to tile board
        for (let i = scrambleState.assembled.length - 1; i >= 0; i--) {
            if (scrambleState.assembled[i] !== null) {
                handleSlotClick(i);
            }
        }
        return;
    }

    // Match typed character to unused tile
    const char = e.key.toLowerCase();
    if (/^[a-z0-9]$/.test(char)) {
        const matchingUnusedTile = scrambleState.tiles.find(t => t.letter === char && !t.used);
        if (matchingUnusedTile) {
            handleTileClick(matchingUnusedTile.originalIndex);
        }
    }
}

// Bind Action Check Click event
document.addEventListener('DOMContentLoaded', () => {
    const actionBtn = document.getElementById('btn-scramble-action');
    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (actionBtn.dataset.nextMode === 'true') {
                scrambleState.currentIndex++;
                loadNextWord();
            } else {
                const isAnyPlaced = scrambleState.assembled.some(slot => slot !== null);
                if (isAnyPlaced) {
                    checkSpelling();
                }
            }
        });
    }

    const exitBtn = document.getElementById('btn-scramble-exit');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            try { playUISound('click'); } catch(e) {}
            clearGameTimer();
            scrambleState.active = false;
            switchView('dashboard');
        });
    }
});

function updateScrambleScoreBadge(card) {
    const score = card.score !== undefined && card.score !== null ? card.score : 50;
    const scoreTooltip = `Memory Strength: ${score}%\nDetermines next review: (Score/20)² days\n• Easy: +40% gap (min +10)\n• Good: +25% gap (min +8)\n• Hard: -15% score (min -5)\n• Again/Timeout: -35% score (min -10)`;
    const arena = document.getElementById('scramble-card-arena');
    if (arena) {
        let existingBadge = arena.querySelector('.card-score-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        arena.insertAdjacentHTML('beforeend', `
            <span class="card-score-badge" data-tooltip="${scoreTooltip}" style="position: absolute; top: 12px; right: 16px; z-index: 100;">
                ${ICONS.zap} ${score}%
            </span>
        `);
    }
}
