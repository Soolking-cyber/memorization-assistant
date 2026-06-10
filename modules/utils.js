/**
 * Escapes a string for safe insertion into HTML.
 * Prevents XSS when interpolating user-controlled or DB-sourced data into innerHTML.
 *
 * Usage:
 *   element.innerHTML = `<p>${escapeHtml(userString)}</p>`;
 *
 * For newline → <br> conversions, escape FIRST then replace:
 *   escapeHtml(str).replace(/\n/g, '<br>')
 */
export function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Safely parse a JSON string, returning fallback on any error.
 * Prevents app crashes from malformed localStorage or corrupted data.
 */
export function safeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str) ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * Layout-agnostic parser for vocabulary flashcards.
 * Auto-detects old vs new layout formats based on content length.
 * 
 * Old format: Front has the definition/explanation, Back has the target word.
 * New format: Front has the target word, Back has the definition/explanation.
 */
export function parseVocabularyCard(card) {
    if (!card) return { targetWord: '', definition: '', wordTypes: [], isSwapped: false };
    
    const isVocab = card.type && (card.type.toLowerCase().includes('vocabulary') || card.type.toLowerCase().includes('vocab'));
    if (!isVocab) {
        return {
            targetWord: (card.back || '').trim(),
            definition: (card.front || '').trim(),
            wordTypes: [],
            isSwapped: false
        };
    }
    
    let rawFront = (card.front || '').trim();
    let rawBack = (card.back || '').trim();
    
    let part1 = rawFront;
    let wordTypes = [];
    if (rawFront.includes('|||')) {
        const parts = rawFront.split('|||');
        part1 = parts[0].trim();
        wordTypes = parts[1].split(',').map(t => t.trim()).filter(Boolean);
    }
    
    // Auto-detect format:
    // If part1 (front without types) is shorter than or equal to back, it is likely the word.
    // In old format, part1 is description (longer) and rawBack is word (shorter).
    // In new format, part1 is word (shorter) and rawBack is description (longer).
    const isSwapped = part1.length <= rawBack.length;
    
    let targetWord = '';
    let definition = '';
    
    if (isSwapped) {
        targetWord = part1;
        definition = rawBack;
    } else {
        targetWord = rawBack;
        definition = part1;
    }
    
    return {
        targetWord: targetWord.trim(),
        definition: definition.trim(),
        wordTypes,
        isSwapped
    };
}
