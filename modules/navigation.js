import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { playUISound } from './sound.js';
import { hideExplanationTooltip } from './canvas.js';
import { loadData, renderManageView, renderCreateSentencesList, updateCardInDB } from './flashcardCrud.js';
import { updateDashboard, handleTypeSelectChange } from './dashboard.js';
import { renderStatistics } from './stats.js';
import { renderCollectionDeck } from './gamification.js';
import { buildCustomDropdownUI } from './uiHelpers.js';


export function initThemeSystem() {
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (!btnThemeToggle) return;
    
    const moonIcon = btnThemeToggle.querySelector('.theme-icon-light');
    const sunIcon = btnThemeToggle.querySelector('.theme-icon-dark');
    
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

export function initNavigation() {
    document.querySelectorAll('[data-view]').forEach(elem => {
        elem.addEventListener('click', (e) => {
            try { playUISound('click'); } catch(err) {}
            const targetView = e.currentTarget.dataset.view;
            switchView(targetView);
        });
    });
}

export async function switchView(viewId) {
    hideExplanationTooltip();

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
        activeCard.style.minHeight = '';
        activeCard.style.maxHeight = '';
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
        v.style.opacity = '0';
        v.style.transform = 'translateY(10px) scale(0.995)';
        v.classList.add('hidden');
    });

    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.remove('hidden');
        void target.offsetWidth;
        target.style.opacity = '1';
        target.style.transform = 'translateY(0) scale(1)';
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.view === viewId) {
            btn.classList.add('active');
        } else {
            if(!btn.classList.contains('primary-nav-btn')) btn.classList.remove('active');
        }
    });

    if (viewId === 'dashboard') {
        const select = document.getElementById('practice-type-select');
        if (select) {
            select.selectedValues = [...select.options].map(o => o.value).filter(v => v !== 'add_new');
            select.value = 'mixed';
            buildCustomDropdownUI('practice-type-select');
        }
        
        if (state.userSession && supabase) {
            loadData();
        } else {
            updateDashboard();
        }
    } else if (viewId === 'stats') {
        await renderStatistics();
    } else if (viewId === 'collection') {
        await renderCollectionDeck();
    }
    if (viewId === 'create') {
        state.draftCreateSentences = [];
        const createSentencesInput = document.getElementById('create-new-sentence');
        if (createSentencesInput) createSentencesInput.value = '';
        const createError = document.getElementById('create-sentence-error');
        if (createError) createError.style.display = 'none';
        renderCreateSentencesList();
        
        const cardTypeSelect = document.getElementById('card-type');
        if (cardTypeSelect) {
            cardTypeSelect.value = 'Vocabulary';
            handleTypeSelectChange({ target: cardTypeSelect });
        }
    }
    if (viewId === 'manage') {
        const searchInput = document.getElementById('manage-search-input');
        if (searchInput) searchInput.value = '';
        renderManageView();
    }
}

export function updateUserAvatarBadge() {
    if (state.userSession && state.userSession.user) {
        const userId = state.userSession.user.id;
        const email = state.userSession.user.email || 'User';
        
        let savedUsername = localStorage.getItem(`profile_username_${userId}`) || '';
        if (!savedUsername && state.userSession.user.user_metadata && state.userSession.user.user_metadata.display_name) {
            savedUsername = state.userSession.user.user_metadata.display_name;
            localStorage.setItem(`profile_username_${userId}`, savedUsername);
        }
        
        let savedAvatarUrl = localStorage.getItem(`profile_avatar_url_${userId}`) || '';
        if (!savedAvatarUrl && state.userSession.user.user_metadata && state.userSession.user.user_metadata.avatar_url) {
            savedAvatarUrl = state.userSession.user.user_metadata.avatar_url;
            localStorage.setItem(`profile_avatar_url_${userId}`, savedAvatarUrl);
        }
        
        const displayName = savedUsername || email;
        const initial = displayName.charAt(0).toUpperCase();
        
        const dropdownEmail = document.getElementById('user-dropdown-email');
        if (dropdownEmail) {
            dropdownEmail.textContent = savedUsername ? `${savedUsername} (${email})` : email;
        }

        const settingsEmail = document.getElementById('settings-email');
        if (settingsEmail) {
            settingsEmail.textContent = savedUsername ? `${savedUsername} (${email})` : email;
        }

        const settingsStatCount = document.getElementById('settings-stat-count');
        if (settingsStatCount) settingsStatCount.textContent = state.cards.length;

        const applyAvatarStyle = (avatarEl, showInitialText) => {
            if (!avatarEl) return;
            if (savedAvatarUrl) {
                avatarEl.style.backgroundImage = `url('${savedAvatarUrl}')`;
                avatarEl.style.backgroundColor = 'transparent';
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
                avatarEl.textContent = '';
            } else {
                avatarEl.style.backgroundImage = 'none';
                avatarEl.style.backgroundColor = 'var(--accent)';
                avatarEl.style.color = 'var(--btn-primary-text)';
                if (showInitialText) {
                    avatarEl.textContent = initial;
                }
            }
        };

        const badge = document.getElementById('user-avatar-badge');
        applyAvatarStyle(badge, true);

        const settingsAvatar = document.getElementById('settings-avatar');
        applyAvatarStyle(settingsAvatar, true);
        
        const btnRemoveAvatar = document.getElementById('btn-settings-remove-avatar');
        if (btnRemoveAvatar) {
            btnRemoveAvatar.style.display = savedAvatarUrl ? 'inline-block' : 'none';
        }
    }
}

