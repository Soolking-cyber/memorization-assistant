let customTypes = JSON.parse(localStorage.getItem('customTypes')) || ['Vocabulary', 'Memory Map', 'Image Card', 'Unknown'];
customTypes = customTypes.filter(t => t !== 'vocabulary' && t !== 'mixed');
if (!customTypes.includes('Vocabulary')) customTypes.push('Vocabulary');
if (!customTypes.includes('Memory Map')) customTypes.push('Memory Map');
if (!customTypes.includes('Image Card')) customTypes.push('Image Card');
if (!customTypes.includes('Unknown')) customTypes.push('Unknown');
localStorage.setItem('customTypes', JSON.stringify(customTypes));

export const state = {
    cards: [],
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
