import { safeJsonParse } from './utils.js';

let cardTypesConfig = safeJsonParse(localStorage.getItem('cardTypesConfig'), null);
if (cardTypesConfig && Array.isArray(cardTypesConfig)) {
    // Filter out 'Vietnamese Vocabulary' from existing config
    const cleanConfig = cardTypesConfig.filter(tc => tc && tc.name && tc.name.toLowerCase() !== 'vietnamese vocabulary');
    if (cleanConfig.length !== cardTypesConfig.length) {
        cardTypesConfig = cleanConfig;
        localStorage.setItem('cardTypesConfig', JSON.stringify(cardTypesConfig));
    }
}

let customTypes = safeJsonParse(localStorage.getItem('customTypes'), null);
if (customTypes && Array.isArray(customTypes)) {
    const cleanTypes = customTypes.filter(t => typeof t === 'string' && t.toLowerCase() !== 'vietnamese vocabulary');
    if (cleanTypes.length !== customTypes.length) {
        customTypes = cleanTypes;
        localStorage.setItem('customTypes', JSON.stringify(customTypes));
    }
}

if (!cardTypesConfig) {
    let initialTypes = customTypes || ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown'];
    if (!Array.isArray(initialTypes)) initialTypes = ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown'];
    initialTypes = initialTypes.filter(t => typeof t === 'string' && t !== 'vocabulary' && t !== 'mixed' && t.toLowerCase() !== 'vietnamese vocabulary');
    if (!initialTypes.includes('Vocabulary')) initialTypes.push('Vocabulary');
    if (!initialTypes.includes('Memory Map')) initialTypes.push('Memory Map');
    if (!initialTypes.includes('Image Card')) initialTypes.push('Image Card');
    if (!initialTypes.includes('Zettelkasten')) initialTypes.push('Zettelkasten');
    if (!initialTypes.includes('Unknown')) initialTypes.push('Unknown');
    
    cardTypesConfig = initialTypes.map(t => {
        let subs = [];
        if (t === 'Vocabulary') {
            subs = ['English', 'Vietnamese'];
        }
        return { name: t, subcategories: subs };
    });
    localStorage.setItem('cardTypesConfig', JSON.stringify(cardTypesConfig));
}
let activeModules = safeJsonParse(localStorage.getItem('active_modules'), ['scramble', 'collection']);
if (!Array.isArray(activeModules)) activeModules = ['scramble', 'collection'];
try { localStorage.setItem('active_modules', JSON.stringify(activeModules)); } catch (e) { console.warn('localStorage write failed:', e); }

export const state = {
    cards: [],
    activeModules: activeModules,
    cardTypesConfig: cardTypesConfig,
    
    get customTypes() {
        return this.cardTypesConfig.map(tc => tc.name);
    },
    set customTypes(newTypes) {
        const currentConfig = this.cardTypesConfig || [];
        this.cardTypesConfig = newTypes.map(name => {
            const existing = currentConfig.find(tc => tc.name === name);
            return existing || { name, subcategories: [] };
        });
        localStorage.setItem('cardTypesConfig', JSON.stringify(this.cardTypesConfig));
        localStorage.setItem('customTypes', JSON.stringify(newTypes));
    },
    dailyReviewLimit: 0,

    reviewQueue: [],
    currentReviewIndex: 0,
    userSession: null,
    isForcedMode: false,
    exampleSentences: {},
    statsYear: new Date().getFullYear(),
    activeCategoryTab: 'mixed',
    draftCreateSentences: [],
    editSentences: [],
    
    // Zettelkasten
    createZettelLinks: [],
    editZettelLinks: [],
    
    // Memory Map
    createMapNodes: [],
    createMapLinks: [],
    editMapNodes: [],
    editMapLinks: [],
    linkingSourceNodeId: null,
    linkingSourceSide: null,
    linkingMousePos: { x: 0, y: 0 },
    
    // Zoom and Snapping
    createMapZoom: 1.0,
    editMapZoom: 1.0,
    mapGridActive: false,
    practiceMapZoom: 1.0,
    
    // Sound
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    audioCtx: null
};

export function isVocabularyType(type) {
    if (!type) return false;
    const lower = type.toLowerCase();
    return lower.includes('vocabulary') || lower.includes('vocab');
}

