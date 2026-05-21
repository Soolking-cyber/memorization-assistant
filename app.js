// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://krlrqimaiuyxybjnwzls.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7wo_d-VC3Ey5wJON02_EjA_KcFm7SJo';

let supabase;

// Error guard just in case the Supabase script failed to load or keys are not updated
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error("Supabase client not initialized. Ensure your keys are set properly.");
}

const ICONS = {
    crown: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M3 20h18"></path></svg>`,
    circle: `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="10"></circle></svg>`,
    link: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    linkActive: `<svg viewBox="0 0 24 24" class="icon-svg glow active"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align: middle; display: inline-block; pointer-events: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    closeSmall: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11" style="vertical-align: middle; display: inline-block; pointer-events: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" style="vertical-align: middle; display: inline-block; pointer-events: none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" style="vertical-align: middle; display: inline-block; margin-left: 6px; pointer-events: none;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    plus: `<svg viewBox="0 0 24 24" class="icon-svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    smile: `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`,
    star: `<svg viewBox="0 0 24 24" class="icon-svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    idea: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15 15.6c1.1-1.03 1.88-2.43 1.88-3.9 0-3.04-2.46-5.5-5.5-5.5S5.88 8.66 5.88 11.7c0 1.47.78 2.87 1.88 3.9H15z"></path></svg>`,
    trophy: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path></svg>`,
    folder: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    pin: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    help: `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    heart: `<svg viewBox="0 0 24 24" class="icon-svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    gear: `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    calendar: `<svg viewBox="0 0 24 24" class="icon-svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
};

let cards = [];
let customTypes = JSON.parse(localStorage.getItem('customTypes')) || ['mixed', 'Vocabulary', 'Memory Map'];
if (!customTypes.includes('mixed')) customTypes.unshift('mixed');
if (!customTypes.includes('Vocabulary')) customTypes.push('Vocabulary');
if (!customTypes.includes('Memory Map')) customTypes.push('Memory Map');
localStorage.setItem('customTypes', JSON.stringify(customTypes));

let reviewQueue = [];
let currentReviewIndex = 0;
let userSession = null;
let isForcedMode = false;

// New Features Global State Variables
let exampleSentences = JSON.parse(localStorage.getItem('exampleSentences')) || {};
let activeCategoryTab = 'mixed';
let draftCreateSentences = [];
let editSentences = [];

// Memory Map Global State Variables
let createMapNodes = [];
let createMapLinks = [];
let editMapNodes = [];
let editMapLinks = [];
let linkingSourceNodeId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initThemeSystem();
    initNavigation();
    
    // Auth events
    document.getElementById('btn-google-login').addEventListener('click', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Bind form events
    document.getElementById('create-card-form').addEventListener('submit', handleCreateCard);
    document.getElementById('edit-card-form').addEventListener('submit', handleEditCardSubmit);
    
    // Practice events
    document.getElementById('btn-practice').addEventListener('click', startPractice);
    document.getElementById('btn-submit-answer').addEventListener('click', evaluateAnswer);
    document.getElementById('btn-next-card').addEventListener('click', proceedToNextCard);
    document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));

    document.getElementById('card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('edit-card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('practice-type-select').addEventListener('change', updateDashboard);
    window.removeType = removeType;

    // Delegated event listeners for interactive spelling direct input boxes
    initSpellingInputListeners();

    // Incorrect answer example sentence saver event
    document.getElementById('btn-save-sentence').addEventListener('click', saveIncorrectExampleSentence);

    // Sentence clues addition events
    const btnCreateAdd = document.getElementById('btn-create-add-sentence');
    if (btnCreateAdd) btnCreateAdd.addEventListener('click', handleCreateAddSentence);
    const btnEditAdd = document.getElementById('btn-edit-add-sentence');
    if (btnEditAdd) btnEditAdd.addEventListener('click', handleEditAddSentence);

    window.deleteDraftCreateSentence = deleteDraftCreateSentence;
    window.deleteEditSentence = deleteEditSentence;

    // Initialize Memory Map canvas and button click listeners
    initMapCanvasListeners();

    if (supabase) {
        checkAuth();
    }
});

// ------ Auth Logic ------
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
        userSession = session;
        updateUserAvatarBadge();
        await loadData();
        handleSessionStart();
    } else {
        userSession = null;
        document.getElementById('nav-buttons').classList.add('hidden');
        switchView('auth');
    }

    // Listen for auth changes (e.g. login from redirect)
    supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session && !userSession) {
            userSession = session;
            updateUserAvatarBadge();
            await loadData();
            handleSessionStart();
        } else if (!session && userSession) {
            userSession = null;
            document.getElementById('nav-buttons').classList.add('hidden');
            switchView('auth');
        }
    });
}

function updateUserAvatarBadge() {
    if (userSession && userSession.user) {
        const email = userSession.user.email || 'User';
        const initial = email.charAt(0).toUpperCase();
        const badge = document.getElementById('user-avatar-badge');
        if (badge) badge.textContent = initial;
    }
}

function handleSessionStart() {
    const urlParams = new URLSearchParams(window.location.search);
    const forcedCount = parseInt(urlParams.get('forcedReview'));
    
    if (!isNaN(forcedCount) && forcedCount > 0) {
        isForcedMode = true;
        document.getElementById('nav-buttons').classList.add('hidden');
        startForcedPractice(forcedCount);
    } else {
        isForcedMode = false;
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
    }
}

function handleLogin() {
    if (!supabase) return alert("Supabase URL and Key are required in app.js");
    supabase.auth.signInWithOAuth({ provider: 'google' });
}

async function handleLogout() {
    await supabase.auth.signOut();
}

// ------ Data Logic (Supabase) ------

async function loadData() {
    if (!userSession) return;
    
    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userSession.user.id);

    if (error) {
        console.error("Error loading cards:", error);
    } else {
        cards = data || [];
        updateDashboard();
    }
}

// Add a single card to DB
async function insertCardToDB(card) {
    if (!userSession) return;
    const { error } = await supabase
        .from('flashcards')
        .insert([{
            user_id: userSession.user.id,
            front: card.front,
            back: card.back,
            nextReview: card.nextReview,
            ease: card.ease,
            interval: card.interval,
            repetitions: card.repetitions
        }]);

    if (error) console.error("Error inserting:", error);
}

// Update a single card in DB
async function updateCardInDB(card) {
    if (!userSession) return;
    const { error } = await supabase
        .from('flashcards')
        .update({
            nextReview: card.nextReview,
            ease: card.ease,
            interval: card.interval,
            repetitions: card.repetitions
        })
        .eq('id', card.id)
        .eq('user_id', userSession.user.id);
        
    if (error) console.error("Error updating:", error);
}


// ------ UI Theme System ------

function initThemeSystem() {
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (!btnThemeToggle) return;
    
    const moonIcon = btnThemeToggle.querySelector('.theme-icon-light');
    const sunIcon = btnThemeToggle.querySelector('.theme-icon-dark');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    if (isDark) {
        document.body.classList.add('dark-theme');
        if (moonIcon) moonIcon.classList.add('hidden');
        if (sunIcon) sunIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark-theme');
        if (moonIcon) moonIcon.classList.remove('hidden');
        if (sunIcon) sunIcon.classList.add('hidden');
    }
    
    btnThemeToggle.addEventListener('click', () => {
        const currentlyDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', currentlyDark ? 'dark' : 'light');
        
        if (currentlyDark) {
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
        }
    });
}


// ------ UI Navigation ------

function initNavigation() {
    document.querySelectorAll('[data-view]').forEach(elem => {
        elem.addEventListener('click', (e) => {
            const targetView = e.currentTarget.dataset.view;
            switchView(targetView);
        });
    });
}

function switchView(viewId) {
    if (viewId === 'auth') {
        document.body.classList.add('logged-out');
        document.body.classList.remove('logged-in');
    } else {
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
    }

    document.querySelectorAll('.view').forEach(v => {
        if (!v.classList.contains('hidden')) {
            v.style.opacity = '0';
            setTimeout(() => {
                v.classList.add('hidden');
            }, 300);
        }
    });

    setTimeout(() => {
        const target = document.getElementById(`view-${viewId}`);
        target.classList.remove('hidden');
        // trigger reflow
        void target.offsetWidth;
        target.style.opacity = '1';
        
        // Update nav active states
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            } else {
                if(!btn.classList.contains('primary-nav-btn')) btn.classList.remove('active');
            }
        });

        if (viewId === 'dashboard') {
            updateDashboard();
        }
        if (viewId === 'create') {
            draftCreateSentences = [];
            const createSentencesInput = document.getElementById('create-new-sentence');
            if (createSentencesInput) createSentencesInput.value = '';
            const createError = document.getElementById('create-sentence-error');
            if (createError) createError.style.display = 'none';
            renderCreateSentencesList();
            document.getElementById('card-front').focus();
        }
        if (viewId === 'manage') {
            renderManageView();
        }
    }, 300);
}

async function removeType(typeToRemove) {
    if (typeToRemove === 'mixed') return;
    if (!confirm(`Are you sure you want to delete the "${typeToRemove}" type? All cards with this type will be reassigned to "All Types".`)) return;
    
    if (userSession) {
        const { error } = await supabase
            .from('flashcards')
            .update({ type: 'mixed' })
            .eq('type', typeToRemove)
            .eq('user_id', userSession.user.id);
            
        if (error) {
            console.error("Error removing type:", error);
            alert("Failed to remove type.");
            return;
        }
    }
    
    cards.forEach(c => {
        if (c.type === typeToRemove) c.type = 'mixed';
    });
    
    customTypes = customTypes.filter(t => t !== typeToRemove);
    localStorage.setItem('customTypes', JSON.stringify(customTypes));
    
    updateTypeDatalists();
    updateDashboard();
    if (!document.getElementById('view-manage').classList.contains('hidden')) {
        renderManageView();
    }
}

function handleTypeSelectChange(e) {
    let val = e.target.value;
    if (val === 'add_new') {
        const newType = prompt("Enter new memory type:");
        if (newType && newType.trim() !== '') {
            const cleanType = newType.trim();
            if (!customTypes.includes(cleanType)) {
                customTypes.push(cleanType);
                localStorage.setItem('customTypes', JSON.stringify(customTypes));
            }
            updateTypeDatalists();
            e.target.value = cleanType;
            val = cleanType;
        } else {
            e.target.value = 'mixed';
            val = 'mixed';
        }
    }
    
    // Toggle the visible fields based on the selected type
    const isEdit = e.target.id === 'edit-card-type';
    const vocabFields = document.getElementById(isEdit ? 'edit-vocab-fields' : 'create-vocab-fields');
    const mapFields = document.getElementById(isEdit ? 'edit-map-fields' : 'create-map-fields');
    
    if (vocabFields && mapFields) {
        if (val === 'Memory Map') {
            vocabFields.classList.add('hidden');
            mapFields.classList.remove('hidden');
            
            // For Edit mode, if it's already rendered, we need to trigger links redraw
            if (isEdit) {
                setTimeout(() => {
                    renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
                }, 50);
            } else {
                setTimeout(() => {
                    renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
                }, 50);
            }
        } else {
            vocabFields.classList.remove('hidden');
            mapFields.classList.add('hidden');
        }
    }
}

function renderTypeTags() {
    const createContainer = document.getElementById('create-type-tags');
    const editContainer = document.getElementById('edit-type-tags');
    
    const tagHtml = customTypes.map(t => {
        const displayType = t === 'mixed' ? 'All Types (Mixed)' : t;
        if (t === 'mixed' || t === 'Vocabulary' || t === 'Memory Map') {
            return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType}</span>`;
        }
        return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType} <button type="button" onclick="removeType('${t}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; margin-left:6px; padding:0; display:inline-flex; align-items:center;">${ICONS.closeSmall}</button></span>`;
    }).join('');
    
    if (createContainer) createContainer.innerHTML = tagHtml;
    if (editContainer) editContainer.innerHTML = tagHtml;
}

function updateTypeDatalists() {
    const types = new Set(customTypes);
    let migrated = false;
    cards.forEach(c => {
        if (!c.type || c.type === 'General') {
            c.type = 'mixed';
            migrated = true;
        }
        types.add(c.type);
    });
    
    if (migrated && userSession) {
        supabase.from('flashcards').update({ type: 'mixed' }).or('type.eq.General,type.is.null').eq('user_id', userSession.user.id).then();
    }
    
    types.delete('General');
    
    customTypes = Array.from(types);
    localStorage.setItem('customTypes', JSON.stringify(customTypes));
    
    const populateSelect = (selectId, addMixed = false) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '';
        
        customTypes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t === 'mixed' ? 'All Types (Mixed)' : t;
            select.appendChild(opt);
        });
        
        if (!addMixed) {
            select.innerHTML += '<option value="add_new" style="font-weight: bold; color: var(--accent);">+ Add New Type...</option>';
        }
        
        if ([...select.options].some(o => o.value === currentVal)) {
            select.value = currentVal;
        } else if (!addMixed) {
            select.value = 'mixed';
        }
    };
    
    populateSelect('card-type', false);
    populateSelect('edit-card-type', false);
    populateSelect('practice-type-select', true);
    
    renderTypeTags();
}

function updateDashboard() {
    updateTypeDatalists();
    renderCategoryTabs();
    
    const totalElement = document.getElementById('stat-total');
    const dueElement = document.getElementById('stat-due');
    const btnPractice = document.getElementById('btn-practice');
    const statusMsg = document.getElementById('practice-status-msg');

    const practiceSelect = document.getElementById('practice-type-select');
    const selectedType = practiceSelect ? practiceSelect.value : 'mixed';

    const filteredCards = selectedType === 'mixed' ? cards : cards.filter(c => c.type === selectedType);
    const total = filteredCards.length;
    const now = Date.now();
    const dueCards = filteredCards.filter(c => c.nextReview <= now);

    if (totalElement) totalElement.textContent = total;
    if (dueElement) dueElement.textContent = dueCards.length;

    if (dueCards.length > 0) {
        if (btnPractice) btnPractice.style.display = 'inline-block';
        if (statusMsg) statusMsg.textContent = `${dueCards.length} memories are ready for retention mapping.`;
    } else if (total === 0) {
        if (btnPractice) btnPractice.style.display = 'none';
        if (statusMsg) statusMsg.textContent = "Start by creating your first memory card.";
    } else {
        if (btnPractice) btnPractice.style.display = 'none';
        
        // Find next due time
        const futureCards = filteredCards.filter(c => c.nextReview > now).sort((a,b) => a.nextReview - b.nextReview);
        if (futureCards.length > 0) {
            const msToNext = futureCards[0].nextReview - now;
            let timeStr = "";
            if (msToNext > 86400000) { timeStr = Math.ceil(msToNext / 86400000) + " days"; }
            else if (msToNext > 3600000) { timeStr = Math.ceil(msToNext / 3600000) + " hours"; }
            else { timeStr = Math.ceil(msToNext / 60000) + " minutes"; }
            if (statusMsg) statusMsg.textContent = `All caught up! Next memory unlocks in ${timeStr}.`;
        }
    }

    renderCategoryCards();
}

function renderCategoryTabs() {
    const tabContainer = document.getElementById('category-tabs');
    if (!tabContainer) return;
    tabContainer.innerHTML = '';
    
    // Collect unique present categories
    const categories = ['mixed'];
    cards.forEach(c => {
        if (c.type && c.type !== 'mixed') {
            if (!categories.includes(c.type)) categories.push(c.type);
        }
    });

    categories.forEach(type => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        if (type === activeCategoryTab) tab.classList.add('active');
        tab.textContent = type === 'mixed' ? 'ALL' : type;
        
        tab.addEventListener('click', () => {
            activeCategoryTab = type;
            renderCategoryTabs();
            renderCategoryCards();
        });
        tabContainer.appendChild(tab);
    });
}

function renderCategoryCards() {
    const grid = document.getElementById('category-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const now = Date.now();
    
    // Filter display categories based on selected tab
    let categoriesToShow = [];
    if (activeCategoryTab === 'mixed') {
        const categories = ['mixed'];
        cards.forEach(c => {
            if (c.type && c.type !== 'mixed') {
                if (!categories.includes(c.type)) categories.push(c.type);
            }
        });
        categoriesToShow = categories;
    } else {
        categoriesToShow = [activeCategoryTab];
    }

    categoriesToShow.forEach(type => {
        const typeCards = type === 'mixed' ? cards : cards.filter(c => c.type === type);
        const total = typeCards.length;
        if (total === 0 && type !== 'mixed') return; // Skip custom categories with no cards

        const due = typeCards.filter(c => c.nextReview <= now).length;
        const reviewed = total - due;
        const percent = total > 0 ? (reviewed / total) * 100 : 0;
        
        const cardEl = document.createElement('div');
        cardEl.className = 'category-card';
        if (total > 0 && due > 0) {
            cardEl.classList.add('clickable');
        }

        // Monochromatic SVG icons
        let iconSvg = '';
        if (type === 'mixed') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`;
        }

        const titleText = type === 'mixed' ? 'All Memories' : type;

        cardEl.innerHTML = `
            <div class="category-card-top">
                <div class="category-card-icon">${iconSvg}</div>
                <div class="category-card-info">
                    <h4>${titleText}</h4>
                    <span class="category-card-fraction">${reviewed}/${total}</span>
                </div>
            </div>
            <div class="category-card-bottom">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;

        if (total > 0 && due > 0) {
            cardEl.addEventListener('click', () => {
                const select = document.getElementById('practice-type-select');
                if (select) {
                    select.value = type;
                    updateDashboard();
                    startPractice();
                }
            });
        }
        
        grid.appendChild(cardEl);
    });
}

// ------ Flashcard Crud ------

function renderManageView() {
    const list = document.getElementById('manage-list');
    const toolbar = document.getElementById('manage-toolbar');
    const selectAllCb = document.getElementById('select-all-checkbox');
    const deleteBtn = document.getElementById('btn-delete-selected');
    const selectedCountEl = document.getElementById('selected-count');
    list.innerHTML = '';
    
    if (cards.length === 0) {
        list.innerHTML = '<p class="status-msg">No memories found.</p>';
        toolbar.classList.add('hidden');
        return;
    }

    toolbar.classList.remove('hidden');
    selectAllCb.checked = false;
    updateBatchUI();

    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'glass manage-card';
        
        let frontImgHtml = card.image_front_url ? `<img src="${card.image_front_url}" class="manage-card-img" alt="Front">` : '';
        let backImgHtml = card.image_back_url ? `<img src="${card.image_back_url}" class="manage-card-img" alt="Back">` : '';

        // Retrieve and format sentences for inline list
        const savedSentences = exampleSentences[card.id];
        let sentencesArray = [];
        if (Array.isArray(savedSentences)) {
            sentencesArray = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentencesArray = [savedSentences];
        }

        let sentencesHtml = '';
        if (sentencesArray.length > 0) {
            sentencesHtml = `
                <div class="manage-sentences-list" style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
                    <strong style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Saved Clues:</strong>
                    ${sentencesArray.map((s, idx) => `
                        <div class="manage-sentence-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 8px; font-size: 0.85rem;">
                            <span style="flex: 1; margin-right: 8px; line-height: 1.4;">${s}</span>
                            <button type="button" class="delete-sentence-bank-btn" data-card-id="${card.id}" data-index="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 4px; display:inline-flex; align-items:center;" title="Delete Clue">${ICONS.trash}</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        let displayFront = '';
        if (card.front.startsWith('{"mode":"memory_map"')) {
            try {
                const mapData = JSON.parse(card.front);
                displayFront = `<strong style="color:var(--accent);">[Memory Map]</strong> ${mapData.title} (${mapData.nodes.length} nodes, ${mapData.links.length} connections)`;
            } catch (e) {
                displayFront = card.front;
            }
        } else {
            displayFront = card.front.replace(/\n/g, '<br>');
        }

        cardEl.innerHTML = `
            <label class="manage-card-checkbox">
                <input type="checkbox" class="card-checkbox" data-id="${card.id}">
                <span class="custom-checkbox"></span>
            </label>
            <div class="manage-card-content" style="flex: 1;">
                <span class="type-tag">${card.type === 'mixed' ? 'All Types' : (card.type || 'All Types')}</span><br>
                <strong>Front:</strong> <br> ${displayFront} ${frontImgHtml} <br><br>
                <strong>Back:</strong> <br> ${card.back.replace(/\n/g, '<br>')} ${backImgHtml}
                ${sentencesHtml}
            </div>
            <div style="margin-left: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: flex-start; padding-top: 16px;">
                <button class="btn-icon edit-btn" data-id="${card.id}" title="Edit Memory">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon delete-btn" data-id="${card.id}" style="color: #ff4444;" title="Delete Memory">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
        list.appendChild(cardEl);
    });

    // Edit handlers
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditView(e.currentTarget.dataset.id);
        });
    });

    // Delete (Single) handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Permanently delete this memory?')) {
                await batchDeleteCards([id]);
            }
        });
    });



    // Inline delete sentence button handler
    document.querySelectorAll('.delete-sentence-bank-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cardId = e.currentTarget.dataset.cardId;
            const index = parseInt(e.currentTarget.dataset.index);
            
            const savedSentences = exampleSentences[cardId];
            let sentencesArray = [];
            if (Array.isArray(savedSentences)) {
                sentencesArray = [...savedSentences];
            } else if (typeof savedSentences === 'string') {
                sentencesArray = [savedSentences];
            }
            
            sentencesArray.splice(index, 1);
            
            if (sentencesArray.length > 0) {
                exampleSentences[cardId] = sentencesArray;
            } else {
                delete exampleSentences[cardId];
            }
            localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));
            
            renderManageView();
        });
    });

    // Checkbox change handlers
    document.querySelectorAll('.card-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            updateBatchUI();
            const allBoxes = document.querySelectorAll('.card-checkbox');
            const allChecked = [...allBoxes].every(b => b.checked);
            selectAllCb.checked = allChecked;
        });
    });

    // Select All
    selectAllCb.onchange = () => {
        const checked = selectAllCb.checked;
        document.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = checked);
        updateBatchUI();
    };

    // Delete Selected
    deleteBtn.onclick = async () => {
        const selected = [...document.querySelectorAll('.card-checkbox:checked')].map(cb => cb.dataset.id);
        if (selected.length === 0) return;
        if (!confirm(`Permanently delete ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'}?`)) return;
        await batchDeleteCards(selected);
    };
}

