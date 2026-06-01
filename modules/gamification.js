import { state } from './state.js';
import { dbGet, dbSet } from './db.js';
import { switchView } from './navigation.js';
import { supabase } from './supabaseClient.js';
import { calculateMatchPercentage } from './practice/spellingEngine.js';
import { applySM2Grade } from './spacedRepetition.js';
import { logReviewAttempt } from './practice.js';
import { playUISound } from './sound.js';

/**
 * Calculates difficulty and gamification rarity statistics for a single card.
 * Rarity tier depends on Struggle Index = max(0, (failures * 6) - (successes * 3) + (clues * 4))
 */
export function calculateCardStats(card, logs) {
    const cardLogs = (logs || []).filter(log => log.cardId === card.id);
    const attempts = cardLogs.length;
    const failures = cardLogs.filter(log => log.grade < 2 || log.score < 75).length;
    const successes = attempts - failures;
    
    const savedSentences = state.exampleSentences[card.id];
    let cluesCount = 0;
    let sentences = [];
    
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences.filter(s => typeof s === 'string' && s.trim().length > 0);
        } else if (typeof savedSentences === 'string' && savedSentences.trim().length > 0) {
            sentences = [savedSentences];
        }
    }
    cluesCount = sentences.length;
    
    const struggleIndex = Math.max(0, (failures * 6) - (successes * 3) + (cluesCount * 4));
    const successRate = attempts > 0 ? Math.round(((attempts - failures) / attempts) * 100) : 100;
    
    let tier = {
        name: 'Tamed',
        key: 'common',
        class: 'tier-common',
        title: 'Common Card'
    };
    
    if (struggleIndex >= 22) {
        tier = {
            name: 'Untamed Colossus',
            key: 'legendary',
            class: 'tier-legendary',
            title: 'Legendary Card'
        };
    } else if (struggleIndex >= 12) {
        tier = {
            name: 'Wild Beast',
            key: 'epic',
            class: 'tier-epic',
            title: 'Epic Card'
        };
    } else if (struggleIndex >= 5) {
        tier = {
            name: 'Challenger',
            key: 'rare',
            class: 'tier-rare',
            title: 'Rare Card'
        };
    }
    
    return {
        attempts,
        failures,
        cluesCount,
        struggleIndex,
        successRate,
        tier,
        sentences
    };
}

/**
 * Master render engine for the Poké Deck View.
 * Renders 4 animated rarity card stacks with live counters.
 */
