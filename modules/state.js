let customTypes = JSON.parse(localStorage.getItem('customTypes')) || ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown'];
customTypes = customTypes.filter(t => t !== 'vocabulary' && t !== 'mixed');
if (!customTypes.includes('Vocabulary')) customTypes.push('Vocabulary');
if (!customTypes.includes('Memory Map')) customTypes.push('Memory Map');
if (!customTypes.includes('Image Card')) customTypes.push('Image Card');
if (!customTypes.includes('Unknown')) customTypes.push('Unknown');
let activeModules = JSON.parse(localStorage.getItem('active_modules')) || ['scramble', 'collection'];
if (!Array.isArray(activeModules)) activeModules = ['scramble', 'collection'];
localStorage.setItem('active_modules', JSON.stringify(activeModules));

export const state = {
    cards: [],
    activeModules: activeModules,
    customTypes: customTypes,

    reviewQueue: [],
    currentReviewIndex: 0,
    userSession: null,
    isForcedMode: false,
    exampleSentences: {},
    statsYear: new Date().getFullYear(),
    activeCategoryTab: 'mixed',
    draftCreateSentences: [],
    editSentences: [],
    
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

