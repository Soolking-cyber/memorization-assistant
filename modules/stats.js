import { state } from './state.js';
import { playUISound } from './sound.js';
import { buildCustomDropdownUI } from './uiHelpers.js';
import { updateDashboard } from './dashboard.js';
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
                renderStatistics();
            };

            nextBtn.onclick = () => {
                if (state.statsYear < maxYear) {
                    state.statsYear++;
                    renderStatistics();
                }
            };
        }
    }

    let avgScore = 0;
    if (state.cards.length > 0) {
        const sum = state.cards.reduce((acc, curr) => acc + (curr.score !== undefined && curr.score !== null ? curr.score : 50), 0);
        avgScore = Math.round(sum / state.cards.length);
    }

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    let addedThisWeek = 0;
    state.cards.forEach(card => {
        if (card.created_at) {
            const creationTime = new Date(card.created_at).getTime();
            if (creationTime >= sevenDaysAgo) addedThisWeek++;
        }
    });

    const totalReviews = logs.length;
    const perfectCount = logs.filter(l => l.score === 100).length;
    const correctReviews = logs.filter(l => l.grade >= 1).length;
    const retentionRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 100;

    const activeCards = state.cards.filter(c => c.repetitions > 0);
    let avgStability = 0;
    let avgDifficulty = 5.0;
    let avgRetrievability = 1.0;

    if (activeCards.length > 0) {
        const sumStability = activeCards.reduce((acc, c) => acc + (c.interval || 0), 0);
        avgStability = sumStability / activeCards.length;
        
        const sumDifficulty = activeCards.reduce((acc, c) => acc + (c.ease || 5.0), 0);
        avgDifficulty = sumDifficulty / activeCards.length;
        
        let sumRetrievability = 0;
        activeCards.forEach(c => {
            const S = c.interval || 0.1;
            const elapsedDays = Math.max(0.01, (Date.now() - c.nextReview) / 86400000 + (c.interval || 1.0));
            const R = Math.pow(1 + elapsedDays / (9 * S), -0.4);
            sumRetrievability += Math.max(0, Math.min(1.0, R));
        });
        avgRetrievability = sumRetrievability / activeCards.length;
    }

    const total = state.cards.length;
    const newCount = state.cards.filter(c => !c.repetitions || c.repetitions === 0).length;
    const learningCount = state.cards.filter(c => c.repetitions > 0 && (c.score || 50) < 50).length;
    const retainedCount = state.cards.filter(c => c.repetitions > 0 && (c.score || 50) >= 50 && (c.score || 50) < 85).length;
    const masteredCount = state.cards.filter(c => c.repetitions > 0 && (c.score || 50) >= 85).length;

    const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0;
    const learningPct = total > 0 ? Math.round((learningCount / total) * 100) : 0;
    const retainedPct = total > 0 ? Math.round((retainedCount / total) * 100) : 0;
    const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

    const statsDashboardContainer = document.getElementById('stats-dashboard-container');
    if (statsDashboardContainer) {
        statsDashboardContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
                <!-- Left Column: Memory Retention Profile -->
                <div class="stats-card" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; min-height: 340px;">
                    <div style="width: 100%;">
                        <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">Memory Retention Profile</h3>
                        <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: var(--text-secondary);">Your current average active recall and brain retention levels.</p>
                    </div>
                    
                    <!-- Large SVG Gauge -->
                    <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; margin: 12px 0;">
                        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                            <defs>
                                <linearGradient id="retentionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="var(--accent)" />
                                    <stop offset="100%" stop-color="var(--success)" />
                                </linearGradient>
                            </defs>
                            <!-- Background track -->
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-secondary)" stroke-width="8"></circle>
                            <!-- Animated fill -->
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#retentionGrad)" stroke-width="8" 
                                    stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * avgScore) / 100}" 
                                    stroke-linecap="round" style="transition: stroke-dashoffset 1s ease-out;"></circle>
                        </svg>
                        <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.1;">
                            <span style="font-size: 1.85rem; font-weight: 800; color: var(--text-primary);">${avgScore}%</span>
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Avg Strength</span>
                        </div>
                    </div>
                    
                    <!-- Secondary DSR Metrics -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 12px; gap: 8px;">
                        <div style="display: flex; flex-direction: column; align-items: center;" data-tooltip="Estimated Retrievability: Your average chance of recalling active memories correctly today.">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Retrievability</span>
                            <span style="font-size: 1.1rem; font-weight: 800; color: var(--accent); margin-top: 4px;">${Math.round(avgRetrievability * 100)}%</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;" data-tooltip="Memory Stability: The average interval (in days) before memory strength decays below 90%.">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Stability</span>
                            <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${avgStability.toFixed(1)}d</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;" data-tooltip="Difficulty Rating: The complexity score (1 to 10) assigned by the FSRS algorithm.">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Difficulty</span>
                            <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${avgDifficulty.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column: Memory Mastery & Stage -->
                <div class="stats-card" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 340px;">
                    <div style="width: 100%;">
                        <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">Memory Mastery & Stage</h3>
                        <p style="margin: 0 0 20px 0; font-size: 0.85rem; color: var(--text-secondary);">Categorization of your cards based on training count and recall performance.</p>
                    </div>

                    <!-- Mastery Stacked Bar -->
                    <div style="width: 100%; margin: 12px 0;">
                        <div style="display: flex; height: 16px; border-radius: 8px; overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                            <div style="width: ${newPct}%; background: var(--text-secondary); transition: width 0.5s;" title="New (Never practiced): ${newCount} cards"></div>
                            <div style="width: ${learningPct}%; background: var(--danger); transition: width 0.5s;" title="Learning (Strength < 50%): ${learningCount} cards"></div>
                            <div style="width: ${retainedPct}%; background: var(--warning); transition: width 0.5s;" title="Retained (Strength 50-84%): ${retainedCount} cards"></div>
                            <div style="width: ${masteredPct}%; background: var(--success); transition: width 0.5s;" title="Mastered (Strength >= 85%): ${masteredCount} cards"></div>
                        </div>
                        
                        <!-- Mastery Legend -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 14px; font-size: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 6px; color: var(--text-primary);">
                                <span style="width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%;"></span>
                                <span>New (${newCount} / ${newPct}%)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; color: var(--text-primary);">
                                <span style="width: 8px; height: 8px; background: var(--danger); border-radius: 50%;"></span>
                                <span>Learning (${learningCount} / ${learningPct}%)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; color: var(--text-primary);">
                                <span style="width: 8px; height: 8px; background: var(--warning); border-radius: 50%;"></span>
                                <span>Retained (${retainedCount} / ${retainedPct}%)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; color: var(--text-primary);">
                                <span style="width: 8px; height: 8px; background: var(--success); border-radius: 50%;"></span>
                                <span>Mastered (${masteredCount} / ${masteredPct}%)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Summary Grid -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 12px; gap: 8px;">
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Total Memories</span>
                            <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${total} <span style="font-size: 0.75rem; font-weight: 700; color: var(--success); margin-left: 2px;">+${addedThisWeek}</span></span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Recall Reviews</span>
                            <span style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${totalReviews}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Accuracy Rate</span>
                            <span style="font-size: 1.15rem; font-weight: 800; color: var(--success); margin-top: 4px;">${retentionRate}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Category Stacks Section -->
            <div class="stats-card" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">Decks & Categories Performance</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Click any category stack below to start targeted review for that deck.</p>
                </div>
                
                <div id="stats-category-stacks-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 8px;">
                    <!-- Populated below dynamically -->
                </div>
            </div>
        `;

        const categoryContainer = document.getElementById('stats-category-stacks-container');
        if (categoryContainer) {
            categoryContainer.innerHTML = '';
            const now = Date.now();
            
            const categories = ['mixed'];
            state.cards.forEach(c => {
                if (c.type && c.type !== 'mixed') {
                    if (!categories.includes(c.type)) categories.push(c.type);
                }
            });

            categories.forEach(type => {
                const typeCards = type === 'mixed' ? state.cards : state.cards.filter(c => c.type === type);
                const totalType = typeCards.length;
                if (totalType === 0 && type !== 'mixed') return;

                const dueType = typeCards.filter(c => c.nextReview <= now).length;
                const reviewedType = totalType - dueType;
                const percentType = totalType > 0 ? (reviewedType / totalType) * 100 : 0;
                
                let typeAvgScore = 0;
                if (totalType > 0) {
                    const sumTypeScore = typeCards.reduce((acc, c) => acc + (c.score !== undefined && c.score !== null ? c.score : 50), 0);
                    typeAvgScore = Math.round(sumTypeScore / totalType);
                }

                const cardEl = document.createElement('div');
                cardEl.className = 'category-card clickable';
                
                let iconSvg = '';
                if (type === 'mixed') {
                    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`;
                } else {
                    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`;
                }

                const titleText = type === 'mixed' ? 'All Stacks' : type;

                cardEl.innerHTML = `
                    <div class="category-card-top" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div class="category-card-icon" style="background: var(--bg-secondary); color: var(--accent); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">${iconSvg}</div>
                            <div class="category-card-info" style="display: flex; flex-direction: column; gap: 2px;">
                                <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">${titleText}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">${reviewedType}/${totalType} Recalled</span>
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--accent);">${typeAvgScore}%</div>
                    </div>
                    <div class="category-card-bottom" style="width: 100%; margin-top: 12px;">
                        <div class="progress-bar-container" style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; border: 1px solid var(--border-color);">
                            <div class="progress-bar-fill" style="height: 100%; width: ${percentType}%; background: var(--accent);"></div>
                        </div>
                    </div>
                `;

                cardEl.addEventListener('click', async () => {
                    const select = document.getElementById('practice-type-select');
                    if (select) {
                        select.selectedValues = type === 'mixed' ? [...select.options].map(o => o.value).filter(v => v !== 'add_new') : [type];
                        select.value = type === 'mixed' ? 'mixed' : type;
                        buildCustomDropdownUI('practice-type-select');
                        updateDashboard();
                        if (dueType > 0) {
                            startPractice();
                        } else {
                            const displayName = type === 'mixed' ? 'All Memories' : type;
                            if (await window.confirm(`You are all caught up on due reviews for "${displayName}"! Would you like to start a study-ahead session to practice all cards in this category?`)) {
                                startPractice(true);
                            }
                        }
                    }
                });
                categoryContainer.appendChild(cardEl);
            });
        }
    }
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

export function initStatsView() {
    const tabButtons = document.querySelectorAll('#stats-view-tabs [data-stats-tab]');
    const tabContents = {
        overview: document.getElementById('stats-tab-content-overview'),
        graph: document.getElementById('stats-tab-content-graph')
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTab = btn.getAttribute('data-stats-tab');
            
            // Toggle active class on tab buttons
            tabButtons.forEach(b => {
                if (b.getAttribute('data-stats-tab') === selectedTab) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            // Toggle hidden class on tab contents
            Object.keys(tabContents).forEach(key => {
                if (tabContents[key]) {
                    if (key === selectedTab) {
                        tabContents[key].classList.remove('hidden');
                    } else {
                        tabContents[key].classList.add('hidden');
                    }
                }
            });

            // If selected tab is graph, initialize graph view
            if (selectedTab === 'graph' && window.initZettelkastenView) {
                window.initZettelkastenView();
            }
        });
    });
}
