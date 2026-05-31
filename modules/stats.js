import { state } from './state.js';
import { playUISound } from './sound.js';
import { buildCustomDropdownUI } from './uiHelpers.js';
import { updateDashboard } from './flashcardCrud.js';
import { startPractice } from './practice.js';
import { dbGet } from './db.js';

export async function renderStatistics() {
    let logs = [];
    try {
        logs = await dbGet('review_activity_logs') || [];
    } catch(e) {
        logs = [];
    }
    if (!Array.isArray(logs)) {
        logs = [];
    }

    const getLocalDateString = (val) => {
        if (!val) return '';
        const d = new Date(val);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dailyReviews = {};
    logs.forEach(log => {
        if (log.timestamp) {
            const dateStr = getLocalDateString(log.timestamp);
            dailyReviews[dateStr] = (dailyReviews[dateStr] || 0) + 1;
        }
    });

    const dailyCreations = {};
    state.cards.forEach(card => {
        if (card.created_at) {
            const dateStr = getLocalDateString(card.created_at);
            dailyCreations[dateStr] = (dailyCreations[dateStr] || 0) + 1;
        }
    });

    const today = new Date();
    const startDate = new Date(state.statsYear, 0, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    startDate.setHours(0, 0, 0, 0);

    let gridHtml = '';
    const tempDate = new Date(startDate);

    for (let w = 0; w < 53; w++) {
        let colHtml = '<div class="contribution-col">';
        for (let d = 0; d < 7; d++) {
            const dateStr = getLocalDateString(tempDate);
            const reviews = dailyReviews[dateStr] || 0;
            const creations = dailyCreations[dateStr] || 0;
            
            let bg = 'var(--heatmap-empty)';
            let opacity = '1.0';
            const isFuture = tempDate > today;
            
            if (isFuture) {
                bg = 'var(--heatmap-future)';
            } else if (reviews > 0 && creations > 0) {
                const totalActivity = reviews + creations;
                if (totalActivity <= 3) {
                    bg = 'var(--heatmap-combined-1)';
                } else if (totalActivity <= 8) {
                    bg = 'var(--heatmap-combined-2)';
                } else {
                    bg = 'var(--heatmap-combined-3)';
                }
            } else if (creations > 0) {
                if (creations <= 1) {
                    bg = 'var(--heatmap-create-1)';
                } else if (creations <= 3) {
                    bg = 'var(--heatmap-create-2)';
                } else {
                    bg = 'var(--heatmap-create-3)';
                }
            } else if (reviews > 0) {
                if (reviews <= 3) {
                    bg = 'var(--heatmap-review-1)';
                } else if (reviews <= 8) {
                    bg = 'var(--heatmap-review-2)';
                } else {
                    bg = 'var(--heatmap-review-3)';
                }
            }
            
            const friendlyDate = tempDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            let styleStr = `background: ${bg}; opacity: ${opacity}; border: 1px solid var(--border-color);`;
            colHtml += `<div class="contribution-cell" style="${styleStr}" data-date="${friendlyDate}" data-reviews="${reviews}" data-creations="${creations}"></div>`;
            
            tempDate.setDate(tempDate.getDate() + 1);
        }
        colHtml += '</div>';
        gridHtml += colHtml;
    }

    const gridContainer = document.getElementById('contribution-grid-container');
    if (gridContainer) {
        gridContainer.innerHTML = gridHtml;
        
        let tooltip = document.getElementById('heatmap-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'heatmap-tooltip';
            tooltip.className = 'heatmap-tooltip';
            document.body.appendChild(tooltip);
        }

        gridContainer.onmouseover = (e) => {
            const cell = e.target.closest('.contribution-cell');
            if (!cell) return;

            try { playUISound('tooltip'); } catch(err) {}

            const friendlyDate = cell.getAttribute('data-date');
            const creations = parseInt(cell.getAttribute('data-creations') || '0', 10);
            const reviews = parseInt(cell.getAttribute('data-reviews') || '0', 10);

            let activityHtml = '';
            if (creations === 0 && reviews === 0) {
                activityHtml = `<span style="color: var(--text-secondary);">No activity</span>`;
            } else {
                activityHtml = `<div style="display: flex; gap: 6px; flex-wrap: wrap;">`;
                if (creations > 0) {
                    activityHtml += `<span class="heatmap-tooltip-pill creation">${creations} card${creations > 1 ? 's' : ''} added</span>`;
                }
                if (reviews > 0) {
                    activityHtml += `<span class="heatmap-tooltip-pill review">${reviews} review${reviews > 1 ? 's' : ''} done</span>`;
                }
                activityHtml += `</div>`;
            }

            tooltip.innerHTML = `
                <div class="heatmap-tooltip-date">${friendlyDate}</div>
                <div class="heatmap-tooltip-activity">${activityHtml}</div>
            `;

            const rect = cell.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
            tooltip.style.top = `${rect.top + window.scrollY}px`;
            tooltip.classList.add('visible');
        };

        gridContainer.onmouseout = (e) => {
            const cell = e.target.closest('.contribution-cell');
            if (!cell) return;
            tooltip.classList.remove('visible');
        };

        const prevBtn = document.getElementById('stats-year-prev');
        const nextBtn = document.getElementById('stats-year-next');
        const yearDisplay = document.getElementById('stats-year-display');
        const heatmapPeriod = document.getElementById('stats-heatmap-period');

        if (prevBtn && nextBtn && yearDisplay) {
            yearDisplay.textContent = state.statsYear;
            
            const maxYear = new Date().getFullYear();
            if (heatmapPeriod) {
                if (state.statsYear === maxYear) {
                    heatmapPeriod.textContent = `this year (${state.statsYear})`;
                } else {
                    heatmapPeriod.textContent = `the year ${state.statsYear}`;
                }
            }

            nextBtn.style.opacity = state.statsYear >= maxYear ? '0.3' : '1';
            nextBtn.style.pointerEvents = state.statsYear >= maxYear ? 'none' : 'auto';

            prevBtn.onclick = () => {
                state.statsYear--;
                try { playUISound('click'); } catch(err) {}
                renderStatistics();
            };

            nextBtn.onclick = () => {
                if (state.statsYear < maxYear) {
                    state.statsYear++;
                    try { playUISound('click'); } catch(err) {}
                    renderStatistics();
                }
            };
        }
    }

    let strongCount = 0;
    state.cards.forEach(card => {
        const reps = card.repetitions || 0;
        const ease = card.ease || 2.5;
        if (reps >= 3 && ease >= 2.2) {
            strongCount++;
        }
    });

    const totalActive = state.cards.length;
    let strongPct = 50;
    if (totalActive > 0) {
        strongPct = Math.round((strongCount / totalActive) * 100);
    }

    const totalCardsEl = document.getElementById('stats-total-cards');
    const perfectReviewsEl = document.getElementById('stats-perfect-reviews');
    const avgScoreEl = document.getElementById('stats-avg-score');
    const totalReviewsEl = document.getElementById('stats-total-reviews');
    const strongPctEl = document.getElementById('stats-strong-pct');

    if (totalCardsEl) totalCardsEl.textContent = state.cards.length;
    if (totalReviewsEl) totalReviewsEl.textContent = logs.length;

    const perfectCount = logs.filter(l => l.score === 100).length;
    if (perfectReviewsEl) perfectReviewsEl.textContent = perfectCount;

    let avgScore = 0;
    if (logs.length > 0) {
        const sum = logs.reduce((acc, curr) => acc + (curr.score || 0), 0);
        avgScore = Math.round(sum / logs.length);
    }
    if (avgScoreEl) avgScoreEl.textContent = `${avgScore}%`;
    if (strongPctEl) strongPctEl.textContent = totalActive > 0 ? `${strongPct}% (${strongCount}/${totalActive})` : `0%`;

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    let addedThisWeek = 0;

    state.cards.forEach(card => {
        if (card.created_at) {
            const creationTime = new Date(card.created_at).getTime();
            if (creationTime >= sevenDaysAgo) addedThisWeek++;
        }
    });

    const addedWeekEl = document.getElementById('stats-added-week');
    if (addedWeekEl) addedWeekEl.textContent = addedThisWeek;
}

export function renderCategoryTabs() {
    const tabContainer = document.getElementById('category-tabs');
    if (!tabContainer) return;
    tabContainer.innerHTML = '';
    
    const categories = ['mixed'];
    state.cards.forEach(c => {
        if (c.type && c.type !== 'mixed') {
            if (!categories.includes(c.type)) categories.push(c.type);
        }
    });

    categories.forEach(type => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        if (type === state.activeCategoryTab) tab.classList.add('active');
        tab.textContent = type === 'mixed' ? 'ALL' : type;
        
        tab.addEventListener('click', () => {
            state.activeCategoryTab = type;
            renderCategoryTabs();
            renderCategoryCards();
        });
        tabContainer.appendChild(tab);
    });
}

export function renderCategoryCards() {
    const grid = document.getElementById('category-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const now = Date.now();
    
    let categoriesToShow = [];
    if (state.activeCategoryTab === 'mixed') {
        const categories = ['mixed'];
        state.cards.forEach(c => {
            if (c.type && c.type !== 'mixed') {
                if (!categories.includes(c.type)) categories.push(c.type);
            }
        });
        categoriesToShow = categories;
    } else {
        categoriesToShow = [state.activeCategoryTab];
    }

    categoriesToShow.forEach(type => {
        const typeCards = type === 'mixed' ? state.cards : state.cards.filter(c => c.type === type);
        const total = typeCards.length;
        if (total === 0 && type !== 'mixed') return;

        const due = typeCards.filter(c => c.nextReview <= now).length;
        const reviewed = total - due;
        const percent = total > 0 ? (reviewed / total) * 100 : 0;
        
        const cardEl = document.createElement('div');
        cardEl.className = 'category-card';
        if (total > 0) {
            cardEl.classList.add('clickable');
        }

        let iconSvg = '';
        if (type === 'mixed') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`;
        }

        const titleText = type === 'mixed' ? 'All Memories' : type;

        cardEl.innerHTML = `
            <div class="category-card-top">
                <div class="category-card-icon">${iconSvg}</div>
                <div class="category-card-info">
                    <h4>${titleText}</h4>
                    <span class="category-card-fraction">${reviewed}/${total}</span>
                </div>
            </div>
            <div class="category-card-bottom">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;

        if (total > 0) {
            cardEl.addEventListener('click', async () => {
                const select = document.getElementById('practice-type-select');
                if (select) {
                    select.selectedValues = type === 'mixed' ? [...select.options].map(o => o.value).filter(v => v !== 'add_new') : [type];
                    select.value = type === 'mixed' ? 'mixed' : type;
                    buildCustomDropdownUI('practice-type-select');
                    updateDashboard();
                    if (due > 0) {
                        startPractice();
                    } else {
                        const displayName = type === 'mixed' ? 'All Memories' : type;
                        if (await window.confirm(`You are all caught up on due reviews for "${displayName}"! Would you like to start a study-ahead session to practice all cards in this category?`)) {
                            startPractice(true);
                        }
                    }
                }
            });
        }
        
        grid.appendChild(cardEl);
    });
}
