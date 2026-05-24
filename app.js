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
    calendar: `<svg viewBox="0 0 24 24" class="icon-svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" style="vertical-align: middle; display: inline-block; pointer-events: none;"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19H5C6.10457 19 7 18.1046 7 17C7 15.8954 7.89543 15 9 15H10C11.1046 15 12 15.8954 12 17V22Z"></path><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"></circle><circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"></circle><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"></circle></svg>`
};

const fontSizeMap = {
    small: { keyword: '0.7rem', exp: '0.65rem' },
    medium: { keyword: '0.8rem', exp: '0.75rem' },
    large: { keyword: '1.0rem', exp: '0.85rem' },
    xl: { keyword: '1.2rem', exp: '0.95rem' }
};

let cards = [];
let customTypes = JSON.parse(localStorage.getItem('customTypes')) || ['mixed', 'Vocabulary', 'Memory Map'];
// Filter out lowercase vocabulary type to migrate to capitalized Vocabulary
customTypes = customTypes.filter(t => t !== 'vocabulary');
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
let linkingSourceSide = null;
let linkingMousePos = { x: 0, y: 0 };

// Global Canvas Zoom States
let createMapZoom = 1.0;
let editMapZoom = 1.0;
let mapGridActive = false;
let practiceMapZoom = 1.0;

let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playUISound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        
        if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Ultra-short, elegant high-frequency haptic haptic tick/pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
            
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            
            osc.start(now);
            osc.stop(now + 0.015);
        } else if (type === 'tooltip') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.012);
            
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
            
            osc.start(now);
            osc.stop(now + 0.012);
        } else if (type === 'success') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.15, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'fail') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(164.81, now); // E3
            osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.2); // C3
            
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'complete') {
            const notes = [261.63, 329.63, 392.00, 523.25];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                
                gain.gain.setValueAtTime(0.0, now + idx * 0.08);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
                
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.3);
            });
        }
    } catch (e) {
        console.warn("Failed to play synthesized sound:", e);
    }
}

function showAlert(message) {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p>${message}</p>
                </div>
                <div class="custom-modal-footer">
                    <button class="btn primary modal-ok-btn" style="min-width: 100px;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        void modal.offsetWidth;
        modal.classList.add('active');
        
        const close = () => {
            modal.classList.remove('active');
            modal.querySelector('.custom-modal-content').classList.remove('animate-pop-in');
            modal.querySelector('.custom-modal-content').classList.add('animate-pop-out');
            setTimeout(() => {
                modal.remove();
                resolve();
            }, 200);
        };
        
        modal.querySelector('.modal-ok-btn').addEventListener('click', close);
        
        const handleKey = (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', handleKey);
                close();
            }
        };
        document.addEventListener('keydown', handleKey);
    });
}

function showConfirm(message) {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p>${message}</p>
                </div>
                <div class="custom-modal-footer" style="display: flex; gap: 12px; justify-content: center; width: 100%;">
                    <button class="btn modal-cancel-btn" style="flex: 1; background: var(--bg-secondary); color: var(--text-primary); border: 2px solid var(--border-color);">Cancel</button>
                    <button class="btn primary modal-confirm-btn" style="flex: 1;">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        void modal.offsetWidth;
        modal.classList.add('active');
        
        const close = (result) => {
            modal.classList.remove('active');
            modal.querySelector('.custom-modal-content').classList.remove('animate-pop-in');
            modal.querySelector('.custom-modal-content').classList.add('animate-pop-out');
            setTimeout(() => {
                modal.remove();
                resolve(result);
            }, 200);
        };
        
        modal.querySelector('.modal-confirm-btn').addEventListener('click', () => close(true));
        modal.querySelector('.modal-cancel-btn').addEventListener('click', () => close(false));
        
        const handleKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.removeEventListener('keydown', handleKey);
                close(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', handleKey);
                close(false);
            }
        };
        document.addEventListener('keydown', handleKey);
    });
}

function showPrompt(message, defaultValue = '') {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p style="margin-bottom: 12px; font-weight: 700;">${message}</p>
                    <input type="text" class="custom-modal-prompt-input" value="${defaultValue}" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: border-color 0.15s ease;">
                </div>
                <div class="custom-modal-footer" style="display: flex; gap: 12px; justify-content: center; width: 100%; margin-top: 16px;">
                    <button class="btn modal-cancel-btn" style="flex: 1; background: var(--bg-secondary); color: var(--text-primary); border: 2px solid var(--border-color);">Cancel</button>
                    <button class="btn primary modal-ok-btn" style="flex: 1;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const inputEl = modal.querySelector('.custom-modal-prompt-input');
        
        // Focus the input field automatically
        setTimeout(() => {
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            }
        }, 50);
        
        void modal.offsetWidth;
        modal.classList.add('active');
        
        const close = (result) => {
            modal.classList.remove('active');
            modal.querySelector('.custom-modal-content').classList.remove('animate-pop-in');
            modal.querySelector('.custom-modal-content').classList.add('animate-pop-out');
            setTimeout(() => {
                modal.remove();
                resolve(result);
            }, 200);
        };
        
        modal.querySelector('.modal-ok-btn').addEventListener('click', () => close(inputEl.value));
        modal.querySelector('.modal-cancel-btn').addEventListener('click', () => close(null));
        
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                close(inputEl.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close(null);
            }
        });
        
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', handleKey);
                close(null);
            }
        };
        document.addEventListener('keydown', handleKey);
    });
}

window.alert = showAlert;
window.confirm = showConfirm;
window.prompt = showPrompt;

function initSoundSystem() {
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    if (!btnSoundToggle) return;
    
    const onIcon = btnSoundToggle.querySelector('.sound-icon-on');
    const offIcon = btnSoundToggle.querySelector('.sound-icon-off');
    
    const updateSoundUI = () => {
        if (soundEnabled) {
            onIcon.classList.remove('hidden');
            offIcon.classList.add('hidden');
        } else {
            onIcon.classList.add('hidden');
            offIcon.classList.remove('hidden');
        }
    };
    
    updateSoundUI();
    
    btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEnabled = !soundEnabled;
        localStorage.setItem('soundEnabled', soundEnabled);
        updateSoundUI();
        if (soundEnabled) {
            playUISound('click');
        }
    });

    // Global capture-phase click listener for micro-interaction sounds
    document.addEventListener('click', (e) => {
        const interactive = e.target.closest('button, .btn, .nav-btn, .header-icon-btn, [role="button"], .user-avatar, .card-type-tab, .node-btn, .toolbar-close-btn, .link-toolbar-btn, .color-swatch');
        if (interactive) {
            if (interactive.id === 'btn-sound-toggle') {
                return;
            }
            playUISound('click');
        }
    }, true);
}

function setCreateMapZoom(level) {
    createMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('create-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${createMapZoom})`;
    }
    const label = document.getElementById('create-zoom-label');
    if (label) {
        label.textContent = `${Math.round(createMapZoom * 100)}%`;
    }
}

function setEditMapZoom(level) {
    editMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('edit-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${editMapZoom})`;
    }
    const label = document.getElementById('edit-zoom-label');
    if (label) {
        label.textContent = `${Math.round(editMapZoom * 100)}%`;
    }
}

function setPracticeMapZoom(level) {
    practiceMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('practice-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${practiceMapZoom})`;
        adjustPracticeViewportCentering();
    }
    const label = document.getElementById('practice-zoom-label');
    if (label) {
        label.textContent = `${Math.round(practiceMapZoom * 100)}%`;
    }
}

function adjustPracticeViewportCentering(viewportWidth, viewportHeight) {
    const viewport = document.getElementById('practice-map-viewport');
    const scrollContainer = document.getElementById('practice-map-canvas-container');
    if (!viewport || !scrollContainer) return;
    
    if (viewportWidth !== undefined && viewportHeight !== undefined) {
        viewport.dataset.originalWidth = viewportWidth;
        viewport.dataset.originalHeight = viewportHeight;
    } else {
        viewportWidth = parseFloat(viewport.dataset.originalWidth) || parseFloat(viewport.style.width) || 2500;
        viewportHeight = parseFloat(viewport.dataset.originalHeight) || parseFloat(viewport.style.height) || 2000;
    }
    
    const containerWidth = scrollContainer.clientWidth || 400;
    const containerHeight = scrollContainer.clientHeight || 400;
    
    const scaledWidth = viewportWidth * practiceMapZoom;
    const scaledHeight = viewportHeight * practiceMapZoom;
    
    const leftMargin = Math.max(0, (containerWidth - scaledWidth) / 2);
    const topMargin = Math.max(0, (containerHeight - scaledHeight) / 2);
    
    viewport.style.left = `${leftMargin}px`;
    viewport.style.top = `${topMargin}px`;
    
    // Auto-scroll to center if larger
    if (scaledWidth > containerWidth) {
        scrollContainer.scrollLeft = (scaledWidth - containerWidth) / 2;
    }
    if (scaledHeight > containerHeight) {
        scrollContainer.scrollTop = (scaledHeight - containerHeight) / 2;
    }
}

