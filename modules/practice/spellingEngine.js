import { state } from '../state.js';
import { playUISound } from '../sound.js';

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
    const inputs = Array.from(document.querySelectorAll('#practice-letter-boxes .letter-input'));
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
    const inputs = Array.from(document.querySelectorAll('.practice-sentence-list .letter-input'));
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
        if (e.target && e.target.classList && e.target.classList.contains('letter-input')) {
            const container = e.target.closest('#practice-letter-boxes') || e.target.closest('.practice-sentence-list') || e.target.closest('#deck-letter-boxes');
            if (!container) return;
            const inputs = Array.from(container.querySelectorAll('.letter-input'));
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
        if (e.target && e.target.classList && e.target.classList.contains('letter-input')) {
            const container = e.target.closest('#practice-letter-boxes') || e.target.closest('.practice-sentence-list') || e.target.closest('#deck-letter-boxes');
            if (!container) return;
            const inputs = Array.from(container.querySelectorAll('.letter-input'));
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

