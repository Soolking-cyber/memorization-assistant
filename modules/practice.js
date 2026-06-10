import { state, isVocabularyType } from './state.js';
import { supabase } from './supabaseClient.js';
import { playUISound } from './sound.js';
import { toggleFullscreen } from './uiHelpers.js';
import { applySM2Grade } from './spacedRepetition.js';
import { queueTransaction } from './syncQueue.js';
import { dbGet, dbSet } from './db.js';
import { ICONS } from './icons.js';
import { escapeHtml, parseVocabularyCard } from './utils.js';

import {
    blankOutWordInSentence,
    renderBoxesForWord,
    renderSpellingBoxes,
    getTypedSpellingAnswer,
    getTargetWordsForSentences,
    getTypedAnswersForSentences,
    initSpellingInputListeners,
    getEditDistance,
    calculateMatchPercentage,
    parseSequencingSteps,
    validateExampleSentence
} from './practice/spellingEngine.js';

import {
    renderPracticeNodes,
    initPracticeCanvasControls
} from './practice/practiceCanvas.js';

import {
    saveIncorrectExampleSentence
} from './practice/clueCollector.js';



import {
    startForcedPractice,
    startPractice,
    proceedToNextCard,
    finishSession
} from './practice/sessionManager.js';

export {
    blankOutWordInSentence,
    renderBoxesForWord,
    renderSpellingBoxes,
    getTypedSpellingAnswer,
    getTargetWordsForSentences,
    getTypedAnswersForSentences,
    initSpellingInputListeners,
    getEditDistance,
    calculateMatchPercentage,
    parseSequencingSteps,
    validateExampleSentence,
    
    renderPracticeNodes,
    initPracticeCanvasControls,
    
    saveIncorrectExampleSentence,
    
    startForcedPractice,
    startPractice,
    proceedToNextCard,
    finishSession
};