function toggleFullscreen(containerId, buttonId) {
    const container = document.getElementById(containerId);
    const btn = document.getElementById(buttonId);
    if (!container || !btn) return;
    
    const isFullscreen = container.classList.toggle('canvas-container-fullscreen');
    
    const closeBtn = container.querySelector('.fullscreen-close-btn');
    if (isFullscreen) {
        // Save original parent and next sibling to restore position on exit
        container._originalParent = container.parentNode;
        container._originalNextSibling = container.nextSibling;
        
        // Append to body so it displays outside of any transformed/absolute parents
        document.body.appendChild(container);
        
        btn.classList.add('fullscreen-active');
        btn.title = "Exit Fullscreen";
        if (closeBtn) closeBtn.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        // Restore to its original spot in the form
        if (container._originalParent) {
            container._originalParent.insertBefore(container, container._originalNextSibling);
        }
        
        btn.classList.remove('fullscreen-active');
        btn.title = "Toggle Fullscreen";
        if (closeBtn) closeBtn.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function updateGridButtonsUI() {
    const createBtn = document.getElementById('btn-create-grid');
    const editBtn = document.getElementById('btn-edit-grid');
    if (mapGridActive) {
        if (createBtn) createBtn.classList.add('grid-active');
        if (editBtn) editBtn.classList.add('grid-active');
    } else {
        if (createBtn) createBtn.classList.remove('grid-active');
        if (editBtn) editBtn.classList.remove('grid-active');
    }
}

function toggleGridSnapping() {
    mapGridActive = !mapGridActive;
    updateGridButtonsUI();
    
    if (mapGridActive) {
        createMapNodes.forEach(node => {
            node.x = Math.round(node.x / 20) * 20;
            node.y = Math.round(node.y / 20) * 20;
        });
        editMapNodes.forEach(node => {
            node.x = Math.round(node.x / 20) * 20;
            node.y = Math.round(node.y / 20) * 20;
        });
    }
    
    renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
    renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
}

// Initialize app
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
    document.getElementById('btn-practice').addEventListener('click', startPractice);
    document.getElementById('btn-submit-answer').addEventListener('click', evaluateAnswer);
    document.getElementById('btn-next-card').addEventListener('click', proceedToNextCard);
    document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));

    document.getElementById('card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('edit-card-type').addEventListener('change', handleTypeSelectChange);
    document.getElementById('practice-type-select').addEventListener('change', updateDashboard);
    const manageSelect = document.getElementById('manage-type-select');
    if (manageSelect) {
        manageSelect.addEventListener('change', renderManageView);
    }
    const manageSearch = document.getElementById('manage-search-input');
    if (manageSearch) {
        manageSearch.addEventListener('input', renderManageView);
    }
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

    // Bind Zoom Control click listeners
    const btnCreateZoomIn = document.getElementById('btn-create-zoom-in');
    if (btnCreateZoomIn) btnCreateZoomIn.addEventListener('click', () => setCreateMapZoom(createMapZoom + 0.1));
    const btnCreateZoomOut = document.getElementById('btn-create-zoom-out');
    if (btnCreateZoomOut) btnCreateZoomOut.addEventListener('click', () => setCreateMapZoom(createMapZoom - 0.1));
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
    if (btnEditZoomIn) btnEditZoomIn.addEventListener('click', () => setEditMapZoom(editMapZoom + 0.1));
    const btnEditZoomOut = document.getElementById('btn-edit-zoom-out');
    if (btnEditZoomOut) btnEditZoomOut.addEventListener('click', () => setEditMapZoom(editMapZoom - 0.1));
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
    updateGridButtonsUI();

    // Cancel active linking mode, close settings toolbars, or exit fullscreens on Escape click
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // 1. If actively drawing a connection/link, cancel it first
            if (linkingSourceNodeId) {
                linkingSourceNodeId = null;
                linkingSourceSide = null;
                if (!document.getElementById('view-create').classList.contains('hidden')) {
                    renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
                } else if (!document.getElementById('view-edit').classList.contains('hidden')) {
                    renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
                }
                return; // Stop here!
            }

            // 2. If any settings popup, link toolbar, or icon picker is open, close them next
            const nodeToolbar = document.querySelector('.map-node-toolbar');
            const linkToolbar = document.querySelector('.map-link-toolbar');
            const iconPickers = document.querySelectorAll('.icon-picker-dropdown');
            
            if (nodeToolbar || linkToolbar || iconPickers.length > 0) {
                if (nodeToolbar) nodeToolbar.remove();
                if (linkToolbar) linkToolbar.remove();
                iconPickers.forEach(p => p.remove());
                activeSelectedNode = null;
                activeSelectedLink = null;
                return; // Stop here!
            }

            // 3. Otherwise (or on second Escape press), exit fullscreen if active
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

        const dropdownEmail = document.getElementById('user-dropdown-email');
        if (dropdownEmail) dropdownEmail.textContent = email;

        const settingsEmail = document.getElementById('settings-email');
        if (settingsEmail) settingsEmail.textContent = email;

        const settingsAvatar = document.getElementById('settings-avatar');
        if (settingsAvatar) settingsAvatar.textContent = initial;
        
        const settingsStatCount = document.getElementById('settings-stat-count');
        if (settingsStatCount) settingsStatCount.textContent = cards.length;
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

async function handleLogin() {
    if (!supabase) return await alert("Supabase URL and Key are required in app.js");
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
        
        // Populate exampleSentences from backend example_sentences column
        cards.forEach(card => {
            if (card.example_sentences) {
                exampleSentences[card.id] = card.example_sentences;
            } else {
                // Backwards compatibility/fallback to local storage if not in DB yet
                if (!exampleSentences[card.id]) {
                    exampleSentences[card.id] = [];
                }
            }
        });
        localStorage.setItem('exampleSentences', JSON.stringify(exampleSentences));
        
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
    // Hide any active explanation tooltips
    hideExplanationTooltip();

    // Reset any active fullscreen canvas containers when switching views
    const fullscreens = document.querySelectorAll('.canvas-container-fullscreen');
    fullscreens.forEach(el => {
        el.classList.remove('canvas-container-fullscreen');
        const closeBtn = el.querySelector('.fullscreen-close-btn');
        if (closeBtn) closeBtn.classList.add('hidden');
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

    const exerciseTitleEl = document.getElementById('practice-exercise-title');
    if (exerciseTitleEl) exerciseTitleEl.style.display = '';

    const activeCard = document.getElementById('active-card');
    if (activeCard) {
        activeCard.style.height = '';
        const cardFront = activeCard.querySelector('.card-front');
        if (cardFront) cardFront.style.padding = '';
        const cardBack = activeCard.querySelector('.card-back');
        if (cardBack) cardBack.style.padding = '';
    }

    if (viewId === 'auth') {
        document.body.classList.add('logged-out');
        document.body.classList.remove('logged-in');
        
        const nav = document.getElementById('nav-buttons');
        if (nav) nav.classList.add('hidden');
    } else {
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
        
        const nav = document.getElementById('nav-buttons');
        if (nav) nav.classList.remove('hidden');
    }

    document.querySelectorAll('.view').forEach(v => {
        if (!v.classList.contains('hidden')) {
            v.style.opacity = '0';
            v.style.transform = 'translateY(10px) scale(0.995)';
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
        target.style.transform = 'translateY(0) scale(1)';
        
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
            
            // Default select type to 'Vocabulary'
            const cardTypeSelect = document.getElementById('card-type');
            if (cardTypeSelect) {
                cardTypeSelect.value = 'Vocabulary';
                // Trigger change toggle dynamically
                handleTypeSelectChange({ target: cardTypeSelect });
            }
            
            document.getElementById('card-front').focus();
        }
        if (viewId === 'manage') {
            const searchInput = document.getElementById('manage-search-input');
            if (searchInput) searchInput.value = '';
            renderManageView();
        }
    }, 300);
}

async function removeType(typeToRemove) {
    if (typeToRemove === 'mixed') return;
    if (!await confirm(`Are you sure you want to delete the "${typeToRemove}" type? All cards with this type will be reassigned to "All Types".`)) return;
    
    if (userSession) {
        const { error } = await supabase
            .from('flashcards')
            .update({ type: 'mixed' })
            .eq('type', typeToRemove)
            .eq('user_id', userSession.user.id);
            
        if (error) {
            console.error("Error removing type:", error);
            await alert("Failed to remove type.");
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

async function handleTypeSelectChange(e) {
    let val = e.target.value;
    if (val === 'add_new') {
        const newType = await prompt("Enter new memory type:");
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
    const settingsContainer = document.getElementById('settings-type-tags');
    
    const tagHtml = customTypes.map(t => {
        const displayType = t === 'mixed' ? 'All Types (Mixed)' : t;
        if (t === 'mixed' || t === 'Vocabulary' || t === 'Memory Map') {
            return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType}</span>`;
        }
        return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-size: 0.85rem; border: 1px solid var(--border-color);">${displayType} <button type="button" onclick="removeType('${t}')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; margin-left:6px; padding:0; display:inline-flex; align-items:center;">${ICONS.closeSmall}</button></span>`;
    }).join('');
    
    if (createContainer) createContainer.innerHTML = tagHtml;
    if (editContainer) editContainer.innerHTML = tagHtml;
    if (settingsContainer) settingsContainer.innerHTML = tagHtml;
}

function updateTypeDatalists() {
    const types = new Set(customTypes);
    let migrated = false;
    let migratedVocab = false;
    cards.forEach(c => {
        if (!c.type || c.type === 'General') {
            c.type = 'mixed';
            migrated = true;
        }
        if (c.type === 'vocabulary') {
            c.type = 'Vocabulary';
            migratedVocab = true;
        }
        types.add(c.type);
    });
    
    if (migrated && userSession) {
        supabase.from('flashcards').update({ type: 'mixed' }).or('type.eq.General,type.is.null').eq('user_id', userSession.user.id).then();
    }
    
    if (migratedVocab && userSession) {
        supabase.from('flashcards').update({ type: 'Vocabulary' }).eq('type', 'vocabulary').eq('user_id', userSession.user.id).then();
    }
    
    types.delete('General');
    types.delete('vocabulary');
    
    customTypes = Array.from(types).filter(t => t !== 'vocabulary');
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
        
        // Synchronize and build the premium custom dropdown UI
        buildCustomDropdownUI(selectId);
    };
    
    populateSelect('card-type', false);
    populateSelect('edit-card-type', false);
    populateSelect('practice-type-select', true);
    populateSelect('manage-type-select', true);
    
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

    const settingsStatCount = document.getElementById('settings-stat-count');
    if (settingsStatCount) settingsStatCount.textContent = cards.length;

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

    const filterSelect = document.getElementById('manage-type-select');
    const activeFilter = filterSelect ? filterSelect.value : 'mixed';
    
    let filteredCards = cards;
    if (activeFilter !== 'mixed') {
        filteredCards = cards.filter(c => c.type === activeFilter);
    }

    const searchInput = document.getElementById('manage-search-input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQuery) {
        filteredCards = filteredCards.filter(c => {
            let frontMatchText = c.front.toLowerCase();
            if (c.front.startsWith('{"mode":"memory_map"')) {
                try {
                    const mapData = JSON.parse(c.front);
                    frontMatchText = `${mapData.title || ''} ${mapData.nodes ? mapData.nodes.map(n => n.text + ' ' + (n.explanation || '')).join(' ') : ''}`.toLowerCase();
                } catch (e) {}
            }
            const backMatchText = (c.back || '').toLowerCase();
            
            const savedSentences = exampleSentences[c.id];
            let sentencesString = '';
            if (Array.isArray(savedSentences)) {
                sentencesString = savedSentences.join(' ').toLowerCase();
            } else if (typeof savedSentences === 'string') {
                sentencesString = savedSentences.toLowerCase();
            }
            
            return frontMatchText.includes(searchQuery) || 
                   backMatchText.includes(searchQuery) || 
                   sentencesString.includes(searchQuery);
        });
    }
    
    if (filteredCards.length === 0) {
        if (searchQuery) {
            list.innerHTML = '<p class="status-msg">No memories found matching your search query.</p>';
        } else {
            list.innerHTML = '<p class="status-msg">No memories found for this type.</p>';
        }
        toolbar.classList.add('hidden');
        return;
    }

    toolbar.classList.remove('hidden');
    selectAllCb.checked = false;
    updateBatchUI();

    filteredCards.forEach(card => {
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
            if (await confirm('Permanently delete this memory?')) {
                await batchDeleteCards([id]);
            }
        });
    });



    // Inline delete sentence button handler
    document.querySelectorAll('.delete-sentence-bank-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
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

            // Sync to in-memory cards array
            const cardIndex = cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                cards[cardIndex].example_sentences = sentencesArray;
            }

            // Sync to DB
            if (userSession && supabase) {
                try {
                    const { error } = await supabase
                        .from('flashcards')
                        .update({ example_sentences: sentencesArray })
                        .eq('id', cardId)
                        .eq('user_id', userSession.user.id);
                    if (error) {
                        console.error('Error updating example sentences in Supabase:', error);
                    }
                } catch (err) {
                    console.error('Error syncing example sentences update to DB:', err);
                }
            }
            
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
        if (!await confirm(`Permanently delete ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'}?`)) return;
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
        await alert("Failed to delete memories.");
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
    if (!userSession) return await alert("Must be logged in to create cards.");

    const activeType = document.getElementById('card-type').value.trim() || 'mixed';
    let frontText = '';
    let backText = '';
    
    if (activeType === 'Memory Map') {
        const title = document.getElementById('create-map-title').value.trim();
        if (!title) {
            await alert("Please enter a Memory Map Title.");
            return;
        }
        if (createMapNodes.length === 0) {
            await alert("Please add at least one card to your Memory Map.");
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

    // Automatically capture pending example sentence if typed but not added
    const sentenceInput = document.getElementById('create-new-sentence');
    if (sentenceInput && sentenceInput.value.trim() !== '') {
        const sentenceText = sentenceInput.value.trim();
        if (validateExampleSentence(sentenceText, backText)) {
            if (!draftCreateSentences.includes(sentenceText)) {
                draftCreateSentences.push(sentenceText);
            }
        }
    }

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
        repetitions: 0,
        example_sentences: activeType !== 'Memory Map' ? [...draftCreateSentences] : []
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

    // Refresh custom dropdown UI to reflect the newly loaded card type
    buildCustomDropdownUI('edit-card-type');

    switchView('edit');
}

async function handleEditCardSubmit(e) {
    e.preventDefault();
    if (!userSession) return await alert("Must be logged in to edit cards.");

    const cardId = document.getElementById('edit-card-id').value;
    const typeText = document.getElementById('edit-card-type').value.trim() || 'mixed';
    
    let frontText = '';
    let backText = '';
    
    if (typeText === 'Memory Map') {
        const title = document.getElementById('edit-map-title').value.trim();
        if (!title) {
            await alert("Please enter a Memory Map Title.");
            return;
        }
        if (editMapNodes.length === 0) {
            await alert("Please add at least one card to your Memory Map.");
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

    const frontImageFile = document.getElementById('edit-card-front-image') ? document.getElementById('edit-card-front-image').files[0] : null;
    const backImageFile = document.getElementById('edit-card-back-image') ? document.getElementById('edit-card-back-image').files[0] : null;

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

    // Automatically capture pending edit example sentence if typed but not added
    const editSentenceInput = document.getElementById('edit-new-sentence');
    if (editSentenceInput && editSentenceInput.value.trim() !== '') {
        const sentenceText = editSentenceInput.value.trim();
        if (validateExampleSentence(sentenceText, backText)) {
            if (!editSentences.includes(sentenceText)) {
                editSentences.push(sentenceText);
            }
        }
    }

    const { data, error } = await supabase
        .from('flashcards')
        .update({
            type: typeText,
            front: frontText,
            back: backText,
            image_front_url: new_image_front_url,
            image_back_url: new_image_back_url,
            example_sentences: typeText !== 'Memory Map' ? [...editSentences] : []
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
        await alert("Failed to update memory.");
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
        if (exerciseTitleEl) exerciseTitleEl.style.display = 'none';
        spellingArea.classList.add('hidden');
        
        // Dynamically adjust card size and remove padding for seamless map canvas
        const activeCard = document.getElementById('active-card');
        if (activeCard) {
            const isMobile = window.innerWidth <= 768;
            activeCard.style.height = isMobile ? '460px' : '600px';
            const cardFront = activeCard.querySelector('.card-front');
            if (cardFront) cardFront.style.padding = '0';
            const cardBack = activeCard.querySelector('.card-back');
            if (cardBack) cardBack.style.padding = '0';
        }
        
        // Reset practice zoom level
        practiceMapZoom = 1.0;
        
        frontEl.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; position: absolute; inset: 0;">
                <!-- Out-of-Canvas Dynamic Header Row -->
                <div class="practice-header-outside" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-card); border-bottom: 2px solid var(--border-color); padding: 12px 16px; text-align: center; width: 100%; box-sizing: border-box; flex-shrink: 0; border-top-left-radius: 14px; border-top-right-radius: 14px; z-index: 10; position: relative;">
                    <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 2px;">Recall the Memory Map</span>
                    <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${mapData ? mapData.title : 'Recall this Memory Map'}</span>
                </div>
                
                <div id="practice-map-canvas-container" style="position: relative; width: 100%; height: 100%; background: transparent; border: none; overflow: auto; box-shadow: none; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; user-select: none; flex-grow: 1; z-index: 1;">
                    <!-- Exit Fullscreen Button -->
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
        
        // Auto-center scroll container onto the nodes' bounding box area and scale dynamically
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
                
                // Set optimal initial zoom level to fit the bounding area elegantly
                let initialZoom = Math.min(1.0, Math.min(containerWidth / viewportWidth, containerHeight / viewportHeight));
                initialZoom = Math.max(0.6, initialZoom);
                
                // Initialize the zoom state & update UI
                setPracticeMapZoom(initialZoom);
                
                // Recalculate margins and adjust scroll positions
                adjustPracticeViewportCentering(viewportWidth, viewportHeight);
            }
        }, 120);
        
        // Bind practice zoom click handlers dynamically
        const btnPracticeZoomIn = document.getElementById('btn-practice-zoom-in');
        if (btnPracticeZoomIn) btnPracticeZoomIn.addEventListener('click', () => setPracticeMapZoom(practiceMapZoom + 0.1));
        const btnPracticeZoomOut = document.getElementById('btn-practice-zoom-out');
        if (btnPracticeZoomOut) btnPracticeZoomOut.addEventListener('click', () => setPracticeMapZoom(practiceMapZoom - 0.1));
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

    // Reset dynamically adjusted card layout, height and padding for standard cards
    if (exerciseTitleEl) exerciseTitleEl.style.display = '';
    const activeCard = document.getElementById('active-card');
    if (activeCard) {
        activeCard.style.height = '';
        const cardFront = activeCard.querySelector('.card-front');
        if (cardFront) cardFront.style.padding = '';
        const cardBack = activeCard.querySelector('.card-back');
        if (cardBack) cardBack.style.padding = '';
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

async function evaluateAnswer() {
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
            await alert("Please attempt to fill in the mind map before submitting!");
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
                input.value = node.text; // Show correct keyword
                input.title = `You typed: "${typedVal}"`;
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
        await alert("Please attempt an answer before submitting!");
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

    if (score >= 75) {
        playUISound('success');
    } else {
        playUISound('fail');
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
async function saveIncorrectExampleSentence() {
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

    // Update in-memory card object
    card.example_sentences = sentencesArray;

    // Sync to DB
    if (userSession && supabase) {
        try {
            const { error } = await supabase
                .from('flashcards')
                .update({ example_sentences: sentencesArray })
                .eq('id', card.id)
                .eq('user_id', userSession.user.id);
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
    playUISound('complete');
    try {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    } catch (err) {
        console.warn("Confetti call failed:", err);
    }

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

function getNodeBoundaryIntersection(src, tgt, w = 180, h = 90) {
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
    if (activeSelectedLink && activeSelectedLink.link.source === link.source && activeSelectedLink.link.target === link.target) {
        hideLinkToolbar(container);
        return;
    }
    
    // Hide any existing toolbar first
    hideLinkToolbar(container);
    
    activeSelectedLink = { link, svgId, containerId, nodes, links, arrowheadId, isEdit };
    
    const toolbar = document.createElement('div');
    toolbar.className = 'map-link-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.zIndex = '1000';
    
    // Find the scrollable canvas container and zoom level to compute boundary clamping
    let scrollContainer = null;
    let zoom = 1.0;
    
    if (isEdit) {
        scrollContainer = document.getElementById('edit-map-canvas-container');
        zoom = editMapZoom;
    } else if (containerId === 'create-map-nodes-container') {
        scrollContainer = document.getElementById('create-map-canvas-container');
        zoom = createMapZoom;
    } else if (containerId === 'practice-map-nodes-container') {
        scrollContainer = document.getElementById('practice-map-canvas-container');
        zoom = practiceMapZoom;
    }
    
    // Fallback detection logic if container ids differ
    if (!scrollContainer && containerId) {
        const scrollContainerId = containerId.replace('nodes-container', 'canvas-container');
        scrollContainer = document.getElementById(scrollContainerId);
    }
    if (!scrollContainer && container) {
        scrollContainer = container.closest('[id$="-canvas-container"]') || container.parentNode;
    }
    
    let clampedMidX = midX;
    let toolbarTop = midY - 45;
    let transformY = 'translate(-50%, -100%)';
    
    if (scrollContainer) {
        const toolbarWidth = 220;
        const toolbarHeight = 245; 
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        
        const padding = 15;
        const halfWidth = toolbarWidth / 2;
        
        // Translate scroll positions to local unscaled viewport coordinates
        const visibleMinX = scrollLeft / zoom;
        const visibleMaxX = (scrollLeft + containerWidth) / zoom;
        const visibleMinY = scrollTop / zoom;
        const visibleMaxY = (scrollTop + containerHeight) / zoom;
        
        // Horizontal Clamping: keep the toolbar fully within the visible left/right boundaries of the container
        const minClampedX = visibleMinX + halfWidth + padding;
        const maxClampedX = visibleMaxX - halfWidth - padding;
        
        if (minClampedX < maxClampedX) {
            clampedMidX = Math.max(minClampedX, Math.min(maxClampedX, midX));
        } else {
            clampedMidX = visibleMinX + (visibleMaxX - visibleMinX) / 2;
        }
        
        // Vertical Clamping & Flipping:
        // Try placing above the connection first. The top of the toolbar in local coordinates would be midY - 45 - toolbarHeight.
        const spaceAbove = midY - 45 - visibleMinY;
        
        if (spaceAbove < toolbarHeight + padding) {
            // Not enough space above, display BELOW the connection point
            toolbarTop = midY + 35;
            transformY = 'translate(-50%, 0)';
            
            // Check if it fits below. If not, clamp to visible bottom boundary
            if (toolbarTop + toolbarHeight + padding > visibleMaxY) {
                toolbarTop = Math.max(visibleMinY + padding, visibleMaxY - toolbarHeight - padding);
            }
        } else {
            // Plenty of space above, display ABOVE the connection point
            toolbarTop = midY - 45;
            transformY = 'translate(-50%, -100%)';
            
            // If it exceeds the visible top boundary, clamp to the top
            if (toolbarTop - toolbarHeight < visibleMinY + padding) {
                toolbarTop = visibleMinY + toolbarHeight + padding;
            }
        }
    }
    
    toolbar.style.left = `${clampedMidX}px`;
    toolbar.style.top = `${toolbarTop}px`;
    toolbar.style.transform = transformY;
    
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
    inputGroup.style = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; width: 100%;';
    
    const label = document.createElement('label');
    label.textContent = 'Connection Label';
    label.className = 'toolbar-section-label';
    label.style.marginTop = '0'; // reset margin-top for the first element
    
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
    
    // Thickness Group
    const thickLabel = document.createElement('div');
    thickLabel.textContent = 'Arrow Thickness';
    thickLabel.className = 'toolbar-section-label';
    toolbar.appendChild(thickLabel);
    
    const thicknessDiv = document.createElement('div');
    thicknessDiv.className = 'segmented-control';
    thicknessDiv.style.marginBottom = '6px';
    
    const thickOptions = [1, 2, 3, 4];
    thickOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = `${opt}px`;
        btn.className = `segmented-btn ${(link.thickness || 2) === opt ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            link.thickness = opt;
            thicknessDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (thickOptions[i] === opt) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        thicknessDiv.appendChild(btn);
    });
    toolbar.appendChild(thicknessDiv);
    
    // Style Group
    const styleLabel = document.createElement('div');
    styleLabel.textContent = 'Line Style';
    styleLabel.className = 'toolbar-section-label';
    toolbar.appendChild(styleLabel);
    
    const stylesDiv = document.createElement('div');
    stylesDiv.className = 'segmented-control';
    stylesDiv.style.marginBottom = '6px';
    
    const styleOptions = [
        { name: 'Solid', value: 'solid' },
        { name: 'Dashed', value: 'dashed' },
        { name: 'Dotted', value: 'dotted' }
    ];
    styleOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.name;
        btn.className = `segmented-btn ${(link.style || 'solid') === opt.value ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            link.style = opt.value;
            stylesDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (styleOptions[i].value === opt.value) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        stylesDiv.appendChild(btn);
    });
    toolbar.appendChild(stylesDiv);
    
    // Colors Definition
    const colorOptions = [
        { name: 'Default', value: '' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Purple', value: '#a855f7' }
    ];
    
    // Arrow Color Picker Row
    const arrowColorLabel = document.createElement('div');
    arrowColorLabel.textContent = 'Arrow Color';
    arrowColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(arrowColorLabel);
    
    const arrowColorsDiv = document.createElement('div');
    arrowColorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 6px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-secondary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((link.color || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            link.color = opt.value;
            // Update UI selected states
            arrowColorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        arrowColorsDiv.appendChild(dot);
    });
    toolbar.appendChild(arrowColorsDiv);
    
    // Text Color Picker Row
    const textColorLabel = document.createElement('div');
    textColorLabel.textContent = 'Text Color';
    textColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(textColorLabel);
    
    const textColorsDiv = document.createElement('div');
    textColorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 10px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-primary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((link.textColor || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            link.textColor = opt.value;
            // Update UI selected states
            textColorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        textColorsDiv.appendChild(dot);
    });
    toolbar.appendChild(textColorsDiv);
    
    // Divider line before action
    const hr = document.createElement('div');
    hr.style = 'border-top: 1px solid var(--border-color); margin-bottom: 8px; width: 100%;';
    toolbar.appendChild(hr);
    
    // Delete connection row
    const deleteRow = document.createElement('div');
    deleteRow.style = 'display: flex; justify-content: flex-end; align-items: center; width: 100%;';
    
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'link-delete-btn';
    delBtn.innerHTML = ICONS.trash;
    delBtn.title = 'Delete Connection';
    delBtn.style = 'border: none; background: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; padding: 2px; transition: transform 0.1s;';
    delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (await confirm("Are you sure you want to delete this connection?")) {
            const idx = links.indexOf(link);
            if (idx !== -1) {
                links.splice(idx, 1);
            }
            hideLinkToolbar(container);
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        }
    });
    deleteRow.appendChild(delBtn);
    toolbar.appendChild(deleteRow);
    const viewport = container.querySelector('[id$="-viewport"]');
    if (viewport) {
        viewport.appendChild(toolbar);
    } else {
        container.appendChild(toolbar);
    }
}

let activeSelectedNode = null;

function hideNodeToolbar(container) {
    if (!container) return;
    const existing = container.querySelector('.map-node-toolbar') || 
                     (container.parentNode && container.parentNode.querySelector('.map-node-toolbar')) ||
                     document.querySelector('.map-node-toolbar');
    if (existing) {
        existing.remove();
    }
    activeSelectedNode = null;
}

function showNodeToolbar(node, container, containerId, nodes, links, svgId, arrowheadId, isEdit) {
    if (activeSelectedNode && activeSelectedNode.node.id === node.id) {
        hideNodeToolbar(container);
        return;
    }
    
    // Hide any existing node toolbar first
    hideNodeToolbar(container);
    
    activeSelectedNode = { node, containerId, isEdit };
    
    const toolbar = document.createElement('div');
    toolbar.className = 'map-node-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.zIndex = '1000';
    
    // Find the scrollable canvas container and zoom level to compute boundary clamping
    let scrollContainer = null;
    let zoom = 1.0;
    
    if (isEdit) {
        scrollContainer = document.getElementById('edit-map-canvas-container');
        zoom = editMapZoom;
    } else if (containerId === 'create-map-nodes-container') {
        scrollContainer = document.getElementById('create-map-canvas-container');
        zoom = createMapZoom;
    } else if (containerId === 'practice-map-nodes-container') {
        scrollContainer = document.getElementById('practice-map-canvas-container');
        zoom = practiceMapZoom;
    }
    
    // Fallback detection logic if container ids differ
    if (!scrollContainer && containerId) {
        const scrollContainerId = containerId.replace('nodes-container', 'canvas-container');
        scrollContainer = document.getElementById(scrollContainerId);
    }
    if (!scrollContainer && container) {
        scrollContainer = container.closest('[id$="-canvas-container"]') || container.parentNode;
    }
    
    // Position the node toolbar right above the node's center top
    const nodeCenterX = node.x + 90; // Node width is 180, so center is x + 90
    const nodeTopY = node.y; // Node top is node.y
    
    let clampedMidX = nodeCenterX;
    let toolbarTop = nodeTopY - 15;
    let transformY = 'translate(-50%, -100%)';
    
    if (scrollContainer) {
        const toolbarWidth = 220;
        const toolbarHeight = 180; // Node toolbar is simpler and shorter than link toolbar (around 180px)
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        
        const padding = 15;
        const halfWidth = toolbarWidth / 2;
        
        // Translate scroll positions to local unscaled viewport coordinates
        const visibleMinX = scrollLeft / zoom;
        const visibleMaxX = (scrollLeft + containerWidth) / zoom;
        const visibleMinY = scrollTop / zoom;
        const visibleMaxY = (scrollTop + containerHeight) / zoom;
        
        // Horizontal Clamping
        const minClampedX = visibleMinX + halfWidth + padding;
        const maxClampedX = visibleMaxX - halfWidth - padding;
        
        if (minClampedX < maxClampedX) {
            clampedMidX = Math.max(minClampedX, Math.min(maxClampedX, nodeCenterX));
        } else {
            clampedMidX = visibleMinX + (visibleMaxX - visibleMinX) / 2;
        }
        
        // Vertical Clamping & Flipping
        const spaceAbove = nodeTopY - 15 - visibleMinY;
        
        if (spaceAbove < toolbarHeight + padding) {
            // Not enough space above, display BELOW the node (node height is 90px, so topStyle is nodeTopY + 90 + 15)
            toolbarTop = nodeTopY + 90 + 15;
            transformY = 'translate(-50%, 0)';
            
            // Check if it fits below. If not, clamp to visible bottom boundary
            if (toolbarTop + toolbarHeight + padding > visibleMaxY) {
                toolbarTop = Math.max(visibleMinY + padding, visibleMaxY - toolbarHeight - padding);
            }
        } else {
            // Plenty of space above, display ABOVE the node
            toolbarTop = nodeTopY - 15;
            transformY = 'translate(-50%, -100%)';
            
            // If it exceeds the visible top boundary, clamp to the top
            if (toolbarTop - toolbarHeight < visibleMinY + padding) {
                toolbarTop = visibleMinY + toolbarHeight + padding;
            }
        }
    }
    
    toolbar.style.left = `${clampedMidX}px`;
    toolbar.style.top = `${toolbarTop}px`;
    toolbar.style.transform = transformY;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toolbar-close-btn';
    closeBtn.innerHTML = ICONS.closeSmall;
    closeBtn.style = 'position: absolute; right: 4px; top: 4px; border: none; background: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 2px;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideNodeToolbar(container);
    });
    toolbar.appendChild(closeBtn);
    
    // Toolbar Title
    const title = document.createElement('div');
    title.textContent = 'Card Styling';
    title.style = 'font-size: 0.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 10px; padding-right: 16px;';
    toolbar.appendChild(title);
    
    // Section 1: Text Color
    const textColorLabel = document.createElement('div');
    textColorLabel.textContent = 'Text Color';
    textColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(textColorLabel);
    
    const colorOptions = [
        { name: 'Default', value: '' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Purple', value: '#a855f7' }
    ];
    
    const colorsDiv = document.createElement('div');
    colorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 12px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-primary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((node.textColor || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            node.textColor = opt.value;
            // Update selected states UI
            colorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        colorsDiv.appendChild(dot);
    });
    toolbar.appendChild(colorsDiv);
    
    // Section 2: Text Size
    const sizeLabel = document.createElement('div');
    sizeLabel.textContent = 'Text Size';
    sizeLabel.className = 'toolbar-section-label';
    toolbar.appendChild(sizeLabel);
    
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'segmented-control';
    
    const sizeOptions = [
        { name: 'Small', value: 'small' },
        { name: 'Medium', value: 'medium' },
        { name: 'Large', value: 'large' },
        { name: 'XL', value: 'xl' }
    ];
    
    sizeOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.name;
        btn.className = `segmented-btn ${(node.fontSize || 'medium') === opt.value ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            node.fontSize = opt.value;
            sizeDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (sizeOptions[i].value === opt.value) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        sizeDiv.appendChild(btn);
    });
    toolbar.appendChild(sizeDiv);
    
    // Append to viewport or container
    const viewport = container.querySelector('[id$="-viewport"]') || container.parentNode;
    if (viewport) {
        viewport.appendChild(toolbar);
    } else {
        container.appendChild(toolbar);
    }
}

function getNodeSideCoords(node, side, w = 180, h = 90) {
    if (side === 'top') {
        return { x: node.x + w / 2, y: node.y };
    } else if (side === 'right') {
        return { x: node.x + w, y: node.y + h / 2 };
    } else if (side === 'bottom') {
        return { x: node.x + w / 2, y: node.y + h };
    } else if (side === 'left') {
        return { x: node.x, y: node.y + h / 2 };
    }
    return { x: node.x + w / 2, y: node.y + h / 2 };
}

function getClosestSides(src, tgt, w = 180, h = 90) {
    const sides = ['top', 'right', 'bottom', 'left'];
    let minD = Infinity;
    let bestSrcSide = 'right';
    let bestTgtSide = 'left';
    
    sides.forEach(sSide => {
        const sPt = getNodeSideCoords(src, sSide, w, h);
        sides.forEach(tSide => {
            const tPt = getNodeSideCoords(tgt, tSide, w, h);
            const dx = tPt.x - sPt.x;
            const dy = tPt.y - sPt.y;
            const dist = dx * dx + dy * dy;
            if (dist < minD) {
                minD = dist;
                bestSrcSide = sSide;
                bestTgtSide = tSide;
            }
        });
    });
    return { srcSide: bestSrcSide, tgtSide: bestTgtSide };
}

function getClosestTargetSide(sPt, tgt, w = 180, h = 90) {
    const sides = ['top', 'right', 'bottom', 'left'];
    let minD = Infinity;
    let bestTgtSide = 'left';
    
    sides.forEach(tSide => {
        const tPt = getNodeSideCoords(tgt, tSide, w, h);
        const dx = tPt.x - sPt.x;
        const dy = tPt.y - sPt.y;
        const dist = dx * dx + dy * dy;
        if (dist < minD) {
            minD = dist;
            bestTgtSide = tSide;
        }
    });
    return bestTgtSide;
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
        
        let sSide = link.sourceSide;
        let tSide = link.targetSide;
        
        if (!sSide) {
            const closest = getClosestSides(src, tgt);
            sSide = closest.srcSide;
            tSide = closest.tgtSide;
        } else if (!tSide) {
            const sPtTemp = getNodeSideCoords(src, sSide);
            tSide = getClosestTargetSide(sPtTemp, tgt);
        }
        
        const sPt = getNodeSideCoords(src, sSide);
        const tPtRaw = getNodeSideCoords(tgt, tSide);
        
        let tPt = { x: tPtRaw.x, y: tPtRaw.y };
        if (tSide === 'top') tPt.y -= 6;
        else if (tSide === 'bottom') tPt.y += 6;
        else if (tSide === 'left') tPt.x -= 6;
        else if (tSide === 'right') tPt.x += 6;
        
        const dx = tPt.x - sPt.x;
        const dy = tPt.y - sPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = Math.min(150, Math.max(35, dist * 0.35));
        
        const cp1 = { x: sPt.x, y: sPt.y };
        if (sSide === 'left') cp1.x -= offset;
        else if (sSide === 'right') cp1.x += offset;
        else if (sSide === 'top') cp1.y -= offset;
        else if (sSide === 'bottom') cp1.y += offset;
        
        const cp2 = { x: tPt.x, y: tPt.y };
        if (tSide === 'left') cp2.x -= offset;
        else if (tSide === 'right') cp2.x += offset;
        else if (tSide === 'top') cp2.y -= offset;
        else if (tSide === 'bottom') cp2.y += offset;
        
        const pathData = `M ${sPt.x} ${sPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tPt.x} ${tPt.y}`;
        
        // Link stroke color
        const lineColor = link.color || 'var(--text-secondary)';
        
        // 1. Draw actual path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', link.thickness || 2);
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', `url(#${arrowheadId})`);
        path.style.opacity = '0.7';
        path.style.color = lineColor;
        
        // Handle styles
        if (link.style === 'dashed') {
            path.setAttribute('stroke-dasharray', '6,4');
        } else if (link.style === 'dotted') {
            path.setAttribute('stroke-dasharray', '2,3');
        }
        
        svg.appendChild(path);
        
        // Compute Midpoint for labels & click events
        const midX = 0.125 * sPt.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * tPt.x;
        const midY = 0.125 * sPt.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * tPt.y;
        
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
                group.style.pointerEvents = 'auto';
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
            rect.setAttribute('stroke', link.textColor || 'var(--border-color)');
            rect.setAttribute('stroke-width', '1');
            
            // Text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY + 4);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', '700');
            text.setAttribute('fill', link.textColor || 'var(--text-primary)');
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
    
    // Render live draft curve if currently linking in this container
    if (interactive && linkingSourceNodeId) {
        const srcNode = nodes.find(n => n.id === linkingSourceNodeId);
        if (srcNode) {
            const sSide = linkingSourceSide || 'right';
            const sPt = getNodeSideCoords(srcNode, sSide);
            const tPt = linkingMousePos;
            
            const dx = tPt.x - sPt.x;
            const dy = tPt.y - sPt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offset = Math.min(150, Math.max(35, dist * 0.35));
            
            let tSide = 'left';
            if (sSide === 'left') tSide = 'right';
            else if (sSide === 'right') tSide = 'left';
            else if (sSide === 'top') tSide = 'bottom';
            else if (sSide === 'bottom') tSide = 'top';
            
            const cp1 = { x: sPt.x, y: sPt.y };
            if (sSide === 'left') cp1.x -= offset;
            else if (sSide === 'right') cp1.x += offset;
            else if (sSide === 'top') cp1.y -= offset;
            else if (sSide === 'bottom') cp1.y += offset;
            
            const cp2 = { x: tPt.x, y: tPt.y };
            if (tSide === 'left') cp2.x -= offset;
            else if (tSide === 'right') cp2.x += offset;
            else if (tSide === 'top') cp2.y -= offset;
            else if (tSide === 'bottom') cp2.y += offset;
            
            const pathData = `M ${sPt.x} ${sPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tPt.x} ${tPt.y}`;
            
            const draftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            draftPath.setAttribute('d', pathData);
            draftPath.setAttribute('stroke', '#22c55e');
            draftPath.setAttribute('stroke-width', '2');
            draftPath.setAttribute('stroke-dasharray', '6,4');
            draftPath.setAttribute('fill', 'none');
            draftPath.style.opacity = '0.8';
            
            svg.appendChild(draftPath);
        }
    }
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
        nodeEl.style.width = '180px';
        nodeEl.style.height = '90px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.border = node.isRoot ? '2px solid var(--warning)' : '2px solid var(--border-color)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.padding = '4px';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.zIndex = '5';
        nodeEl.style.cursor = 'grab';
        
        // Node Header Row (Top Right Corner subtle controls)
        const headerEl = document.createElement('div');
        headerEl.style.display = 'flex';
        headerEl.style.justifyContent = 'flex-end';
        headerEl.style.alignItems = 'center';
        headerEl.style.gap = '6px';
        headerEl.style.height = '10px';
        headerEl.style.marginBottom = '4px';
        headerEl.style.paddingRight = '4px';
        
        // 1. Style Button (Subtle macOS Green dot)
        const styleBtn = document.createElement('button');
        styleBtn.type = 'button';
        styleBtn.className = 'node-btn style-btn';
        styleBtn.title = 'Style Card Text';
        styleBtn.style.width = '10px';
        styleBtn.style.height = '10px';
        styleBtn.style.borderRadius = '50%';
        styleBtn.style.background = '#27c93f'; // macOS Green
        styleBtn.style.border = 'none';
        styleBtn.style.cursor = 'pointer';
        styleBtn.style.padding = '0';
        styleBtn.style.opacity = '0.5';
        styleBtn.style.transition = 'opacity 0.15s, transform 0.15s';
        styleBtn.style.outline = 'none';
        styleBtn.addEventListener('mouseenter', () => {
            styleBtn.style.opacity = '1';
            styleBtn.style.transform = 'scale(1.1)';
        });
        styleBtn.addEventListener('mouseleave', () => {
            styleBtn.style.opacity = '0.5';
            styleBtn.style.transform = 'scale(1)';
        });
        styleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNodeToolbar(node, container, containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        // 2. Delete Node Button (Subtle macOS Red dot)
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'node-btn delete-btn';
        deleteBtn.title = 'Delete Card';
        deleteBtn.style.width = '10px';
        deleteBtn.style.height = '10px';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.background = '#ff5f56'; // macOS Red
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '0';
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.transition = 'opacity 0.15s, transform 0.15s';
        deleteBtn.style.outline = 'none';
        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
            deleteBtn.style.transform = 'scale(1.1)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0.5';
            deleteBtn.style.transform = 'scale(1)';
        });
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

        // 3. Starting Node Button (Subtle macOS Yellow dot)
        const rootBtn = document.createElement('button');
        rootBtn.type = 'button';
        rootBtn.className = 'node-btn root-btn';
        rootBtn.title = node.isRoot ? 'Current Starting Card (Root)' : 'Set as Starting Card';
        rootBtn.style.width = '10px';
        rootBtn.style.height = '10px';
        rootBtn.style.borderRadius = '50%';
        rootBtn.style.background = node.isRoot ? '#ffbd2e' : '#cbd5e1'; // Yellow if root, gray if not
        rootBtn.style.border = 'none';
        rootBtn.style.cursor = 'pointer';
        rootBtn.style.padding = '0';
        rootBtn.style.opacity = node.isRoot ? '1.0' : '0.5';
        rootBtn.style.transition = 'opacity 0.15s, transform 0.15s, background-color 0.15s';
        rootBtn.style.outline = 'none';
        rootBtn.addEventListener('mouseenter', () => {
            rootBtn.style.opacity = '1.0';
            rootBtn.style.transform = 'scale(1.1)';
        });
        rootBtn.addEventListener('mouseleave', () => {
            rootBtn.style.opacity = node.isRoot ? '1.0' : '0.5';
            rootBtn.style.transform = 'scale(1)';
        });
        rootBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nodes.forEach(n => {
                n.isRoot = (n.id === node.id);
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        headerEl.appendChild(rootBtn);
        headerEl.appendChild(styleBtn);
        headerEl.appendChild(deleteBtn);
        
        // 4-Sided Plus Connectors (Top, Right, Bottom, Left)
        const sides = ['top', 'right', 'bottom', 'left'];
        sides.forEach(side => {
            const plusBtn = document.createElement('div');
            plusBtn.className = `node-connector-plus ${side}`;
            if (linkingSourceNodeId === node.id && linkingSourceSide === side) {
                plusBtn.classList.add('active');
            }
            plusBtn.innerHTML = '+';
            
            let posStyles = '';
            if (side === 'top') posStyles = 'top: -10px; left: calc(50% - 10px);';
            else if (side === 'right') posStyles = 'top: calc(50% - 10px); right: -10px;';
            else if (side === 'bottom') posStyles = 'bottom: -10px; left: calc(50% - 10px);';
            else if (side === 'left') posStyles = 'top: calc(50% - 10px); left: -10px;';
            
            plusBtn.style.cssText = posStyles;
            
            plusBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (linkingSourceNodeId === node.id && linkingSourceSide === side) {
                    linkingSourceNodeId = null;
                    linkingSourceSide = null;
                } else {
                    linkingSourceNodeId = node.id;
                    linkingSourceSide = side;
                    
                    const canvasEl = container.parentNode;
                    const rect = canvasEl.getBoundingClientRect();
                    const activeZoom = isEdit ? editMapZoom : createMapZoom;
                    linkingMousePos.x = (e.clientX - rect.left) / activeZoom;
                    linkingMousePos.y = (e.clientY - rect.top) / activeZoom;
                }
                renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
            });
            
            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            nodeEl.appendChild(plusBtn);
        });
        
        // 1. Explanation input field
        const expRow = document.createElement('div');
        expRow.style = 'width: 100%; box-sizing: border-box; margin-bottom: 4px;';
        
        const expInput = document.createElement('input');
        expInput.type = 'text';
        expInput.className = 'node-explanation-input';
        expInput.value = node.explanation || '';
        expInput.placeholder = 'Explanation...';
        
        // Apply text styling
        const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
        expInput.style.fontSize = sizeStyles.exp;
        if (node.textColor) {
            expInput.style.color = node.textColor;
        } else {
            expInput.style.color = 'var(--text-secondary)';
        }
        
        expInput.addEventListener('input', (e) => {
            node.explanation = e.target.value;
        });
        expInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                expInput.blur();
            }
        });
        expRow.appendChild(expInput);
        
        // 2. Keyword input field
        const bodyEl = document.createElement('div');
        bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box;';
        
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'node-input';
        inputEl.value = node.text || '';
        inputEl.placeholder = 'Keyword...';
        
        // Apply text styling
        inputEl.style.fontSize = sizeStyles.keyword;
        if (node.textColor) {
            inputEl.style.color = node.textColor;
        } else {
            inputEl.style.color = 'var(--text-primary)';
        }
        
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
        
        // Connect link when releasing mouse on node body in linking mode
        nodeEl.addEventListener('mouseup', (e) => {
            if (linkingSourceNodeId && linkingSourceNodeId !== node.id) {
                e.stopPropagation();
                const exists = links.some(l => l.source === linkingSourceNodeId && l.target === node.id);
                if (!exists) {
                    links.push({
                        source: linkingSourceNodeId,
                        target: node.id,
                        sourceSide: linkingSourceSide
                    });
                }
                linkingSourceNodeId = null;
                linkingSourceSide = null;
                renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
            }
        });
        
        // Drag Events
        let isDragging = false;
        let startX, startY;
        let startNodeX, startNodeY;
        
        const handleStart = (clientX, clientY, e) => {
            if (linkingSourceNodeId) return;
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button' || e.target.closest('.icon-picker-dropdown')) return;
            
            if (e.target.tagName.toLowerCase() !== 'input') {
                e.preventDefault();
            }
            
            isDragging = true;
            nodeEl.style.cursor = 'grabbing';
            startX = clientX;
            startY = clientY;
            startNodeX = node.x;
            startNodeY = node.y;
        };

        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            const activeZoom = isEdit ? editMapZoom : createMapZoom;
            const dx = (clientX - startX) / activeZoom;
            const dy = (clientY - startY) / activeZoom;
            
            let nx = startNodeX + dx;
            let ny = startNodeY + dy;
            
            nx = Math.max(0, Math.min(2500 - 180, nx));
            ny = Math.max(0, Math.min(2000 - 90, ny));
            
            if (mapGridActive) {
                nx = Math.round(nx / 20) * 20;
                ny = Math.round(ny / 20) * 20;
            }
            
            node.x = nx;
            node.y = ny;
            
            nodeEl.style.left = `${nx}px`;
            nodeEl.style.top = `${ny}px`;
            
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        };

        const handleEnd = () => {
            isDragging = false;
            nodeEl.style.cursor = 'grab';
        };

        // Mouse Events
        nodeEl.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY, e);
            
            const onMouseMove = (moveEvent) => {
                handleMove(moveEvent.clientX, moveEvent.clientY);
            };
            
            const onMouseUp = () => {
                handleEnd();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Touch Events
        nodeEl.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY, e);
            }
            
            const onTouchMove = (moveEvent) => {
                if (moveEvent.touches.length > 0) {
                    handleMove(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
                }
            };
            
            const onTouchEnd = () => {
                handleEnd();
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        }, { passive: false });
        
        nodeEl.appendChild(headerEl);
        nodeEl.appendChild(expRow);
        nodeEl.appendChild(bodyEl);
        
        container.appendChild(nodeEl);
    });
}

function initMapCanvasListeners() {
    const handleAddCreateNode = () => {
        const id = 'node_' + Date.now();
        
        let cx = 150;
        let cy = 150;
        const canvas = document.getElementById('create-map-canvas-container');
        if (canvas) {
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const width = canvas.clientWidth || canvas.offsetWidth || 800;
            const height = canvas.clientHeight || canvas.offsetHeight || 500;
            cx = (scrollLeft + width / 2) / createMapZoom - 90;
            cy = (scrollTop + height / 2) / createMapZoom - 45;
        }
        
        let boundedX = Math.max(0, Math.min(2500 - 180, cx));
        let boundedY = Math.max(0, Math.min(2000 - 90, cy));
        
        if (mapGridActive) {
            boundedX = Math.round(boundedX / 20) * 20;
            boundedY = Math.round(boundedY / 20) * 20;
        }
        
        createMapNodes.push({
            id: id,
            text: '',
            explanation: '',
            x: boundedX,
            y: boundedY,
            isRoot: createMapNodes.length === 0
        });
        renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
    };
    
    const btnCreateAddBar = document.getElementById('btn-create-map-add-node-bar');
    if (btnCreateAddBar) btnCreateAddBar.addEventListener('click', handleAddCreateNode);
    
    const handleClearCreate = async () => {
        if (await confirm("Are you sure you want to clear the mind map canvas?")) {
            createMapNodes = [];
            createMapLinks = [];
            linkingSourceNodeId = null;
            renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
        }
    };
    
    const btnCreateClearBar = document.getElementById('btn-create-map-clear-bar');
    if (btnCreateClearBar) btnCreateClearBar.addEventListener('click', handleClearCreate);
    
    const createCanvas = document.getElementById('create-map-canvas-container');
    if (createCanvas) {
        createCanvas.addEventListener('dblclick', (e) => {
            if (e.target.closest('.map-node') || e.target.closest('.canvas-zoom-controls')) {
                return;
            }
            const viewport = document.getElementById('create-map-viewport');
            const rect = viewport.getBoundingClientRect();
            const x = (e.clientX - rect.left) / createMapZoom - 90;
            const y = (e.clientY - rect.top) / createMapZoom - 45;
            let boundedX = Math.max(0, Math.min(2500 - 180, x));
            let boundedY = Math.max(0, Math.min(2000 - 90, y));
            
            if (mapGridActive) {
                boundedX = Math.round(boundedX / 20) * 20;
                boundedY = Math.round(boundedY / 20) * 20;
            }
            
            const id = 'node_' + Date.now();
            createMapNodes.push({
                id: id,
                text: '',
                explanation: '',
                x: boundedX,
                y: boundedY,
                isRoot: createMapNodes.length === 0
            });
            renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead');
        });
        
        createCanvas.addEventListener('mousemove', (e) => {
            if (linkingSourceNodeId) {
                const viewport = document.getElementById('create-map-viewport');
                const rect = viewport.getBoundingClientRect();
                linkingMousePos.x = (e.clientX - rect.left) / createMapZoom;
                linkingMousePos.y = (e.clientY - rect.top) / createMapZoom;
                drawLinks(createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead', true, 'create-map-nodes-container', false);
            }
        });
        
        createCanvas.addEventListener('mouseup', (e) => {
            if (linkingSourceNodeId && !e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                const viewport = document.getElementById('create-map-viewport');
                const rect = viewport.getBoundingClientRect();
                const x = (e.clientX - rect.left) / createMapZoom - 90;
                const y = (e.clientY - rect.top) / createMapZoom - 45;
                let boundedX = Math.max(0, Math.min(2500 - 180, x));
                let boundedY = Math.max(0, Math.min(2000 - 90, y));
                
                if (mapGridActive) {
                    boundedX = Math.round(boundedX / 20) * 20;
                    boundedY = Math.round(boundedY / 20) * 20;
                }
                
                const newId = 'node_' + Date.now();
                createMapNodes.push({
                    id: newId,
                    text: '',
                    explanation: '',
                    x: boundedX,
                    y: boundedY,
                    isRoot: createMapNodes.length === 0
                });
                
                createMapLinks.push({
                    source: linkingSourceNodeId,
                    target: newId,
                    sourceSide: linkingSourceSide
                });
                
                linkingSourceNodeId = null;
                linkingSourceSide = null;
                renderEditorNodes('create-map-nodes-container', createMapNodes, createMapLinks, 'create-map-svg', 'create-arrowhead', false);
            }
        });
        
        createCanvas.addEventListener('click', (e) => {
            if (!e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                if (!linkingSourceNodeId) {
                    hideLinkToolbar(createCanvas);
                    hideNodeToolbar(createCanvas);
                    createCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
                }
            }
        });
    }
    
    const handleAddEditNode = () => {
        const id = 'node_' + Date.now();
        
        let cx = 150;
        let cy = 150;
        const canvas = document.getElementById('edit-map-canvas-container');
        if (canvas) {
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const width = canvas.clientWidth || canvas.offsetWidth || 800;
            const height = canvas.clientHeight || canvas.offsetHeight || 500;
            cx = (scrollLeft + width / 2) / editMapZoom - 90;
            cy = (scrollTop + height / 2) / editMapZoom - 45;
        }
        
        let boundedX = Math.max(0, Math.min(2500 - 180, cx));
        let boundedY = Math.max(0, Math.min(2000 - 90, cy));
        
        if (mapGridActive) {
            boundedX = Math.round(boundedX / 20) * 20;
            boundedY = Math.round(boundedY / 20) * 20;
        }
        
        editMapNodes.push({
            id: id,
            text: '',
            explanation: '',
            x: boundedX,
            y: boundedY,
            isRoot: editMapNodes.length === 0
        });
        renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
    };
    
    const btnEditAddBar = document.getElementById('btn-edit-map-add-node-bar');
    if (btnEditAddBar) btnEditAddBar.addEventListener('click', handleAddEditNode);
    
    const handleClearEdit = async () => {
        if (await confirm("Are you sure you want to clear the mind map canvas?")) {
            editMapNodes = [];
            editMapLinks = [];
            linkingSourceNodeId = null;
            renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        }
    };
    
    const btnEditClearBar = document.getElementById('btn-edit-map-clear-bar');
    if (btnEditClearBar) btnEditClearBar.addEventListener('click', handleClearEdit);
    
    const editCanvas = document.getElementById('edit-map-canvas-container');
    if (editCanvas) {
        editCanvas.addEventListener('dblclick', (e) => {
            if (e.target.closest('.map-node') || e.target.closest('.canvas-zoom-controls')) {
                return;
            }
            const viewport = document.getElementById('edit-map-viewport');
            const rect = viewport.getBoundingClientRect();
            const x = (e.clientX - rect.left) / editMapZoom - 90;
            const y = (e.clientY - rect.top) / editMapZoom - 45;
            let boundedX = Math.max(0, Math.min(2500 - 180, x));
            let boundedY = Math.max(0, Math.min(2000 - 90, y));
            
            if (mapGridActive) {
                boundedX = Math.round(boundedX / 20) * 20;
                boundedY = Math.round(boundedY / 20) * 20;
            }
            
            const id = 'node_' + Date.now();
            editMapNodes.push({
                id: id,
                text: '',
                explanation: '',
                x: boundedX,
                y: boundedY,
                isRoot: editMapNodes.length === 0
            });
            renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        });
        
        editCanvas.addEventListener('mousemove', (e) => {
            if (linkingSourceNodeId) {
                const viewport = document.getElementById('edit-map-viewport');
                const rect = viewport.getBoundingClientRect();
                linkingMousePos.x = (e.clientX - rect.left) / editMapZoom;
                linkingMousePos.y = (e.clientY - rect.top) / editMapZoom;
                drawLinks(editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true, 'edit-map-nodes-container', true);
            }
        });
        
        editCanvas.addEventListener('mouseup', (e) => {
            if (linkingSourceNodeId && !e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                const viewport = document.getElementById('edit-map-viewport');
                const rect = viewport.getBoundingClientRect();
                const x = (e.clientX - rect.left) / editMapZoom - 90;
                const y = (e.clientY - rect.top) / editMapZoom - 45;
                let boundedX = Math.max(0, Math.min(2500 - 180, x));
                let boundedY = Math.max(0, Math.min(2000 - 90, y));
                
                if (mapGridActive) {
                    boundedX = Math.round(boundedX / 20) * 20;
                    boundedY = Math.round(boundedY / 20) * 20;
                }
                
                const newId = 'node_' + Date.now();
                editMapNodes.push({
                    id: newId,
                    text: '',
                    explanation: '',
                    x: boundedX,
                    y: boundedY,
                    isRoot: editMapNodes.length === 0
                });
                
                editMapLinks.push({
                    source: linkingSourceNodeId,
                    target: newId,
                    sourceSide: linkingSourceSide
                });
                
                linkingSourceNodeId = null;
                linkingSourceSide = null;
                renderEditorNodes('edit-map-nodes-container', editMapNodes, editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
            }
        });
        
        editCanvas.addEventListener('click', (e) => {
            if (!e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                if (!linkingSourceNodeId) {
                    hideLinkToolbar(editCanvas);
                    hideNodeToolbar(editCanvas);
                    editCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
                }
            }
        });
    }
}

function showExplanationTooltip(nodeEl, text) {
    hideExplanationTooltip();
    
    // Play delicate, high-frequency haptic tick sound on tooltip reveal
    playUISound('tooltip');
    
    const tooltip = document.createElement('div');
    tooltip.className = 'node-explanation-tooltip';
    tooltip.textContent = text;
    
    const nx = parseFloat(nodeEl.style.left) || 0;
    const ny = parseFloat(nodeEl.style.top) || 0;
    
    // Center horizontally relative to 180px width, and offset 10px above the top
    tooltip.style.left = `${nx + 90}px`;
    tooltip.style.top = `${ny - 10}px`;
    
    const container = document.getElementById('practice-map-nodes-container');
    if (container) {
        container.appendChild(tooltip);
    }
}

function hideExplanationTooltip() {
    const existing = document.querySelectorAll('.node-explanation-tooltip');
    existing.forEach(t => t.remove());
}

function renderPracticeNodes(containerId, originalNodes, links, svgId, arrowheadId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!originalNodes || originalNodes.length === 0) return;
    
    // Calculate the bounding box of originalNodes
    let minX = Infinity;
    let minY = Infinity;
    
    originalNodes.forEach(node => {
        const nx = Number(node.x) || 0;
        const ny = Number(node.y) || 0;
        if (nx < minX) minX = nx;
        if (ny < minY) minY = ny;
    });
    
    if (minX === Infinity) {
        minX = 0;
        minY = 0;
    }
    
    // Clone and shift nodes to start at (40, 40)
    const nodes = originalNodes.map(node => ({
        ...node,
        x: (Number(node.x) || 0) - minX + 40,
        y: (Number(node.y) || 0) - minY + 40
    }));
    
    // Draw links using the shifted coordinates (interactive = false)
    drawLinks(nodes, links, svgId, arrowheadId, false);
    
    nodes.forEach((node, idx) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'map-node';
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = '180px';
        nodeEl.style.height = '90px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.alignItems = 'center';
        nodeEl.style.justifyContent = 'center';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.padding = '6px';
        nodeEl.style.zIndex = '5';
        
        const hasAnyRoot = nodes.some(n => n.isRoot);
        const isAnchor = hasAnyRoot ? !!node.isRoot : (idx === 0);
        
        if (isAnchor) {
            nodeEl.style.border = '2px solid var(--warning)';
            nodeEl.style.color = 'var(--text-primary)';
            
            const badge = document.createElement('span');
            badge.style = 'font-size: 0.7rem; color: var(--warning); margin-bottom: 2px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0;';
            badge.textContent = 'START';
            
            const textSpan = document.createElement('span');
            textSpan.style = 'font-size: 0.85rem; font-weight: 700; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0;';
            textSpan.textContent = node.text || '';
            
            // Apply text styling
            const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
            textSpan.style.fontSize = sizeStyles.keyword;
            if (node.textColor) {
                textSpan.style.color = node.textColor;
            } else {
                textSpan.style.color = 'var(--text-primary)';
            }
 
            const expSpan = document.createElement('span');
            expSpan.style = 'font-size: 0.7rem; color: var(--text-secondary); text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; margin-top: 2px; flex-shrink: 0;';
            expSpan.textContent = node.explanation || 'Anchor';
            expSpan.style.fontSize = sizeStyles.exp;
            if (node.textColor) {
                expSpan.style.color = node.textColor;
            } else {
                expSpan.style.color = 'var(--text-secondary)';
            }
            
            nodeEl.appendChild(badge);
            nodeEl.appendChild(textSpan);
            nodeEl.appendChild(expSpan);
        } else {
            nodeEl.style.border = '2px solid var(--border-color)';
            
            const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
            
            const expLabel = document.createElement('span');
            expLabel.style = 'font-size: 0.75rem; color: var(--text-secondary); text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; font-weight: 500; flex-shrink: 0;';
            expLabel.textContent = node.explanation || 'No explanation';
            expLabel.title = node.explanation || '';
            expLabel.style.fontSize = sizeStyles.exp;
            if (node.textColor) {
                expLabel.style.color = node.textColor;
            } else {
                expLabel.style.color = 'var(--text-secondary)';
            }
            
            const bodyEl = document.createElement('div');
            bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box; justify-content: center;';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'practice-map-node-input';
            input.placeholder = 'Type keyword...';
            input.dataset.nodeId = node.id;
            input.style = 'flex: 1; border: none; border-bottom: 2px dashed var(--border-color); background: transparent; text-align: center; font-size: 0.8rem; color: var(--text-primary); font-family: inherit; font-weight: 700; box-sizing: border-box; padding: 2px 0; width: 100%; outline: none;';
            
            input.style.fontSize = sizeStyles.keyword;
            if (node.textColor) {
                input.style.color = node.textColor;
            } else {
                input.style.color = 'var(--text-primary)';
            }
            
            // Premium Floating explanation tooltips on focus
            input.addEventListener('focus', () => {
                showExplanationTooltip(nodeEl, node.explanation || 'No explanation');
            });
            input.addEventListener('blur', () => {
                hideExplanationTooltip();
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('btn-submit-answer').click();
                }
            });
            
            bodyEl.appendChild(input);
            nodeEl.appendChild(expLabel);
            nodeEl.appendChild(bodyEl);
        }
        
        container.appendChild(nodeEl);
    });
}

// ------ User Profile & Settings Modal ------

function initProfileMenu() {
    const avatarBadge = document.getElementById('user-avatar-badge');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnSettingsAddType = document.getElementById('btn-settings-add-type');
    const settingsNewTypeInput = document.getElementById('settings-new-type-input');

    if (avatarBadge && dropdownMenu) {
        avatarBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

        // Hide dropdown menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.classList.contains('hidden') && !dropdownMenu.contains(e.target) && e.target !== avatarBadge) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }

    if (btnOpenSettings && settingsModal) {
        btnOpenSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
            
            // Populate settings profile details before opening
            if (userSession && userSession.user) {
                const email = userSession.user.email || 'User';
                const initial = email.charAt(0).toUpperCase();
                const settingsAvatar = document.getElementById('settings-avatar');
                const settingsEmail = document.getElementById('settings-email');
                const settingsStatCount = document.getElementById('settings-stat-count');
                
                if (settingsAvatar) settingsAvatar.textContent = initial;
                if (settingsEmail) settingsEmail.textContent = email;
                if (settingsStatCount) settingsStatCount.textContent = cards.length;
            }
            
            settingsModal.classList.remove('hidden');
            renderTypeTags();
        });
    }

    if (btnCloseSettings && settingsModal) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });
    }

    if (btnSettingsAddType && settingsNewTypeInput) {
        btnSettingsAddType.addEventListener('click', handleSettingsAddType);
        settingsNewTypeInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await handleSettingsAddType();
            }
        });
    }
}

