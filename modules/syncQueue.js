import { state } from './state.js';
import { supabase } from './supabaseClient.js';
import { dbGet, dbSet } from './db.js';

let isSyncing = false;
let listenersInitialized = false;
let syncIntervalId = null;

export function updateSyncIndicator(status, count = 0) {
    const syncInd = document.getElementById('sync-indicator');
    if (!syncInd) return;

    if (status === 'syncing') {
        syncInd.innerHTML = `
            <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" style="vertical-align: middle; margin-right: 4px;">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>Syncing...</span>
        `;
        syncInd.style.borderColor = 'var(--border-color)';
        syncInd.style.color = 'var(--text-secondary)';
        syncInd.classList.remove('hidden');
        syncInd.style.display = 'inline-flex';
    } else if (status === 'pending') {
        syncInd.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" style="vertical-align: middle; margin-right: 4px;">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
            </svg>
            <span>Unsynced (${count})</span>
        `;
        syncInd.style.borderColor = 'var(--warning)';
        syncInd.style.color = 'var(--warning)';
        syncInd.classList.remove('hidden');
        syncInd.style.display = 'inline-flex';
    } else if (status === 'synced') {
        syncInd.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" style="vertical-align: middle; margin-right: 4px;">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Cloud Saved</span>
        `;
        syncInd.style.borderColor = 'var(--success)';
        syncInd.style.color = 'var(--success)';
        syncInd.classList.remove('hidden');
        syncInd.style.display = 'inline-flex';
        
        setTimeout(() => {
            const currentSpan = syncInd.querySelector('span:last-child');
            if (currentSpan && currentSpan.textContent === 'Cloud Saved') {
                syncInd.classList.add('hidden');
                syncInd.style.display = 'none';
            }
        }, 3000);
    } else if (status === 'offline') {
        syncInd.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" style="vertical-align: middle; margin-right: 4px;">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.5M5 12.5a10.94 10.94 0 0 1 5.83-2.84M8.58 6.14A16.94 16.94 0 0 1 18 8.5M4.88 4.88A16.92 16.92 0 0 1 12 5M12 19h.01"></path>
            </svg>
            <span>Offline</span>
        `;
        syncInd.style.borderColor = 'var(--danger)';
        syncInd.style.color = 'var(--danger)';
        syncInd.classList.remove('hidden');
        syncInd.style.display = 'inline-flex';
    } else {
        syncInd.classList.add('hidden');
        syncInd.style.display = 'none';
    }
}

export async function queueTransaction(type, payload) {
    try {
        const queue = await dbGet('offline_sync_queue') || [];
        const transactionItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
            type,
            timestamp: Date.now(),
            payload
        };
        queue.push(transactionItem);
        await dbSet('offline_sync_queue', queue);
        
        updateSyncIndicator('pending', queue.length);
        console.log(`[Offline Sync] Queued offline transaction: ${type}`, payload);
    } catch (e) {
        console.error("Failed to queue offline transaction:", e);
    }
}

function isPermanentDbError(error) {
    if (!error) return false;
    const code = String(error.code || '');
    // PostgreSQL error codes starting with:
    // 22: Data Exception (e.g. 22P02 invalid text representation)
    // 23: Integrity Constraint Violation (e.g. 23503 foreign key violation)
    // 42: Syntax Error or Access Rule Violation (e.g. RLS)
    if (code.startsWith('22') || code.startsWith('23') || code.startsWith('42')) {
        return true;
    }
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('foreign key') || msg.includes('invalid input syntax') || msg.includes('violates row-level security')) {
        return true;
    }
    return false;
}

export async function processSyncQueue() {
    if (isSyncing) return;
    if (!navigator.onLine) {
        const queue = await dbGet('offline_sync_queue') || [];
        if (queue.length > 0) {
            updateSyncIndicator('pending', queue.length);
        } else {
            updateSyncIndicator('offline');
        }
        return;
    }

    try {
        const queue = await dbGet('offline_sync_queue') || [];
        if (queue.length === 0) {
            return;
        }

        isSyncing = true;
        updateSyncIndicator('syncing');
        console.log(`[Offline Sync] Processing ${queue.length} pending transactions...`);

        let completedCount = 0;
        const failedItems = [];

        for (const item of queue) {
            let success = false;
            let isPermanentError = false;
            
            try {
                if (!state.userSession || !state.userSession.user) {
                    console.warn("[Offline Sync] Cannot process sync queue because user session is missing.");
                    break;
                }

                // Sanitize/round nextReview in update_card payload if it is a float/string number
                if (item.type === 'update_card' && item.payload && item.payload.nextReview !== undefined) {
                    const parsed = Number(item.payload.nextReview);
                    if (!isNaN(parsed)) {
                        item.payload.nextReview = Math.round(parsed);
                    }
                }

                if (item.type === 'update_card') {
                    const { error } = await supabase
                        .from('flashcards')
                        .update({
                            nextReview: item.payload.nextReview,
                            ease: item.payload.ease,
                            interval: item.payload.interval,
                            repetitions: item.payload.repetitions,
                            score: item.payload.score || 50
                        })
                        .eq('id', item.payload.id)
                        .eq('user_id', state.userSession.user.id);
                        
                    if (!error) {
                        success = true;
                    } else {
                        console.error("Error syncing card update in queue:", error);
                        if (isPermanentDbError(error)) {
                            isPermanentError = true;
                        }
                    }
                } else if (item.type === 'insert_log') {
                    const { error } = await supabase
                        .from('review_logs')
                        .insert([{
                            user_id: state.userSession.user.id,
                            card_id: item.payload.card_id,
                            grade: item.payload.grade,
                            score: item.payload.score
                        }]);
                        
                    if (!error) {
                        success = true;
                    } else {
                        console.error("Error syncing review log in queue:", error);
                        if (isPermanentDbError(error)) {
                            isPermanentError = true;
                        }
                    }
                }
            } catch (err) {
                console.error("Network exception during queue processing:", err);
            }

            if (success) {
                completedCount++;
            } else if (isPermanentError) {
                console.error("[Offline Sync] Discarding invalid queue item due to permanent database error:", item);
                completedCount++; // Mark as processed so it gets removed from the queue
            } else {
                failedItems.push(item);
                // Stop processing on first connection failure to preserve order of updates
                break;
            }
        }

        // Keep remaining failed items in the queue by reading the latest queue and slicing off the completed ones
        const latestQueue = await dbGet('offline_sync_queue') || [];
        const remainingQueue = latestQueue.slice(completedCount);
        await dbSet('offline_sync_queue', remainingQueue);

        if (completedCount > 0) {
            console.log(`[Offline Sync] Successfully synchronized ${completedCount} changes.`);
        }

        if (remainingQueue.length > 0) {
            updateSyncIndicator('pending', remainingQueue.length);
        } else {
            updateSyncIndicator('synced');
        }
    } catch (e) {
        console.error("Failed to process offline sync queue:", e);
    } finally {
        isSyncing = false;
    }
}

export function initSyncListeners() {
    if (listenersInitialized) return;
    listenersInitialized = true;

    window.addEventListener('online', () => {
        console.log("[Offline Sync] Connection back online. Flushing queue...");
        processSyncQueue();
    });

    window.addEventListener('offline', () => {
        console.log("[Offline Sync] Browser went offline.");
        updateSyncIndicator('offline');
    });

    // Check status at startup
    if (!navigator.onLine) {
        updateSyncIndicator('offline');
    } else {
        dbGet('offline_sync_queue').then(queue => {
            if (queue && queue.length > 0) {
                updateSyncIndicator('pending', queue.length);
                processSyncQueue();
            }
        });
    }

    if (syncIntervalId) clearInterval(syncIntervalId);
    // Periodic sweep every 20 seconds
    syncIntervalId = setInterval(processSyncQueue, 20000);
}
