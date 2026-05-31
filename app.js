import { state } from './modules/state.js';
import { supabase } from './modules/supabaseClient.js';
import { playUISound, initSoundSystem } from './modules/sound.js';
import {
    initThemeSystem,
    initNavigation,
    switchView,
    updateUserAvatarBadge,
    initProfileMenu
} from './modules/navigation.js';
import {
    loadData,
    handleCreateCard,
    handleEditCardSubmit,
    handleCreateAddSentence,
    handleEditAddSentence
} from './modules/flashcardCrud.js';
import {
    startPractice,
    startForcedPractice,
    evaluateAnswer,
    proceedToNextCard,
    saveIncorrectExampleSentence,
    initSpellingInputListeners
} from './modules/practice.js';
import {
    updateDashboard,
    handleTypeSelectChange
} from './modules/dashboard.js';
import {
    setCreateMapZoom,
    setEditMapZoom,
    toggleFullscreen,
    toggleGridSnapping,
    initMapCanvasListeners,
    renderEditorNodes
} from './modules/canvas.js';

// Bind necessary functions to window for DOM/inline event listeners
window.switchView = switchView;
window.startPractice = startPractice;

async function checkAuth() {
    if (!supabase) return;
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
        state.userSession = session;
        updateUserAvatarBadge();
        
        try {
            const cached = localStorage.getItem('cached_cards');
            if (cached) {
                state.cards = JSON.parse(cached) || [];
                updateDashboard();
            }
        } catch (e) {
            console.warn("Failed to load cached cards on startup:", e);
        }
        
        await loadData();
        handleSessionStart();
    } else {
        state.userSession = null;
        document.getElementById('nav-buttons').classList.add('hidden');
        switchView('auth');
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session && !state.userSession) {
            state.userSession = session;
            updateUserAvatarBadge();
            
            try {
                const cached = localStorage.getItem('cached_cards');
                if (cached) {
                    state.cards = JSON.parse(cached) || [];
                    updateDashboard();
                }
            } catch (e) {
                console.warn("Failed to load cached cards on auth change:", e);
            }
            
            await loadData();
            handleSessionStart();
        } else if (!session && state.userSession) {
            state.userSession = null;
            document.getElementById('nav-buttons').classList.add('hidden');
            switchView('auth');
        }
    });
}

function handleSessionStart() {
    const urlParams = new URLSearchParams(window.location.search);
    const forcedCount = parseInt(urlParams.get('forcedReview'));
    
    if (!isNaN(forcedCount) && forcedCount > 0) {
        state.isForcedMode = true;
        document.getElementById('nav-buttons').classList.add('hidden');
        startForcedPractice(forcedCount);
    } else {
        state.isForcedMode = false;
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
    }
}

async function handleLogin() {
    if (!supabase) return await window.alert("Supabase URL and Key are required in app.js");
    supabase.auth.signInWithOAuth({ provider: 'google' });
}

