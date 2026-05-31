import { state } from './state.js';
import { dbGet } from './db.js';
import { switchView } from './navigation.js';
import { calculateMatchPercentage } from './practice/spellingEngine.js';
import { applySM2Grade } from './spacedRepetition.js';
import { logReviewAttempt } from './practice.js';
import { playUISound } from './sound.js';

/**
 * Calculates difficulty and gamification rarity statistics for a single card.
 * Rarity tier depends on Struggle Index = (attempts * 2) + (failures * 5) + (clues * 4)
 */
export function calculateCardStats(card, logs) {
    const cardLogs = (logs || []).filter(log => log.cardId === card.id);
    const attempts = cardLogs.length;
    const failures = cardLogs.filter(log => log.grade < 2 || log.score < 75).length;
    
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
    
    const struggleIndex = (attempts * 2) + (failures * 5) + (cluesCount * 4);
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
    
    // Group cards into the 4 rarity tiers
    const legendaryCards = [];
    const epicCards = [];
    const rareCards = [];
    const commonCards = [];
    
    state.cards.forEach(card => {
        const stats = calculateCardStats(card, logs);
        const cardObj = { card, stats };
        
        if (stats.tier.key === 'legendary') legendaryCards.push(cardObj);
        else if (stats.tier.key === 'epic') epicCards.push(cardObj);
        else if (stats.tier.key === 'rare') rareCards.push(cardObj);
        else commonCards.push(cardObj);
    });
    
    stacksGrid.innerHTML = '';
    
    // Stacks configuration list
    const stacksConfig = [
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
        
        const hpPercent = Math.min(100, Math.max(5, stats.struggleIndex * 3));
        
        container.innerHTML = `
            <div class="study-pokemon-card ${stats.tier.class} card-slide-in">
                <div class="card-holo"></div>
                <div class="card-header">
                    <div class="card-title-area">
                        <span class="card-rarity-badge">${stats.tier.name}</span>
                        <h4 class="card-title-text" style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">Untamed Memory</h4>
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
                    
                    <button id="btn-deck-attack" class="deck-attack-btn">Tame Concept (Enter)</button>
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
                        <div class="clue-nav-buttons" style="display: flex; gap: 6px;">
                            <button class="clue-nav-btn btn-up" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 0.65rem; font-weight: 800;" title="Previous Clue">▲</button>
                            <button class="clue-nav-btn btn-down" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 0.65rem; font-weight: 800;" title="Next Clue">▼</button>
                        </div>
                    `;
                }
                
                abilitiesContainer.innerHTML = `
                    <div class="ability-slot" style="display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 8px 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span class="ability-badge">Clue ${activeSentenceIndex + 1} of ${stats.sentences.length}</span>
                            ${navigationHTML}
                        </div>
                        <span class="ability-description" title="${rawSentence}" style="font-size: 0.85rem; font-style: normal; white-space: normal; line-height: 1.45; color: var(--text-secondary);">
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
    if (!typed) {
        alert("Please type your active recall translation first!");
        return;
    }
    
    // Compares translation to target spelling
    const score = calculateMatchPercentage(typed, card.back);
    
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
    const input = document.getElementById('deck-practice-input');
    if (input) input.disabled = true;
    
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
            html += `<input type="text" class="letter-box letter-input deck-letter-input" max-length="1" data-index="${inputCount}" style="width: 28px; height: 36px; text-align: center; outline: none; padding: 0; caret-color: transparent; font-family: inherit; font-size: 1.1rem; font-weight: 800; border: 2px solid var(--border-color); box-shadow: inset 0 -2px 0 var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-primary); transition: all 0.15s ease;" autocomplete="off">`;
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