export async function renderCollectionDeck() {
    const stacksGrid = document.getElementById('stacks-grid');
    if (!stacksGrid) return;
    
    // Toggle view visibility resets
    document.getElementById('deck-stacks-view')?.classList.remove('hidden');
    document.getElementById('deck-study-view')?.classList.add('hidden');
    
    stacksGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; font-weight: 600; color: var(--text-secondary);">Shuffling Stacks...</div>';
    
    // Load reviews history from local cache db
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not retrieve review logs for Pokédex:", e);
    }
    
    // Group cards into the rarity tiers
    const legendaryCards = [];
    const ultraRareCards = [];
    const epicCards = [];
    const rareCards = [];
    const commonCards = [];
    
    // First, filter and map all vocabulary cards with their calculated stats
    const vocabCards = state.cards
        .filter(card => card.type && card.type.toLowerCase() === 'vocabulary')
        .map(card => {
            const stats = calculateCardStats(card, logs);
            return { card, stats };
        });
        
    // Sort vocabulary cards descending by struggleIndex to isolate the absolute hardest
    vocabCards.sort((a, b) => b.stats.struggleIndex - a.stats.struggleIndex);
    
    // The top 10 most difficult cards are classified as "Ultra Rare" (Apex Shadow)
    vocabCards.forEach((cardObj, idx) => {
        if (idx < 10) {
            cardObj.stats.tier = {
                name: 'Apex Shadow',
                key: 'ultrarare',
                class: 'tier-ultrarare',
                title: 'Ultra Rare Card'
            };
            ultraRareCards.push(cardObj);
        } else {
            // Re-allocate remaining cards to their native HP-based tiers
            const stats = cardObj.stats;
            if (stats.tier.key === 'legendary') legendaryCards.push(cardObj);
            else if (stats.tier.key === 'epic') epicCards.push(cardObj);
            else if (stats.tier.key === 'rare') rareCards.push(cardObj);
            else commonCards.push(cardObj);
        }
    });
    
    stacksGrid.innerHTML = '';
    
    // Stacks configuration list
    const stacksConfig = [
        {
            key: 'ultrarare',
            name: 'Apex Shadow',
            badge: 'Ultra Rare',
            class: 'stack-ultrarare',
            cards: ultraRareCards,
            desc: 'The top 10 absolute hardest concepts in your entire deck.'
        },
        {
            key: 'legendary',
            name: 'Untamed Colossus',
            badge: 'Legendary',
            class: 'stack-legendary',
            cards: legendaryCards,
            desc: 'Extreme difficulty memories needing immediate taming.'
        },
        {
            key: 'epic',
            name: 'Wild Beast',
            badge: 'Epic',
            class: 'stack-epic',
            cards: epicCards,
            desc: 'Struggling cards requiring steady active reviews.'
        },
        {
            key: 'rare',
            name: 'Challenger',
            badge: 'Rare',
            class: 'stack-rare',
            cards: rareCards,
            desc: 'Moderate difficulty memories showing light errors.'
        },
        {
            key: 'common',
            name: 'Tamed',
            badge: 'Common',
            class: 'stack-common',
            cards: commonCards,
            desc: 'Successfully tamed and mastered memory units.'
        }
    ];
    
    stacksConfig.forEach(cfg => {
        const stackWrapper = document.createElement('div');
        stackWrapper.className = `deck-stack ${cfg.class}`;
        
        const count = cfg.cards.length;
        const emptyBadge = count === 0 ? '<div class="stack-empty-badge">Stack Cleared!</div>' : '';
        
        stackWrapper.innerHTML = `
            <div class="stack-card stack-card-1"></div>
            <div class="stack-card stack-card-2"></div>
            <div class="stack-card stack-card-3">
                <div class="stack-info">
                    <span class="stack-badge">${cfg.badge}</span>
                    <h4 class="stack-title">${cfg.name}</h4>
                    <span class="stack-count">${count}</span>
                    <span class="stack-count-label">Concepts</span>
                    ${emptyBadge}
                </div>
            </div>
        `;
        
        // Trigger stack study session on click if cards are available
        stackWrapper.addEventListener('click', () => {
            if (count === 0) {
                try { playUISound('fail'); } catch(e) {}
                alert(`No concepts in the ${cfg.name} stack! You have completely tamed this difficulty level.`);
                return;
            }
            try { playUISound('click'); } catch(e) {}
            startStackStudy(cfg.key, cfg.name, cfg.cards);
        });
        
        stacksGrid.appendChild(stackWrapper);
    });
}

/**
 * Initializes and starts the stack active study session.
 */
function startStackStudy(tierKey, tierName, decoratedCards) {
    // Sort cards by struggle index descending (hardest first)
    const sorted = decoratedCards.sort((a, b) => b.stats.struggleIndex - a.stats.struggleIndex);
    
    state.reviewQueue = sorted.map(c => c.card);
    state.currentReviewIndex = 0;
    state.activeStudyTierKey = tierKey;
    state.activeStudyTierName = tierName;
    state.isForcedMode = true;
    state.practiceOrigin = 'collection'; // Backwards compatible fallback
    
    // Toggle active view states
    document.getElementById('deck-stacks-view')?.classList.add('hidden');
    const studyView = document.getElementById('deck-study-view');
    if (studyView) studyView.classList.remove('hidden');
    
    const studyTitle = document.getElementById('study-stack-title');
    if (studyTitle) studyTitle.textContent = `Taming ${tierName} Stack`;
    
    renderActiveStackCard();
}

/**
 * Renders the top card of the active study stack.
 */