function updateBatchUI() {
    const selected = document.querySelectorAll('.card-checkbox:checked').length;
    const countEl = document.getElementById('selected-count');
    const deleteBtn = document.getElementById('btn-delete-selected');
    if (countEl) countEl.textContent = `${selected} selected`;
    if (selected > 0) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }
}

async function batchDeleteCards(ids) {
    if (!userSession) return;
    
    const deleteBtn = document.getElementById('btn-delete-selected');
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;

    // Collect images to delete from storage
    const idSet = new Set(ids);
    const cardsToDelete = cards.filter(c => idSet.has(c.id));
    const imagePaths = [];
    
    cardsToDelete.forEach(card => {
        if (card.image_front_url) {
            const parts = card.image_front_url.split('/');
            imagePaths.push(parts[parts.length - 1]);
        }
        if (card.image_back_url) {
            const parts = card.image_back_url.split('/');
            imagePaths.push(parts[parts.length - 1]);
        }
    });

    const { error } = await supabase
        .from('flashcards')
        .delete()
        .in('id', ids)
        .eq('user_id', userSession.user.id);
        
    if (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete memories.");
        deleteBtn.textContent = 'Delete Selected';
        deleteBtn.disabled = false;
    } else {
        // Remove associated images from storage
        if (imagePaths.length > 0) {
            await supabase.storage.from('card_images').remove(imagePaths);
        }

        // Also clean up any local storage example sentences
        ids.forEach(id => {
            delete exampleSentences[id];
        });
        localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));

        cards = cards.filter(c => !idSet.has(c.id));
        renderManageView();
        updateDashboard();
    }
}

