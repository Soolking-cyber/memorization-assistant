import { state } from './state.js';
import { dbGet } from './db.js';
import { switchView } from './navigation.js';
import { renderCurrentCard } from './practice.js';

/**
 * Calculates difficulty and gamification rarity statistics for a single card.
 * Rarity tier depends on Struggle Index = (attempts * 2) + (failures * 5) + (clues * 4)
 */
export function calculateCardStats(card, logs) {
    const cardLogs = (logs || []).filter(log => log.cardId === card.id);
    const attempts = cardLogs.length;
    
    // Unsuccessful attempts have grade < 2 or score < 75
    const failures = cardLogs.filter(log => log.grade < 2 || log.score < 75).length;
    
    const savedSentences = state.exampleSentences[card.id];
    let cluesCount = 0;
    let sentences = [];
    
    if (savedSentences) {
        if (Array.isArray(savedSentences)) {
            sentences = savedSentences.filter(s => typeof s === 'string' && s.trim().length > 0);
        } else if (typeof savedSentences === 'string' && savedSentences.trim().length > 0) {
            sentences = [savedSentences];
        }
    }
    cluesCount = sentences.length;
    
    const struggleIndex = (attempts * 2) + (failures * 5) + (cluesCount * 4);
    const successRate = attempts > 0 ? Math.round(((attempts - failures) / attempts) * 100) : 100;
    
    let tier = {
        name: 'Tamed',
        key: 'common',
        class: 'tier-common',
        title: 'Common Card'
    };
    
    if (struggleIndex >= 22) {
        tier = {
            name: 'Untamed Colossus',
            key: 'legendary',
            class: 'tier-legendary',
            title: 'Legendary Card'
        };
    } else if (struggleIndex >= 12) {
        tier = {
            name: 'Wild Beast',
            key: 'epic',
            class: 'tier-epic',
            title: 'Epic Card'
        };
    } else if (struggleIndex >= 5) {
        tier = {
            name: 'Challenger',
            key: 'rare',
            class: 'tier-rare',
            title: 'Rare Card'
        };
    }
    
    return {
        attempts,
        failures,
        cluesCount,
        struggleIndex,
        successRate,
        tier,
        sentences
    };
}

/**
 * Starts a focused single-card study session from the collection deck.
 */
export function startCardTraining(card) {
    state.reviewQueue = [card];
    state.currentReviewIndex = 0;
    state.isForcedMode = true;
    state.practiceOrigin = 'collection';
    
    // Bind total practice size and switch screen
    const practiceTotal = document.getElementById('practice-total');
    if (practiceTotal) practiceTotal.textContent = '1';
    
    const activeCard = document.getElementById('active-card');
    if (activeCard) activeCard.style.display = 'block';
    
    const ctrl = document.querySelector('.practice-controls');
    if (ctrl) ctrl.style.display = 'flex';
    
    const practiceCompleted = document.getElementById('practice-completed');
    if (practiceCompleted) practiceCompleted.classList.add('hidden');
    
    const closeBtn = document.querySelector('#view-practice .close-view');
    if (closeBtn) closeBtn.style.display = 'block';
    
    switchView('practice');
    renderCurrentCard();
}

/**
 * Master render engine for the Poké Deck View.
 */
