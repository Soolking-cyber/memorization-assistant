import { state } from '../state.js';
import { ICONS } from '../icons.js';
import { playUISound } from '../sound.js';
import { fontSizeMap } from '../uiHelpers.js';
import { drawLinks, updateDraftLink } from './linkRenderer.js';
import {
    showNodeToolbar,
    hideNodeToolbar,
    showLinkToolbar,
    hideLinkToolbar
} from './toolbarMenus.js';

export function showExplanationTooltip(nodeEl, text) {
    hideExplanationTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'node-explanation-tooltip';
    tooltip.style = 'position: absolute; background: rgba(0,0,0,0.85); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; max-width: 220px; z-index: 1000; pointer-events: none; box-shadow: var(--shadow-sm); line-height: 1.3; font-family: inherit; word-break: break-word;';
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    const rect = nodeEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    const left = rect.left + (rect.width - tooltipRect.width) / 2;
    const top = rect.top - tooltipRect.height - 8;
    
    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
}

export function hideExplanationTooltip() {
    const existing = document.querySelectorAll('.node-explanation-tooltip');
    existing.forEach(t => t.remove());
}

export function renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
    
    nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'map-node';
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = '180px';
        nodeEl.style.height = '90px';
        nodeEl.style.background = 'var(--bg-card)';
        nodeEl.style.border = node.isRoot ? '2px solid var(--warning)' : '2px solid var(--border-color)';
        nodeEl.style.borderRadius = '8px';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.padding = '4px';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.zIndex = '5';
        nodeEl.style.cursor = 'grab';
        
        const headerEl = document.createElement('div');
        headerEl.style.display = 'flex';
        headerEl.style.justifyContent = 'flex-end';
        headerEl.style.alignItems = 'center';
        headerEl.style.gap = '6px';
        headerEl.style.height = '10px';
        headerEl.style.marginBottom = '4px';
        headerEl.style.paddingRight = '4px';
        
        const styleBtn = document.createElement('button');
        styleBtn.type = 'button';
        styleBtn.className = 'node-btn style-btn';
        styleBtn.title = 'Style Card Text';
        styleBtn.style.width = '10px';
        styleBtn.style.height = '10px';
        styleBtn.style.borderRadius = '50%';
        styleBtn.style.background = '#27c93f'; 
        styleBtn.style.border = 'none';
        styleBtn.style.cursor = 'pointer';
        styleBtn.style.padding = '0';
        styleBtn.style.opacity = '0.5';
        styleBtn.style.transition = 'opacity 0.15s, transform 0.15s';
        styleBtn.style.outline = 'none';
        styleBtn.addEventListener('mouseenter', () => {
            styleBtn.style.opacity = '1';
            styleBtn.style.transform = 'scale(1.1)';
        });
        styleBtn.addEventListener('mouseleave', () => {
            styleBtn.style.opacity = '0.5';
            styleBtn.style.transform = 'scale(1)';
        });
        styleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNodeToolbar(node, container, containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'node-btn delete-btn';
        deleteBtn.title = 'Delete Card';
        deleteBtn.style.width = '10px';
        deleteBtn.style.height = '10px';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.background = '#ff5f56'; 
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '0';
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.transition = 'opacity 0.15s, transform 0.15s';
        deleteBtn.style.outline = 'none';
        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
            deleteBtn.style.transform = 'scale(1.1)';
        });
        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0.5';
            deleteBtn.style.transform = 'scale(1)';
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = nodes.findIndex(n => n.id === node.id);
            if (idx !== -1) {
                nodes.splice(idx, 1);
            }
            const filteredLinks = links.filter(l => l.source !== node.id && l.target !== node.id);
            links.length = 0;
            filteredLinks.forEach(l => links.push(l));
            
            if (node.isRoot && nodes.length > 0) {
                nodes[0].isRoot = true;
            }
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });

        const rootBtn = document.createElement('button');
        rootBtn.type = 'button';
        rootBtn.className = 'node-btn root-btn';
        rootBtn.title = node.isRoot ? 'Current Starting Card (Root)' : 'Set as Starting Card';
        rootBtn.style.width = '10px';
        rootBtn.style.height = '10px';
        rootBtn.style.borderRadius = '50%';
        rootBtn.style.background = node.isRoot ? '#ffbd2e' : '#cbd5e1'; 
        rootBtn.style.border = 'none';
        rootBtn.style.cursor = 'pointer';
        rootBtn.style.padding = '0';
        rootBtn.style.opacity = node.isRoot ? '1.0' : '0.5';
        rootBtn.style.transition = 'opacity 0.15s, transform 0.15s, background-color 0.15s';
        rootBtn.style.outline = 'none';
        rootBtn.addEventListener('mouseenter', () => {
            rootBtn.style.opacity = '1.0';
            rootBtn.style.transform = 'scale(1.1)';
        });
        rootBtn.addEventListener('mouseleave', () => {
            rootBtn.style.opacity = node.isRoot ? '1.0' : '0.5';
            rootBtn.style.transform = 'scale(1)';
        });
        rootBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nodes.forEach(n => {
                n.isRoot = (n.id === node.id);
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        
        headerEl.appendChild(rootBtn);
        headerEl.appendChild(styleBtn);
        headerEl.appendChild(deleteBtn);
        
        const sides = ['top', 'right', 'bottom', 'left'];
        sides.forEach(side => {
            const plusBtn = document.createElement('div');
            plusBtn.className = `node-connector-plus ${side}`;
            if (state.linkingSourceNodeId === node.id && state.linkingSourceSide === side) {
                plusBtn.classList.add('active');
            }
            plusBtn.innerHTML = '+';
            
            let posStyles = '';
            if (side === 'top') posStyles = 'top: -10px; left: calc(50% - 10px);';
            else if (side === 'right') posStyles = 'top: calc(50% - 10px); right: -10px;';
            else if (side === 'bottom') posStyles = 'bottom: -10px; left: calc(50% - 10px);';
            else if (side === 'left') posStyles = 'top: calc(50% - 10px); left: -10px;';
            
            plusBtn.style.cssText = posStyles;
            
            plusBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (state.linkingSourceNodeId === node.id && state.linkingSourceSide === side) {
                    state.linkingSourceNodeId = null;
                    state.linkingSourceSide = null;
                } else {
                    state.linkingSourceNodeId = node.id;
                    state.linkingSourceSide = side;
                    
                    const canvasEl = container.parentNode;
                    const rect = canvasEl.getBoundingClientRect();
                    const activeZoom = isEdit ? state.editMapZoom : state.createMapZoom;
                    state.linkingMousePos.x = (e.clientX - rect.left) / activeZoom;
                    state.linkingMousePos.y = (e.clientY - rect.top) / activeZoom;
                }
                renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
            });
            
            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            nodeEl.appendChild(plusBtn);
        });
        
        const expRow = document.createElement('div');
        expRow.style = 'width: 100%; box-sizing: border-box; margin-bottom: 4px;';
        
        const expInput = document.createElement('input');
        expInput.type = 'text';
        expInput.className = 'node-explanation-input';
        expInput.value = node.explanation || '';
        expInput.placeholder = 'Explanation...';
        
        const sizeStyles = fontSizeMap[node.fontSize || 'medium'];
        expInput.style.fontSize = sizeStyles.exp;
        if (node.textColor) {
            expInput.style.color = node.textColor;
        } else {
            expInput.style.color = 'var(--text-secondary)';
        }
        
        expInput.addEventListener('input', (e) => {
            node.explanation = e.target.value;
        });
        expInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                expInput.blur();
            }
        });
        expRow.appendChild(expInput);
        
        const bodyEl = document.createElement('div');
        bodyEl.style = 'display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box;';
        
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'node-input';
        inputEl.value = node.text || '';
        inputEl.placeholder = 'Keyword...';
        
        inputEl.style.fontSize = sizeStyles.keyword;
        if (node.textColor) {
            inputEl.style.color = node.textColor;
        } else {
            inputEl.style.color = 'var(--text-primary)';
        }
        
        inputEl.addEventListener('input', (e) => {
            node.text = e.target.value;
        });
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                inputEl.blur();
            }
        });
        bodyEl.appendChild(inputEl);
        
        nodeEl.addEventListener('mouseup', (e) => {
            if (state.linkingSourceNodeId && state.linkingSourceNodeId !== node.id) {
                e.stopPropagation();
                const exists = links.some(l => l.source === state.linkingSourceNodeId && l.target === node.id);
                if (!exists) {
                    links.push({
                        source: state.linkingSourceNodeId,
                        target: node.id,
                        sourceSide: state.linkingSourceSide
                    });
                }
                state.linkingSourceNodeId = null;
                state.linkingSourceSide = null;
                renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
            }
        });
        
        nodeEl.appendChild(expRow);
        nodeEl.appendChild(bodyEl);
        
        let isDragging = false;
        let startX, startY;
        let startNodeX, startNodeY;
        let dragRafId = null;
        
        const handleStart = (clientX, clientY, e) => {
            if (state.linkingSourceNodeId) return;
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button' || e.target.closest('.icon-picker-dropdown')) return;
            
            if (e.target.tagName.toLowerCase() !== 'input') {
                e.preventDefault();
            }
            
            isDragging = true;
            nodeEl.style.cursor = 'grabbing';
            startX = clientX;
            startY = clientY;
            startNodeX = node.x;
            startNodeY = node.y;
        };

        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            if (dragRafId) {
                cancelAnimationFrame(dragRafId);
            }
            
            dragRafId = requestAnimationFrame(() => {
                const activeZoom = isEdit ? state.editMapZoom : state.createMapZoom;
                const dx = (clientX - startX) / activeZoom;
                const dy = (clientY - startY) / activeZoom;
                
                let nx = startNodeX + dx;
                let ny = startNodeY + dy;
                
                nx = Math.max(0, Math.min(2500 - 180, nx));
                ny = Math.max(0, Math.min(2000 - 90, ny));
                
                if (state.mapGridActive) {
                    nx = Math.round(nx / 20) * 20;
                    ny = Math.round(ny / 20) * 20;
                }
                
                node.x = nx;
                node.y = ny;
                
                nodeEl.style.left = `${nx}px`;
                nodeEl.style.top = `${ny}px`;
                
                drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
            });
        };

        const handleEnd = () => {
            isDragging = false;
            nodeEl.style.cursor = 'grab';
            if (dragRafId) {
                cancelAnimationFrame(dragRafId);
                dragRafId = null;
            }
        };

        nodeEl.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY, e);
            
            const onMouseMove = (moveEvent) => {
                handleMove(moveEvent.clientX, moveEvent.clientY);
            };
            
            const onMouseUp = () => {
                handleEnd();
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
        
        container.appendChild(nodeEl);
    });
}