async function handleCreateCard(e) {
    e.preventDefault();
    if (!userSession) return alert("Must be logged in to create cards.");

    const activeType = document.getElementById('card-type').value.trim() || 'mixed';
    let frontText = '';
    let backText = '';
    
    if (activeType === 'Memory Map') {
        const title = document.getElementById('create-map-title').value.trim();
        if (!title) {
            alert("Please enter a Memory Map Title.");
            return;
        }
        if (createMapNodes.length === 0) {
            alert("Please add at least one node to your Memory Map.");
            return;
        }
        const hasRoot = createMapNodes.some(n => n.isRoot);
        if (!hasRoot) {
            alert("Please designate exactly one Root Node (using the crown button).");
            return;
        }
        
        const mapData = {
            mode: 'memory_map',
            title: title,
            nodes: createMapNodes,
            links: createMapLinks
        };
        frontText = JSON.stringify(mapData);
        backText = 'Memory Map';
    } else {
        frontText = document.getElementById('card-front').value.trim();
        backText = document.getElementById('card-back').value.trim();
        if (!frontText || !backText) return;
    }

    const btn = document.querySelector('#create-card-form button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = "Uploading Memory...";
    btn.disabled = true;

    const cardId = crypto.randomUUID();
    let image_front_url = null;
    let image_back_url = null;

    const uploadImage = async (file, side) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${cardId}_${side}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file);
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            return null;
        }
        const { data: publicUrlData } = supabase.storage.from('card_images').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const frontImageFile = document.getElementById('card-front-image').files[0];
    const backImageFile = document.getElementById('card-back-image').files[0];

    if (frontImageFile) image_front_url = await uploadImage(frontImageFile, 'front');
    if (backImageFile) image_back_url = await uploadImage(backImageFile, 'back');

    const newCard = {
        user_id: userSession.user.id,
        type: activeType,
        front: frontText,
        back: backText,
        image_front_url: image_front_url,
        image_back_url: image_back_url,
        nextReview: Date.now(),
        ease: 2.5,
        interval: 0,
        repetitions: 0
    };

    const { data, error } = await supabase.from('flashcards').insert([newCard]).select();

    if (!error && data) {
        const createdCard = data[0];
        cards.push(createdCard); 
        if (draftCreateSentences.length > 0 && activeType !== 'Memory Map') {
            exampleSentences[createdCard.id] = [...draftCreateSentences];
            localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));
        }
        updateDashboard();
    } else {
        console.error("Failed to insert core memory:", error);
    }
    
    document.getElementById('card-type').value = 'mixed';
    document.getElementById('card-front').value = '';
    document.getElementById('card-back').value = '';
    document.getElementById('card-front-image').value = '';
    document.getElementById('card-back-image').value = '';
    
    // Clear Memory Map create fields
    document.getElementById('create-map-title').value = '';
    createMapNodes = [];
    createMapLinks = [];
    renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
    
    // Hide map fields and restore vocab fields visually
    document.getElementById('create-vocab-fields').classList.remove('hidden');
    document.getElementById('create-map-fields').classList.add('hidden');

    // Clear example sentences creation inputs and list
    const createSentencesInput = document.getElementById('create-new-sentence');
    if (createSentencesInput) createSentencesInput.value = '';
    const createError = document.getElementById('create-sentence-error');
    if (createError) createError.style.display = 'none';
    draftCreateSentences = [];
    renderCreateSentencesList();
    
    btn.innerHTML = "Memory Locked! " + ICONS.check;
    btn.style.background = "var(--accent)";
    btn.style.borderColor = "var(--accent)";
    btn.style.color = "#ffffff";
    btn.disabled = false;
    
    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
        if (document.getElementById('card-front')) document.getElementById('card-front').focus();
    }, 1500);
}

