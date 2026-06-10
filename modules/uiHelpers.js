import { playUISound } from './sound.js';
import { escapeHtml } from './utils.js';

export const fontSizeMap = {
    small: { keyword: '0.7rem', exp: '0.65rem' },
    medium: { keyword: '0.8rem', exp: '0.75rem' },
    large: { keyword: '1.0rem', exp: '0.85rem' },
    xl: { keyword: '1.2rem', exp: '0.95rem' }
};

export function showAlert(message) {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p>${escapeHtml(message)}</p>
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

export function showConfirm(message) {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p>${escapeHtml(message)}</p>
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

export function showPrompt(message, defaultValue = '') {
    playUISound('click');
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal-content glass animate-pop-in">
                <div class="custom-modal-body">
                    <p style="margin-bottom: 12px; font-weight: 700;">${escapeHtml(message)}</p>
                    <input type="text" class="custom-modal-prompt-input" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: border-color 0.15s ease;">
                </div>
                <div class="custom-modal-footer" style="display: flex; gap: 12px; justify-content: center; width: 100%; margin-top: 16px;">
                    <button class="btn modal-cancel-btn" style="flex: 1; background: var(--bg-secondary); color: var(--text-primary); border: 2px solid var(--border-color);">Cancel</button>
                    <button class="btn primary modal-ok-btn" style="flex: 1;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const inputEl = modal.querySelector('.custom-modal-prompt-input');
        // Set value via DOM property (not attribute) to prevent attribute injection XSS
        if (inputEl) inputEl.value = defaultValue ?? '';
        
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

// Override global dialog triggers
window.alert = showAlert;
window.confirm = showConfirm;
window.prompt = showPrompt;

export function toggleFullscreen(containerId, buttonId) {
    const container = document.getElementById(containerId);
    const btn = document.getElementById(buttonId);
    if (!container || !btn) return;
    
    const isFullscreen = container.classList.toggle('canvas-container-fullscreen');
    
    const closeBtn = container.querySelector('.fullscreen-close-btn');
    if (isFullscreen) {
        container._originalParent = container.parentNode;
        container._originalNextSibling = container.nextSibling;
        
        document.body.appendChild(container);
        
        btn.classList.add('fullscreen-active');
        btn.title = "Exit Fullscreen";
        if (closeBtn) closeBtn.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        if (container._originalParent) {
            container._originalParent.insertBefore(container, container._originalNextSibling);
        }
        
        btn.classList.remove('fullscreen-active');
        btn.title = "Toggle Fullscreen";
        if (closeBtn) closeBtn.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

export function buildCustomDropdownUI(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.style.display = 'none';
    
    const isMultiSelect = selectId === 'practice-type-select' || selectId === 'manage-type-select' || selectId === 'vocab-word-types' || selectId === 'edit-vocab-word-types' || selectId === 'vocab-type' || selectId === 'edit-vocab-type';
    
    let customWrapper = document.getElementById(`custom-dropdown-${selectId}`);
    if (!customWrapper) {
        customWrapper = document.createElement('div');
        customWrapper.id = `custom-dropdown-${selectId}`;
        customWrapper.className = 'custom-dropdown';
        select.parentNode.insertBefore(customWrapper, select);
    }
    
    if (isMultiSelect) {
        customWrapper.classList.add('multi-select');
    } else {
        customWrapper.classList.remove('multi-select');
    }
    
    if (isMultiSelect && !select.selectedValues) {
        if (selectId === 'vocab-word-types' || selectId === 'edit-vocab-word-types' || selectId === 'vocab-type' || selectId === 'edit-vocab-type') {
            select.selectedValues = [];
        } else {
            const options = [...select.options].map(o => o.value).filter(v => v !== 'add_new');
            select.selectedValues = options;
        }
    }
    
    customWrapper.innerHTML = '';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-dropdown-trigger';
    trigger.tabIndex = 0;
    
    const triggerText = document.createElement('span');
    triggerText.className = 'custom-dropdown-text';
    
    if (isMultiSelect) {
        if (selectId === 'vocab-word-types' || selectId === 'edit-vocab-word-types' || selectId === 'vocab-type' || selectId === 'edit-vocab-type') {
            if (select.selectedValues.length === 0) {
                triggerText.textContent = 'Select Word Type(s)';
            } else if (select.selectedValues.length <= 2) {
                triggerText.textContent = select.selectedValues.join(', ');
            } else {
                triggerText.textContent = `${select.selectedValues.length} Types Selected`;
            }
        } else {
            const activeIndividualTypes = select.selectedValues.filter(v => v !== 'mixed');
            const totalTypes = [...select.options].filter(o => o.value !== 'mixed' && o.value !== 'add_new').length;
            
            if (select.selectedValues.includes('mixed') || activeIndividualTypes.length === totalTypes) {
                triggerText.textContent = 'All Types (Mixed)';
            } else if (activeIndividualTypes.length === 0) {
                triggerText.textContent = 'None Selected';
            } else if (activeIndividualTypes.length <= 2) {
                triggerText.textContent = activeIndividualTypes.join(', ');
            } else {
                triggerText.textContent = `${activeIndividualTypes.length} Types Selected`;
            }
        }
    } else {
        const activeOpt = [...select.options].find(o => o.value === select.value) || select.options[0];
        triggerText.textContent = activeOpt ? activeOpt.textContent : '';
    }
    
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
        
        if (isMultiSelect) {
            const isChecked = select.selectedValues.includes(opt.value);
            
            const checkbox = document.createElement('span');
            checkbox.className = `custom-dropdown-checkbox ${isChecked ? 'checked' : ''}`;
            if (isChecked) {
                checkbox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            item.appendChild(checkbox);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = opt.textContent;
            item.appendChild(textSpan);
            
            if (isChecked) {
                item.classList.add('active');
            }
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                playUISound('click');
                
                if (selectId === 'vocab-word-types' || selectId === 'edit-vocab-word-types' || selectId === 'vocab-type' || selectId === 'edit-vocab-type') {
                    const isChecked = select.selectedValues.includes(opt.value);
                    if (isChecked) {
                        select.selectedValues = select.selectedValues.filter(v => v !== opt.value);
                    } else {
                        select.selectedValues.push(opt.value);
                    }
                    [...select.options].forEach(o => {
                        o.selected = select.selectedValues.includes(o.value);
                    });
                } else {
                    if (opt.value === 'mixed') {
                        const wasChecked = select.selectedValues.includes('mixed');
                        if (wasChecked) {
                            select.selectedValues = [];
                        } else {
                            select.selectedValues = [...select.options]
                                .map(o => o.value)
                                .filter(v => v !== 'add_new');
                        }
                    } else {
                        const isChecked = select.selectedValues.includes(opt.value);
                        if (isChecked) {
                            select.selectedValues = select.selectedValues.filter(v => v !== opt.value);
                            select.selectedValues = select.selectedValues.filter(v => v !== 'mixed');
                        } else {
                            select.selectedValues.push(opt.value);
                            
                            const allIndividualTypes = [...select.options]
                                .map(o => o.value)
                                .filter(v => v !== 'mixed' && v !== 'add_new');
                            
                            const allChecked = allIndividualTypes.every(v => select.selectedValues.includes(v));
                            if (allChecked) {
                                select.selectedValues.push('mixed');
                            }
                        }
                    }
                    
                    if (select.selectedValues.includes('mixed')) {
                        select.value = 'mixed';
                    } else if (select.selectedValues.length > 0) {
                        select.value = select.selectedValues[0];
                    } else {
                        select.value = '';
                    }
                }
                
                select.dispatchEvent(new Event('change', { bubbles: true }));
                buildCustomDropdownUI(selectId);
            });
            
        } else {
            item.textContent = opt.textContent;
            
            if (opt.value === select.value) {
                item.classList.add('active');
                
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
                playUISound('click');
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                buildCustomDropdownUI(selectId);
                customWrapper.classList.remove('open');
            });
        }
        
        menu.appendChild(item);
    });
    
    customWrapper.appendChild(menu);
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        playUISound('click');
        
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

let tooltipEl = null;
let tooltipTimeout = null;

export function initGlobalTooltips() {
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[title], [data-tooltip], button, .btn, .btn-icon, .nav-btn, input[type="submit"]');
        if (!target) return;

        // Convert title to data-tooltip to avoid default browser tooltips
        if (target.hasAttribute('title')) {
            const titleVal = target.getAttribute('title');
            if (titleVal && titleVal.trim() !== '') {
                target.setAttribute('data-tooltip', titleVal);
                target.removeAttribute('title');
            }
        }

        let tooltipText = target.getAttribute('data-tooltip');

        // Dynamic fallback logic for buttons
        if (!tooltipText || tooltipText.trim() === '') {
            const isButton = target.tagName === 'BUTTON' || 
                             target.classList.contains('btn') || 
                             target.classList.contains('btn-icon') || 
                             target.classList.contains('nav-btn') || 
                             target.getAttribute('type') === 'submit';
                             
            if (isButton) {
                let rawText = target.textContent || target.innerText || '';
                
                // Handle empty text / icon-only buttons
                if (rawText.trim() === '') {
                    const iconChild = target.querySelector('svg');
                    if (iconChild && iconChild.getAttribute('title')) {
                        rawText = iconChild.getAttribute('title');
                    } else {
                        const id = target.id || '';
                        const className = target.className || '';
                        if (id.includes('zoom-in')) {
                            rawText = 'Zoom In';
                        } else if (id.includes('zoom-out')) {
                            rawText = 'Zoom Out';
                        } else if (id.includes('zoom-reset')) {
                            rawText = 'Reset Zoom';
                        } else if (id.includes('close') || className.includes('close')) {
                            rawText = 'Close View';
                        } else if (id.includes('fullscreen')) {
                            rawText = 'Toggle Fullscreen';
                        } else if (id.includes('grid')) {
                            rawText = 'Toggle Grid Snapping';
                        } else if (className.includes('edit-btn')) {
                            rawText = 'Edit Card';
                        } else if (className.includes('delete-btn')) {
                            rawText = 'Delete Card';
                        } else if (id === 'btn-theme-toggle') {
                            rawText = 'Toggle Theme';
                        } else if (id === 'btn-sound-toggle') {
                            rawText = 'Toggle Sound';
                        }
                    }
                }
                
                let cleanText = rawText.replace(/\s+/g, ' ').trim();
                
                // Map specific IDs to detailed tooltips
                const id = target.id || '';
                if (id === 'btn-theme-toggle') {
                    cleanText = 'Toggle Theme (Light / Dark)';
                } else if (id === 'btn-sound-toggle') {
                    cleanText = 'Toggle Sound Effects';
                } else if (id === 'btn-open-settings') {
                    cleanText = 'Open Profile Settings';
                } else if (id === 'btn-logout') {
                    cleanText = 'Sign Out of Account';
                } else if (id === 'btn-google-login') {
                    cleanText = 'Sign in with Google Account';
                } else if (id === 'btn-practice') {
                    cleanText = 'Start Active Recall Spaced Repetition Practice';
                } else if (id === 'btn-create-add-sentence' || id === 'btn-edit-add-sentence') {
                    cleanText = 'Add Sentence Clue to Draft';
                } else if (id === 'btn-submit-answer') {
                    cleanText = 'Submit Answer (Enter)';
                } else if (id === 'btn-next-card') {
                    cleanText = 'Next Memory (Enter)';
                } else if (id === 'btn-finish-practice') {
                    cleanText = 'Return to Dashboard';
                } else if (id === 'btn-save-sentence') {
                    cleanText = 'Save Sentence Clue to Database';
                } else if (id === 'btn-delete-selected') {
                    cleanText = 'Delete Selected Memory Cards';
                } else if (id === 'btn-back-to-stacks') {
                    cleanText = 'Return to Decks Overview';
                } else if (id === 'btn-create-map-add-node-bar' || id === 'btn-edit-map-add-node-bar') {
                    cleanText = 'Add Card Node to Mind Map';
                } else if (id === 'btn-create-map-clear-bar' || id === 'btn-edit-map-clear-bar') {
                    cleanText = 'Clear Map Canvas';
                }
                
                if (cleanText) {
                    target.setAttribute('data-tooltip', cleanText);
                    tooltipText = cleanText;
                }
            }
        }

        if (!tooltipText || tooltipText.trim() === '') return;

        // Skip repeating/redundant tooltips where tooltip matches visible text
        const visibleText = (target.textContent || target.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (visibleText && tooltipText.trim().toLowerCase() === visibleText) {
            return;
        }

        if (tooltipTimeout) clearTimeout(tooltipTimeout);

        tooltipTimeout = setTimeout(() => {
            showTooltip(target, tooltipText);
        }, 350);
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            hideTooltip();
        }
    });

    document.addEventListener('click', () => {
        hideTooltip();
    });
}

function showTooltip(target, text) {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'custom-tooltip';
        document.body.appendChild(tooltipEl);
    }

    tooltipEl.textContent = text;
    tooltipEl.classList.add('visible');

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

    if (top < 8) {
        top = targetRect.bottom + 8;
    }
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
    }

    tooltipEl.style.top = `${top + window.scrollY}px`;
    tooltipEl.style.left = `${left + window.scrollX}px`;
}

function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    if (tooltipEl) {
        tooltipEl.classList.remove('visible');
    }
}