async function handleLogout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
}

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    initThemeSystem();
    initSoundSystem();
    initNavigation();
    initProfileMenu();
    
    // Auth events
    document.getElementById('btn-google-login').addEventListener('click', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Bind form events
    document.getElementById('create-card-form').addEventListener('submit', handleCreateCard);
    document.getElementById('edit-card-form').addEventListener('submit', handleEditCardSubmit);
    
    // Practice events
    document.getElementById('btn-practice').addEventListener('click', () => startPractice(false));
    document.getElementById('btn-submit-answer').addEventListener('click', evaluateAnswer);
    document.getElementById('btn-next-card').addEventListener('click', proceedToNextCard);
    document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));

    // Global Enter key handler for Practice Mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const viewPractice = document.getElementById('view-practice');
            if (viewPractice && !viewPractice.classList.contains('hidden')) {
                if (e.target.closest('#settings-modal') || e.target.closest('#settings-sidebar')) {
                    return;
                }
                
                const completedArea = document.getElementById('practice-completed');
                if (completedArea && !completedArea.classList.contains('hidden')) {
                    e.preventDefault();
                    document.getElementById('btn-finish-practice').click();
                    return;
                }
                
                const evalArea = document.getElementById('evaluation-area');
                if (evalArea && !evalArea.classList.contains('hidden')) {
                    if (e.target.id === 'incorrect-sentence-input') {
                        e.preventDefault();
                        document.getElementById('btn-save-sentence').click();
                        return;
                    }
                    e.preventDefault();
                    document.getElementById('btn-next-card').click();
                    return;
                }
                
                const btnSubmit = document.getElementById('btn-submit-answer');
                if (btnSubmit && !btnSubmit.classList.contains('hidden')) {
                    e.preventDefault();
                    btnSubmit.click();
                    return;
                }
            }
        }
    });

    document.getElementById('card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('edit-card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('practice-type-select').addEventListener('change', updateDashboard);
    
    const manageSelect = document.getElementById('manage-type-select');
    if (manageSelect) {
        manageSelect.addEventListener('change', () => {
            if (window.renderManageView) window.renderManageView();
        });
    }
    const manageSearch = document.getElementById('manage-search-input');
    if (manageSearch) {
        manageSearch.addEventListener('input', () => {
            if (window.renderManageView) window.renderManageView();
        });
    }

    initSpellingInputListeners();

    document.getElementById('btn-save-sentence').addEventListener('click', saveIncorrectExampleSentence);

    const btnCreateAdd = document.getElementById('btn-create-add-sentence');
    if (btnCreateAdd) btnCreateAdd.addEventListener('click', handleCreateAddSentence);
    const btnEditAdd = document.getElementById('btn-edit-add-sentence');
    if (btnEditAdd) btnEditAdd.addEventListener('click', handleEditAddSentence);

    initMapCanvasListeners();

    // Bind Zoom Control click listeners
    const btnCreateZoomIn = document.getElementById('btn-create-zoom-in');
    if (btnCreateZoomIn) btnCreateZoomIn.addEventListener('click', () => setCreateMapZoom(state.createMapZoom + 0.1));
    const btnCreateZoomOut = document.getElementById('btn-create-zoom-out');
    if (btnCreateZoomOut) btnCreateZoomOut.addEventListener('click', () => setCreateMapZoom(state.createMapZoom - 0.1));
    const btnCreateZoomReset = document.getElementById('btn-create-zoom-reset');
    if (btnCreateZoomReset) btnCreateZoomReset.addEventListener('click', () => setCreateMapZoom(1.0));
    const btnCreateFullscreen = document.getElementById('btn-create-fullscreen');
    if (btnCreateFullscreen) {
        btnCreateFullscreen.addEventListener('click', () => toggleFullscreen('create-map-canvas-container', 'btn-create-fullscreen'));
    }
    const btnCreateClose = document.querySelector('#create-map-canvas-container .fullscreen-close-btn');
    if (btnCreateClose) {
        btnCreateClose.addEventListener('click', () => toggleFullscreen('create-map-canvas-container', 'btn-create-fullscreen'));
    }
    const btnCreateGrid = document.getElementById('btn-create-grid');
    if (btnCreateGrid) {
        btnCreateGrid.addEventListener('click', toggleGridSnapping);
    }

    const btnEditZoomIn = document.getElementById('btn-edit-zoom-in');
    if (btnEditZoomIn) btnEditZoomIn.addEventListener('click', () => setEditMapZoom(state.editMapZoom + 0.1));
    const btnEditZoomOut = document.getElementById('btn-edit-zoom-out');
    if (btnEditZoomOut) btnEditZoomOut.addEventListener('click', () => setEditMapZoom(state.editMapZoom - 0.1));
    const btnEditZoomReset = document.getElementById('btn-edit-zoom-reset');
    if (btnEditZoomReset) btnEditZoomReset.addEventListener('click', () => setEditMapZoom(1.0));
    const btnEditFullscreen = document.getElementById('btn-edit-fullscreen');
    if (btnEditFullscreen) {
        btnEditFullscreen.addEventListener('click', () => toggleFullscreen('edit-map-canvas-container', 'btn-edit-fullscreen'));
    }
    const btnEditClose = document.querySelector('#edit-map-canvas-container .fullscreen-close-btn');
    if (btnEditClose) {
        btnEditClose.addEventListener('click', () => toggleFullscreen('edit-map-canvas-container', 'btn-edit-fullscreen'));
    }
    const btnEditGrid = document.getElementById('btn-edit-grid');
    if (btnEditGrid) {
        btnEditGrid.addEventListener('click', toggleGridSnapping);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.linkingSourceNodeId) {
                state.linkingSourceNodeId = null;
                state.linkingSourceSide = null;
                if (!document.getElementById('view-create').classList.contains('hidden')) {
                    renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
                } else if (!document.getElementById('view-edit').classList.contains('hidden')) {
                    renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
                }
                return;
            }

            const nodeToolbar = document.querySelector('.map-node-toolbar');
            const linkToolbar = document.querySelector('.map-link-toolbar');
            const iconPickers = document.querySelectorAll('.icon-picker-dropdown');
            
            if (nodeToolbar || linkToolbar || iconPickers.length > 0) {
                if (nodeToolbar) nodeToolbar.remove();
                if (linkToolbar) linkToolbar.remove();
                iconPickers.forEach(p => p.remove());
                return;
            }

            const fullscreens = document.querySelectorAll('.canvas-container-fullscreen');
            if (fullscreens.length > 0) {
                fullscreens.forEach(el => {
                    el.classList.remove('canvas-container-fullscreen');
                    if (el._originalParent) {
                        el._originalParent.insertBefore(el, el._originalNextSibling);
                    }
                });
                const btns = document.querySelectorAll('.zoom-ctrl-btn.fullscreen-active');
                btns.forEach(btn => {
                    btn.classList.remove('fullscreen-active');
                    btn.title = "Toggle Fullscreen";
                });
                document.body.style.overflow = '';
            }
        }
    });

    if (supabase) {
        checkAuth();
    }
});