function openEditView(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('edit-card-id').value = card.id;
    document.getElementById('edit-card-type').value = card.type || 'mixed';
    
    document.getElementById('edit-card-front-image').value = '';
    document.getElementById('edit-card-back-image').value = '';

    const frontPreviewDiv = document.getElementById('edit-front-img-preview');
    if (card.image_front_url) {
        frontPreviewDiv.classList.remove('hidden');
        frontPreviewDiv.querySelector('img').src = card.image_front_url;
    } else {
        frontPreviewDiv.classList.add('hidden');
    }

    const backPreviewDiv = document.getElementById('edit-back-img-preview');
    if (card.image_back_url) {
        backPreviewDiv.classList.remove('hidden');
        backPreviewDiv.querySelector('img').src = card.image_back_url;
    } else {
        backPreviewDiv.classList.add('hidden');
    }

    // Toggle fields based on card type
    const vocabFields = document.getElementById('edit-vocab-fields');
    const mapFields = document.getElementById('edit-map-fields');
    
    let isMap = false;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            isMap = true;
        }
    } catch (e) {}
    
    if (isMap || card.type === 'Memory Map') {
        document.getElementById('edit-card-type').value = 'Memory Map';
        vocabFields.classList.add('hidden');
        mapFields.classList.remove('hidden');
        
        let mapData = { title: '', nodes: [], links: [] };
        try {
            mapData = JSON.parse(card.front);
        } catch (e) {
            console.error("Error parsing memory map front text:", e);
        }
        
        document.getElementById('edit-map-title').value = mapData.title || '';
        editMapNodes = mapData.nodes || [];
        editMapLinks = mapData.links || [];
        
        // Render edit nodes
        setTimeout(() => {
            renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        }, 100);
    } else {
        vocabFields.classList.remove('hidden');
        mapFields.classList.add('hidden');
        
        document.getElementById('edit-card-front').value = card.front;
        document.getElementById('edit-card-back').value = card.back;
        
        // Load example sentences clues
        const savedSentences = exampleSentences[card.id];
        if (Array.isArray(savedSentences)) {
            editSentences = [...savedSentences];
        } else if (typeof savedSentences === 'string') {
            editSentences = [savedSentences];
        } else {
            editSentences = [];
        }

        const editSentencesInput = document.getElementById('edit-new-sentence');
        if (editSentencesInput) editSentencesInput.value = '';
        const editError = document.getElementById('edit-sentence-error');
        if (editError) editError.style.display = 'none';
        renderEditSentencesList();
    }

    switchView('edit');
}

async function handleEditCardSubmit(e) {
    e.preventDefault();
    if (!userSession) return alert("Must be logged in to edit cards.");

    const cardId = document.getElementById('edit-card-id').value;
    const typeText = document.getElementById('edit-card-type').value.trim() || 'mixed';
    
    let frontText = '';
    let backText = '';
    
    if (typeText === 'Memory Map') {
        const title = document.getElementById('edit-map-title').value.trim();
        if (!title) {
            alert("Please enter a Memory Map Title.");
            return;
        }
        if (editMapNodes.length === 0) {
            alert("Please add at least one node to your Memory Map.");
            return;
        }
        const hasRoot = editMapNodes.some(n => n.isRoot);
        if (!hasRoot) {
            alert("Please designate exactly one Root Node (using the crown button).");
            return;
        }
        
        const mapData = {
            mode: 'memory_map',
            title: title,
            nodes: editMapNodes,
            links: editMapLinks
        };
        frontText = JSON.stringify(mapData);
        backText = 'Memory Map';
    } else {
        frontText = document.getElementById('edit-card-front').value.trim();
        backText = document.getElementById('edit-card-back').value.trim();
    }
    
    if (!frontText || !backText || !cardId) return;

    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const existingCard = cards[cardIndex];

    const btn = document.querySelector('#edit-card-form button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = "Saving Changes...";
    btn.disabled = true;

    let new_image_front_url = existingCard.image_front_url;
    let new_image_back_url = existingCard.image_back_url;

    const uploadImage = async (file, side) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${cardId}_${side}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('card_images').upload(fileName, file);
        if (uploadError) {
            console.error(`Error uploading ${side} image:`, uploadError);
            return null;
        }
        const { data: publicUrlData } = supabase.storage.from('card_images').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    };

    const deleteOldImage = async (url) => {
        if (!url) return;
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        await supabase.storage.from('card_images').remove([fileName]);
    };

    if (frontImageFile) {
        if (existingCard.image_front_url) {
            await deleteOldImage(existingCard.image_front_url);
        }
        new_image_front_url = await uploadImage(frontImageFile, 'front');
    }

    if (backImageFile) {
        if (existingCard.image_back_url) {
            await deleteOldImage(existingCard.image_back_url);
        }
        new_image_back_url = await uploadImage(backImageFile, 'back');
    }

    const { data, error } = await supabase
        .from('flashcards')
        .update({
            type: typeText,
            front: frontText,
            back: backText,
            image_front_url: new_image_front_url,
            image_back_url: new_image_back_url
        })
        .eq('id', cardId)
        .eq('user_id', userSession.user.id)
        .select();

    if (!error && data) {
        cards[cardIndex] = data[0];
        
        // Save example sentences clues
        if (editSentences.length > 0) {
            exampleSentences[cardId] = [...editSentences];
        } else {
            delete exampleSentences[cardId];
        }
        localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));
        
        updateDashboard();
        renderManageView();
        
        btn.innerHTML = "Changes Saved! " + ICONS.check;
        btn.style.background = "var(--accent)";
        btn.style.borderColor = "var(--accent)";
        btn.style.color = "#ffffff";
        
        setTimeout(() => {
            btn.innerHTML = oldText;
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.style.color = "";
            btn.disabled = false;
            switchView('manage');
        }, 1000);
    } else {
        console.error("Failed to update memory:", error);
        alert("Failed to update memory.");
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

// ------ Practice Logic ------

function startForcedPractice(count) {
    const now = Date.now();
    reviewQueue = cards.filter(c => c.nextReview <= now)
                       .sort((a, b) => a.nextReview - b.nextReview);
                       
    if (reviewQueue.length === 0) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
        return;
    }
    
    reviewQueue = reviewQueue.slice(0, count);
    currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'none';
    
    switchView('practice');
    renderCurrentCard();
}

function startPractice() {
    isForcedMode = false;
    const now = Date.now();
    const selectedType = document.getElementById('practice-type-select').value;
    reviewQueue = cards.filter(c => c.nextReview <= now && (selectedType === 'mixed' || c.type === selectedType))
                       .sort((a, b) => a.nextReview - b.nextReview); // Oldest due first
                       
    if (reviewQueue.length === 0) return;
    
    currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'block';
    
    switchView('practice');
    renderCurrentCard();
}

