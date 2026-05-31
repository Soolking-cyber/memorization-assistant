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
        const { data: metadataList, error: metadataError } = await supabase
            .from('flashcards')
            .select('id, user_id, type, nextReview, ease, interval, repetitions, created_at')
            .eq('user_id', state.userSession.user.id);

        if (metadataError) {
            console.error("Error loading card metadata:", metadataError);
            return;
        }

        const metadataMap = new Map(metadataList.map(m => [m.id, m]));
        let cacheChanged = false;

        state.cards = state.cards.filter(c => {
            const stillExists = metadataMap.has(c.id);
            if (!stillExists) cacheChanged = true;
            return stillExists;
        });

        const cardsMap = new Map(state.cards.map(c => [c.id, c]));
        const idsToFetch = [];

        for (const meta of metadataList) {
            const cached = cardsMap.get(meta.id);
            if (!cached) {
                idsToFetch.push(meta.id);
            } else {
                const metaChanged = 
                    cached.type !== meta.type ||
                    cached.nextReview !== meta.nextReview ||
                    cached.ease !== meta.ease ||
                    cached.interval !== meta.interval ||
                    cached.repetitions !== meta.repetitions;

                const hasFullBody = 
                    cached.front !== undefined && 
                    cached.back !== undefined;

                if (metaChanged || !hasFullBody) {
                    idsToFetch.push(meta.id);
                }
            }
        }

        if (idsToFetch.length > 0) {
            console.log(`Selective sync: fetching full details for ${idsToFetch.length} new/changed cards.`);
            const { data: fullCards, error: fullError } = await supabase
                .from('flashcards')
                .select('*')
                .in('id', idsToFetch);

            if (fullError) {
                console.error("Error fetching full details for selective sync:", fullError);
            } else if (fullCards) {
                cacheChanged = true;
                
                for (const fullCard of fullCards) {
                    const idx = state.cards.findIndex(c => c.id === fullCard.id);
                    if (idx !== -1) {
                        state.cards[idx] = fullCard;
                    } else {
                        state.cards.push(fullCard);
                    }
                }
            }
        }

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
        .eq('user_id', state.userSession.user.id);
        
    if (error) {
        console.error("Error deleting:", error);
        await window.alert("Failed to delete memories.");
        deleteBtn.textContent = 'Delete Selected';
        deleteBtn.disabled = false;
    } else {
        if (imagePaths.length > 0) {
            await supabase.storage.from('card_images').remove(imagePaths);
        }

        ids.forEach(id => {
            delete state.exampleSentences[id];
        });
        await dbSet('exampleSentences', state.exampleSentences);

        await loadData();
        renderManageView();
    }
}
