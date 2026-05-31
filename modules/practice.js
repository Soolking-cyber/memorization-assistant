import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { ICONS } from './icons.js';
import { playUISound } from './sound.js';
import { toggleFullscreen } from './uiHelpers.js';
import { applySM2Grade } from './spacedRepetition.js';
import { renderPracticeNodes, setPracticeMapZoom, adjustPracticeViewportCentering } from './canvas.js';
import { updateDashboard, getSelectedTypes } from './dashboard.js';
import { switchView } from './navigation.js';
import { loadData } from './flashcardCrud.js';
import { dbGet, dbSet } from './db.js';

export function startForcedPractice(count) {
    const now = Date.now();
    state.reviewQueue = state.cards.filter(c => c.nextReview <= now)
                       .sort((a, b) => a.nextReview - b.nextReview);
                       
    if (state.reviewQueue.length === 0) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
        return;
    }
    
    state.reviewQueue = state.reviewQueue.slice(0, count);
    state.currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = state.reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'none';
    
    switchView('practice');
    renderCurrentCard();
}

export function startPractice(forceStudyAhead = false) {
    state.isForcedMode = false;
    const now = Date.now();
    const activeTypes = getSelectedTypes('practice-type-select');
    if (forceStudyAhead) {
        state.reviewQueue = state.cards.filter(c => activeTypes.includes(c.type));
    } else {
        state.reviewQueue = state.cards.filter(c => c.nextReview <= now && activeTypes.includes(c.type))
                           .sort((a, b) => a.nextReview - b.nextReview);
    }
                       
    if (state.reviewQueue.length === 0) return;
    
    state.currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = state.reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'block';
    
    switchView('practice');
    renderCurrentCard();
}

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
        }
        
        setTimeout(() => {
            const scrollContainer = document.getElementById('practice-map-canvas-container');
            const viewport = document.getElementById('practice-map-viewport');
            if (scrollContainer && viewport && mapData && mapData.nodes && mapData.nodes.length > 0) {
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
                const viewportWidth = mapWidth + 80;
                const viewportHeight = mapHeight + 80;
                
                const containerWidth = scrollContainer.clientWidth || 400;
                const containerHeight = scrollContainer.clientHeight || 400;
                
                let initialZoom = Math.min(1.0, Math.min(containerWidth / viewportWidth, containerHeight / viewportHeight));
                initialZoom = Math.max(0.6, initialZoom);
                
                setPracticeMapZoom(initialZoom);
                adjustPracticeViewportCentering(viewportWidth, viewportHeight);
            }
        }, 120);
        
        const btnPracticeZoomIn = document.getElementById('btn-practice-zoom-in');
        if (btnPracticeZoomIn) btnPracticeZoomIn.addEventListener('click', () => setPracticeMapZoom(state.practiceMapZoom + 0.1));
        const btnPracticeZoomOut = document.getElementById('btn-practice-zoom-out');
        if (btnPracticeZoomOut) btnPracticeZoomOut.addEventListener('click', () => setPracticeMapZoom(state.practiceMapZoom - 0.1));
        const btnPracticeZoomReset = document.getElementById('btn-practice-zoom-reset');
        if (btnPracticeZoomReset) btnPracticeZoomReset.addEventListener('click', () => setPracticeMapZoom(1.0));
        const btnPracticeFullscreen = document.getElementById('btn-practice-fullscreen');
        if (btnPracticeFullscreen) {
            btnPracticeFullscreen.addEventListener('click', () => toggleFullscreen('practice-map-canvas-container', 'btn-practice-fullscreen'));
        }
        const btnPracticeClose = document.querySelector('#practice-map-canvas-container .fullscreen-close-btn');
        if (btnPracticeClose) {
            btnPracticeClose.addEventListener('click', () => toggleFullscreen('practice-map-canvas-container', 'btn-practice-fullscreen'));
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
                
                ${card.image_front_url ? `
                    <div class="image-card-frame" style="position: relative; overflow: hidden; border-radius: 16px; border: 2px solid var(--border-color); background: rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; width: auto; max-width: 100%; height: 100%; max-height: 520px; align-self: center; box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: border-color 0.3s ease; flex-grow: 1;">
                        <img src="${card.image_front_url}" style="height: 100%; max-height: 520px; width: auto; max-width: 100%; object-fit: contain; display: block;" alt="Image Card Prompt">
                    </div>
                ` : `
                    <div class="practice-explanation" style="font-size: 1.45rem; font-weight: 700; color: var(--text-primary); text-align: center; max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word; margin: auto 0;">
                        ${card.front.replace(/\n/g, '<br>')}
                    </div>
                `}
            </div>
        `;
        
        const targetSteps = parseSequencingSteps(card.back);
        let seqHtml = '';
        targetSteps.forEach((step, idx) => {
            seqHtml += `
                <div class="sequencing-input-row" style="margin-bottom: 4px;">
                    <span style="font-weight: 800; font-size: 1.15rem; color: var(--accent); min-width: 24px; text-align: right;">${idx + 1}.</span>
                    <input type="text" class="practice-sequence-input" data-step-index="${idx}" placeholder="Enter step ${idx + 1}..." style="flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: inherit; font-size: 1rem; padding: 0;">
                </div>
            `;
        });
        
        if (seqContainer) {
            seqContainer.innerHTML = seqHtml;
            seqContainer.classList.remove('hidden');
            
            seqContainer.querySelectorAll('.practice-sequence-input').forEach(input => {
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        evt.stopPropagation();
                        const nextIdx = parseInt(input.dataset.stepIndex) + 1;
                        const nextInput = seqContainer.querySelector(`.practice-sequence-input[data-step-index="${nextIdx}"]`);
                        if (nextInput) {
                            nextInput.focus();
                        } else {
                            document.getElementById('btn-submit-answer').click();
                        }
                    }
                });
            });
        }
        
        document.getElementById('practice-input').classList.add('hidden');
        spellingArea.classList.add('hidden');
        
        backEl.innerHTML = card.back.replace(/\n/g, '<br>');
        
        const frontImg = document.getElementById('practice-front-img');
        if (frontImg) frontImg.classList.add('hidden');
        
        const backImg = document.getElementById('practice-back-img');
        if (card.image_back_url) {
            backImg.src = card.image_back_url;
            backImg.classList.remove('hidden');
        } else {
            backImg.classList.add('hidden');
        }
        
        document.querySelector('.card-front').classList.remove('hidden');
        document.querySelector('.card-back').classList.add('hidden');
        
        document.getElementById('typing-area').classList.remove('hidden');
        document.getElementById('evaluation-area').classList.add('hidden');
        
        setTimeout(() => {
            if (seqContainer) {
                const firstSeqInput = seqContainer.querySelector('.practice-sequence-input');
                if (firstSeqInput) firstSeqInput.focus();
            }
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
    const targetWord = card.back.trim();
    const isSingleWord = !targetWord.includes(' ') && targetWord.length > 0;
    
    if (sentences.length > 0) {
        exerciseTitleEl.textContent = "Complete the sentences with the correct word";
        
        const explanationHtml = card.front.replace(/\n/g, '<br>');
        
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
                    ${explanationHtml}
                </div>
                <div class="practice-divider" style="width: 60px; height: 2px; background: var(--bg-tertiary); margin: 4px 0;"></div>
                ${sentencesHtml}
            </div>
        `;
        spellingArea.classList.add('hidden');
    } else {
        exerciseTitleEl.textContent = "Question";
        
        const explanationHtml = card.front.replace(/\n/g, '<br>');
        frontEl.innerHTML = `
            <div class="practice-explanation-only" style="font-size: 1.45rem; font-weight: 700; color: var(--text-primary); max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word; text-align: center; margin: auto 0;">
                ${explanationHtml}
            </div>
        `;
        
        if (isSingleWord && targetWord.length > 1) {
            spellingArea.classList.remove('hidden');
            renderSpellingBoxes(targetWord);
        } else {
            spellingArea.classList.add('hidden');
        }
    }
    
    backEl.innerHTML = card.back.replace(/\n/g, '<br>');
    
    const frontImg = document.getElementById('practice-front-img');
    if (card.image_front_url) {
        frontImg.src = card.image_front_url;
        frontImg.classList.remove('hidden');
    } else {
        frontImg.classList.add('hidden');
    }

    const backImg = document.getElementById('practice-back-img');
    if (card.image_back_url) {
        backImg.src = card.image_back_url;
        backImg.classList.remove('hidden');
    } else {
        backImg.classList.add('hidden');
    }
    
    document.querySelector('.card-front').classList.remove('hidden');
    document.querySelector('.card-back').classList.add('hidden');
    
    document.getElementById('typing-area').classList.remove('hidden');
    document.getElementById('practice-input').value = '';
    document.getElementById('evaluation-area').classList.add('hidden');
    
    const firstSpellingInput = document.querySelector('.letter-input');
    if (firstSpellingInput) {
        document.getElementById('practice-input').classList.add('hidden');
        setTimeout(() => {
            firstSpellingInput.focus();
        }, 50);
    } else {
        document.getElementById('practice-input').classList.remove('hidden');
        document.getElementById('practice-input').focus();
    }
}