function renderCurrentCard() {
    const card = reviewQueue[currentReviewIndex];
    document.getElementById('practice-progress').textContent = currentReviewIndex + 1;
    
    const frontEl = document.getElementById('practice-front');
    const exerciseTitleEl = document.getElementById('practice-exercise-title');
    const backEl = document.getElementById('practice-back');
    const spellingArea = document.getElementById('spelling-indicator-area');

    let isMap = false;
    let mapData = null;
    try {
        if (card.front.startsWith('{"mode":"memory_map"')) {
            mapData = JSON.parse(card.front);
            isMap = true;
        }
    } catch (e) {}

    if (isMap || card.type === 'Memory Map') {
        exerciseTitleEl.textContent = "Recall the Memory Map";
        spellingArea.classList.add('hidden');
        
        frontEl.innerHTML = `
            <div class="practice-prompt-container" style="display: flex; flex-direction: column; gap: 12px; width: 100%; height: 100%;">
                <div class="practice-explanation" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); text-align: center;">
                    ${mapData ? mapData.title : 'Recall this Memory Map'}
                </div>
                <div id="practice-map-canvas-container" style="position: relative; width: 100%; height: 350px; background: var(--bg-secondary); border: 2px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: inset 0 -2px 0 var(--border-color); user-select: none;">
                    <div style="position: absolute; inset: 0; background-size: 20px 20px; background-image: radial-gradient(var(--border-color) 1px, transparent 0); opacity: 0.4; pointer-events: none;"></div>
                    <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;" id="practice-map-svg">
                        <defs>
                            <marker id="practice-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
                            </marker>
                        </defs>
                    </svg>
                    <div id="practice-map-nodes-container" style="position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2;"></div>
                </div>
            </div>
        `;
        
        if (mapData) {
            renderPracticeNodes('practice-map-nodes-container', mapData.nodes, mapData.links, 'practice-map-svg', 'practice-arrowhead');
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

    
    // Check if card has saved example sentences
    const savedSentences = exampleSentences[card.id];
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
        // Sentence blanking mode (Fill-in-the-blank style with potentially multiple numbered sentences)
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
        spellingArea.classList.add('hidden'); // Covered by inline boxes
    } else {
        // Standard question mode
        exerciseTitleEl.textContent = "Question";
        
        const explanationHtml = card.front.replace(/\n/g, '<br>');
        frontEl.innerHTML = `
            <div class="practice-explanation-only" style="font-size: 1.45rem; font-weight: 700; color: var(--text-primary); max-width: 100%; line-height: 1.5; word-break: normal; overflow-wrap: break-word; text-align: center; margin: auto 0;">
                ${explanationHtml}
            </div>
        `;
        
        // Show box hint if it is a single-word vocabulary card
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
    
    // Auto show/hide and autofocus based on spelling box presence
    const firstSpellingInput = document.querySelector('.letter-input');
    if (firstSpellingInput) {
        document.getElementById('practice-input').classList.add('hidden');
        setTimeout(() => {
            firstSpellingInput.focus();
        }, 50); // slight timeout to ensure element layout is rendered & interactive
    } else {
        document.getElementById('practice-input').classList.remove('hidden');
        document.getElementById('practice-input').focus();
    }
}

function blankOutWordInSentence(sentence, word, startIndex = 0) {
    if (!sentence || !word) return { html: '', nextIndex: startIndex };
    const targetWord = word.trim();
    if (!targetWord) return { html: sentence, nextIndex: startIndex };
    
    // Escape special regex characters in the target word
    const escapedWord = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Create regex matching the word case-insensitively at boundaries
    const regex = new RegExp('\\b' + escapedWord + '\\b', 'gi');
    
    let currentStartIndex = startIndex;
    let finalNextIndex = startIndex;
    
    const match = regex.exec(sentence);
    if (!match) {
        const simpleRegex = new RegExp(escapedWord, 'gi');
        const simpleMatch = simpleRegex.exec(sentence);
        if (!simpleMatch) {
            const boxesObj = renderBoxesForWord(targetWord, currentStartIndex);
            return {
                html: sentence + `<br><br><span class="letter-boxes-container inline">${boxesObj.html}</span>`,
                nextIndex: boxesObj.nextIndex
            };
        }
        let htmlResult = sentence.replace(simpleRegex, (matched) => {
            const boxesObj = renderBoxesForWord(matched, currentStartIndex);
            currentStartIndex = boxesObj.nextIndex;
            finalNextIndex = boxesObj.nextIndex;
            return boxesObj.html;
        });
        return { html: htmlResult, nextIndex: finalNextIndex };
    }
    
    regex.lastIndex = 0;
    let htmlResult = sentence.replace(regex, (matched) => {
        const boxesObj = renderBoxesForWord(matched, currentStartIndex);
        currentStartIndex = boxesObj.nextIndex;
        finalNextIndex = boxesObj.nextIndex;
        return boxesObj.html;
    });
    return { html: htmlResult, nextIndex: finalNextIndex };
}

function renderBoxesForWord(word, startIndex = 0) {
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

function renderSpellingBoxes(word) {
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

// Reconstruct spelling answer from individual input boxes
function getTypedSpellingAnswer(targetWord) {
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

// Reconstruct spelling answer from individual input boxes for multiple sentences
function getTypedAnswersForSentences(targetWord, sentencesCount) {
    const inputs = Array.from(document.querySelectorAll('.letter-input'));
    const typedWords = [];
    
    // Count how many letter inputs are needed for a single instance of the target word
    let letterInputsPerWord = 0;
    for (let i = 0; i < targetWord.length; i++) {
        const char = targetWord.charAt(i);
        if (!/\s/.test(char) && !/[.,\/#!$%\^&\*;:{}=\-_`~()]/g.test(char)) {
            letterInputsPerWord++;
        }
    }
    
    if (letterInputsPerWord === 0) return [targetWord];
    
    let inputIndex = 0;
    for (let s = 0; s < sentencesCount; s++) {
        let typed = '';
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
        typedWords.push(typed.trim());
    }
    return typedWords;
}

// Initialize delegated listeners for spelling inputs
function initSpellingInputListeners() {
    // Delegated input event for direct input letter squares
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

    // Delegated keydown event for backspace, arrows, and Enter
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
                document.getElementById('btn-submit-answer').click();
            }
        }
    });
}

// ------ Auto Grading Logic ------

// Simple Levenshtein distance for typo tolerance
function getEditDistance(a, b) {
  if (a.length === 0) return b.length; 
  if (b.length === 0) return a.length; 

  var matrix = [];

  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateMatchPercentage(typed, actual) {
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

function evaluateAnswer() {
    const card = reviewQueue[currentReviewIndex];
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
    
    // Retrieve example sentences to see how many we rendered
    const savedSentences = exampleSentences[card.id];
    let sentences = [];
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences;
        } else if (typeof savedSentences === 'string') {
            sentences = [savedSentences];
        }
    }

    if (isMap || card.type === 'Memory Map') {
        const practiceInputs = document.querySelectorAll('.practice-map-node-input');
        const enteredCount = Array.from(practiceInputs).filter(i => i.value.trim().length > 0).length;
        if (enteredCount === 0 && practiceInputs.length > 0) {
            alert("Please attempt to fill in the mind map before submitting!");
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
                
                const label = document.createElement('span');
                label.className = 'correct-answer-label';
                label.textContent = node.text;
                nodeEl.appendChild(label);
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
                const typedWords = getTypedAnswersForSentences(card.back.trim(), sentences.length);
                let allCorrect = true;
                let totalScore = 0;
                typedWords.forEach(word => {
                    const matchScore = calculateMatchPercentage(word, card.back);
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
        alert("Please attempt an answer before submitting!");
        return;
    }

    // Disable spelling inputs after submitting to lock the state
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

    applySM2Grade(gradeInt);

    // Show Evaluation
    document.getElementById('typing-area').classList.add('hidden');
    document.querySelector('.card-back').classList.remove('hidden'); // Reveal answer
    
    document.getElementById('eval-score').textContent = score + '%';
    const gradeSpan = document.getElementById('eval-grade');
    gradeSpan.textContent = gradeText;
    gradeSpan.style.color = gradeColor;
    
    // Manage Incorrect sentence collector logic
    const sentenceContainer = document.getElementById('incorrect-sentence-container');
    if (score < 75 && !(isMap || card.type === 'Memory Map')) {
        sentenceContainer.classList.remove('hidden');
        document.getElementById('incorrect-sentence-input').value = '';
        document.getElementById('incorrect-sentence-input').placeholder = `e.g. We are running ${card.back} on gas.`;
        document.getElementById('sentence-error-msg').classList.add('hidden');
        document.getElementById('btn-next-card').classList.add('hidden'); // Hide the Next Memory button on failure
    } else {
        sentenceContainer.classList.add('hidden');
        document.getElementById('btn-next-card').classList.remove('hidden'); // Show the Next Memory button on success
    }
    
    document.getElementById('evaluation-area').classList.remove('hidden');
}


// SM-2 Algorithm mapping based on grade
async function applySM2Grade(gradeInt) {
    const cardId = reviewQueue[currentReviewIndex].id;
    const cardIndexInGlobal = cards.findIndex(c => c.id === cardId);
    if (cardIndexInGlobal === -1) return;
    
    let card = cards[cardIndexInGlobal];
    
    if (gradeInt === 0) {
        card.repetitions = 0;
        card.interval = 1 / (24 * 60); // 1 minute
        card.ease = Math.max(1.3, card.ease - 0.2);
    } else {
        if (gradeInt === 1) { // Hard
            card.interval = Math.max(10 / (24 * 60), card.interval * 1.2); 
            card.ease = Math.max(1.3, card.ease - 0.15);
        } 
        else if (gradeInt === 2) { // Good
            if (card.repetitions === 0) card.interval = 10 / (24 * 60); 
            else if (card.repetitions === 1) card.interval = 0.5; 
            else if (card.repetitions === 2) card.interval = 1; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease));
        }
        else if (gradeInt === 3) { // Easy
            if (card.repetitions === 0) card.interval = 1; 
            else if (card.repetitions === 1) card.interval = 4; 
            else card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
            card.ease += 0.15;
        }
        card.repetitions += 1;
    }

    const MS_PER_DAY = 86400000;
    card.nextReview = Date.now() + (card.interval * MS_PER_DAY);

    // Sync to DB silently
    updateCardInDB(card);
}

// Incorrect answer example sentence saver
function saveIncorrectExampleSentence() {
    const card = reviewQueue[currentReviewIndex];
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
    
    // Save to local storage array
    const savedSentences = exampleSentences[card.id];
    let sentencesArray = [];
    if (Array.isArray(savedSentences)) {
        sentencesArray = [...savedSentences];
    } else if (typeof savedSentences === 'string') {
        sentencesArray = [savedSentences];
    }
    
    sentencesArray.push(sentenceText);
    exampleSentences[card.id] = sentencesArray;
    localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));
    
    errorMsg.innerHTML = "Sentence saved as memory clue! " + ICONS.check;
    errorMsg.style.color = "#34a853";
    errorMsg.classList.remove('hidden');
    
    saveBtn.disabled = true;
    setTimeout(() => {
        saveBtn.disabled = false;
        errorMsg.classList.add('hidden');
        // Hide the incorrect sentence collector since it's saved successfully
        document.getElementById('incorrect-sentence-container').classList.add('hidden');
        document.getElementById('btn-next-card').classList.remove('hidden'); // Show the Next Memory button!
    }, 1500);
}

function proceedToNextCard() {
    const flashcardEl = document.getElementById('active-card');
    flashcardEl.style.transform = 'translateY(-20px) scale(0.95)';
    flashcardEl.style.opacity = '0';
    
    setTimeout(() => {
        flashcardEl.style.transform = 'none';
        flashcardEl.style.opacity = '1';
        
        currentReviewIndex++;
        if (currentReviewIndex >= reviewQueue.length) {
            finishSession();
        } else {
            renderCurrentCard();
        }
    }, 300);
}

function finishSession() {
    updateDashboard(); // Re-calculate due
    document.getElementById('active-card').style.display = 'none';
    document.querySelector('.practice-controls').style.display = 'none';
    
    if (isForcedMode) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
    } else {
        const completedMsg = document.getElementById('practice-completed');
        completedMsg.innerHTML = `<h2>Session Complete</h2><p style="color: var(--text-secondary); margin-bottom: 24px;">Your brain is getting stronger.</p><button class="btn primary" id="btn-finish-practice">Back to Dashboard</button>`;
        document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));
        completedMsg.classList.remove('hidden');
    }
}