async function handleSettingsAddType() {
    const input = document.getElementById('settings-new-type-input');
    if (!input) return;
    let newType = input.value.trim();
    if (newType === '') return;
    
    if (newType.toLowerCase() === 'vocabulary') {
        await alert("The Vocabulary category must be capitalized. It has been auto-corrected.");
        newType = 'Vocabulary';
    }
    
    if (customTypes.includes(newType)) {
        await alert("This category type already exists.");
        return;
    }
    
    customTypes.push(newType);
    localStorage.setItem('customTypes', JSON.stringify(customTypes));
    updateTypeDatalists();
    input.value = '';
}

// ------ Premium Custom Dropdown Component ------

function buildCustomDropdownUI(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Hide the native select cleanly
    select.style.display = 'none';
    
    // Check if we already created the custom dropdown wrapper
    let customWrapper = document.getElementById(`custom-dropdown-${selectId}`);
    if (!customWrapper) {
        customWrapper = document.createElement('div');
        customWrapper.id = `custom-dropdown-${selectId}`;
        customWrapper.className = 'custom-dropdown';
        select.parentNode.insertBefore(customWrapper, select);
    }
    
    // Clear and build the trigger and menu elements
    customWrapper.innerHTML = '';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-dropdown-trigger';
    trigger.tabIndex = 0; // support keyboard focus
    
    const triggerText = document.createElement('span');
    triggerText.className = 'custom-dropdown-text';
    
    // Find text of current selected option
    const activeOpt = [...select.options].find(o => o.value === select.value) || select.options[0];
    triggerText.textContent = activeOpt ? activeOpt.textContent : '';
    
    const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('viewBox', '0 0 24 24');
    arrowSvg.setAttribute('fill', 'none');
    arrowSvg.setAttribute('stroke', 'currentColor');
    arrowSvg.setAttribute('stroke-width', '2.5');
    arrowSvg.setAttribute('stroke-linecap', 'round');
    arrowSvg.setAttribute('stroke-linejoin', 'round');
    arrowSvg.className.baseVal = 'custom-dropdown-arrow';
    arrowSvg.style.width = '14px';
    arrowSvg.style.height = '14px';
    arrowSvg.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    
    trigger.appendChild(triggerText);
    trigger.appendChild(arrowSvg);
    customWrapper.appendChild(trigger);
    
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    
    [...select.options].forEach(opt => {
        const item = document.createElement('div');
        item.className = 'custom-dropdown-item';
        item.dataset.value = opt.value;
        item.textContent = opt.textContent;
        
        if (opt.value === select.value) {
            item.classList.add('active');
            
            // Add a checkmark icon to the active item for visual excellence
            const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            check.setAttribute('viewBox', '0 0 24 24');
            check.setAttribute('fill', 'none');
            check.setAttribute('stroke', 'currentColor');
            check.setAttribute('stroke-width', '3');
            check.setAttribute('stroke-linecap', 'round');
            check.setAttribute('stroke-linejoin', 'round');
            check.style.width = '14px';
            check.style.height = '14px';
            check.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
            item.appendChild(check);
        }
        
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Play synthesized selection click sound
            playUISound('click');
            
            // Update hidden native select value
            select.value = opt.value;
            
            // Dispatch dynamic change event so standard app triggers fire cleanly!
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Re-render custom dropdown elements to sync state
            buildCustomDropdownUI(selectId);
            
            // Close the menu
            customWrapper.classList.remove('open');
        });
        
        menu.appendChild(item);
    });
    
    customWrapper.appendChild(menu);
    
    // Toggle opening/closing on trigger click
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Play synthesized haptic pop sound
        playUISound('click');
        
        // Close other open custom dropdowns first
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== customWrapper) d.classList.remove('open');
        });
        
        customWrapper.classList.toggle('open');
    });
}

// Close all custom dropdown menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
    }
});


