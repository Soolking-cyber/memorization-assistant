import { state } from '../state.js';
import { supabase } from '../supabaseClient.js';
import { playUISound } from '../sound.js';
import { updateDashboard, getSelectedTypes } from '../dashboard.js';
import { switchView } from '../navigation.js';
import { loadData } from '../flashcardCrud.js';
import { renderCurrentCard } from '../practice.js';

export function startForcedPractice(count) {
    const now = Date.now();
    state.reviewQueue = state.cards.filter(c => c.nextReview <= now)
                       .sort((a, b) => a.nextReview - b.nextReview);
                       
    if (state.reviewQueue.length === 0) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
        return;
    }
    
    state.reviewQueue = state.reviewQueue.slice(0, count);
    state.currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = state.reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'none';
    
    switchView('practice');
    renderCurrentCard();
}

export function startPractice(forceStudyAhead = false) {
    state.isForcedMode = false;
    const now = Date.now();
    const activeTypes = getSelectedTypes('practice-type-select');
    if (forceStudyAhead) {
        state.reviewQueue = state.cards.filter(c => activeTypes.includes(c.type));
    } else {
        state.reviewQueue = state.cards.filter(c => c.nextReview <= now && activeTypes.includes(c.type))
                           .sort((a, b) => a.nextReview - b.nextReview);
    }
                       
    if (state.reviewQueue.length === 0) return;
    
    state.currentReviewIndex = 0;
    document.getElementById('practice-total').textContent = state.reviewQueue.length;
    
    document.getElementById('active-card').style.display = 'block';
    document.querySelector('.practice-controls').style.display = 'flex';
    document.getElementById('practice-completed').classList.add('hidden');
    document.querySelector('#view-practice .close-view').style.display = 'block';
    
    switchView('practice');
    renderCurrentCard();
}

export function proceedToNextCard() {
    const flashcardEl = document.getElementById('active-card');
    flashcardEl.style.transform = 'translateY(-20px) scale(0.95)';
    flashcardEl.style.opacity = '0';
    
    setTimeout(() => {
        flashcardEl.style.transform = 'none';
        flashcardEl.style.opacity = '1';
        
        state.currentReviewIndex++;
        if (state.currentReviewIndex >= state.reviewQueue.length) {
            finishSession();
        } else {
            renderCurrentCard();
        }
    }, 300);
}

export async function finishSession() {
    playUISound('complete');

    if (state.userSession && supabase) {
        await loadData();
    } else {
        updateDashboard();
    }
    
    document.getElementById('active-card').style.display = 'none';
    document.querySelector('.practice-controls').style.display = 'none';
    
    if (state.isForcedMode) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        if (state.practiceOrigin === 'collection') {
            state.practiceOrigin = null;
            switchView('collection');
        } else {
            switchView('dashboard');
        }
    } else {
        const completedMsg = document.getElementById('practice-completed');
        
        completedMsg.innerHTML = `
            <style>
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            #btn-finish-practice:hover svg {
                transform: translateX(4px);
            }
            </style>
            <div class="session-complete-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; max-width: 420px; margin: 0 auto;">
                <div class="trophy-glow-container" style="position: relative; margin-bottom: 24px; animation: float 3s ease-in-out infinite;">
                    <div class="trophy-glow-bg" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90px; height: 90px; background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%); filter: blur(10px); border-radius: 50%;"></div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 72px; height: 72px; position: relative; z-index: 2; filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path>
                        <path d="M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"></path>
                    </svg>
                </div>
                
                <h2 style="font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin: 0 0 8px 0; background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.7) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Practice Complete!</h2>
                <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.4; margin: 0 0 24px 0;">Congratulations! You have successfully completed your practice session.</p>
                
                <button class="btn primary full-width" id="btn-finish-practice" style="min-height: 48px; font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; border-radius: 12px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25); transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                    Back to Dashboard
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" style="transition: transform 0.2s;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
        `;
        document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));
        completedMsg.classList.remove('hidden');
    }
}
