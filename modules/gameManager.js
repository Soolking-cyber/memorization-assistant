import { state } from './state.js';
import { updateDashboard } from './dashboard.js';
import { switchView } from './navigation.js';

// Game module registry
const G_REGISTRY = {
    scramble: {
        id: 'scramble',
        name: 'Word Scramble',
        description: 'Rearrange mixed letters to practice vocabulary spelling.',
        icon: '🧩',
        navViewId: 'scramble',
        entryPoint: './practice/scrambleGame.js',
        loaded: false,
        async init() {
            const mod = await import(this.entryPoint);
            window.initScrambleView = mod.initScrambleView;
            window.resetScrambleGame = mod.resetScrambleGame;
            window.handleScrambleKeydown = mod.handleScrambleKeydown;

            this._keydownHandler = (e) => {
                const viewScramble = document.getElementById('view-scramble');
                if (viewScramble && !viewScramble.classList.contains('hidden')) {
                    mod.handleScrambleKeydown(e);
                }
            };
            document.addEventListener('keydown', this._keydownHandler);
            this.loaded = true;
        },
        unload() {
            if (this._keydownHandler) {
                document.removeEventListener('keydown', this._keydownHandler);
                this._keydownHandler = null;
            }
            delete window.initScrambleView;
            delete window.resetScrambleGame;
            delete window.handleScrambleKeydown;
            this.loaded = false;
        }
    },
    collection: {
        id: 'collection',
        name: 'Recall Decks',
        description: 'Study custom Poké-style cards grouped by struggle metrics.',
        icon: '🃏',
        navViewId: 'collection',
        entryPoint: './gamification.js',
        loaded: false,
        async init() {
            const mod = await import(this.entryPoint);
            window.renderCollectionDeck = mod.renderCollectionDeck;
            window.calculateCardStats = mod.calculateCardStats;
            this.loaded = true;
        },
        unload() {
            delete window.renderCollectionDeck;
            delete window.calculateCardStats;
            this.loaded = false;
        }
    }
};

export function getModulesStorageKey() {
    return 'active_modules';
}

export function loadStoredModules() {
    const key = getModulesStorageKey();
    let stored = JSON.parse(localStorage.getItem(key));
    if (!stored || !Array.isArray(stored)) {
        stored = ['scramble', 'collection'];
        localStorage.setItem(key, JSON.stringify(stored));
    }
    state.activeModules = stored;
}

export async function loadModules() {
    loadStoredModules();
    
    const initPromises = [];
    for (const modId in G_REGISTRY) {
        const mod = G_REGISTRY[modId];
        const isActive = state.activeModules.includes(modId);
        
        if (isActive) {
            if (!mod.loaded) {
                initPromises.push(mod.init().catch(err => {
                    console.error(`Failed to load module ${modId}:`, err);
                }));
            }
        } else {
            if (mod.loaded) {
                mod.unload();
            }
        }
    }
    
    await Promise.all(initPromises);
    updateModuleUI();
}

export async function toggleModule(modId, active) {
    const key = getModulesStorageKey();
    let stored = JSON.parse(localStorage.getItem(key)) || ['scramble', 'collection'];
    
    if (active) {
        if (!stored.includes(modId)) stored.push(modId);
    } else {
        stored = stored.filter(id => id !== modId);
    }
    
    localStorage.setItem(key, JSON.stringify(stored));
    state.activeModules = stored;
    
    const mod = G_REGISTRY[modId];
    if (mod) {
        if (active) {
            if (!mod.loaded) {
                await mod.init().catch(err => console.error(err));
            }
        } else {
            if (mod.loaded) {
                mod.unload();
            }
        }
    }
    
    updateModuleUI();
    updateDashboard();
}

export function updateModuleUI() {
    for (const modId in G_REGISTRY) {
        const mod = G_REGISTRY[modId];
        const isActive = state.activeModules.includes(modId);
        
        // Hide/show sidebar nav button
        const navBtn = document.querySelector(`.nav-btn[data-view="${mod.navViewId}"]`);
        if (navBtn) {
            if (isActive) {
                navBtn.style.display = '';
            } else {
                navBtn.style.display = 'none';
                
                // If we are currently on the disabled view, redirect to dashboard
                if (navBtn.classList.contains('active')) {
                    switchView('dashboard');
                }
            }
        }
    }
}

export function renderSettingsToggles() {
    const listContainer = document.getElementById('settings-modules-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    for (const modId in G_REGISTRY) {
        const mod = G_REGISTRY[modId];
        const isActive = state.activeModules.includes(modId);
        
        const toggleItem = document.createElement('div');
        toggleItem.className = 'module-toggle-item';
        toggleItem.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 16px;
            transition: all 0.2s ease;
        `;
        
        toggleItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                <span style="font-size: 1.8rem; line-height: 1;">${mod.icon}</span>
                <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                    <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-primary);">${mod.name}</span>
                    <span style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${mod.description}</span>
                </div>
            </div>
            <label class="switch-control" style="position: relative; display: inline-block; width: 46px; height: 26px; flex-shrink: 0; margin-left: 12px;">
                <input type="checkbox" id="module-toggle-${modId}" ${isActive ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                <span class="switch-slider"></span>
            </label>
        `;
        
        const checkbox = toggleItem.querySelector(`input[type="checkbox"]`);
        checkbox.addEventListener('change', async (e) => {
            const isChecked = e.target.checked;
            toggleItem.style.opacity = '0.7';
            checkbox.disabled = true;
            await toggleModule(modId, isChecked);
            toggleItem.style.opacity = '1';
            checkbox.disabled = false;
        });
        
        listContainer.appendChild(toggleItem);
    }
}
