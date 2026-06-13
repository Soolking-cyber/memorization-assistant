import { safeJsonParse } from './utils.js';

let customTypes = safeJsonParse(localStorage.getItem('customTypes'), ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown']);
if (!Array.isArray(customTypes)) customTypes = ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown'];
customTypes = customTypes.filter(t => typeof t === 'string' && t !== 'vocabulary' && t !== 'mixed');
if (!customTypes.includes('Vocabulary')) customTypes.push('Vocabulary');
if (!customTypes.includes('Memory Map')) customTypes.push('Memory Map');
if (!customTypes.includes('Image Card')) customTypes.push('Image Card');
if (!customTypes.includes('Zettelkasten')) customTypes.push('Zettelkasten');
if (!customTypes.includes('Unknown')) customTypes.push('Unknown');
let activeModules = safeJsonParse(localStorage.getItem('active_modules'), ['scramble', 'collection']);
if (!Array.isArray(activeModules)) activeModules = ['scramble', 'collection'];
try { localStorage.setItem('active_modules', JSON.stringify(activeModules)); } catch (e) { console.warn('localStorage write failed:', e); }

export const state = {
    cards: [],
    activeModules: activeModules,
    customTypes: customTypes,
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