export function blankOutWordInSentence(sentence, word, startIndex = 0) {
    if (!sentence || !word) return { html: '', nextIndex: startIndex };
    let targetWord = word.trim();
    if (!targetWord) return { html: sentence, nextIndex: startIndex };
    
    let escapedWord = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    let regex = new RegExp('\\b' + escapedWord + '\\b', 'gi');
    let simpleRegex = new RegExp(escapedWord, 'gi');
    
    let isMatch = regex.test(sentence) || simpleRegex.test(sentence);
    regex.lastIndex = 0;
    simpleRegex.lastIndex = 0;

    let useStripped = false;
    let strippedWord = '';

    if (!isMatch && targetWord.length >= 3) {
        strippedWord = targetWord.slice(0, -1);
        const escapedStripped = strippedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const strippedRegex = new RegExp(escapedStripped, 'gi');
        if (strippedRegex.test(sentence)) {
            useStripped = true;
            targetWord = strippedWord;
            escapedWord = escapedStripped;
            regex = new RegExp(escapedStripped, 'gi');
            simpleRegex = strippedRegex;
        }
    }
    
    let currentStartIndex = startIndex;
    let finalNextIndex = startIndex;
    
    regex.lastIndex = 0;
    const match = regex.exec(sentence);
    if (!match) {
        const simpleMatch = simpleRegex.exec(sentence);
        if (!simpleMatch) {
            const boxesObj = renderBoxesForWord(targetWord, currentStartIndex);
            return {
                html: sentence + `<br><br><span class="letter-boxes-container inline">${boxesObj.html}</span>`,
                nextIndex: boxesObj.nextIndex
            };
        }
        let htmlResult = sentence.replace(simpleRegex, (matched) => {
            const boxesObj = renderBoxesForWord(targetWord, currentStartIndex);
            currentStartIndex = boxesObj.nextIndex;
            finalNextIndex = boxesObj.nextIndex;
            return boxesObj.html;
        });
        return { html: htmlResult, nextIndex: finalNextIndex };
    }
    
    regex.lastIndex = 0;
    let htmlResult = sentence.replace(regex, (matched) => {
        const boxesObj = renderBoxesForWord(targetWord, currentStartIndex);
        currentStartIndex = boxesObj.nextIndex;
        finalNextIndex = boxesObj.nextIndex;
        return boxesObj.html;
    });
    return { html: htmlResult, nextIndex: finalNextIndex };
}