export function renderCurrentCard() {
    const card = state.reviewQueue[state.currentReviewIndex];
    document.getElementById('practice-progress').textContent = state.currentReviewIndex + 1;
    
    const frontEl = document.getElementById('practice-front');
    const exerciseTitleEl = document.getElementById('practice-exercise-title');
    const backEl = document.getElementById('practice-back');
    const spellingArea = document.getElementById('spelling-indicator-area');

    const rightImgContainer = document.getElementById('practice-right-image-container');
    const rightImg = document.getElementById('practice-right-img');
    if (rightImgContainer) {
        rightImgContainer.classList.add('hidden');
        if (rightImg) rightImg.src = '';
    }

    document.getElementById('practice-input').classList.remove('hidden');
    document.getElementById('practice-input').value = '';
    document.getElementById('btn-submit-answer').classList.remove('hidden');
    document.getElementById('evaluation-area').classList.add('hidden');
    
    if (spellingArea) {
        spellingArea.classList.add('hidden');
        const letterBoxes = document.getElementById('practice-letter-boxes');
        if (letterBoxes) letterBoxes.innerHTML = '';
    }
    
    const seqContainer = document.getElementById('practice-sequence-container');
    if (seqContainer) {
        seqContainer.classList.add('hidden');
        seqContainer.innerHTML = '';
    }

    let isMap = false;
    let mapData = null;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            mapData = JSON.parse(card.front);
            isMap = true;
        }
    } catch (e) {}

    const hasImage = !!(card.image_front_url || card.image_back_url);
    const isSplit = hasImage && !(isMap || card.type === 'Memory Map');
    const viewPractice = document.getElementById('view-practice');
    if (viewPractice) {
        if (isMap || card.type === 'Memory Map') {
            viewPractice.classList.add('practice-layout-map');
            viewPractice.classList.remove('practice-layout-split');
        } else if (isSplit) {
            viewPractice.classList.add('practice-layout-split');
            viewPractice.classList.remove('practice-layout-map');
        } else {
            viewPractice.classList.remove('practice-layout-split', 'practice-layout-map');
        }
    }

    if (isMap || card.type === 'Memory Map') {
        if (exerciseTitleEl) exerciseTitleEl.style.display = 'none';
        spellingArea.classList.add('hidden');
        
        const activeCard = document.getElementById('active-card');
        if (activeCard) {
            activeCard.style.height = '100%';
            activeCard.style.minHeight = '0';
            activeCard.style.maxHeight = 'none';
            const cardFront = activeCard.querySelector('.card-front');
            if (cardFront) {
                cardFront.style.padding = '0';
                cardFront.style.height = '100%';
                cardFront.style.overflow = 'hidden';
            }
            const cardBack = activeCard.querySelector('.card-back');
            if (cardBack) {
                cardBack.style.padding = '0';
                cardBack.style.height = '100%';
                cardBack.style.overflow = 'hidden';
            }
        }
        
        state.practiceMapZoom = 1.0;

        // Calculate exact viewport dimensions to fit content exactly
        let viewportWidth = 2500;
        let viewportHeight = 2000;
        if (mapData && mapData.nodes && mapData.nodes.length > 0) {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            mapData.nodes.forEach(node => {
                const nx = Number(node.x) || 0;
                const ny = Number(node.y) || 0;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            });
            const mapWidth = maxX - minX + 180;
            const mapHeight = maxY - minY + 90;
            viewportWidth = mapWidth + 80;
            viewportHeight = mapHeight + 80;
        }

        // Style the card content element to host the layout cleanly
        if (frontEl) {
            frontEl.style.display = 'flex';
            frontEl.style.flexDirection = 'column';
            frontEl.style.alignItems = 'stretch';
            frontEl.style.justifyContent = 'stretch';
            frontEl.style.width = '100%';
            frontEl.style.height = '100%';
            frontEl.style.position = 'relative';
        }
        
        frontEl.innerHTML = `
            <div class="practice-header-outside" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-secondary); border-bottom: 2px solid var(--border-color); padding: 12px 16px; text-align: center; width: 100%; box-sizing: border-box; flex-shrink: 0; z-index: 10; position: relative;">
                <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 2px;">Recall the Memory Map</span>
                <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${mapData ? escapeHtml(mapData.title) : 'Recall this Memory Map'}</span>
            </div>
            
            <div id="practice-map-canvas-container" style="position: relative; width: 100%; background: transparent; border: none; overflow: hidden; box-shadow: none; user-select: none; flex-grow: 1; z-index: 1;">
                <button type="button" class="fullscreen-close-btn hidden" title="Exit Fullscreen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div id="practice-map-scroll-pane" style="width: 100%; height: 100%; overflow: auto; position: relative;">
                    <div id="practice-map-viewport" style="position: absolute; left: 0; top: 0; width: ${viewportWidth}px; height: ${viewportHeight}px; transform-origin: 0 0;">
                        <div style="position: absolute; inset: 0; background-size: 20px 20px; background-image: radial-gradient(var(--border-color) 1px, transparent 0); opacity: 0.4; pointer-events: none;"></div>
                        <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;" id="practice-map-svg">
                            <defs>
                                <marker id="practice-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                    <polygon points="0 1.5, 5 3.5, 0 5.5" fill="currentColor" />
                                </marker>
                            </defs>
                        </svg>
                        <div id="practice-map-nodes-container" style="position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2;"></div>
                    </div>
                </div>
                
                <div class="canvas-zoom-controls">
                    <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-out">−</button>
                    <span class="zoom-percent" id="practice-zoom-label">100%</span>
                    <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-in">+</button>
                    <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-reset" style="font-size: 0.65rem; margin-left: 2px;">R</button>
                    <button type="button" class="zoom-ctrl-btn" id="btn-practice-fullscreen" style="font-size: 0.65rem; margin-left: 2px;" title="Toggle Fullscreen">⛶</button>
                </div>
            </div>
        `;
        
        if (mapData) {
            renderPracticeNodes('practice-map-nodes-container', mapData.nodes, mapData.links, 'practice-map-svg', 'practice-arrowhead');
            initPracticeCanvasControls(mapData);
        }
        
        backEl.innerHTML = `<strong style="color:var(--accent);">Memory Map Title:</strong> ${mapData ? escapeHtml(mapData.title) : ''}`;
        
        const frontImg = document.getElementById('practice-front-img');
        if (frontImg) frontImg.classList.add('hidden');
        const backImg = document.getElementById('practice-back-img');
        if (backImg) backImg.classList.add('hidden');
        
        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        
        document.getElementById('typing-area').classList.remove('hidden');
        document.getElementById('practice-input').classList.add('hidden');
        document.getElementById('evaluation-area').classList.add('hidden');
        
        setTimeout(() => {
            const firstInput = document.querySelector('.practice-map-node-input');
            if (firstInput) firstInput.focus();
        }, 100);
        return;
    }

    if (exerciseTitleEl) exerciseTitleEl.style.display = '';
    const activeCard = document.getElementById('active-card');
    if (activeCard) {
        activeCard.style.minHeight = '';
        activeCard.style.maxHeight = '';
        const hasImage = card.image_front_url || card.image_back_url;
        if (hasImage) {
            const isMobile = window.innerWidth <= 768;
            activeCard.style.height = isMobile ? '420px' : '600px';
        } else {
            activeCard.style.height = '';
        }
        const cardFront = activeCard.querySelector('.card-front');
        if (cardFront) {
            cardFront.style.padding = '';
            cardFront.style.overflow = '';
            cardFront.style.height = '';
        }
        const cardBack = activeCard.querySelector('.card-back');
        if (cardBack) {
            cardBack.style.padding = '';
            cardBack.style.height = '';
        }
    }
    
    // Reset frontEl styles for other card types
    if (frontEl) {
        frontEl.style.display = '';
        frontEl.style.flexDirection = '';
        frontEl.style.alignItems = '';
        frontEl.style.justifyContent = '';
        frontEl.style.width = '';
        frontEl.style.height = '';
        frontEl.style.position = '';
    }

    if (card.type === 'Image Card') {
        if (hasImage) {
            if (exerciseTitleEl) exerciseTitleEl.style.display = 'none';
            if (activeCard) {
                const isMobile = window.innerWidth <= 768;
                activeCard.style.height = isMobile ? '450px' : '100%';
                const cardFront = activeCard.querySelector('.card-front');
                if (cardFront) {
                    cardFront.style.padding = '0';
                    cardFront.style.overflow = 'hidden';
                    cardFront.style.height = isMobile ? '450px' : '100%';
                }
            }
            
            frontEl.innerHTML = `
                <div class="practice-image-card-container">
                    <div class="image-card-clue-row">
                        <div class="image-card-clue-header">
                            Recall the Steps in Sequence Order
                        </div>
                        <div class="image-card-clue-title">
                            ${escapeHtml(card.front)}
                        </div>
                    </div>
                    <div class="image-card-frame">
                        <img src="${card.image_front_url || card.image_back_url}" alt="Memory step image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div style="display: none; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 100%; width: 100%; color: var(--text-secondary); padding: 20px; text-align: center; box-sizing: border-box;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="48" height="48" style="opacity: 0.6; color: var(--danger);">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                            </svg>
                            <span style="font-size: 0.85rem; font-weight: 700; opacity: 0.7;">Image failed to load</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            if (exerciseTitleEl) {
                exerciseTitleEl.textContent = "Recall the Steps in Sequence Order";
                exerciseTitleEl.style.display = '';
            }
            frontEl.innerHTML = `
                <div class="practice-explanation-only" style="font-size: 1.45rem; font-weight: 700; color: var(--text-primary); max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word; text-align: center; margin: auto 0;">
                    ${escapeHtml(card.front).replace(/\n/g, '<br>')}
                </div>
            `;
        }
        
        backEl.innerHTML = `<strong style="color:var(--accent);">Target sequence:</strong> ${escapeHtml(card.back)}`;
        
        const steps = parseSequencingSteps(card.back);
        if (seqContainer && steps.length > 0) {
            seqContainer.innerHTML = '';
            steps.forEach((step, idx) => {
                const row = document.createElement('div');
                row.className = 'sequencing-input-row';
                row.innerHTML = `
                    <span class="sequencing-step-number">${idx + 1}</span>
                    <input type="text" class="practice-sequence-input" placeholder="Recall step ${idx + 1}..." data-step-index="${idx}" />
                `;
                seqContainer.appendChild(row);
                
                const input = row.querySelector('.practice-sequence-input');
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const allInputs = document.querySelectorAll('.practice-sequence-input');
                        const nextInput = allInputs[idx + 1];
                        if (nextInput) {
                            nextInput.focus();
                        } else {
                            document.getElementById('btn-submit-answer').click();
                        }
                    }
                });
            });
            seqContainer.classList.remove('hidden');
        }
        
        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        
        document.getElementById('typing-area').classList.remove('hidden');
        document.getElementById('practice-input').classList.add('hidden');
        document.getElementById('evaluation-area').classList.add('hidden');
        
        setTimeout(() => {
            const firstInput = document.querySelector('.practice-sequence-input');
            if (firstInput) firstInput.focus();
        }, 100);
        return;
    }

    if (card.type === 'Zettelkasten') {
        exerciseTitleEl.textContent = "Recall the Reference / Source of this Quote";
        spellingArea.classList.add('hidden');
        
        let quote = '';
        let tags = [];
        let links = [];
        try {
            const ztData = JSON.parse(card.front);
            quote = ztData.quote || '';
            tags = ztData.tags || [];
            links = ztData.links || [];
        } catch (e) {
            quote = card.front;
        }

        let tagsHtml = '';
        if (tags.length > 0) {
            tagsHtml = `
                <div class="practice-word-types" style="display: flex; gap: 6px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
                    ${tags.map(t => `<span class="word-type-badge">${escapeHtml(t)}</span>`).join('')}
                </div>
            `;
        }

        let linksHtml = '';
        if (links.length > 0) {
            const linkTexts = links.map(l => {
                const targetCard = state.cards.find(c => c.id === l.targetId);
                let targetTitle = 'Unknown Card';
                if (targetCard) {
                    try {
                        const targetData = JSON.parse(targetCard.front);
                        targetTitle = targetData.quote ? (targetData.quote.substring(0, 30) + '...') : targetCard.back;
                    } catch (e) {
                        targetTitle = targetCard.back;
                    }
                }
                return `<span style="background: rgba(var(--accent-rgb, 100, 108, 255), 0.15); border: 1px solid var(--accent); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">→ <em style="color:var(--text-secondary);">${escapeHtml(l.label || 'connects to')}</em> <strong>${escapeHtml(targetTitle)}</strong></span>`;
            }).join(' ');
            linksHtml = `<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:12px;">${linkTexts}</div>`;
        }

        frontEl.innerHTML = `
            <div class="practice-explanation-only" style="font-size: 1.35rem; font-weight: 500; font-style: italic; color: var(--text-primary); max-width: 100%; line-height: 1.6; word-break: normal; overflow-wrap: break-word; text-align: center; margin: auto 0; padding: 20px; border-left: 4px solid var(--accent); background: rgba(255,255,255,0.03); border-radius: 4px;">
                "${escapeHtml(quote).replace(/\n/g, '<br>')}"
                ${tagsHtml}
                ${linksHtml}
            </div>
        `;
        
        backEl.innerHTML = `
            <div class="practice-answer-container">
                <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; letter-spacing: 1px;">Source / Reference:</div>
                <div class="practice-answer-word" style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">
                    ${escapeHtml(card.back).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        const frontImg = document.getElementById('practice-front-img');
        const backImg = document.getElementById('practice-back-img');
        if (frontImg) {
            if (card.image_front_url) {
                frontImg.src = card.image_front_url;
                frontImg.classList.remove('hidden');
            } else {
                frontImg.src = '';
                frontImg.classList.add('hidden');
            }
        }
        if (backImg) {
            if (card.image_back_url) {
                backImg.src = card.image_back_url;
                backImg.classList.remove('hidden');
            } else {
                backImg.src = '';
                backImg.classList.add('hidden');
            }
        }

        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        
        document.getElementById('typing-area').classList.remove('hidden');
        document.getElementById('practice-input').classList.remove('hidden');
        document.getElementById('evaluation-area').classList.add('hidden');
        
        setTimeout(() => {
            const typingInput = document.getElementById('practice-input');
            if (typingInput) typingInput.focus();
        }, 100);
        return;
    }

    const savedSentences = state.exampleSentences[card.id];
    let sentences = [];
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentences = [savedSentences];
        }
    }
    const isVocab = isVocabularyType(card.type);
    const parsed = isVocab ? parseVocabularyCard(card) : null;
    const targetWord = isVocab ? parsed.targetWord : card.back.trim();
    const isSingleWord = !targetWord.includes(' ') && targetWord.length > 0;
    
    let cleanFront = isVocab ? parsed.definition : card.front;
    let wordTypes = isVocab ? parsed.wordTypes : [];
    
    if (sentences.length > 0) {
        exerciseTitleEl.textContent = "Complete the sentences with the correct word";
        
        const explanationHtml = cleanFront.replace(/\n/g, '<br>');
        
        let wordTypesHtml = '';
        if (wordTypes.length > 0) {
            wordTypesHtml = `
                <div class="practice-word-types" style="display: flex; gap: 6px; justify-content: center; margin-top: 6px; flex-wrap: wrap;">
                    ${wordTypes.map(t => `<span class="word-type-badge">${escapeHtml(t)}</span>`).join('')}
                </div>
            `;
        }
        
        let sentencesHtml = '<div class="practice-sentence-list" style="display: flex; flex-direction: column; gap: 20px; width: 100%; text-align: left; margin: 10px 0;">';
        let currentInputIndex = 0;
        sentences.forEach((s, idx) => {
            const blankedObj = blankOutWordInSentence(s, targetWord, currentInputIndex);
            currentInputIndex = blankedObj.nextIndex;
            
            sentencesHtml += `
                <div class="practice-sentence-item" style="display: flex; gap: 12px; font-size: 1.3rem; font-weight: 700; color: var(--text-primary); line-height: 1.8; word-break: normal; overflow-wrap: break-word; align-items: flex-start;">
                    <span class="sentence-number" style="color: var(--accent); min-width: 24px; font-size: 1.15rem; font-weight: 800; text-align: right; padding-top: 2px;">${idx + 1}.</span>
                    <div class="sentence-text" style="flex: 1;">
                        ${blankedObj.html}
                    </div>
                </div>
            `;
        });
        sentencesHtml += '</div>';
        
        frontEl.innerHTML = `
            <div class="practice-prompt-container" style="display: flex; flex-direction: column; gap: 16px; width: 100%; justify-content: center; align-items: center; text-align: center; margin: auto 0;">
                <div class="practice-explanation" style="font-size: 1.15rem; font-weight: 600; color: var(--text-secondary); max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word;">
                    ${escapeHtml(explanationHtml).replace(/\n/g, '<br>')}
                    ${wordTypesHtml}
                </div>
                <div class="practice-divider" style="width: 60px; height: 2px; background: var(--bg-tertiary); margin: 4px 0;"></div>
                ${sentencesHtml}
            </div>
        `;
        spellingArea.classList.add('hidden');
    } else {
        exerciseTitleEl.textContent = "Question";
        
        const explanationHtml = cleanFront.replace(/\n/g, '<br>');
        
        let wordTypesHtml = '';
        if (wordTypes.length > 0) {
            wordTypesHtml = `
                <div class="practice-word-types" style="display: flex; gap: 6px; justify-content: center; margin-top: 10px; flex-wrap: wrap;">
                    ${wordTypes.map(t => `<span class="word-type-badge">${escapeHtml(t)}</span>`).join('')}
                </div>
            `;
        }

        frontEl.innerHTML = `
            <div class="practice-explanation-only" style="font-size: 1.45rem; font-weight: 700; color: var(--text-primary); max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word; text-align: center; margin: auto 0;">
                ${escapeHtml(explanationHtml).replace(/\n/g, '<br>')}
                ${wordTypesHtml}
            </div>
        `;
        
        if (isSingleWord && targetWord.length > 1) {
            spellingArea.classList.remove('hidden');
            renderSpellingBoxes(targetWord);
        } else {
            spellingArea.classList.add('hidden');
        }
    }
    
    let backHtml = `
        <div class="practice-answer-container">
            <div class="practice-answer-word">
                ${escapeHtml(isVocab ? targetWord : card.back).replace(/\n/g, '<br>')}
            </div>
    `;
    if (isVocab) {
        backHtml += `
            <div class="practice-answer-definition" style="font-size: 1rem; color: var(--text-secondary); margin-top: 8px;">
                ${escapeHtml(cleanFront).replace(/\n/g, '<br>')}
            </div>
        `;
    }
    if (isVocabularyType(card.type) && wordTypes.length > 0) {
        const badgesHtml = wordTypes.map(t => `<span class="word-type-badge">${escapeHtml(t)}</span>`).join('');
        backHtml += `
            <div class="word-types-container">
                ${badgesHtml}
            </div>
        `;
    }
    backHtml += `</div>`;
    backEl.innerHTML = backHtml;
    
    const frontImg = document.getElementById('practice-front-img');
    const backImg = document.getElementById('practice-back-img');

    const imageUrl = card.image_front_url || card.image_back_url;

    if (isVocab && imageUrl) {
        if (frontImg) {
            frontImg.src = '';
            frontImg.classList.add('hidden');
        }
        if (backImg) {
            backImg.src = '';
            backImg.classList.add('hidden');
        }
        if (rightImgContainer && rightImg) {
            rightImg.src = imageUrl;
            rightImgContainer.classList.remove('hidden');
        }
    } else {
        if (rightImgContainer) {
            rightImgContainer.classList.add('hidden');
        }
        if (rightImg) {
            rightImg.src = '';
        }

        if (frontImg) {
            if (card.image_front_url) {
                frontImg.src = card.image_front_url;
                frontImg.classList.remove('hidden');
            } else {
                frontImg.src = '';
                frontImg.classList.add('hidden');
            }
        }
        if (backImg) {
            if (card.image_back_url) {
                backImg.src = card.image_back_url;
                backImg.classList.remove('hidden');
            } else {
                backImg.src = '';
                backImg.classList.add('hidden');
            }
        }
    }
    
    document.querySelector('.card-front').classList.remove('hidden');
    document.querySelector('.card-back').classList.add('hidden');
    
    document.getElementById('typing-area').classList.remove('hidden');
    document.getElementById('practice-input').value = '';
    document.getElementById('evaluation-area').classList.add('hidden');
    
    const firstSpellingInput = document.querySelector('#practice-letter-boxes .letter-input, .practice-sentence-list .letter-input');
    if (firstSpellingInput) {
        document.getElementById('practice-input').classList.add('hidden');
        setTimeout(() => {
            firstSpellingInput.focus();
        }, 50);
    } else {
        document.getElementById('practice-input').classList.remove('hidden');
        document.getElementById('practice-input').focus();
    }

    // Render universal memory strength badge
    updatePracticeScoreBadges(card);
}

export function updatePracticeScoreBadges(card) {
    const score = card.score !== undefined && card.score !== null ? card.score : 39;
    const S = (card.interval && card.interval > 0.01 ? card.interval : 0.1 * Math.exp((score / 100) * Math.log(3650))).toFixed(1);
    const D = (card.ease !== undefined && card.ease !== null ? card.ease : 5.0).toFixed(1);
    const tooltipText = `Memory Strength: ${score}%\nFSRS Spaced Repetition (DSR Model):\n• Stability (Lifespan): ${S} days\n• Difficulty (1-10): ${D}\n• Easy: Boosts Stability significantly & decreases Difficulty\n• Good: Expands Stability normally & maintains Difficulty\n• Hard: Increases Stability slightly & increases Difficulty\n• Again/Timeout: Shrinks Stability heavily & resets interval\n• Memory Strength (1-100%) maps logarithmically from Stability (S)\n• Category tuning: adjusts stability/difficulty based on category reviews`;
    
    const badgeHtml = `
        <span class="card-score-badge" data-tooltip="${tooltipText}" style="cursor: help;">
            ${ICONS.zap} ${score}%
        </span>
    `;
    
    const frontFace = document.querySelector('.card-front');
    const backFace = document.querySelector('.card-back');
    
    if (frontFace) {
        let frontBadge = frontFace.querySelector('.card-score-badge');
        if (frontBadge) {
            frontBadge.remove();
        }
    }
    
    if (backFace) {
        let backBadge = backFace.querySelector('.card-score-badge');
        if (backBadge) {
            backBadge.remove();
        }
    }

    const container = document.getElementById('practice-card-score-badge-container');
    if (container) {
        container.innerHTML = badgeHtml;
    }
}

export async function logReviewAttempt(cardId, gradeInt, score) {
    const payload = {
        card_id: cardId,
        grade: gradeInt,
        score: score
    };
    
    // Append locally to IndexedDB cache for real-time live Poké Deck update!
    try {
        const localLogs = await dbGet('review_activity_logs') || [];
        localLogs.push({
            timestamp: Date.now(),
            cardId: cardId,
            grade: gradeInt,
            score: score
        });
        await dbSet('review_activity_logs', localLogs);
    } catch (e) {
        console.warn("Could not save review attempt locally:", e);
    }
    
    try {
        if (!state.userSession || !supabase) return;
        
        const { error } = await supabase
            .from('review_logs')
            .insert([{
                user_id: state.userSession.user.id,
                card_id: cardId,
                grade: gradeInt,
                score: score
            }]);
        if (error) {
            console.error("Error saving review attempt to database, queueing transaction:", error);
            await queueTransaction('insert_log', payload);
        }
    } catch (err) {
        console.warn("Exception during review attempt log, queueing transaction:", err);
        await queueTransaction('insert_log', payload);
    }
}

export async function evaluateAnswer() {
    const card = state.reviewQueue[state.currentReviewIndex];
    if (!card) return;

    let isMap = false;
    let mapData = null;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            mapData = JSON.parse(card.front);
            isMap = true;
        }
    } catch (e) {}

    let typed = '';
    let score = 0;
    const spellingInputs = document.querySelectorAll('#practice-letter-boxes .letter-input, .practice-sentence-list .letter-input');
    
    const savedSentences = state.exampleSentences[card.id];
    let sentences = [];
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentences = [savedSentences];
        }
    }

    if (card.type === 'Image Card') {
        const practiceInputs = document.querySelectorAll('.practice-sequence-input');
        const enteredCount = Array.from(practiceInputs).filter(i => i.value.trim().length > 0).length;
        if (enteredCount === 0 && practiceInputs.length > 0) {
            await window.alert("Please attempt to fill in the sequence steps before submitting!");
            return;
        }
        
        let totalScore = 0;
        const targetSteps = parseSequencingSteps(card.back);
        
        practiceInputs.forEach(input => {
            const idx = parseInt(input.dataset.stepIndex);
            const correctVal = targetSteps[idx] || '';
            const typedVal = input.value.trim();
            
            const matchScore = calculateMatchPercentage(typedVal, correctVal);
            totalScore += matchScore;
            
            const rowEl = input.closest('.sequencing-input-row');
            input.disabled = true;
            
            if (matchScore === 100) {
                if (rowEl) {
                    rowEl.style.borderColor = 'var(--success)';
                    rowEl.style.background = 'rgba(46, 125, 50, 0.05)';
                }
                input.style.color = 'var(--success)';
            } else {
                if (rowEl) {
                    rowEl.style.borderColor = 'var(--danger)';
                    rowEl.style.background = 'rgba(198, 40, 40, 0.05)';
                    rowEl.classList.remove('node-shake');
                    void rowEl.offsetWidth;
                    rowEl.classList.add('node-shake');
                }
                input.style.color = 'var(--danger)';
                input.value = `${correctVal} (Typed: "${typedVal || 'empty'}")`;
                input.title = `Correct: "${correctVal}". You typed: "${typedVal}"`;
            }
        });
        
        score = targetSteps.length > 0 ? Math.round(totalScore / targetSteps.length) : 100;
        typed = 'sequencing-attempt';
    } else if (isMap || card.type === 'Memory Map') {
        const practiceInputs = document.querySelectorAll('.practice-map-node-input');
        const enteredCount = Array.from(practiceInputs).filter(i => i.value.trim().length > 0).length;
        if (enteredCount === 0 && practiceInputs.length > 0) {
            await window.alert("Please attempt to fill in the mind map before submitting!");
            return;
        }
        
        let totalScore = 0;
        let nonRootNodesCount = 0;
        
        practiceInputs.forEach(input => {
            const nodeId = input.dataset.nodeId;
            const node = mapData.nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            nonRootNodesCount++;
            
            const typedVal = input.value.trim();
            const correctVal = node.text.trim();
            
            const matchScore = calculateMatchPercentage(typedVal, correctVal);
            totalScore += matchScore;
            
            const nodeEl = input.closest('.map-node');
            input.disabled = true;
            
            if (matchScore === 100) {
                nodeEl.style.borderColor = 'var(--success)';
                input.style.color = 'var(--success)';
                input.style.borderBottom = 'none';
            } else {
                nodeEl.style.borderColor = 'var(--danger)';
                input.style.color = 'var(--danger)';
                input.style.borderBottom = 'none';
                input.value = node.text;
                input.title = `You typed: "${typedVal}"`;
                
                nodeEl.classList.remove('node-shake');
                void nodeEl.offsetWidth;
                nodeEl.classList.add('node-shake');
            }
        });
        
        score = nonRootNodesCount > 0 ? Math.round(totalScore / nonRootNodesCount) : 100;
        typed = 'memory-map-attempt';
    } else {
        const isVocab = isVocabularyType(card.type);
        const parsed = isVocab ? parseVocabularyCard(card) : null;
        const targetWord = isVocab ? parsed.targetWord : card.back.trim();

        if (spellingInputs.length > 0) {
            const enteredCount = Array.from(spellingInputs).filter(i => i.value.trim().length > 0).length;
            if (enteredCount > 0) {
                typed = 'attempted';
            }
            
            if (sentences.length > 0) {
                const targetWords = getTargetWordsForSentences(targetWord, sentences);
                const typedWords = getTypedAnswersForSentences(targetWords, sentences.length);
                let allCorrect = true;
                let totalScore = 0;
                typedWords.forEach((word, idx) => {
                    const expectedWord = targetWords[idx] || targetWord;
                    const matchScore = calculateMatchPercentage(word, expectedWord);
                    if (matchScore < 100) {
                        allCorrect = false;
                    }
                    totalScore += matchScore;
                });
                
                if (allCorrect) {
                    score = 100;
                } else {
                    const averageScore = Math.round(totalScore / sentences.length);
                    score = Math.min(74, averageScore);
                }
                
                typed = typedWords.join(' | ');
            } else {
                typed = getTypedSpellingAnswer(targetWord).trim();
                score = calculateMatchPercentage(typed, targetWord);
            }
        } else {
            typed = document.getElementById('practice-input').value.trim();
            score = calculateMatchPercentage(typed, targetWord);
        }
    }

    if (!typed) {
        await window.alert("Please attempt an answer before submitting!");
        return;
    }

    spellingInputs.forEach(input => {
        input.disabled = true;
    });
    
    let gradeInt = 0;
    let gradeText = "Again";
    let gradeColor = "var(--danger)";

    if (score === 100) {
        gradeInt = 3; gradeText = "Easy"; gradeColor = "var(--success)";
    } else if (score >= 75) {
        gradeInt = 2; gradeText = "Good"; gradeColor = "var(--accent)";
    } else if (score >= 50) {
        gradeInt = 1; gradeText = "Hard"; gradeColor = "var(--warning)";
    } else {
        gradeInt = 0; gradeText = "Again"; gradeColor = "var(--danger)";
    }

    if (score >= 75) {
        playUISound('success');
    } else {
        playUISound('fail');
    }

    applySM2Grade(card.id, gradeInt);
    logReviewAttempt(card.id, gradeInt, score);
    updatePracticeScoreBadges(card);

    if (card.type === 'Image Card') {
        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        document.getElementById('btn-submit-answer').classList.add('hidden');
    } else if (isMap || card.type === 'Memory Map') {
        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        document.getElementById('typing-area').classList.add('hidden');
    } else {
        document.querySelector('.card-front').classList.add('hidden');
        document.querySelector('.card-back').classList.remove('hidden');
        document.getElementById('typing-area').classList.add('hidden');
    }
    
    document.getElementById('eval-score').textContent = score + '%';
    const gradeSpan = document.getElementById('eval-grade');
    gradeSpan.textContent = gradeText;
    gradeSpan.style.color = gradeColor;
    
    const sentenceContainer = document.getElementById('incorrect-sentence-container');
    if (score < 75 && !(isMap || card.type === 'Memory Map' || card.type === 'Image Card' || card.type === 'Zettelkasten')) {
        sentenceContainer.classList.remove('hidden');
        document.getElementById('incorrect-sentence-input').value = '';
        document.getElementById('incorrect-sentence-input').placeholder = `e.g. We are running ${card.back} on gas.`;
        document.getElementById('sentence-error-msg').classList.add('hidden');
        document.getElementById('btn-next-card').classList.add('hidden');
    } else {
        sentenceContainer.classList.add('hidden');
        document.getElementById('btn-next-card').classList.remove('hidden');
    }
    
    document.getElementById('evaluation-area').classList.remove('hidden');
}