// ------ Example Sentences (Vocabulary Clues) Multi-Sentence Helpers ------

function validateExampleSentence(sentenceText, targetWordText) {
    if (!sentenceText || !targetWordText) return false;
    const targetWord = targetWordText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanSentence = sentenceText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    return cleanSentence.includes(targetWord);
}

function handleCreateAddSentence() {
    const sentenceInput = document.getElementById('create-new-sentence');
    const targetWordInput = document.getElementById('card-back');
    const errorSpan = document.getElementById('create-sentence-error');
    
    const sentenceText = sentenceInput.value.trim();
    const targetWord = targetWordInput.value.trim();
    
    if (!targetWord) {
        errorSpan.textContent = "Please specify a target word (Back) first!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!sentenceText) {
        errorSpan.textContent = "Please enter an example sentence!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!validateExampleSentence(sentenceText, targetWord)) {
        errorSpan.textContent = `The sentence must contain the target word "${targetWord}"!`;
        errorSpan.style.display = 'block';
        return;
    }
    
    errorSpan.style.display = 'none';
    draftCreateSentences.push(sentenceText);
    sentenceInput.value = '';
    renderCreateSentencesList();
}

function renderCreateSentencesList() {
    const listDiv = document.getElementById('create-sentences-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    draftCreateSentences.forEach((sentence, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.background = 'var(--bg-card)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = '8px';
        row.style.fontSize = '0.9rem';
        
        row.innerHTML = `
            <span style="flex: 1; margin-right: 10px; line-height: 1.4;">${sentence}</span>
            <button type="button" onclick="deleteDraftCreateSentence(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center;">${ICONS.closeSmall}</button>
        `;
        listDiv.appendChild(row);
    });
}

function deleteDraftCreateSentence(index) {
    draftCreateSentences.splice(index, 1);
    renderCreateSentencesList();
}

function handleEditAddSentence() {
    const sentenceInput = document.getElementById('edit-new-sentence');
    const targetWordInput = document.getElementById('edit-card-back');
    const errorSpan = document.getElementById('edit-sentence-error');
    
    const sentenceText = sentenceInput.value.trim();
    const targetWord = targetWordInput.value.trim();
    
    if (!targetWord) {
        errorSpan.textContent = "Please specify a target word (Back) first!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!sentenceText) {
        errorSpan.textContent = "Please enter an example sentence!";
        errorSpan.style.display = 'block';
        return;
    }
    
    if (!validateExampleSentence(sentenceText, targetWord)) {
        errorSpan.textContent = `The sentence must contain the target word "${targetWord}"!`;
        errorSpan.style.display = 'block';
        return;
    }
    
    errorSpan.style.display = 'none';
    editSentences.push(sentenceText);
    sentenceInput.value = '';
    renderEditSentencesList();
}

function renderEditSentencesList() {
    const listDiv = document.getElementById('edit-sentences-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    editSentences.forEach((sentence, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.background = 'var(--bg-card)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = '8px';
        row.style.fontSize = '0.9rem';
        
        row.innerHTML = `
            <span style="flex: 1; margin-right: 10px; line-height: 1.4;">${sentence}</span>
            <button type="button" onclick="deleteEditSentence(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 4px; display: inline-flex; align-items: center;">${ICONS.closeSmall}</button>
        `;
        listDiv.appendChild(row);
    });
}

function deleteEditSentence(index) {
    editSentences.splice(index, 1);
    renderEditSentencesList();
}

// ------ Memory Map Core Engine & Interactive Canvas Handlers ------

function getNodeBoundaryIntersection(src, tgt, w = 140, h = 55) {
    const cx = src.x + w / 2;
    const cy = src.y + h / 2;
    const tx = tgt.x + w / 2;
    const ty = tgt.y + h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const w2 = w / 2;
    const h2 = h / 2;
    let scale = 1;
    if (absDx * h2 > absDy * w2) {
        // Intersects left or right boundary
        scale = w2 / absDx;
    } else {
        // Intersects top or bottom boundary
        scale = h2 / absDy;
    }
    return {
        x: cx + dx * scale,
        y: cy + dy * scale
    };
}

let activeSelectedLink = null;

function hideLinkToolbar(container) {
    const existing = container.querySelector('.map-link-toolbar');
    if (existing) {
        existing.remove();
    }
    activeSelectedLink = null;
}

function showLinkToolbar(midX, midY, container, link, nodes, links, svgId, arrowheadId, containerId, isEdit) {
    // Hide any existing toolbar first
    hideLinkToolbar(container);
    
    activeSelectedLink = { link, svgId, containerId, nodes, links, arrowheadId, isEdit };
    
    const toolbar = document.createElement('div');
    toolbar.className = 'map-link-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.left = `${midX}px`;
    toolbar.style.top = `${midY - 45}px`; // Display 45px above
    toolbar.style.transform = 'translate(-50%, -100%)';
    toolbar.style.zIndex = '1000';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toolbar-close-btn';
    closeBtn.innerHTML = ICONS.closeSmall;
    closeBtn.style = 'position: absolute; right: 4px; top: 4px; border: none; background: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 2px;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideLinkToolbar(container);
    });
    toolbar.appendChild(closeBtn);

    // Label input
    const inputGroup = document.createElement('div');
    inputGroup.style = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; width: 100%;';
    
    const label = document.createElement('label');
    label.textContent = 'Connection Label';
    label.style = 'font-size: 0.65rem; color: var(--text-secondary); font-weight: 700;';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = link.label || '';
    input.placeholder = 'e.g. causes, belongs to...';
    input.className = 'toolbar-input';
    input.style = 'padding: 6px 8px; font-size: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;';
    
    input.addEventListener('input', (e) => {
        link.label = e.target.value;
        drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
    });
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    toolbar.appendChild(inputGroup);
    
    // Row for Color & Style & Delete
    const row = document.createElement('div');
    row.style = 'display: flex; justify-content: space-between; align-items: center; gap: 10px; width: 100%;';
    
    // Colors group
    const colorsDiv = document.createElement('div');
    colorsDiv.style = 'display: flex; gap: 4px;';
    const colorOptions = [
        { name: 'default', value: '' },
        { name: 'blue', value: '#3b82f6' },
        { name: 'green', value: '#22c55e' },
        { name: 'red', value: '#ef4444' },
        { name: 'orange', value: '#f97316' },
        { name: 'purple', value: '#a855f7' }
    ];
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `color-dot ${link.color === opt.value ? 'active' : ''}`;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-secondary)'}; transition: transform 0.1s;`;
        if (link.color === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
        }
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            link.color = opt.value;
            // Highlight active dot
            toolbar.querySelectorAll('.color-dot').forEach(d => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
            });
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        colorsDiv.appendChild(dot);
    });
    
    row.appendChild(colorsDiv);
    
    // Styles group
    const stylesDiv = document.createElement('div');
    stylesDiv.style = 'display: flex; gap: 4px; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden;';
    const styleOptions = [
        { name: 'Solid', value: 'solid' },
        { name: 'Dashed', value: 'dashed' },
        { name: 'Dotted', value: 'dotted' }
    ];
    styleOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.name[0]; // S, D, D
        btn.title = opt.name;
        btn.className = `style-btn ${(link.style || 'solid') === opt.value ? 'active' : ''}`;
        btn.style = `border: none; padding: 2px 6px; font-size: 0.65rem; cursor: pointer; background: ${(link.style || 'solid') === opt.value ? 'var(--accent)' : 'var(--bg-secondary)'}; color: ${(link.style || 'solid') === opt.value ? '#ffffff' : 'var(--text-primary)'}; font-weight: 700;`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            link.style = opt.value;
            // Update UI
            stylesDiv.querySelectorAll('.style-btn').forEach(b => {
                b.style.background = 'var(--bg-secondary)';
                b.style.color = 'var(--text-primary)';
            });
            btn.style.background = 'var(--accent)';
            btn.style.color = '#ffffff';
            
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        stylesDiv.appendChild(btn);
    });
    row.appendChild(stylesDiv);
    
    // Delete link button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'link-delete-btn';
    delBtn.innerHTML = ICONS.trash;
    delBtn.title = 'Delete Connection';
    delBtn.style = 'border: none; background: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; padding: 2px; transition: transform 0.1s;';
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this connection?")) {
            const idx = links.indexOf(link);
            if (idx !== -1) {
                links.splice(idx, 1);
            }
            hideLinkToolbar(container);
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        }
    });
    
    row.appendChild(delBtn);
    toolbar.appendChild(row);
    
    container.appendChild(toolbar);
}

