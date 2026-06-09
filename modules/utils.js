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