export function renderBoxesForWord(word, startIndex = 0) {
    let html = `<span class="letter-boxes-container inline">`;
    let inputCount = startIndex;
    for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        if (/\s/.test(char)) {
            html += `<span class="letter-box-space" style="margin: 0 4px; display: inline-block;">&nbsp;</span>`;
        } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
            html += `<span class="letter-box-punctuation" style="margin: 0 2px; font-weight: 800; font-size: 1.1rem; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; color: var(--text-secondary);">${char}</span>`;
        } else {
            html += `<input type="text" class="letter-box letter-input" maxlength="1" data-index="${inputCount}">`;
            inputCount++;
        }
    }
    html += `</span>`;
    return { html, nextIndex: inputCount };
}

export function renderSpellingBoxes(word) {
    const container = document.getElementById('practice-letter-boxes');
    if (!container) return;
    container.innerHTML = '';
    
    let inputCount = 0;
    for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        if (/\s/.test(char)) {
            const space = document.createElement('span');
            space.className = 'letter-box-space';
            space.style.margin = '0 4px';
            space.style.display = 'inline-block';
            space.innerHTML = '&nbsp;';
            container.appendChild(space);
        } else if (/[.,\/#!$%\^&\*;:{}=\-_`~()]/.test(char)) {
            const punct = document.createElement('span');
            punct.className = 'letter-box-punctuation';
            punct.style.margin = '0 2px';
            punct.style.fontWeight = '800';
            punct.style.fontSize = '1.1rem';
            punct.style.display = 'inline-flex';
            punct.style.alignItems = 'center';
            punct.style.justifyContent = 'center';
            punct.style.verticalAlign = 'middle';
            punct.style.color = 'var(--text-secondary)';
            punct.textContent = char;
            container.appendChild(punct);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'letter-box letter-input';
            input.maxLength = 1;
            input.dataset.index = inputCount;
            container.appendChild(input);
            inputCount++;
        }
    }
}

