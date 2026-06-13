import { playUISound } from './sound.js';
import { escapeHtml } from './utils.js';
import { state } from './state.js';

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
    const isCardTypeDropdown = selectId === 'card-type' || selectId === 'edit-card-type' || selectId === 'practice-type-select' || selectId === 'manage-type-select';
    
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

    if (isCardTypeDropdown && isMultiSelect && !select.selectedSubcategories) {
        select.selectedSubcategories = {};
        if (state.cardTypesConfig) {
            state.cardTypesConfig.forEach(tcConfig => {
                select.selectedSubcategories[tcConfig.name] = [...tcConfig.subcategories];
            });
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
            // Card Type Multi-Select
            const activeIndividualTypes = select.selectedValues.filter(v => v !== 'mixed');
            const totalTypes = [...select.options].filter(o => o.value !== 'mixed' && o.value !== 'add_new').length;
            
            // Check if any subcategory filtering is active
            let hasSubcategoryFiltering = false;
            if (select.selectedSubcategories && state.cardTypesConfig) {
                hasSubcategoryFiltering = Object.keys(select.selectedSubcategories).some(type => {
                    const selected = select.selectedSubcategories[type] || [];
                    const config = state.cardTypesConfig.find(tc => tc.name === type);
                    return config && config.subcategories.length > 0 && selected.length < config.subcategories.length;
                });
            }

            if ((select.selectedValues.includes('mixed') || activeIndividualTypes.length === totalTypes) && !hasSubcategoryFiltering) {
                triggerText.textContent = 'All Types (Mixed)';
            } else if (activeIndividualTypes.length === 0) {
                triggerText.textContent = 'None Selected';
            } else {
                const parts = [];
                activeIndividualTypes.forEach(type => {
                    const config = state.cardTypesConfig ? state.cardTypesConfig.find(tc => tc.name === type) : null;
                    const selectedSubs = select.selectedSubcategories ? select.selectedSubcategories[type] : null;
                    if (config && config.subcategories.length > 0 && selectedSubs) {
                        if (selectedSubs.length === config.subcategories.length) {
                            parts.push(type);
                        } else if (selectedSubs.length > 0) {
                            parts.push(`${type} (${selectedSubs.join(', ')})`);
                        }
                    } else {
                        parts.push(type);
                    }
                });
                if (parts.length === 0) {
                    triggerText.textContent = 'None Selected';
                } else {
                    const summary = parts.join(', ');
                    triggerText.textContent = summary.length > 25 ? `${parts.length} Types Selected` : summary;
                }
            }
        }
    } else {
        // Single Select
        const activeOpt = [...select.options].find(o => o.value === select.value) || select.options[0];
        if (activeOpt) {
            if (isCardTypeDropdown && select.selectedSubcategory) {
                const config = state.cardTypesConfig ? state.cardTypesConfig.find(tc => tc.name === activeOpt.value) : null;
                if (config && config.subcategories.includes(select.selectedSubcategory)) {
                    triggerText.textContent = `${activeOpt.textContent} (${select.selectedSubcategory})`;
                } else {
                    triggerText.textContent = activeOpt.textContent;
                }
            } else {
                triggerText.textContent = activeOpt.textContent;
            }
        } else {
            triggerText.textContent = '';
        }
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
        
        // Setup draggability for card types dropdowns
        const canDrag = isCardTypeDropdown && opt.value !== 'mixed' && opt.value !== 'add_new';
        if (canDrag) {
            item.draggable = true;
            
            const grip = document.createElement('span');
            grip.className = 'custom-dropdown-grip';
            grip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="9" cy="5" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle></svg>';
            item.appendChild(grip);
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', opt.value);
                item.classList.add('dragging');
                customWrapper.classList.add('dragging-active');
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                customWrapper.classList.remove('dragging-active');
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingItem = menu.querySelector('.dragging');
                if (draggingItem && draggingItem !== item) {
                    const rect = item.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    menu.insertBefore(draggingItem, next ? item.nextSibling : item);
                }
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const newOrder = [...menu.querySelectorAll('.custom-dropdown-item')]
                    .map(el => el.dataset.value)
                    .filter(val => val && val !== 'add_new' && val !== 'mixed');
                
                document.dispatchEvent(new CustomEvent('cardTypesReordered', { detail: { newOrder } }));
            });
        }
        
        // Multi-select or single-select specific rendering
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
            
            // Click listener for main item (multi-select)
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
                    // Card Type multi-select
                    const tcConfig = state.cardTypesConfig ? state.cardTypesConfig.find(tc => tc.name === opt.value) : null;
                    if (opt.value === 'mixed') {
                        const wasChecked = select.selectedValues.includes('mixed');
                        if (wasChecked) {
                            select.selectedValues = [];
                            if (select.selectedSubcategories) {
                                Object.keys(select.selectedSubcategories).forEach(type => {
                                    select.selectedSubcategories[type] = [];
                                });
                            }
                        } else {
                            select.selectedValues = [...select.options]
                                .map(o => o.value)
                                .filter(v => v !== 'add_new');
                            if (select.selectedSubcategories && state.cardTypesConfig) {
                                state.cardTypesConfig.forEach(tcConfig => {
                                    select.selectedSubcategories[tcConfig.name] = [...tcConfig.subcategories];
                                });
                            }
                        }
                    } else {
                        const isChecked = select.selectedValues.includes(opt.value);
                        if (isChecked) {
                            select.selectedValues = select.selectedValues.filter(v => v !== opt.value);
                            select.selectedValues = select.selectedValues.filter(v => v !== 'mixed');
                            if (select.selectedSubcategories) {
                                select.selectedSubcategories[opt.value] = [];
                            }
                        } else {
                            select.selectedValues.push(opt.value);
                            if (select.selectedSubcategories && tcConfig) {
                                select.selectedSubcategories[opt.value] = [...tcConfig.subcategories];
                            }
                            
                            const allIndividualTypes = [...select.options]
                                .map(o => o.value)
                                .filter(v => v !== 'mixed' && v !== 'add_new');
                            
                            const allChecked = allIndividualTypes.every(v => select.selectedValues.includes(v));
                            
                            // Check if subcategory filtering is active
                            let hasSubcategoryFiltering = false;
                            if (select.selectedSubcategories && state.cardTypesConfig) {
                                hasSubcategoryFiltering = Object.keys(select.selectedSubcategories).some(type => {
                                    const selected = select.selectedSubcategories[type] || [];
                                    const config = state.cardTypesConfig.find(tc => tc.name === type);
                                    return config && config.subcategories.length > 0 && selected.length < config.subcategories.length;
                                });
                            }

                            if (allChecked && !hasSubcategoryFiltering) {
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
            // Single select
            const textSpan = document.createElement('span');
            textSpan.textContent = opt.textContent;
            item.appendChild(textSpan);
            
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
                check.style.marginLeft = '8px';
                check.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                item.appendChild(check);
            }
            
            // Click listener for main item (single-select)
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                playUISound('click');
                select.value = opt.value;
                if (isCardTypeDropdown) {
                    select.selectedSubcategory = null;
                }
                select.dispatchEvent(new Event('change', { bubbles: true }));
                buildCustomDropdownUI(selectId);
                customWrapper.classList.remove('open');
            });
        }
        
        // Setup Hover Subcategory Submenu
        if (isCardTypeDropdown && opt.value !== 'mixed' && opt.value !== 'add_new') {
            const tcConfig = state.cardTypesConfig ? state.cardTypesConfig.find(tc => tc.name === opt.value) : null;
            if (tcConfig) {
                // Add tiny indicator arrow to show submenu exists
                const rightArrow = document.createElement('span');
                rightArrow.style.marginLeft = 'auto';
                rightArrow.style.fontSize = '0.75rem';
                rightArrow.style.opacity = '0.5';
                rightArrow.innerHTML = '&#9656;';
                item.appendChild(rightArrow);
                
                const submenu = document.createElement('div');
                submenu.className = 'custom-dropdown-submenu';
                
                // Position adjustment on hover to avoid clipping
                item.addEventListener('mouseenter', () => {
                    const rect = item.getBoundingClientRect();
                    const submenuWidth = 200;
                    if (rect.right + submenuWidth > window.innerWidth) {
                        submenu.style.left = 'auto';
                        submenu.style.right = '100%';
                    } else {
                        submenu.style.left = '100%';
                        submenu.style.right = 'auto';
                    }
                });
                
                // Render Subcategories
                tcConfig.subcategories.forEach(sub => {
                    const submenuItem = document.createElement('div');
                    submenuItem.className = 'custom-dropdown-submenu-item';
                    
                    const isSubChecked = isMultiSelect
                        ? (select.selectedSubcategories[opt.value] && select.selectedSubcategories[opt.value].includes(sub))
                        : (select.selectedSubcategory === sub);
                    
                    const subCheckbox = document.createElement('span');
                    subCheckbox.className = `custom-dropdown-checkbox ${isSubChecked ? 'checked' : ''}`;
                    if (isSubChecked) {
                        subCheckbox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    }
                    
                    const subText = document.createElement('span');
                    subText.textContent = sub;
                    
                    submenuItem.appendChild(subCheckbox);
                    submenuItem.appendChild(subText);
                    
                    submenuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playUISound('click');
                        
                        if (isMultiSelect) {
                            if (!select.selectedSubcategories[opt.value]) {
                                select.selectedSubcategories[opt.value] = [];
                            }
                            const isAlreadyChecked = select.selectedSubcategories[opt.value].includes(sub);
                            if (isAlreadyChecked) {
                                select.selectedSubcategories[opt.value] = select.selectedSubcategories[opt.value].filter(v => v !== sub);
                            } else {
                                select.selectedSubcategories[opt.value].push(sub);
                            }
                            
                            // Adjust parent type checkbox selection
                            const hasAnyChecked = select.selectedSubcategories[opt.value].length > 0;
                            const isParentChecked = select.selectedValues.includes(opt.value);
                            if (hasAnyChecked && !isParentChecked) {
                                select.selectedValues.push(opt.value);
                            } else if (!hasAnyChecked && isParentChecked) {
                                select.selectedValues = select.selectedValues.filter(v => v !== opt.value);
                            }
                            
                            // Update mixed option status based on complete subcategory selections
                            const allIndividualTypes = [...select.options]
                                .map(o => o.value)
                                .filter(v => v !== 'mixed' && v !== 'add_new');
                            const allChecked = allIndividualTypes.every(v => select.selectedValues.includes(v));
                            
                            let hasSubcategoryFiltering = false;
                            if (select.selectedSubcategories && state.cardTypesConfig) {
                                hasSubcategoryFiltering = Object.keys(select.selectedSubcategories).some(type => {
                                    const selected = select.selectedSubcategories[type] || [];
                                    const config = state.cardTypesConfig.find(tc => tc.name === type);
                                    return config && config.subcategories.length > 0 && selected.length < config.subcategories.length;
                                });
                            }
                            
                            if (allChecked && !hasSubcategoryFiltering) {
                                if (!select.selectedValues.includes('mixed')) {
                                    select.selectedValues.push('mixed');
                                }
                            } else {
                                select.selectedValues = select.selectedValues.filter(v => v !== 'mixed');
                            }
                            
                            // Re-calculate select.value
                            if (select.selectedValues.includes('mixed')) {
                                select.value = 'mixed';
                            } else if (select.selectedValues.length > 0) {
                                select.value = select.selectedValues[0];
                            } else {
                                select.value = '';
                            }
                        } else {
                            // Single Select
                            if (select.selectedSubcategory === sub) {
                                select.selectedSubcategory = null;
                            } else {
                                select.selectedSubcategory = sub;
                                select.value = opt.value;
                            }
                            customWrapper.classList.remove('open');
                        }
                        
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        buildCustomDropdownUI(selectId);
                    });
                    
                    submenu.appendChild(submenuItem);
                });
                
                // Add Subcategory Prompt Trigger
                const addSubBtn = document.createElement('div');
                addSubBtn.className = 'custom-dropdown-submenu-add';
                addSubBtn.innerHTML = '<span>+ Add Subcategory...</span>';
                addSubBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    playUISound('click');
                    
                    const newSub = await window.prompt(`Enter new subcategory for ${opt.value}:`);
                    if (newSub && newSub.trim() !== '') {
                        const cleanSub = newSub.trim();
                        if (!tcConfig.subcategories.includes(cleanSub)) {
                            tcConfig.subcategories.push(cleanSub);
                            localStorage.setItem('cardTypesConfig', JSON.stringify(state.cardTypesConfig));
                            
                            // Auto check new subcategory
                            if (isMultiSelect) {
                                if (!select.selectedSubcategories[opt.value]) {
                                    select.selectedSubcategories[opt.value] = [];
                                }
                                select.selectedSubcategories[opt.value].push(cleanSub);
                                if (!select.selectedValues.includes(opt.value)) {
                                    select.selectedValues.push(opt.value);
                                }
                            } else {
                                select.selectedSubcategory = cleanSub;
                                select.value = opt.value;
                            }
                            
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            buildCustomDropdownUI(selectId);
                        }
                    }
                });
                submenu.appendChild(addSubBtn);
                item.appendChild(submenu);
            }
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