function renderActiveStackCard() {
    const container = document.querySelector('.study-card-container');
    if (!container) return;
    
    const card = state.reviewQueue[state.currentReviewIndex];
    if (!card) {
        finishStackStudy();
        return;
    }
    
    // Update progress label
    const progressLabel = document.getElementById('study-stack-progress');
    if (progressLabel) {
        progressLabel.textContent = `Concept ${state.currentReviewIndex + 1} of ${state.reviewQueue.length}`;
    }
    
    // Recalculate stats for the card
    const sentences = state.exampleSentences[card.id] || [];
    let sentencesList = [];
    if (Array.isArray(sentences)) {
        sentencesList = sentences.filter(s => typeof s === 'string' && s.trim().length > 0);
    } else if (typeof sentences === 'string' && sentences.trim().length > 0) {
        sentencesList = [sentences];
    }
    
    // Rarity and stats mapping
    let logs = [];
    dbGet('review_activity_logs').then(l => {
        logs = l || [];
        const stats = calculateCardStats(card, logs);
        const titleText = getCardTitle(card);
        
        let illustrationContent = `<div class="illustration-text" style="font-size: 1.15rem; font-weight: 800; line-height: 1.55; overflow-y: auto; max-height: 100%; text-align: center; padding: 16px 20px; font-family: 'Outfit', sans-serif; color: var(--text-primary);">${titleText}</div>`;
        if (card.type === 'Image Card' && card.image_front_url) {
            illustrationContent = `<img class="illustration-img" src="${card.image_front_url}" alt="Memory Art">`;
        }
        
        const hpPercent = Math.min(100, Math.max(25, stats.struggleIndex * 3));
        
        container.innerHTML = `
            <div class="study-pokemon-card ${stats.tier.class} card-slide-in">
                <div class="card-holo"></div>
                <div class="card-header">
                    <div class="card-title-area">
                        <span class="card-rarity-badge">${stats.tier.name}</span>
                    </div>
                    <span class="card-type-indicator">${card.type || 'Unknown'}</span>
                </div>
                
                <div class="card-illustration">
                    ${illustrationContent}
                </div>
                
                <div class="card-hp-section">
                    <div class="card-hp-label">
                        <span>Wild Energy / HP</span>
                        <span class="hp-val">${stats.struggleIndex} HP</span>
                    </div>
                    <div class="card-hp-bar">
                        <div class="card-hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                </div>
                
                <!-- Dynamic active clues section -->
                <div class="card-abilities-section">
                    <!-- Clue slider populated dynamically -->
                </div>
                
                <!-- Recall Attack active prompt field -->
                <div class="recall-attack-area">
                    <div class="attack-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align: middle;">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        <span>Attack Move: Active Recall</span>
                    </div>
                    
                    <div class="attack-input-wrapper" style="display: flex; justify-content: center; width: 100%; overflow: visible;">
                        ${generateSpellingBoxesHTML(card.back)}
                    </div>
                    
                    <div id="deck-attack-feedback" class="attack-feedback hidden"></div>
                    
                    <div style="display: flex; justify-content: center; width: 100%; margin-top: 12px;" id="deck-attack-buttons-wrapper">
                        <button id="btn-deck-attack" class="deck-attack-btn" style="margin: 0; width: 100%;">Tame Concept (Enter)</button>
                    </div>
                </div>
            </div>
        `;
        
        const cardEl = container.querySelector('.study-pokemon-card');
        const attackBtn = container.querySelector('#btn-deck-attack');
        const feedbackBox = container.querySelector('#deck-attack-feedback');
        
        // Active Sentence Clues Navigation Slide System
        let activeSentenceIndex = 0;
        
        function updateSentenceClueUI() {
            const abilitiesContainer = cardEl.querySelector('.card-abilities-section');
            if (!abilitiesContainer) return;
            
            if (stats.sentences.length > 0) {
                const rawSentence = stats.sentences[activeSentenceIndex];
                const blurredSentence = blurWordInSentence(rawSentence, card.back);
                
                let navigationHTML = '';
                if (stats.sentences.length > 1) {
                    navigationHTML = `
                        <div class="clue-nav-buttons">
                            <button class="clue-nav-btn btn-up" title="Previous Clue">▲</button>
                            <button class="clue-nav-btn btn-down" title="Next Clue">▼</button>
                        </div>
                    `;
                }
                
                abilitiesContainer.innerHTML = `
                    <div class="ability-slot">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span class="ability-badge">Clue ${activeSentenceIndex + 1} of ${stats.sentences.length}</span>
                            ${navigationHTML}
                        </div>
                        <span class="ability-description" title="${rawSentence}">
                            "${blurredSentence}"
                        </span>
                    </div>
                `;
                
                // Bind arrow study triggers
                if (stats.sentences.length > 1) {
                    abilitiesContainer.querySelector('.btn-up').addEventListener('click', (e) => {
                        e.stopPropagation();
                        activeSentenceIndex = (activeSentenceIndex - 1 + stats.sentences.length) % stats.sentences.length;
                        try { playUISound('click'); } catch(err) {}
                        updateSentenceClueUI();
                    });
                    abilitiesContainer.querySelector('.btn-down').addEventListener('click', (e) => {
                        e.stopPropagation();
                        activeSentenceIndex = (activeSentenceIndex + 1) % stats.sentences.length;
                        try { playUISound('click'); } catch(err) {}
                        updateSentenceClueUI();
                    });
                }
            } else {
                abilitiesContainer.innerHTML = '<div class="no-abilities">No ability modifiers (sentences) attached. Train this memory on fail to unlock.</div>';
            }
        }
        
        updateSentenceClueUI();
        
        // Handle Letter Boxes Active Focus and enter triggers
        const letterBoxes = container.querySelector('#deck-letter-boxes');
        if (letterBoxes) {
            const firstInput = letterBoxes.querySelector('.deck-letter-input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 50);
            }
            
            // Bind satisfying sound effects and active visual pop-up animations to letters
            const inputs = Array.from(letterBoxes.querySelectorAll('.deck-letter-input'));
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    try { playUISound('tooltip'); } catch(e) {}
                });
                
                input.addEventListener('input', (e) => {
                    if (e.target.value.length > 0) {
                        try { playUISound('click'); } catch(e) {}
                        
                        // Apply micro-animation class and clear it
                        e.target.classList.add('just-typed');
                        setTimeout(() => {
                            e.target.classList.remove('just-typed');
                        }, 150);
                    }
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace') {
                        try { playUISound('click'); } catch(err) {}
                    }
                });
            });
            
            letterBoxes.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!attackBtn.dataset.nextMode) {
                        const compiledTyped = getTypedAnswer(card.back);
                        evaluateStackAnswer(card, compiledTyped, feedbackBox, attackBtn);
                    } else {
                        proceedToNextStackCard(cardEl);
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!attackBtn.dataset.nextMode) {
                        evaluateStackAnswer(card, "", feedbackBox, attackBtn);
                    }
                }
            });
        }
        
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                if (!attackBtn.dataset.nextMode) {
                    const compiledTyped = getTypedAnswer(card.back);
                    evaluateStackAnswer(card, compiledTyped, feedbackBox, attackBtn);
                } else {
                    proceedToNextStackCard(cardEl);
                }
            });
        }
        
        // Setup 3D Hover Tilt perspective triggers
        cardEl.addEventListener('mousemove', (e) => {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const midX = rect.width / 2;
            const midY = rect.height / 2;
            
            const rotateX = -((y - midY) / midY) * 12;
            const rotateY = ((x - midX) / midX) * 12;
            
            cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
            
            const holo = cardEl.querySelector('.card-holo');
            if (holo) {
                const percentX = (x / rect.width) * 100;
                const percentY = (y / rect.height) * 100;
                holo.style.backgroundPosition = `${percentX}% ${percentY}%`;
            }
        });
        
        cardEl.addEventListener('mouseleave', () => {
            cardEl.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            const holo = cardEl.querySelector('.card-holo');
            if (holo) {
                holo.style.backgroundPosition = `50% 50%`;
            }
        });
    });
}