export function getTypedSpellingAnswer(targetWord) {
    const inputs = Array.from(document.querySelectorAll('.letter-input'));
    let typed = '';
    let inputIndex = 0;
    for (let i = 0; i < targetWord.length; i++) {
        const char = targetWord.charAt(i);
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
    return typed;
}

export function getTargetWordsForSentences(backWord, sentences) {
    const targetWord = backWord.trim();
    return sentences.map(s => {
        const escapedWord = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('\\b' + escapedWord + '\\b', 'gi');
        const simpleRegex = new RegExp(escapedWord, 'gi');
        const isMatch = regex.test(s) || simpleRegex.test(s);
        
        if (!isMatch && targetWord.length >= 3) {
            const strippedWord = targetWord.slice(0, -1);
            const escapedStripped = strippedWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const strippedRegex = new RegExp(escapedStripped, 'gi');
            if (strippedRegex.test(s)) {
                return strippedWord;
            }
        }
        return targetWord;
    });
}

export function getTypedAnswersForSentences(targetWords, sentencesCount) {
    const inputs = Array.from(document.querySelectorAll('.letter-input'));
    const typedWords = [];
    
    let inputIndex = 0;
    for (let s = 0; s < sentencesCount; s++) {
        let typed = '';
        const currentTargetWord = targetWords[s] || targetWords[0];
        
        for (let i = 0; i < currentTargetWord.length; i++) {
            const char = currentTargetWord.charAt(i);
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
        typedWords.push(typed.trim());
    }
    return typedWords;
}

export function initSpellingInputListeners() {
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('letter-input')) {
            const inputs = Array.from(document.querySelectorAll('.letter-input'));
            const currentIndex = inputs.indexOf(e.target);
            
            if (e.target.value.length > 0) {
                e.target.classList.add('filled');
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                    inputs[currentIndex + 1].select();
                }
            } else {
                e.target.classList.remove('filled');
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('letter-input')) {
            const inputs = Array.from(document.querySelectorAll('.letter-input'));
            const currentIndex = inputs.indexOf(e.target);
            
            if (e.key === 'Backspace') {
                if (e.target.value === '') {
                    if (currentIndex > 0) {
                        const prevInput = inputs[currentIndex - 1];
                        prevInput.focus();
                        prevInput.value = '';
                        prevInput.classList.remove('filled');
                        e.preventDefault();
                    }
                } else {
                    e.target.classList.remove('filled');
                }
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) {
                    inputs[currentIndex - 1].focus();
                    inputs[currentIndex - 1].select();
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowRight') {
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                    inputs[currentIndex + 1].select();
                    e.preventDefault();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopImmediatePropagation();
                document.getElementById('btn-submit-answer').click();
            }
        }
    });
}