export async function renderCollectionDeck() {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; font-weight: 600; color: var(--text-secondary);">Shuffling Poké Deck...</div>';
    
    // Load reviews history from local cache db
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch (e) {
        console.warn("Could not retrieve review logs for Pokédex:", e);
    }
    
    // Calculate card visual states
    const decoratedCards = state.cards.map(card => {
        const stats = calculateCardStats(card, logs);
        return {
            card,
            stats
        };
    });
    
    // Retrieve filters
    const searchVal = (document.getElementById('deck-search-input')?.value || '').toLowerCase().trim();
    const rarityVal = document.getElementById('deck-rarity-filter')?.value || 'all';
    const sortVal = document.getElementById('deck-sort-select')?.value || 'struggle-desc';
    
    // Apply filters
    let filtered = decoratedCards.filter(({ card, stats }) => {
        // Search matches front or back text
        let frontText = card.front || '';
        let backText = card.back || '';
        
        // Unpack memory map front content
        if (card.type === 'Memory Map' || frontText.startsWith('{"mode":"memory_map"')) {
            try {
                const data = JSON.parse(frontText);
                if (data && data.nodes) {
                    frontText = data.nodes.map(n => n.text).join(' ');
                }
            } catch (e) {}
        }
        
        const matchesSearch = frontText.toLowerCase().includes(searchVal) || backText.toLowerCase().includes(searchVal);
        const matchesRarity = rarityVal === 'all' || stats.tier.key === rarityVal;
        
        return matchesSearch && matchesRarity;
    });
    
    // Apply sorts
    filtered.sort((a, b) => {
        switch (sortVal) {
            case 'struggle-desc':
                return b.stats.struggleIndex - a.stats.struggleIndex;
            case 'struggle-asc':
                return a.stats.struggleIndex - b.stats.struggleIndex;
            case 'success-desc':
                return b.stats.successRate - a.stats.successRate;
            case 'success-asc':
                return a.stats.successRate - b.stats.successRate;
            case 'name-asc':
                return getCardTitle(a.card).localeCompare(getCardTitle(b.card));
            case 'name-desc':
                return getCardTitle(b.card).localeCompare(getCardTitle(a.card));
            default:
                return b.stats.struggleIndex - a.stats.struggleIndex;
        }
    });
    
    // Update live counters summary bubble UI
    const legendaryCount = decoratedCards.filter(c => c.stats.struggleIndex >= 22).length;
    const epicCount = decoratedCards.filter(c => c.stats.struggleIndex >= 12 && c.stats.struggleIndex < 22).length;
    const rareCount = decoratedCards.filter(c => c.stats.struggleIndex >= 5 && c.stats.struggleIndex < 12).length;
    const commonCount = decoratedCards.filter(c => c.stats.struggleIndex < 5).length;
    
    const countAll = document.getElementById('deck-count-all');
    const countLegendary = document.getElementById('deck-count-legendary');
    const countWild = document.getElementById('deck-count-wild');
    const countTamed = document.getElementById('deck-count-tamed');
    
    if (countAll) countAll.textContent = state.cards.length;
    if (countLegendary) countLegendary.textContent = legendaryCount;
    if (countWild) countWild.textContent = epicCount + rareCount;
    if (countTamed) countTamed.textContent = commonCount;
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1;" class="deck-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <h3>No Memories Match Your Filter</h3>
                <p>Try adjusting your search keywords or choosing a different rarity tier.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(({ card, stats }) => {
        const titleText = getCardTitle(card);
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper animate-pop-in';
        
        let abilitiesHTML = '';
        if (stats.sentences.length > 0) {
            stats.sentences.slice(0, 2).forEach((sentence, index) => {
                abilitiesHTML += `
                    <div class="ability-slot">
                        <span class="ability-badge">Slot ${index + 1}</span>
                        <span class="ability-description" title="${sentence}">${sentence}</span>
                    </div>
                `;
            });
        } else {
            abilitiesHTML = '<div class="no-abilities">No ability modifiers (sentences) attached. Train this memory on fail to unlock.</div>';
        }
        
        // Illustration front face preview
        let illustrationContent = `<div class="illustration-text">${titleText}</div>`;
        if (card.type === 'Image Card' && card.image_front_url) {
            illustrationContent = `<img class="illustration-img" src="${card.image_front_url}" alt="Memory Art">`;
        }
        
        // Calculate HP percentage bar (HP caps at 100 max)
        const hpPercent = Math.min(100, Math.max(5, stats.struggleIndex * 3));
        
        cardWrapper.innerHTML = `
            <div class="pokemon-card ${stats.tier.class}">
                <div class="card-holo"></div>
                <div class="card-header">
                    <div class="card-title-area">
                        <span class="card-rarity-badge">${stats.tier.name}</span>
                        <h4 class="card-title-text" title="${titleText}">${titleText}</h4>
                    </div>
                    <span class="card-type-indicator">${card.type || 'Unknown'}</span>
                </div>
                
                <div class="card-illustration">
                    ${illustrationContent}
                </div>
                
                <div class="card-hp-section">
                    <div class="card-hp-label">
                        <span>Wild Energy / HP</span>
                        <span class="hp-val">${stats.struggleIndex} HP</span>
                    </div>
                    <div class="card-hp-bar">
                        <div class="card-hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                </div>
                
                <div class="card-abilities-section">
                    ${abilitiesHTML}
                </div>
                
                <div class="card-stats-footer">
                    <div class="footer-stat-group">
                        <span class="footer-stat-label">Tamed Accuracy</span>
                        <span class="footer-stat-val">${stats.successRate}%</span>
                    </div>
                    <button class="btn-card-action" data-card-id="${card.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" style="vertical-align: middle;">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span>Train Card</span>
                    </button>
                </div>
            </div>
        `;
        
        // Bind focused 3D Hover Tilt tracking
        cardWrapper.addEventListener('mousemove', (e) => {
            const innerCard = cardWrapper.querySelector('.pokemon-card');
            const rect = cardWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const midX = rect.width / 2;
            const midY = rect.height / 2;
            
            const rotateX = -((y - midY) / midY) * 14;
            const rotateY = ((x - midX) / midX) * 14;
            
            innerCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            const holo = innerCard.querySelector('.card-holo');
            if (holo) {
                const percentX = (x / rect.width) * 100;
                const percentY = (y / rect.height) * 100;
                holo.style.backgroundPosition = `${percentX}% ${percentY}%`;
            }
        });
        
        cardWrapper.addEventListener('mouseleave', () => {
            const innerCard = cardWrapper.querySelector('.pokemon-card');
            innerCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            const holo = innerCard.querySelector('.card-holo');
            if (holo) {
                holo.style.backgroundPosition = `50% 50%`;
            }
        });
        
        // Bind individual training buttons
        cardWrapper.querySelector('.btn-card-action').addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                if (window.playUISound) window.playUISound('click');
            } catch (err) {}
            startCardTraining(card);
        });
        
        grid.appendChild(cardWrapper);
    });
}

/**
 * Decodes the card front safely to yield a neat title.
 */
function getCardTitle(card) {
    if (!card.front) return 'Untamed Card';
    
    // Check for JSON mind map format
    if (card.type === 'Memory Map' || card.front.startsWith('{"mode":"memory_map"')) {
        try {
            const data = JSON.parse(card.front);
            if (data && data.nodes && data.nodes.length > 0) {
                const rootNode = data.nodes.find(n => n.isRoot);
                return rootNode ? rootNode.text : data.nodes[0].text;
            }
        } catch (e) {}
        return 'Memory Map';
    }
    
    return card.front;
}

// Bind live filter events when collection view is present
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('deck-search-input');
    const filterRarity = document.getElementById('deck-rarity-filter');
    const selectSort = document.getElementById('deck-sort-select');
    
    if (searchInput) searchInput.addEventListener('input', renderCollectionDeck);
    if (filterRarity) filterRarity.addEventListener('change', renderCollectionDeck);
    if (selectSort) selectSort.addEventListener('change', renderCollectionDeck);
});
