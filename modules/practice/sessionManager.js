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
    try {
        if (typeof window.confetti === 'function') {
            window.confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    } catch (err) {
        console.warn("Confetti call failed:", err);
    }

    if (state.userSession && supabase) {
        await loadData();
    } else {
        updateDashboard();
    }
    
    document.getElementById('active-card').style.display = 'none';
    document.querySelector('.practice-controls').style.display = 'none';
    
    if (state.isForcedMode) {
        document.getElementById('nav-buttons').classList.remove('hidden');
        switchView('dashboard');
    } else {
        const completedMsg = document.getElementById('practice-completed');
        completedMsg.innerHTML = `<h2>Session Complete</h2><p style="color: var(--text-secondary); margin-bottom: 24px;">Your brain is getting stronger.</p><button class="btn primary" id="btn-finish-practice">Back to Dashboard</button>`;
        document.getElementById('btn-finish-practice').addEventListener('click', () => switchView('dashboard'));
        completedMsg.classList.remove('hidden');
    }
}