function drawLinks(nodes, links, svgId, arrowheadId, interactive = false, containerId = null, isEdit = false) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    
    // Keep defs but clear everything else
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);
    
    links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        
        if (!src || !tgt) return;
        
        const sPt = getNodeBoundaryIntersection(src, tgt);
        const tPtRaw = getNodeBoundaryIntersection(tgt, src);
        
        const dx = tPtRaw.x - sPt.x;
        const dy = tPtRaw.y - sPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let tPt = tPtRaw;
        if (dist > 10) {
            const lux = dx / dist;
            const luy = dy / dist;
            // Offset 8px back so arrowhead marker doesn't overlap the border
            tPt = {
                x: tPtRaw.x - lux * 8,
                y: tPtRaw.y - luy * 8
            };
        }
        
        // Gorgeous Curved Cubic Bezier horizontal skew paths
        const cp1x = sPt.x + dx * 0.5;
        const cp1y = sPt.y;
        const cp2x = tPt.x - dx * 0.5;
        const cp2y = tPt.y;
        const pathData = `M ${sPt.x} ${sPt.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tPt.x} ${tPt.y}`;
        
        // Link stroke color
        const lineColor = link.color || 'var(--text-secondary)';
        
        // 1. Draw actual path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', `url(#${arrowheadId})`);
        path.style.opacity = '0.7';
        // Set color style so the arrowhead inherits it if set to currentColor
        path.style.color = lineColor;
        
        // Handle styles
        if (link.style === 'dashed') {
            path.setAttribute('stroke-dasharray', '6,4');
        } else if (link.style === 'dotted') {
            path.setAttribute('stroke-dasharray', '2,3');
        }
        
        svg.appendChild(path);
        
        // Compute Midpoint for labels & click events
        // Cubic bezier midpoint formula at t = 0.5
        const midX = 0.125 * sPt.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * tPt.x;
        const midY = 0.125 * sPt.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * tPt.y;
        
        // 2. Draw invisible thick stroke path for easy clicking/hovering
        if (interactive && containerId) {
            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            overlay.setAttribute('d', pathData);
            overlay.setAttribute('stroke', 'transparent');
            overlay.setAttribute('stroke-width', '12');
            overlay.setAttribute('fill', 'none');
            overlay.style.cursor = 'pointer';
            overlay.style.pointerEvents = 'stroke';
            
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                const container = document.getElementById(containerId);
                if (container) {
                    showLinkToolbar(midX, midY, container, link, nodes, links, svgId, arrowheadId, containerId, isEdit);
                }
            });
            svg.appendChild(overlay);
        }
        
        // 3. Draw connection label group if it exists
        if (link.label && link.label.trim().length > 0) {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.style.userSelect = 'none';
            if (interactive) {
                group.style.cursor = 'pointer';
            }
            
            // Mask rect
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const labelLength = link.label.length;
            const rWidth = Math.max(45, labelLength * 6.5 + 10);
            const rHeight = 18;
            rect.setAttribute('width', rWidth);
            rect.setAttribute('height', rHeight);
            rect.setAttribute('x', midX - rWidth / 2);
            rect.setAttribute('y', midY - rHeight / 2);
            rect.setAttribute('rx', '4');
            rect.setAttribute('ry', '4');
            rect.setAttribute('fill', 'var(--bg-card)');
            rect.setAttribute('stroke', 'var(--border-color)');
            rect.setAttribute('stroke-width', '1');
            
            // Text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY + 4);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', '700');
            text.setAttribute('fill', 'var(--text-primary)');
            text.textContent = link.label;
            
            group.appendChild(rect);
            group.appendChild(text);
            
            if (interactive && containerId) {
                group.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const container = document.getElementById(containerId);
                    if (container) {
                        showLinkToolbar(midX, midY, container, link, nodes, links, svgId, arrowheadId, containerId, isEdit);
                    }
                });
            }
            
            svg.appendChild(group);
        }
    });
}

function renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    // Draw links first so they are behind the nodes (interactive = true)
    drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
    
    nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'map-node';
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = '160px';
        nodeEl.style.height = '60px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.border = node.isRoot ? '2px solid var(--warning)' : '2px solid var(--border-color)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.padding = '4px';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.zIndex = '5';
        nodeEl.style.cursor = 'grab';
        
        // Node Header Row
        const headerEl = document.createElement('div');
        headerEl.style.display = 'flex';
        headerEl.style.justifyContent = 'space-between';
        headerEl.style.alignItems = 'center';
        headerEl.style.marginBottom = '2px';
        
        // 1. Root Toggle Button
        const rootBtn = document.createElement('button');
        rootBtn.type = 'button';
        rootBtn.className = `node-btn root-btn ${node.isRoot ? 'active' : ''}`;
        rootBtn.innerHTML = node.isRoot ? ICONS.crown : ICONS.circle;
        rootBtn.title = node.isRoot ? 'Root Node (Static)' : 'Set as Root Node';
        rootBtn.style.background = 'none';
        rootBtn.style.border = 'none';
        rootBtn.style.cursor = 'pointer';
        rootBtn.style.padding = '0';
        if (node.isRoot) {
            rootBtn.style.color = 'var(--warning)';
        }
        rootBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nodes.forEach(n => n.isRoot = false);
            node.isRoot = true;
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        // 2. Add Child Node Button (+)
        const addChildBtn = document.createElement('button');
        addChildBtn.type = 'button';
        addChildBtn.className = 'node-btn add-child-btn';
        addChildBtn.innerHTML = ICONS.plus;
        addChildBtn.title = 'Add Linked Child Node';
        addChildBtn.style.background = 'none';
        addChildBtn.style.border = 'none';
        addChildBtn.style.cursor = 'pointer';
        addChildBtn.style.padding = '0';
        addChildBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const childId = 'node_' + Date.now();
            const rect = container.getBoundingClientRect();
            
            // Auto position to the right with a small vertical offset
            const childNode = {
                id: childId,
                text: '',
                x: Math.max(0, Math.min(rect.width - 160, node.x + 180)),
                y: Math.max(0, Math.min(rect.height - 60, node.y + (Math.random() * 40 - 20))),
                isRoot: false
            };
            
            nodes.push(childNode);
            links.push({ source: node.id, target: childId });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        // 3. Select Icon Button (Smile)
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'node-btn icon-btn';
        iconBtn.innerHTML = ICONS.smile;
        iconBtn.title = 'Attach Icon to Concept';
        iconBtn.style.background = 'none';
        iconBtn.style.border = 'none';
        iconBtn.style.cursor = 'pointer';
        iconBtn.style.padding = '0';
        iconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const existingPicker = nodeEl.querySelector('.icon-picker-dropdown');
            if (existingPicker) {
                existingPicker.remove();
            } else {
                // Close other open icon pickers first
                container.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
                
                const picker = document.createElement('div');
                picker.className = 'icon-picker-dropdown';
                picker.style = 'position: absolute; top: 22px; left: 0; z-index: 1001; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 6px; width: 120px;';
                
                const availableIcons = ['star', 'idea', 'trophy', 'folder', 'pin', 'help', 'heart', 'gear', 'calendar'];
                
                // None / Remove Option
                const noneBtn = document.createElement('button');
                noneBtn.type = 'button';
                noneBtn.textContent = 'Remove';
                noneBtn.style = 'grid-column: span 4; font-size: 0.65rem; padding: 2px; border: none; background: var(--bg-secondary); color: var(--text-secondary); cursor: pointer; border-radius: 3px; font-weight: 700;';
                noneBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    delete node.icon;
                    renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
                });
                picker.appendChild(noneBtn);
                
                availableIcons.forEach(iconName => {
                    const optBtn = document.createElement('button');
                    optBtn.type = 'button';
                    optBtn.innerHTML = ICONS[iconName];
                    optBtn.style = 'background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: background 0.1s;';
                    optBtn.addEventListener('mouseenter', () => optBtn.style.background = 'var(--bg-secondary)');
                    optBtn.addEventListener('mouseleave', () => optBtn.style.background = 'none');
                    optBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        node.icon = iconName;
                        renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
                    });
                    picker.appendChild(optBtn);
                });
                
                nodeEl.appendChild(picker);
            }
        });
        
        // 4. Link Button
        const linkBtn = document.createElement('button');
        linkBtn.type = 'button';
        linkBtn.className = 'node-btn link-btn';
        const isLinkingSource = (linkingSourceNodeId === node.id);
        linkBtn.innerHTML = isLinkingSource ? ICONS.linkActive : ICONS.link;
        linkBtn.title = isLinkingSource ? 'Click target node to connect' : 'Link from this node';
        linkBtn.style.background = 'none';
        linkBtn.style.border = 'none';
        linkBtn.style.cursor = 'pointer';
        linkBtn.style.padding = '0';
        if (isLinkingSource) {
            linkBtn.style.color = 'var(--accent)';
            nodeEl.style.boxShadow = '0 0 8px var(--accent)';
        }
        linkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (linkingSourceNodeId === node.id) {
                linkingSourceNodeId = null;
            } else if (linkingSourceNodeId) {
                // Connect link
                const exists = links.some(l => l.source === linkingSourceNodeId && l.target === node.id);
                if (!exists && linkingSourceNodeId !== node.id) {
                    links.push({ source: linkingSourceNodeId, target: node.id });
                }
                linkingSourceNodeId = null;
            } else {
                linkingSourceNodeId = node.id;
            }
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        // 5. Delete Node Button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'node-btn delete-btn';
        deleteBtn.innerHTML = ICONS.close;
        deleteBtn.title = 'Delete Node';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.color = '#ef4444';
        deleteBtn.style.padding = '0';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Remove node
            const idx = nodes.findIndex(n => n.id === node.id);
            if (idx !== -1) {
                nodes.splice(idx, 1);
            }
            // Remove connected links
            const filteredLinks = links.filter(l => l.source !== node.id && l.target !== node.id);
            links.length = 0;
            filteredLinks.forEach(l => links.push(l));
            
            // Set root fallback if deleted root
            if (node.isRoot && nodes.length > 0) {
                nodes[0].isRoot = true;
            }
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        headerEl.appendChild(rootBtn);
        headerEl.appendChild(addChildBtn);
        headerEl.appendChild(iconBtn);
        headerEl.appendChild(linkBtn);
        headerEl.appendChild(deleteBtn);
        
        // Node Concept Input & Icon Container
        const bodyEl = document.createElement('div');
        bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box;';
        
        if (node.icon && ICONS[node.icon]) {
            const iconWrapper = document.createElement('span');
            iconWrapper.className = 'node-icon-wrapper';
            iconWrapper.style = 'display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; background: var(--bg-secondary); color: var(--accent); flex-shrink: 0;';
            iconWrapper.innerHTML = ICONS[node.icon];
            bodyEl.appendChild(iconWrapper);
        }
        
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'node-input';
        inputEl.value = node.text || '';
        inputEl.placeholder = 'Concept...';
        inputEl.style = 'flex: 1; border: none; background: rgba(0,0,0,0.02); border-radius: 4px; padding: 2px 4px; font-size: 0.8rem; color: var(--text-primary); box-sizing: border-box; font-family: inherit; text-align: center; width: 100%;';
        
        inputEl.addEventListener('input', (e) => {
            node.text = e.target.value;
        });
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                inputEl.blur();
            }
        });
        bodyEl.appendChild(inputEl);
        
        // Connect link when clicking node body in linking mode
        nodeEl.addEventListener('click', (e) => {
            if (linkingSourceNodeId && linkingSourceNodeId !== node.id) {
                e.stopPropagation();
                const exists = links.some(l => l.source === linkingSourceNodeId && l.target === node.id);
                if (!exists) {
                    links.push({ source: linkingSourceNodeId, target: node.id });
                }
                linkingSourceNodeId = null;
                renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
            }
        });
        
        // Drag Events
        let isDragging = false;
        let startX, startY;
        let startNodeX, startNodeY;
        
        nodeEl.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button' || e.target.closest('.icon-picker-dropdown')) {
                return;
            }
            e.preventDefault();
            isDragging = true;
            nodeEl.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            startNodeX = node.x;
            startNodeY = node.y;
            
            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                
                let nx = startNodeX + dx;
                let ny = startNodeY + dy;
                
                const rect = container.getBoundingClientRect();
                nx = Math.max(0, Math.min(rect.width - 160, nx));
                ny = Math.max(0, Math.min(rect.height - 60, ny));
                
                node.x = nx;
                node.y = ny;
                
                nodeEl.style.left = `${nx}px`;
                nodeEl.style.top = `${ny}px`;
                
                drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
            };
            
            const onMouseUp = () => {
                isDragging = false;
                nodeEl.style.cursor = 'grab';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        nodeEl.appendChild(headerEl);
        nodeEl.appendChild(bodyEl);
        
        container.appendChild(nodeEl);
    });
}

