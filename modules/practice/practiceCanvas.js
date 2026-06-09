import { state } from '../state.js';
import { fontSizeMap, toggleFullscreen } from '../uiHelpers.js';
import { drawLinks } from '../canvas/linkRenderer.js';
import { showExplanationTooltip, hideExplanationTooltip } from '../canvas/nodeManager.js';
import { setPracticeMapZoom, adjustPracticeViewportCentering } from '../canvas/viewport.js';

export function renderPracticeNodes(containerId, originalNodes, links, svgId, arrowheadId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!originalNodes || originalNodes.length === 0) return;
    
    let minX = Infinity;
    let minY = Infinity;
    
    originalNodes.forEach(node => {
        const nx = Number(node.x) || 0;
        const ny = Number(node.y) || 0;
        if (nx < minX) minX = nx;
        if (ny < minY) minY = ny;
    });
    
    if (minX === Infinity) {
        minX = 0;
        minY = 0;
    }
    
    const nodes = originalNodes.map(node => ({
        ...node,
        x: (Number(node.x) || 0) - minX + 40,
        y: (Number(node.y) || 0) - minY + 40
    }));
    
    drawLinks(nodes, links, svgId, arrowheadId, false);
    
    nodes.forEach((node, idx) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'map-node';
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = '180px';
        nodeEl.style.height = '90px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.alignItems = 'center';
        nodeEl.style.justifyContent = 'center';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.padding = '6px';
        nodeEl.style.zIndex = '5';
        
        const hasAnyRoot = nodes.some(n => n.isRoot);
        const isAnchor = hasAnyRoot ? !!node.isRoot : (idx === 0);
        
        if (isAnchor) {
            nodeEl.style.border = '2px solid var(--warning)';
            nodeEl.style.color = 'var(--text-primary)';
            
            const badge = document.createElement('span');
            badge.style = 'font-size: 0.7rem; color: var(--warning); margin-bottom: 2px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0;';
            badge.textContent = 'START';
            
            const textSpan = document.createElement('span');
            textSpan.style = 'font-size: 0.85rem; font-weight: 700; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; cursor: help;';
            textSpan.textContent = node.text || '';
            
            const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
            textSpan.style.fontSize = sizeStyles.keyword;
            if (node.textColor) {
                textSpan.style.color = node.textColor;
            } else {
                textSpan.style.color = 'var(--text-primary)';
            }
 
            textSpan.addEventListener('mouseenter', () => {
                showExplanationTooltip(nodeEl, node.explanation || 'No explanation');
            });
            textSpan.addEventListener('mouseleave', () => {
                hideExplanationTooltip();
            });
            textSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                const existing = document.querySelector('.node-explanation-tooltip');
                if (existing) {
                    hideExplanationTooltip();
                } else {
                    showExplanationTooltip(nodeEl, node.explanation || 'No explanation');
                }
            });
            
            nodeEl.appendChild(badge);
            nodeEl.appendChild(textSpan);
        } else {
            nodeEl.style.border = '2px solid var(--border-color)';
            
            const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
            
            const bodyEl = document.createElement('div');
            bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box; justify-content: center;';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'practice-map-node-input';
            input.placeholder = 'Type keyword...';
            input.dataset.nodeId = node.id;
            input.style = 'flex: 1; border: none; border-bottom: 2px dashed var(--border-color); background: transparent; text-align: center; font-size: 0.8rem; color: var(--text-primary); font-family: inherit; font-weight: 700; box-sizing: border-box; padding: 2px 0; width: 100%; outline: none;';
            
            input.style.fontSize = sizeStyles.keyword;
            if (node.textColor) {
                input.style.color = node.textColor;
            } else {
                input.style.color = 'var(--text-primary)';
            }
            
            input.addEventListener('focus', () => {
                showExplanationTooltip(nodeEl, node.explanation || 'No explanation');
            });
            input.addEventListener('blur', () => {
                hideExplanationTooltip();
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation(); 
                    document.getElementById('btn-submit-answer').click();
                }
            });
            
            bodyEl.appendChild(input);
            nodeEl.appendChild(bodyEl);
        }
        
        container.appendChild(nodeEl);
    });
}

export function initPracticeCanvasControls(mapData) {
    if (!mapData) return;
    
    setTimeout(() => {
        const scrollContainer = document.getElementById('practice-map-scroll-pane') || document.getElementById('practice-map-canvas-container');
        const viewport = document.getElementById('practice-map-viewport');
        if (scrollContainer && viewport && mapData.nodes && mapData.nodes.length > 0) {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            
            mapData.nodes.forEach(node => {
                const nx = Number(node.x) || 0;
                const ny = Number(node.y) || 0;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            });
            
            const mapWidth = maxX - minX + 180;
            const mapHeight = maxY - minY + 90;
            const viewportWidth = mapWidth + 80;
            const viewportHeight = mapHeight + 80;
            
            const containerWidth = scrollContainer.clientWidth || 400;
            const containerHeight = scrollContainer.clientHeight || 400;
            
            viewport.style.width = `${viewportWidth}px`;
            viewport.style.height = `${viewportHeight}px`;
            
            const initialZoom = 1.0;
            
            setPracticeMapZoom(initialZoom);
            adjustPracticeViewportCentering(viewportWidth, viewportHeight);
        }
    }, 120);

    // Centering again after slide-up animation (400ms transition) completes
    setTimeout(() => {
        adjustPracticeViewportCentering();
    }, 500);
    
    const btnPracticeZoomIn = document.getElementById('btn-practice-zoom-in');
    if (btnPracticeZoomIn) btnPracticeZoomIn.addEventListener('click', () => setPracticeMapZoom(state.practiceMapZoom + 0.1));
    const btnPracticeZoomOut = document.getElementById('btn-practice-zoom-out');
    if (btnPracticeZoomOut) btnPracticeZoomOut.addEventListener('click', () => setPracticeMapZoom(state.practiceMapZoom - 0.1));
    const btnPracticeZoomReset = document.getElementById('btn-practice-zoom-reset');
    if (btnPracticeZoomReset) btnPracticeZoomReset.addEventListener('click', () => setPracticeMapZoom(1.0));
    const btnPracticeFullscreen = document.getElementById('btn-practice-fullscreen');
    if (btnPracticeFullscreen) {
        btnPracticeFullscreen.addEventListener('click', () => toggleFullscreen('practice-map-canvas-container', 'btn-practice-fullscreen'));
    }
    const btnPracticeClose = document.querySelector('#practice-map-canvas-container .fullscreen-close-btn');
    if (btnPracticeClose) {
        btnPracticeClose.addEventListener('click', () => toggleFullscreen('practice-map-canvas-container', 'btn-practice-fullscreen'));
    }
}
