import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { playUISound } from './sound.js';
import { toggleFullscreen } from './uiHelpers.js';
import { applySM2Grade } from './spacedRepetition.js';
import { queueTransaction } from './syncQueue.js';

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
    const isSplit = (card.type === 'Image Card' || hasImage) && !(isMap || card.type === 'Memory Map');
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
            const isMobile = window.innerWidth <= 768;
            activeCard.style.height = isMobile ? '460px' : 'calc(100vh - 280px)';
            activeCard.style.minHeight = isMobile ? '360px' : '480px';
            activeCard.style.maxHeight = isMobile ? 'none' : '850px';
            const cardFront = activeCard.querySelector('.card-front');
            if (cardFront) cardFront.style.padding = '0';
            const cardBack = activeCard.querySelector('.card-back');
            if (cardBack) cardBack.style.padding = '0';
        }
        
        state.practiceMapZoom = 1.0;
        
        frontEl.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; position: absolute; inset: 0;">
                <div class="practice-header-outside" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-card); border-bottom: 2px solid var(--border-color); padding: 12px 16px; text-align: center; width: 100%; box-sizing: border-box; flex-shrink: 0; border-top-left-radius: 14px; border-top-right-radius: 14px; z-index: 10; position: relative;">
                    <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 2px;">Recall the Memory Map</span>
                    <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${mapData ? mapData.title : 'Recall this Memory Map'}</span>
                </div>
                
                <div id="practice-map-canvas-container" style="position: relative; width: 100%; height: 100%; background: transparent; border: none; overflow: auto; box-shadow: none; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; user-select: none; flex-grow: 1; z-index: 1;">
                    <button type="button" class="fullscreen-close-btn hidden" title="Exit Fullscreen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div id="practice-map-viewport" style="position: absolute; left: 0; top: 0; width: 2500px; height: 2000px; transform-origin: 0 0;">
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
                    <div class="canvas-zoom-controls">
                        <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-out">−</button>
                        <span class="zoom-percent" id="practice-zoom-label">100%</span>
                        <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-in">+</button>
                        <button type="button" class="zoom-ctrl-btn" id="btn-practice-zoom-reset" style="font-size: 0.65rem; margin-left: 2px;">R</button>
                        <button type="button" class="zoom-ctrl-btn" id="btn-practice-fullscreen" style="font-size: 0.65rem; margin-left: 2px;" title="Toggle Fullscreen">⛶</button>
                    </div>
                </div>
            </div>
        `;
        
        if (mapData) {
            renderPracticeNodes('practice-map-nodes-container', mapData.nodes, mapData.links, 'practice-map-svg', 'practice-arrowhead');
            initPracticeCanvasControls(mapData);
        }
        
        backEl.innerHTML = `<strong style="color:var(--accent);">Memory Map Title:</strong> ${mapData ? mapData.title : ''}`;
        
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
        if (cardFront) cardFront.style.padding = '';
        const cardBack = activeCard.querySelector('.card-back');
        if (cardBack) cardBack.style.padding = '';
    }

    if (card.type === 'Image Card') {
        if (exerciseTitleEl) exerciseTitleEl.style.display = 'none';
        if (activeCard) {
            const isMobile = window.innerWidth <= 768;
            activeCard.style.height = isMobile ? '450px' : '655px';
            const cardFront = activeCard.querySelector('.card-front');
            if (cardFront) cardFront.style.padding = '0';
        }
        
        frontEl.innerHTML = `
            <div class="practice-image-card-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; height: 100%; position: relative; box-sizing: border-box; padding: 24px;">
                <div class="image-card-clue-row">
                    <div class="image-card-clue-header">
                        Recall the Steps in Sequence Order
                    </div>
                    <div class="image-card-clue-title">
                        ${card.front}
                    </div>
                </div>
                <div class="image-card-frame">
                    <img src="${card.image_front_url || card.image_back_url}" alt="Memory step image" />
                </div>
            </div>
        `;
        
        backEl.innerHTML = `<strong style="color:var(--accent);">Target sequence:</strong> ${card.back}`;
        
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

    const savedSentences = state.exampleSentences[card.id];
    let sentences = [];
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentences = [savedSentences];
        }
    }
    
    if (sentences.length > 0) {
        exerciseTitleEl.textContent = "Fill in the blank clues";
        
        let blanksHtml = '';
        const targetWords = getTargetWordsForSentences(card.back.trim(), sentences);
        
        sentences.forEach((sentence, idx) => {
            const targetWord = targetWords[idx] || card.back.trim();
            const blanked = blankOutWordInSentence(sentence, targetWord);
            blanksHtml += `
                <div class="blank-sentence-clue" style="margin-bottom: 24px; padding: 12px; border-radius: 8px; background: var(--bg-hover); border-left: 4px solid var(--accent); text-align: left;">
                    <p style="font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: var(--text-primary); margin-bottom: 8px;">${blanked}</p>
                    <div class="sentence-boxes-wrapper" data-sentence-index="${idx}" style="display: flex; gap: 4px; align-items: center; justify-content: flex-start; flex-wrap: wrap;"></div>
                </div>
            `;
        });
        
        frontEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: center;">
                <strong style="color: var(--accent); font-size: 1rem;">Recall:</strong>
                <span style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${card.front}</span>
                <div class="blank-clues-container" style="margin-top: 16px;">
                    ${blanksHtml}
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const wrappers = document.querySelectorAll('.sentence-boxes-wrapper');
            wrappers.forEach((wrapper, idx) => {
                const targetWord = targetWords[idx] || card.back.trim();
                renderBoxesForWord(targetWord, wrapper, idx);
            });
            initSpellingInputListeners();
        }, 10);
        
        spellingArea.classList.remove('hidden');
        document.getElementById('typing-area').classList.add('hidden');
    } else {
        exerciseTitleEl.textContent = "Spelling Practice";
        frontEl.innerHTML = card.front;
        spellingArea.classList.remove('hidden');
        renderSpellingBoxes(card.back.trim());
        document.getElementById('typing-area').classList.add('hidden');
        initSpellingInputListeners();
    }
    
    backEl.innerHTML = card.back;
    
    const frontImg = document.getElementById('practice-front-img');
    if (frontImg) {
        if (card.image_front_url) {
            frontImg.src = card.image_front_url;
            frontImg.classList.remove('hidden');
        } else {
            frontImg.classList.add('hidden');
        }
    }
    const backImg = document.getElementById('practice-back-img');
    if (backImg) {
        if (card.image_back_url) {
            backImg.src = card.image_back_url;
            backImg.classList.remove('hidden');
        } else {
            backImg.classList.add('hidden');
        }
    }
    
    document.querySelector('.card-front').classList.remove('hidden');
    document.querySelector('.card-back').classList.add('hidden');
}

export async function logReviewAttempt(cardId, gradeInt, score) {
    const payload = {
        card_id: cardId,
        grade: gradeInt,
        score: score
    };
    
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
    const spellingInputs = document.querySelectorAll('.letter-input');
    
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
        if (spellingInputs.length > 0) {
            const enteredCount = Array.from(spellingInputs).filter(i => i.value.trim().length > 0).length;
            if (enteredCount > 0) {
                typed = 'attempted';
            }
            
            if (sentences.length > 0) {
                const targetWords = getTargetWordsForSentences(card.back.trim(), sentences);
                const typedWords = getTypedAnswersForSentences(targetWords, sentences.length);
                let allCorrect = true;
                let totalScore = 0;
                typedWords.forEach((word, idx) => {
                    const expectedWord = targetWords[idx] || card.back.trim();
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
                typed = getTypedSpellingAnswer(card.back.trim()).trim();
                score = calculateMatchPercentage(typed, card.back);
            }
        } else {
            typed = document.getElementById('practice-input').value.trim();
            score = calculateMatchPercentage(typed, card.back);
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

    applySM2Grade(gradeInt);
    logReviewAttempt(card.id, gradeInt, score);

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
    if (score < 75 && !(isMap || card.type === 'Memory Map' || card.type === 'Image Card')) {
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