export function getEditDistance(a, b) {
  if (a.length === 0) return b.length; 
  if (b.length === 0) return a.length; 

  if (a.length > b.length) {
    const temp = a;
    a = b;
    b = temp;
  }

  const lenA = a.length;
  const lenB = b.length;

  let prevRow = new Int32Array(lenA + 1);
  let currRow = new Int32Array(lenA + 1);

  for (let j = 0; j <= lenA; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= lenB; i++) {
    currRow[0] = i;
    const charB = b.charAt(i - 1);
    for (let j = 1; j <= lenA; j++) {
      if (charB === a.charAt(j - 1)) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = Math.min(prevRow[j - 1] + 1, Math.min(currRow[j - 1] + 1, prevRow[j] + 1));
      }
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[lenA];
}

export function calculateMatchPercentage(typed, actual) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'it', 'to', 'of', 'in', 'and', 'or', 'that', 'this', 'for', 'with', 'on', 'at', 'by', 'from']);
    
    const normalize = str => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()"]/g, "").split(/\s+/).filter(w => w.length > 0);
    
    let actualWords = normalize(actual).filter(w => !stopWords.has(w));
    let typedWords = normalize(typed);

    if (actualWords.length === 0) {
        actualWords = normalize(actual); 
    }

    let totalMatchScore = 0;
    
    actualWords.forEach(actualWord => {
        let bestMatch = 0;
        
        typedWords.forEach(typedWord => {
            if (typedWord === actualWord) {
                bestMatch = 1;
            } else if (typedWord.includes(actualWord) || actualWord.includes(typedWord)) {
                let similarity = Math.min(typedWord.length, actualWord.length) / Math.max(typedWord.length, actualWord.length);
                if (similarity > bestMatch) bestMatch = similarity;
            } else {
                let dist = getEditDistance(actualWord, typedWord);
                let maxLength = Math.max(actualWord.length, typedWord.length);
                let similarity = (maxLength - dist) / maxLength;
                if (similarity > bestMatch) bestMatch = similarity;
            }
        });
        
        if (bestMatch > 0.5) {
            totalMatchScore += bestMatch;
        }
    });

    return Math.round((totalMatchScore / actualWords.length) * 100);
}

export function parseSequencingSteps(backText) {
    if (!backText) return [];
    return backText.split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const match = line.match(/^\s*\d+[\.\)\-:]\s*(.+)/);
            return match ? match[1].trim() : line;
        });
}

export function validateExampleSentence(sentenceText, targetWordText) {
    if (!sentenceText || !targetWordText) return false;
    const targetWord = targetWordText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanSentence = sentenceText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    if (cleanSentence.includes(targetWord)) return true;
    
    if (targetWord.length > 2) {
        const droppedWord = targetWord.slice(0, -1);
        if (cleanSentence.includes(droppedWord)) return true;
    }
    
    return false;
}