/**
 * Dynamic answering evaluation for Poké Deck in-place Active Recall.
 */
function evaluateStackAnswer(card, typed, feedbackBox, attackBtn) {
    // If empty or Can't Guess, evaluate match percentage as 0 (escaped)
    const score = typed ? calculateMatchPercentage(typed, card.back) : 0;
    
    // Hide the "Can't Guess" button if it exists
    const cantGuessBtn = document.getElementById('btn-deck-cant-guess');
    if (cantGuessBtn) {
        cantGuessBtn.style.display = 'none';
    }
    
    let gradeInt = 0;
    let success = false;
    
    if (score === 100) {
        gradeInt = 3;
        success = true;
    } else if (score >= 75) {
        gradeInt = 2;
        success = true;
    } else if (score >= 50) {
        gradeInt = 1;
    } else {
        gradeInt = 0;
    }
    
    // Play correct / incorrect sound effects
    if (success) {
        try { playUISound('success'); } catch(e) {}
    } else {
        try { playUISound('fail'); } catch(e) {}
    }
    
    // Disable typed text inputs
    const inputs = document.querySelectorAll('.deck-letter-input');
    inputs.forEach(inp => inp.disabled = true);
    
    // Recalculate SM-2 Intervals & Log attempt
    applySM2Grade(gradeInt);
    logReviewAttempt(card.id, gradeInt, score);
    
    // Inject visual feedback details
    feedbackBox.classList.remove('hidden');
    if (success) {
        feedbackBox.className = 'attack-feedback feedback-success';
        feedbackBox.innerHTML = `
            <div class="feedback-result-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>
                CONCEPT TAMED!
            </div>
            <div>Struggle score drops. Evolving card rarity live.</div>
        `;
    } else {
        feedbackBox.className = 'attack-feedback feedback-danger';
        feedbackBox.innerHTML = `
            <div class="feedback-result-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                WILD CONCEPT ESCAPED!
            </div>
            <div>Correct Spelling:</div>
            <div class="feedback-correct-val">${card.back}</div>
        `;
        
        // Show custom interactive Pokémon style clue-attachment form if guess failed
        const abilitiesContainer = document.querySelector('.study-card-container .card-abilities-section');
        if (abilitiesContainer) {
            abilitiesContainer.innerHTML = `
                <div class="ability-slot attach-clue-container">
                    <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--warning); display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align: middle;">
                            <polygon points="12 2 2 22 22 22 12 2"></polygon>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <span>Unlock Clue Modifier (Attach Clue)</span>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                        Teach this card a clue sentence containing the target word <strong>"${card.back}"</strong> to tame it easily next time!
                    </span>
                    <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
                        <input type="text" id="deck-attach-sentence-input" class="input-field" placeholder="e.g. He showed high affinity for the task." style="flex: 1; padding: 8px 12px; font-size: 0.85rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.25); color: var(--text-primary); outline: none;">
                        <button id="btn-deck-save-sentence" class="btn" style="padding: 8px 16px; font-size: 0.8rem; font-weight: 800; background: var(--warning); color: #000; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">Save Clue</button>
                    </div>
                    <div id="deck-sentence-error" style="font-size: 0.75rem; font-weight: 700; color: var(--danger); margin-top: 4px;" class="hidden"></div>
                </div>
            `;
            
            const saveBtn = abilitiesContainer.querySelector('#btn-deck-save-sentence');
            const inputEl = abilitiesContainer.querySelector('#deck-attach-sentence-input');
            const errorEl = abilitiesContainer.querySelector('#deck-sentence-error');
            
            if (saveBtn && inputEl && errorEl) {
                // Focus the attachment field automatically so they can type immediately
                setTimeout(() => inputEl.focus(), 150);
                
                saveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const sentenceText = inputEl.value.trim();
                    if (!sentenceText) {
                        errorEl.textContent = "Please enter an example sentence clue!";
                        errorEl.style.color = "var(--danger)";
                        errorEl.classList.remove('hidden');
                        return;
                    }
                    
                    const escapedTarget = card.back.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const substringCheckRegex = new RegExp(escapedTarget, 'i');
                    if (!substringCheckRegex.test(sentenceText)) {
                        errorEl.textContent = `The sentence must contain the target word "${card.back}"!`;
                        errorEl.style.color = "var(--danger)";
                        errorEl.classList.remove('hidden');
                        return;
                    }
                    
                    const savedSentences = state.exampleSentences[card.id];
                    let sentencesArray = [];
                    if (Array.isArray(savedSentences)) {
                        sentencesArray = [...savedSentences];
                    } else if (typeof savedSentences === 'string' && savedSentences.trim().length > 0) {
                        sentencesArray = [savedSentences];
                    }
                    sentencesArray.push(sentenceText);
                    state.exampleSentences[card.id] = sentencesArray;
                    await dbSet('exampleSentences', state.exampleSentences);
                    
                    card.example_sentences = sentencesArray;
                    
                    if (state.userSession && supabase) {
                        try {
                            await supabase
                                .from('flashcards')
                                .update({ example_sentences: sentencesArray })
                                .eq('id', card.id)
                                .eq('user_id', state.userSession.user.id);
                        } catch(err) {
                            console.error("Failed to sync example sentence from Poke card stack:", err);
                        }
                    }
                    
                    errorEl.innerHTML = `Clue saved successfully! Ability unlocked. <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12" style="vertical-align: middle; margin-left: 2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    errorEl.style.color = "var(--success)";
                    errorEl.classList.remove('hidden');
                    saveBtn.disabled = true;
                    inputEl.disabled = true;
                    try { playUISound('success'); } catch(soundErr) {}
                });
            }
        }
    }
    
    // Modify button text to prompt proceeding
    attackBtn.textContent = 'Proceed (Enter)';
    attackBtn.dataset.nextMode = 'true';
    attackBtn.focus();
}

/**
 * Slide animations triggered when loading the next card.
 */
function proceedToNextStackCard(cardEl) {
    cardEl.classList.remove('card-slide-in');
    cardEl.classList.add('card-slide-out');
    
    setTimeout(() => {
        state.currentReviewIndex++;
        renderActiveStackCard();
    }, 380);
}

/**
 * Finishes the current card stack study session.
 */
function finishStackStudy() {
    const container = document.querySelector('.study-card-container');
    if (!container) return;
    
    try {
        playUISound('complete');
        if (typeof window.confetti === 'function') {
            window.confetti({
                particleCount: 180,
                spread: 90,
                origin: { y: 0.55 }
            });
        }
    } catch (e) {}
    
    container.innerHTML = `
        <div class="study-victory-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" width="60" height="60">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 8 15 11 12 14 9 11 12 8" fill="#d4af37"></polygon>
                <polyline points="12 2 12 8"></polyline>
                <polyline points="12 16 12 22"></polyline>
            </div>
            <h3>Tier Stack Cleared!</h3>
            <p>You have successfully confronted all concepts in the <strong>${state.activeStudyTierName}</strong> stack. Evolved cards have dropped into their new tiers.</p>
            <button id="btn-victory-back" class="btn primary" style="width: 100%; max-width: 200px;">Return to Stacks</button>
        </div>
    `;
    
    const backBtn = container.querySelector('#btn-victory-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            renderCollectionDeck();
        });
    }
}

/**
 * Decodes the card front safely to yield a neat title.
 */
function getCardTitle(card) {
    if (!card.front) return 'Untamed Card';
    
    if (card.type === 'Memory Map' || card.front.startsWith('{"mode":"memory_map"')) {
        try {
            const data = JSON.parse(card.front);
            if (data && data.nodes && data.nodes.length > 0) {
                const rootNode = data.nodes.find(n => n.isRoot);
                return rootNode ? rootNode.text : data.nodes[0].text;
            }
        } catch (e) {}
        return 'Memory Map';
    }
    
    return card.front;
}

/**
 * Escapes regex special characters and blurs occurrences of targetWord inside a sentence with ***.
 */
function blurWordInSentence(sentence, targetWord) {
    if (!sentence || !targetWord) return sentence;
    const word = targetWord.trim();
    if (!word) return sentence;
    
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // 1. Try matching whole words only case-insensitively
    const wordRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let blurred = sentence.replace(wordRegex, '***');
    
    // 2. Fallback to general substring match if exact boundary wasn't found (e.g. inflected suffix)
    if (blurred === sentence) {
        const subRegex = new RegExp(escaped, 'gi');
        blurred = sentence.replace(subRegex, '***');
    }
    
    return blurred;
}

/**
 * Generates custom letter box inputs HTML styled for spelling and active recall.
 */
function generateSpellingBoxesHTML(word) {
    if (!word) return '';
    let html = '<div class="letter-boxes-container" id="deck-letter-boxes" style="display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; margin: 10px auto;">';
    let inputCount = 0;
    
    for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        if (/\s/.test(char)) {
            html += `<span class="letter-box-space" style="margin: 0 4px; display: inline-block; width: 12px; height: 36px;">&nbsp;</span>`;
        } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
            html += `<span class="letter-box-punctuation" style="margin: 0 2px; font-weight: 800; font-size: 1.1rem; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; color: var(--text-secondary);">${char}</span>`;
        } else {
            html += `<input type="text" class="letter-box letter-input deck-letter-input" maxlength="1" data-index="${inputCount}" autocomplete="off">`;
            inputCount++;
        }
    }
    html += '</div>';
    return html;
}

/**
 * Compiles character input letters into a single text answer.
 */
function getTypedAnswer(word) {
    if (!word) return '';
    const inputs = Array.from(document.querySelectorAll('.deck-letter-input'));
    let typed = '';
    let inputIndex = 0;
    
    for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        if (/\s/.test(char)) {
            typed += ' ';
        } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
            typed += char;
        } else {
            const input = inputs[inputIndex];
            if (input) {
                typed += input.value || '';
                inputIndex++;
            }
        }
    }
    return typed.trim();
}

// Global back to stacks click navigation binder
document.addEventListener('DOMContentLoaded', () => {
    const btnBack = document.getElementById('btn-back-to-stacks');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            renderCollectionDeck();
        });
    }
});