function initMapCanvasListeners() {
    // Creation elements
    const btnCreateAdd = document.getElementById('btn-create-map-add-node');
    if (btnCreateAdd) {
        btnCreateAdd.addEventListener('click', () => {
            const id = 'node_' + Date.now();
            createMapNodes.push({
                id: id,
                text: '',
                x: 80 + Math.random() * 80,
                y: 80 + Math.random() * 80,
                isRoot: createMapNodes.length === 0
            });
            renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
        });
    }
    
    const btnCreateClear = document.getElementById('btn-create-map-clear');
    if (btnCreateClear) {
        btnCreateClear.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the mind map canvas?")) {
                createMapNodes = [];
                createMapLinks = [];
                linkingSourceNodeId = null;
                renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
            }
        });
    }
    
    const createCanvas = document.getElementById('create-map-canvas-container');
    if (createCanvas) {
        createCanvas.addEventListener('dblclick', (e) => {
            if (e.target.id !== 'create-map-canvas-container' && e.target.id !== 'create-map-nodes-container') {
                return;
            }
            const rect = createCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left - 80;
            const y = e.clientY - rect.top - 30;
            const boundedX = Math.max(0, Math.min(rect.width - 160, x));
            const boundedY = Math.max(0, Math.min(rect.height - 60, y));
            
            const id = 'node_' + Date.now();
            createMapNodes.push({
                id: id,
                text: '',
                x: boundedX,
                y: boundedY,
                isRoot: createMapNodes.length === 0
            });
            renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
        });
        
        createCanvas.addEventListener('click', (e) => {
            if (e.target.id === 'create-map-canvas-container' || e.target.id === 'create-map-nodes-container' || e.target.id === 'create-map-svg') {
                hideLinkToolbar(createCanvas);
                createCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
            }
        });
    }
    
    // Editing elements
    const btnEditAdd = document.getElementById('btn-edit-map-add-node');
    if (btnEditAdd) {
        btnEditAdd.addEventListener('click', () => {
            const id = 'node_' + Date.now();
            editMapNodes.push({
                id: id,
                text: '',
                x: 80 + Math.random() * 80,
                y: 80 + Math.random() * 80,
                isRoot: editMapNodes.length === 0
            });
            renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        });
    }
    
    const btnEditClear = document.getElementById('btn-edit-map-clear');
    if (btnEditClear) {
        btnEditClear.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the mind map canvas?")) {
                editMapNodes = [];
                editMapLinks = [];
                linkingSourceNodeId = null;
                renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
            }
        });
    }
    
    const editCanvas = document.getElementById('edit-map-canvas-container');
    if (editCanvas) {
        editCanvas.addEventListener('dblclick', (e) => {
            if (e.target.id !== 'edit-map-canvas-container' && e.target.id !== 'edit-map-nodes-container') {
                return;
            }
            const rect = editCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left - 80;
            const y = e.clientY - rect.top - 30;
            const boundedX = Math.max(0, Math.min(rect.width - 160, x));
            const boundedY = Math.max(0, Math.min(rect.height - 60, y));
            
            const id = 'node_' + Date.now();
            editMapNodes.push({
                id: id,
                text: '',
                x: boundedX,
                y: boundedY,
                isRoot: editMapNodes.length === 0
            });
            renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        });
        
        editCanvas.addEventListener('click', (e) => {
            if (e.target.id === 'edit-map-canvas-container' || e.target.id === 'edit-map-nodes-container' || e.target.id === 'edit-map-svg') {
                hideLinkToolbar(editCanvas);
                editCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
            }
        });
    }
}

function renderPracticeNodes(containerId, nodes, links, svgId, arrowheadId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    // Draw links (interactive = false)
    drawLinks(nodes, links, svgId, arrowheadId, false);
    
    nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'map-node';
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = '160px';
        nodeEl.style.height = '60px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.alignItems = 'center';
        nodeEl.style.justifyContent = 'center';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.padding = '6px';
        nodeEl.style.zIndex = '5';
        
        if (node.isRoot) {
            nodeEl.style.border = '2px solid var(--warning)';
            nodeEl.style.fontWeight = '700';
            nodeEl.style.color = 'var(--text-primary)';
            
            const badge = document.createElement('span');
            badge.style = 'font-size: 0.7rem; color: var(--warning); margin-bottom: 2px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px;';
            badge.innerHTML = `${ICONS.crown} ROOT`;
            
            const textSpan = document.createElement('span');
            textSpan.style = 'font-size: 0.85rem; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 4px;';
            
            if (node.icon && ICONS[node.icon]) {
                textSpan.innerHTML = `<span style="display:inline-flex; width:14px; height:14px; color:var(--accent); align-items:center; justify-content:center;">${ICONS[node.icon]}</span> <span>${node.text || ''}</span>`;
            } else {
                textSpan.textContent = node.text || '';
            }
            
            nodeEl.appendChild(badge);
            nodeEl.appendChild(textSpan);
        } else {
            nodeEl.style.border = '2px solid var(--border-color)';
            
            const bodyEl = document.createElement('div');
            bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box;';
            
            if (node.icon && ICONS[node.icon]) {
                const iconWrapper = document.createElement('span');
                iconWrapper.className = 'node-icon-wrapper';
                iconWrapper.style = 'display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; background: var(--bg-secondary); color: var(--accent); flex-shrink: 0;';
                iconWrapper.innerHTML = ICONS[node.icon];
                bodyEl.appendChild(iconWrapper);
            }
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'practice-map-node-input';
            input.placeholder = 'Type concept...';
            input.dataset.nodeId = node.id;
            input.style = 'flex: 1; border: none; border-bottom: 2px dashed var(--border-color); background: transparent; text-align: center; font-size: 0.8rem; color: var(--text-primary); font-family: inherit; font-weight: 700; box-sizing: border-box; padding: 2px 0; width: 100%;';
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('btn-submit-answer').click();
                }
            });
            
            bodyEl.appendChild(input);
            nodeEl.appendChild(bodyEl);
        }
        
        container.appendChild(nodeEl);
    });
}