export async function logReviewAttempt(cardId, gradeInt, score) {
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch(e) {
        logs = [];
    }
    
    if (!Array.isArray(logs)) {
        logs = [];
    }
    
    const newAttempt = {
        timestamp: Date.now(),
        cardId: cardId,
        grade: gradeInt,
        score: score
    };
    logs.push(newAttempt);
    
    if (logs.length > 10000) {
        logs.shift();
    }
    
    await dbSet('review_activity_logs', logs);

    if (state.userSession && supabase) {
        const { error } = await supabase
            .from('review_logs')
            .insert([{
                user_id: state.userSession.user.id,
                card_id: cardId,
                grade: gradeInt,
                score: score
            }]);
        if (error) {
            console.error("Error saving review attempt to database:", error);
        }
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

export async function saveIncorrectExampleSentence() {
    const card = state.reviewQueue[state.currentReviewIndex];
    if (!card) return;
    
    const sentenceInput = document.getElementById('incorrect-sentence-input');
    const sentenceText = sentenceInput.value.trim();
    const errorMsg = document.getElementById('sentence-error-msg');
    const saveBtn = document.getElementById('btn-save-sentence');
    
    if (!sentenceText) {
        errorMsg.textContent = "Please enter an example sentence!";
        errorMsg.style.color = "#ea4335";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    if (!validateExampleSentence(sentenceText, card.back)) {
        errorMsg.textContent = `The sentence must contain the target word "${card.back}"!`;
        errorMsg.style.color = "#ea4335";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    const savedSentences = state.exampleSentences[card.id];
    let sentencesArray = [];
    if (Array.isArray(savedSentences)) {
        sentencesArray = [...savedSentences];
    } else if (typeof savedSentences === 'string') {
        sentencesArray = [savedSentences];
    }
    
    sentencesArray.push(sentenceText);
    state.exampleSentences[card.id] = sentencesArray;
    await dbSet('exampleSentences', state.exampleSentences);

    card.example_sentences = sentencesArray;

    if (state.userSession && supabase) {
        try {
            const { error } = await supabase
                .from('flashcards')
                .update({ example_sentences: sentencesArray })
                .eq('id', card.id)
                .eq('user_id', state.userSession.user.id);
            if (error) {
                console.error('Error updating example sentences in Supabase:', error);
            }
        } catch (err) {
            console.error('Error syncing example sentences update to DB:', err);
        }
    }
    
    errorMsg.innerHTML = "Sentence saved as memory clue! " + ICONS.check;
    errorMsg.style.color = "#34a853";
    errorMsg.classList.remove('hidden');
    
    saveBtn.disabled = true;
    setTimeout(() => {
        saveBtn.disabled = false;
        errorMsg.classList.add('hidden');
        document.getElementById('incorrect-sentence-container').classList.add('hidden');
        document.getElementById('btn-next-card').classList.remove('hidden');
    }, 1500);
}

export function proceedToNextCard() {
    const flashcardEl = document.getElementById('active-card');
    flashcardEl.style.transform = 'translateY(-20px) scale(0.95)';
    flashcardEl.style.opacity = '0';
    
    setTimeout(() => {
        flashcardEl.style.transform = 'none';
        flashcardEl.style.opacity = '1';
        
        state.currentReviewIndex++;
        if (state.currentReviewIndex >= state.reviewQueue.length) {
            finishSession();
        } else {
            renderCurrentCard();
        }
    }, 300);
}

export async function finishSession() {
    playUISound('complete');
    try {
        if (typeof window.confetti === 'function') {
            window.confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    } catch (err) {
        console.warn("Confetti call failed:", err);
    }

    if (state.userSession && supabase) {
        await loadData();
    } else {
        updateDashboard();
    }
    
    document.getElementById('active-card').style.display = 'none';
    document.querySelector('.practice-controls').style.display = 'none';
    
    if (state.isForcedMode) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
    } else {
        const completedMsg = document.getElementById('practice-completed');
        completedMsg.innerHTML = `<h2>Session Complete</h2><p style="color: var(--text-secondary); margin-bottom: 24px;">Your brain is getting stronger.</p><button class="btn primary" id="btn-finish-practice">Back to Dashboard</button>`;
        document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));
        completedMsg.classList.remove('hidden');
    }
}