export function initProfileMenu() {
    const avatarBadge = document.getElementById('user-avatar-badge');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsModal = document.getElementById('settings-modal');
    const usernameInput = document.getElementById('settings-username-input');

    if (avatarBadge && dropdownMenu) {
        avatarBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

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
            
            if (state.userSession && state.userSession.user) {
                const userId = state.userSession.user.id;
                const email = state.userSession.user.email || 'User';
                
                const savedUsername = localStorage.getItem(`profile_username_${userId}`) || '';
                const savedAvatarUrl = localStorage.getItem(`profile_avatar_url_${userId}`) || '';
                
                const displayName = savedUsername || email;
                const initial = displayName.charAt(0).toUpperCase();
                
                const settingsAvatar = document.getElementById('settings-avatar');
                const settingsEmail = document.getElementById('settings-email');
                const settingsStatCount = document.getElementById('settings-stat-count');
                
                if (settingsEmail) settingsEmail.textContent = savedUsername ? `${savedUsername} (${email})` : email;
                if (settingsStatCount) settingsStatCount.textContent = state.cards.length;
                
                if (usernameInput) usernameInput.value = savedUsername;
                
                if (settingsAvatar) {
                    if (savedAvatarUrl) {
                        settingsAvatar.style.backgroundImage = `url('${savedAvatarUrl}')`;
                        settingsAvatar.style.backgroundColor = 'transparent';
                        settingsAvatar.textContent = '';
                    } else {
                        settingsAvatar.style.backgroundImage = 'none';
                        settingsAvatar.style.backgroundColor = 'var(--accent)';
                        settingsAvatar.style.color = 'var(--btn-primary-text)';
                        settingsAvatar.textContent = initial;
                    }
                }
            }
            
            settingsModal.classList.remove('hidden');
        });
    }

    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (!state.userSession || !state.userSession.user) return;
            const userId = state.userSession.user.id;
            const avatarUrl = localStorage.getItem(`profile_avatar_url_${userId}`) || '';
            if (!avatarUrl) {
                const avatarEl = document.getElementById('settings-avatar');
                if (avatarEl) {
                    const email = state.userSession.user.email || 'User';
                    const name = usernameInput.value.trim() || email;
                    avatarEl.textContent = name.charAt(0).toUpperCase();
                }
            }
        });
    }

    const avatarFileInput = document.getElementById('settings-avatar-file-input');
    const btnUploadAvatar = document.getElementById('btn-settings-upload-avatar');
    
    if (btnUploadAvatar && avatarFileInput) {
        btnUploadAvatar.addEventListener('click', () => avatarFileInput.click());
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                await window.alert("File is too large! Maximum allowed size is 2MB.");
                avatarFileInput.value = '';
                return;
            }
            
            if (!state.userSession || !state.userSession.user) return;
            const userId = state.userSession.user.id;
            
            const btnUploadText = btnUploadAvatar.querySelector('span');
            const originalText = btnUploadText ? btnUploadText.textContent : "Upload Photo";
            if (btnUploadText) btnUploadText.textContent = "Uploading...";
            btnUploadAvatar.disabled = true;
            
            try {
                if (supabase) {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${userId}/avatar.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file, { upsert: true });
                        
                    if (uploadError) throw uploadError;
                    
                    const { data } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                        
                    const publicUrl = data.publicUrl;
                    localStorage.setItem(`profile_avatar_url_${userId}`, publicUrl);
                    
                    const settingsAvatar = document.getElementById('settings-avatar');
                    if (settingsAvatar) {
                        settingsAvatar.style.backgroundImage = `url('${publicUrl}')`;
                        settingsAvatar.style.backgroundColor = 'transparent';
                        settingsAvatar.textContent = '';
                    }
                    
                    updateUserAvatarBadge();
                    playUISound('success');
                    await window.alert("Avatar uploaded successfully!");
                } else {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64Url = event.target.result;
                        localStorage.setItem(`profile_avatar_url_${userId}`, base64Url);
                        
                        const settingsAvatar = document.getElementById('settings-avatar');
                        if (settingsAvatar) {
                            settingsAvatar.style.backgroundImage = `url('${base64Url}')`;
                            settingsAvatar.style.backgroundColor = 'transparent';
                            settingsAvatar.textContent = '';
                        }
                        
                        updateUserAvatarBadge();
                        playUISound('success');
                        await window.alert("Avatar uploaded successfully (Offline Mode)!");
                    };
                    reader.readAsDataURL(file);
                }
            } catch (err) {
                await window.alert("Failed to upload avatar: " + err.message);
            } finally {
                if (btnUploadText) btnUploadText.textContent = originalText;
                btnUploadAvatar.disabled = false;
                avatarFileInput.value = '';
            }
        });
    }

    const btnRemoveAvatar = document.getElementById('btn-settings-remove-avatar');
    if (btnRemoveAvatar) {
        btnRemoveAvatar.addEventListener('click', async () => {
            if (!state.userSession || !state.userSession.user) return;
            const userId = state.userSession.user.id;
            
            if (await window.confirm("Are you sure you want to remove your profile photo?")) {
                localStorage.removeItem(`profile_avatar_url_${userId}`);
                
                const settingsAvatar = document.getElementById('settings-avatar');
                if (settingsAvatar) {
                    settingsAvatar.style.backgroundImage = 'none';
                    settingsAvatar.style.backgroundColor = 'var(--accent)';
                    settingsAvatar.style.color = 'var(--btn-primary-text)';
                    
                    const email = state.userSession.user.email || 'User';
                    const displayName = usernameInput ? usernameInput.value.trim() || email : email;
                    settingsAvatar.textContent = displayName.charAt(0).toUpperCase();
                }
                
                if (supabase) {
                    supabase.auth.updateUser({
                        data: {
                            avatar_url: ''
                        }
                    }).then();
                }
                
                updateUserAvatarBadge();
                playUISound('success');
                await window.alert("Profile photo removed.");
            }
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

    const btnSaveProfile = document.getElementById('btn-settings-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            if (!state.userSession || !state.userSession.user) return;
            const userId = state.userSession.user.id;
            
            const username = usernameInput ? usernameInput.value.trim() : '';
            
            localStorage.setItem(`profile_username_${userId}`, username);
            
            if (supabase) {
                supabase.auth.updateUser({
                    data: {
                        display_name: username
                    }
                }).then();
            }
            
            playUISound('success');
            updateUserAvatarBadge();
            if (settingsModal) settingsModal.classList.add('hidden');
            await window.alert("Profile settings saved successfully!");
        });
    }

    const btnChangePassword = document.getElementById('btn-settings-change-password');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', async () => {
            const newPassword = await window.prompt("Enter your new account password:");
            if (newPassword && newPassword.trim().length >= 6) {
                if (supabase) {
                    try {
                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                        if (error) throw error;
                        playUISound('success');
                        await window.alert("Password updated successfully!");
                    } catch (err) {
                        await window.alert("Failed to update password: " + err.message);
                    }
                } else {
                    await window.alert("Supabase is not connected in this session.");
                }
            } else if (newPassword) {
                await window.alert("Password must be at least 6 characters long.");
            }
        });
    }

    const btnResetIntervals = document.getElementById('btn-settings-reset-intervals');
    if (btnResetIntervals) {
        btnResetIntervals.addEventListener('click', async () => {
            if (await window.confirm("Are you sure you want to reset spaced repetition intervals on all memories? This will reschedule all cards to be due immediately and cannot be undone.")) {
                state.cards.forEach(card => {
                    card.repetitions = 0;
                    card.interval = 1;
                    card.ease = 2.5;
                    card.nextReview = Date.now();
                    updateCardInDB(card);
                });
                updateDashboard();
                playUISound('success');
                await window.alert("Spaced repetition intervals have been reset successfully!");
            }
        });
    }
}
