import { state } from '../state.js';
import { supabase } from '../supabaseClient.js';
import { updateDashboard } from '../dashboard.js';
import { renderStatistics } from '../stats.js';
import { dbSet } from '../db.js';
import { queueTransaction } from '../syncQueue.js';
import { renderManageView } from '../flashcardCrud.js';

export async function fetchAndCacheReviewLogs() {
    if (!state.userSession || !supabase) return;
    const { data, error } = await supabase
        .from('review_logs')
        .select('card_id, score, grade, created_at')
        .eq('user_id', state.userSession.user.id);
        
    if (error) {
        console.error("Error loading review logs from DB:", error);
        return;
    }
    
    const formattedLogs = (data || []).map(log => ({
        timestamp: new Date(log.created_at).getTime(),
        cardId: log.card_id,
        grade: log.grade,
        score: log.score
    }));
    
    await dbSet('review_activity_logs', formattedLogs);
}

export async function loadData() {
    if (!state.userSession || !supabase) return;
    
    const syncInd = document.getElementById('sync-indicator');
    if (syncInd) syncInd.classList.remove('hidden');
    
    try {
        const { data: fullCards, error: fullError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', state.userSession.user.id);

        if (fullError) {
            console.error("Error loading card data:", fullError);
            return;
        }

        // Compare if cache changed
        let cacheChanged = false;
        if (state.cards.length !== fullCards.length) {
            cacheChanged = true;
        } else {
            const cardsMap = new Map(state.cards.map(c => [c.id, c]));
            for (const card of fullCards) {
                const cached = cardsMap.get(card.id);
                if (!cached || 
                    cached.type !== card.type ||
                    cached.front !== card.front ||
                    cached.back !== card.back ||
                    cached.image_front_url !== card.image_front_url ||
                    cached.image_back_url !== card.image_back_url ||
                    cached.nextReview !== card.nextReview ||
                    cached.ease !== card.ease ||
                    cached.interval !== card.interval ||
                    cached.repetitions !== card.repetitions ||
                    JSON.stringify(cached.example_sentences) !== JSON.stringify(card.example_sentences)
                ) {
                    cacheChanged = true;
                    break;
                }
            }
        }

        state.cards = fullCards || [];

        let migratedCards = [];
        state.cards.forEach(card => {
            let needsUpdate = false;
            if (!card.type || card.type === 'General' || card.type === 'mixed') {
                card.type = 'Unknown';
                needsUpdate = true;
                cacheChanged = true;
            }
            if (needsUpdate) {
                migratedCards.push(card);
            }
            
            if (card.example_sentences) {
                state.exampleSentences[card.id] = card.example_sentences;
            } else {
                if (!state.exampleSentences[card.id]) {
                    state.exampleSentences[card.id] = [];
                }
            }
        });

        if (cacheChanged) {
            await dbSet('cached_cards', state.cards);
            await dbSet('exampleSentences', state.exampleSentences);
        }

        if (migratedCards.length > 0) {
            console.log(`Migrating ${migratedCards.length} cards with missing types...`);
            Promise.all(migratedCards.map(card => 
                supabase.from('flashcards')
                    .update({ type: card.type })
                    .eq('id', card.id)
                    .eq('user_id', state.userSession.user.id)
            )).then(() => {
                console.log("Database migration and synchronization complete!");
            }).catch(err => {
                console.error("Failed to sync migrated cards to database:", err);
            });
        }
        
        await fetchAndCacheReviewLogs();
        updateDashboard();
        const statsView = document.getElementById('view-stats');
        if (statsView && !statsView.classList.contains('hidden')) {
            renderStatistics();
        }
    } catch (err) {
        console.error("Critical error inside loadData background fetch:", err);
    } finally {
        if (syncInd) syncInd.classList.add('hidden');
    }
}

export async function insertCardToDB(card) {
    if (!state.userSession || !supabase) return;
    const { error } = await supabase
        .from('flashcards')
        .insert([{
            user_id: state.userSession.user.id,
            front: card.front,
            back: card.back,
            nextReview: card.nextReview,
            ease: card.ease,
            interval: card.interval,
            repetitions: card.repetitions
        }]);

    if (error) console.error("Error inserting:", error);
}

export async function updateCardInDB(card) {
    if (!state.userSession || !supabase) return;

    await dbSet('cached_cards', state.cards);

    const payload = {
        id: card.id,
        nextReview: card.nextReview,
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions
    };

    if (!navigator.onLine) {
        console.log("[Offline] Queued card update transaction.");
        await queueTransaction('update_card', payload);
        return;
    }

    try {
        const { error } = await supabase
            .from('flashcards')
            .update({
                nextReview: card.nextReview,
                ease: card.ease,
                interval: card.interval,
                repetitions: card.repetitions
            })
            .eq('id', card.id)
            .eq('user_id', state.userSession.user.id);
            
        if (error) {
            console.error("Error updating card, queueing transaction:", error);
            await queueTransaction('update_card', payload);
        }
    } catch (err) {
        console.warn("Exception during card update, queueing transaction:", err);
        await queueTransaction('update_card', payload);
    }
}

export function updateBatchUI() {
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

export async function batchDeleteCards(ids) {
    if (!state.userSession || !supabase) return;
    
    const deleteBtn = document.getElementById('btn-delete-selected');
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;

    const idSet = new Set(ids);
    const cardsToDelete = state.cards.filter(c => idSet.has(c.id));
    const imagePaths = [];
    
    cardsToDelete.forEach(card => {
        const extractPath = (url) => {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/storage/v1/object/public/card_images/');
                if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
            } catch (e) {}
            // Fallback: just use the last segment
            const parts = url.split('/');
            return parts[parts.length - 1];
        };
        if (card.image_front_url) {
            imagePaths.push(extractPath(card.image_front_url));
        }
        if (card.image_back_url) {
            imagePaths.push(extractPath(card.image_back_url));
        }
    });

    const { error } = await supabase
        .from('flashcards')
        .delete()
        .in('id', ids)
        .eq('user_id', state.userSession.user.id);
        
    if (error) {
        console.error("Error deleting:", error);
        await window.alert("Failed to delete memories.");
        deleteBtn.textContent = 'Delete Selected';
        deleteBtn.disabled = false;
    } else {
        if (imagePaths.length > 0) {
            await supabase.storage.from('card_images').remove(imagePaths).catch(e => console.warn('Image cleanup error:', e));
        }

        ids.forEach(id => {
            delete state.exampleSentences[id];
        });
        await dbSet('exampleSentences', state.exampleSentences);

        await loadData();
        renderManageView();
    }
}
