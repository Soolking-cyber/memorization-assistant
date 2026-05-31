import { state } from './state.js';
import { ICONS } from './icons.js';
import { playUISound } from './sound.js';
import { fontSizeMap } from './uiHelpers.js';
import {
    getNodeBoundaryIntersection,
    getNodeSideCoords,
    getClosestSides,
    getClosestTargetSide,
    updateDraftLink,
    drawLinks
} from './canvas/linkRenderer.js';
import {
    activeSelectedLink,
    hideLinkToolbar,
    showLinkToolbar,
    activeSelectedNode,
    hideNodeToolbar,
    showNodeToolbar
} from './canvas/toolbarMenus.js';

export {
    getNodeBoundaryIntersection,
    getNodeSideCoords,
    getClosestSides,
    getClosestTargetSide,
    updateDraftLink,
    drawLinks,
    activeSelectedLink,
    hideLinkToolbar,
    showLinkToolbar,
    activeSelectedNode,
    hideNodeToolbar,
    showNodeToolbar
};

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
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        nodeEl.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY, e);
            }
            
            const onTouchMove = (moveEvent) => {
                if (moveEvent.touches.length > 0) {
                    handleMove(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
                }
            };
            
            const onTouchEnd = () => {
                handleEnd();
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
            };
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        }, { passive: false });
        
        nodeEl.appendChild(headerEl);
        nodeEl.appendChild(expRow);
        nodeEl.appendChild(bodyEl);
        
        container.appendChild(nodeEl);
    });
}

export function setCreateMapZoom(level) {
    state.createMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('create-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${state.createMapZoom})`;
    }
    const label = document.getElementById('create-zoom-label');
    if (label) {
        label.textContent = `${Math.round(state.createMapZoom * 100)}%`;
    }
}

export function setEditMapZoom(level) {
    state.editMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('edit-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${state.editMapZoom})`;
    }
    const label = document.getElementById('edit-zoom-label');
    if (label) {
        label.textContent = `${Math.round(state.editMapZoom * 100)}%`;
    }
}

export function setPracticeMapZoom(level) {
    state.practiceMapZoom = Math.min(1.5, Math.max(0.5, level));
    const viewport = document.getElementById('practice-map-viewport');
    if (viewport) {
        viewport.style.transform = `scale(${state.practiceMapZoom})`;
        adjustPracticeViewportCentering();
    }
    const label = document.getElementById('practice-zoom-label');
    if (label) {
        label.textContent = `${Math.round(state.practiceMapZoom * 100)}%`;
    }
}

export function adjustPracticeViewportCentering(viewportWidth, viewportHeight) {
    const viewport = document.getElementById('practice-map-viewport');
    const scrollContainer = document.getElementById('practice-map-canvas-container');
    if (!viewport || !scrollContainer) return;
    
    if (viewportWidth !== undefined && viewportHeight !== undefined) {
        viewport.dataset.originalWidth = viewportWidth;
        viewport.dataset.originalHeight = viewportHeight;
    } else {
        viewportWidth = parseFloat(viewport.dataset.originalWidth) || parseFloat(viewport.style.width) || 2500;
        viewportHeight = parseFloat(viewport.dataset.originalHeight) || parseFloat(viewport.style.height) || 2000;
    }
    
    const containerWidth = scrollContainer.clientWidth || 400;
    const containerHeight = scrollContainer.clientHeight || 400;
    
    const scaledWidth = viewportWidth * state.practiceMapZoom;
    const scaledHeight = viewportHeight * state.practiceMapZoom;
    
    const leftMargin = Math.max(0, (containerWidth - scaledWidth) / 2);
    const topMargin = Math.max(0, (containerHeight - scaledHeight) / 2);
    
    viewport.style.left = `${leftMargin}px`;
    viewport.style.top = `${topMargin}px`;
    
    if (scaledWidth > containerWidth) {
        scrollContainer.scrollLeft = (scaledWidth - containerWidth) / 2;
    }
    if (scaledHeight > containerHeight) {
        scrollContainer.scrollTop = (scaledHeight - containerHeight) / 2;
    }
}

export function updateGridButtonsUI() {
    const createBtn = document.getElementById('btn-create-grid');
    const editBtn = document.getElementById('btn-edit-grid');
    if (state.mapGridActive) {
        if (createBtn) createBtn.classList.add('grid-active');
        if (editBtn) editBtn.classList.add('grid-active');
    } else {
        if (createBtn) createBtn.classList.remove('grid-active');
        if (editBtn) editBtn.classList.remove('grid-active');
    }
}

export function toggleGridSnapping() {
    state.mapGridActive = !state.mapGridActive;
    updateGridButtonsUI();
    
    if (state.mapGridActive) {
        state.createMapNodes.forEach(node => {
            node.x = Math.round(node.x / 20) * 20;
            node.y = Math.round(node.y / 20) * 20;
        });
        state.editMapNodes.forEach(node => {
            node.x = Math.round(node.x / 20) * 20;
            node.y = Math.round(node.y / 20) * 20;
        });
    }
    
    renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
    renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
}

export function initMapCanvasListeners() {
    let createCanvasRafId = null;
    let editCanvasRafId = null;
    
    const handleAddCreateNode = () => {
        const id = 'node_' + Date.now();
        
        let cx = 150;
        let cy = 150;
        const canvas = document.getElementById('create-map-canvas-container');
        if (canvas) {
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const width = canvas.clientWidth || canvas.offsetWidth || 800;
            const height = canvas.clientHeight || canvas.offsetHeight || 500;
            cx = (scrollLeft + width / 2) / state.createMapZoom - 90;
            cy = (scrollTop + height / 2) / state.createMapZoom - 45;
        }
        
        let boundedX = Math.max(0, Math.min(2500 - 180, cx));
        let boundedY = Math.max(0, Math.min(2000 - 90, cy));
        
        if (state.mapGridActive) {
            boundedX = Math.round(boundedX / 20) * 20;
            boundedY = Math.round(boundedY / 20) * 20;
        }
        
        state.createMapNodes.push({
            id: id,
            text: '',
            explanation: '',
            x: boundedX,
            y: boundedY,
            isRoot: state.createMapNodes.length === 0
        });
        renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
    };
    
    const btnCreateAddBar = document.getElementById('btn-create-map-add-node-bar');
    if (btnCreateAddBar) btnCreateAddBar.addEventListener('click', handleAddCreateNode);
    
    const handleClearCreate = async () => {
        if (await window.confirm("Are you sure you want to clear the mind map canvas?")) {
            state.createMapNodes = [];
            state.createMapLinks = [];
            state.linkingSourceNodeId = null;
            renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
        }
    };
    
    const btnCreateClearBar = document.getElementById('btn-create-map-clear-bar');
    if (btnCreateClearBar) btnCreateClearBar.addEventListener('click', handleClearCreate);
    
    const createCanvas = document.getElementById('create-map-canvas-container');
    if (createCanvas) {
        createCanvas.addEventListener('dblclick', (e) => {
            if (e.target.closest('.map-node') || e.target.closest('.canvas-zoom-controls')) {
                return;
            }
            const viewport = document.getElementById('create-map-viewport');
            const rect = viewport.getBoundingClientRect();
            const x = (e.clientX - rect.left) / state.createMapZoom - 90;
            const y = (e.clientY - rect.top) / state.createMapZoom - 45;
            let boundedX = Math.max(0, Math.min(2500 - 180, x));
            let boundedY = Math.max(0, Math.min(2000 - 90, y));
            
            if (state.mapGridActive) {
                boundedX = Math.round(boundedX / 20) * 20;
                boundedY = Math.round(boundedY / 20) * 20;
            }
            
            const id = 'node_' + Date.now();
            state.createMapNodes.push({
                id: id,
                text: '',
                explanation: '',
                x: boundedX,
                y: boundedY,
                isRoot: state.createMapNodes.length === 0
            });
            renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead');
        });
        
        createCanvas.addEventListener('mousemove', (e) => {
            if (state.linkingSourceNodeId) {
                if (createCanvasRafId) {
                    cancelAnimationFrame(createCanvasRafId);
                }
                createCanvasRafId = requestAnimationFrame(() => {
                    const viewport = document.getElementById('create-map-viewport');
                    if (!viewport) return;
                    const rect = viewport.getBoundingClientRect();
                    state.linkingMousePos.x = (e.clientX - rect.left) / state.createMapZoom;
                    state.linkingMousePos.y = (e.clientY - rect.top) / state.createMapZoom;
                    const srcNode = state.createMapNodes.find(n => n.id === state.linkingSourceNodeId);
                    updateDraftLink('create-map-svg', srcNode, state.linkingSourceSide, state.linkingMousePos);
                });
            }
        });
        
        createCanvas.addEventListener('mouseup', (e) => {
            if (createCanvasRafId) {
                cancelAnimationFrame(createCanvasRafId);
                createCanvasRafId = null;
            }
            if (state.linkingSourceNodeId && !e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                const viewport = document.getElementById('create-map-viewport');
                const rect = viewport.getBoundingClientRect();
                const x = (e.clientX - rect.left) / state.createMapZoom - 90;
                const y = (e.clientY - rect.top) / state.createMapZoom - 45;
                let boundedX = Math.max(0, Math.min(2500 - 180, x));
                let boundedY = Math.max(0, Math.min(2000 - 90, y));
                
                if (state.mapGridActive) {
                    boundedX = Math.round(boundedX / 20) * 20;
                    boundedY = Math.round(boundedY / 20) * 20;
                }
                
                const newId = 'node_' + Date.now();
                state.createMapNodes.push({
                    id: newId,
                    text: '',
                    explanation: '',
                    x: boundedX,
                    y: boundedY,
                    isRoot: state.createMapNodes.length === 0
                });
                
                state.createMapLinks.push({
                    source: state.linkingSourceNodeId,
                    target: newId,
                    sourceSide: state.linkingSourceSide
                });
                
                state.linkingSourceNodeId = null;
                state.linkingSourceSide = null;
                renderEditorNodes('create-map-nodes-container', state.createMapNodes, state.createMapLinks, 'create-map-svg', 'create-arrowhead', false);
            }
        });
        
        createCanvas.addEventListener('click', (e) => {
            if (!e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                if (!state.linkingSourceNodeId) {
                    hideLinkToolbar(createCanvas);
                    hideNodeToolbar(createCanvas);
                    createCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
                }
            }
        });
    }

    const handleAddEditNode = () => {
        const id = 'node_' + Date.now();
        
        let cx = 150;
        let cy = 150;
        const canvas = document.getElementById('edit-map-canvas-container');
        if (canvas) {
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const width = canvas.clientWidth || canvas.offsetWidth || 800;
            const height = canvas.clientHeight || canvas.offsetHeight || 500;
            cx = (scrollLeft + width / 2) / state.editMapZoom - 90;
            cy = (scrollTop + height / 2) / state.editMapZoom - 45;
        }
        
        let boundedX = Math.max(0, Math.min(2500 - 180, cx));
        let boundedY = Math.max(0, Math.min(2000 - 90, cy));
        
        if (state.mapGridActive) {
            boundedX = Math.round(boundedX / 20) * 20;
            boundedY = Math.round(boundedY / 20) * 20;
        }
        
        state.editMapNodes.push({
            id: id,
            text: '',
            explanation: '',
            x: boundedX,
            y: boundedY,
            isRoot: state.editMapNodes.length === 0
        });
        renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
    };
    
    const btnEditAddBar = document.getElementById('btn-edit-map-add-node-bar');
    if (btnEditAddBar) btnEditAddBar.addEventListener('click', handleAddEditNode);
    
    const handleClearEdit = async () => {
        if (await window.confirm("Are you sure you want to clear the mind map canvas?")) {
            state.editMapNodes = [];
            state.editMapLinks = [];
            state.linkingSourceNodeId = null;
            renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        }
    };
    
    const btnEditClearBar = document.getElementById('btn-edit-map-clear-bar');
    if (btnEditClearBar) btnEditClearBar.addEventListener('click', handleClearEdit);
    
    const editCanvas = document.getElementById('edit-map-canvas-container');
    if (editCanvas) {
        editCanvas.addEventListener('dblclick', (e) => {
            if (e.target.closest('.map-node') || e.target.closest('.canvas-zoom-controls')) {
                return;
            }
            const viewport = document.getElementById('edit-map-viewport');
            const rect = viewport.getBoundingClientRect();
            const x = (e.clientX - rect.left) / state.editMapZoom - 90;
            const y = (e.clientY - rect.top) / state.editMapZoom - 45;
            let boundedX = Math.max(0, Math.min(2500 - 180, x));
            let boundedY = Math.max(0, Math.min(2000 - 90, y));
            
            if (state.mapGridActive) {
                boundedX = Math.round(boundedX / 20) * 20;
                boundedY = Math.round(boundedY / 20) * 20;
            }
            
            const id = 'node_' + Date.now();
            state.editMapNodes.push({
                id: id,
                text: '',
                explanation: '',
                x: boundedX,
                y: boundedY,
                isRoot: state.editMapNodes.length === 0
            });
            renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
        });
        
        editCanvas.addEventListener('mousemove', (e) => {
            if (state.linkingSourceNodeId) {
                if (editCanvasRafId) {
                    cancelAnimationFrame(editCanvasRafId);
                }
                editCanvasRafId = requestAnimationFrame(() => {
                    const viewport = document.getElementById('edit-map-viewport');
                    if (!viewport) return;
                    const rect = viewport.getBoundingClientRect();
                    state.linkingMousePos.x = (e.clientX - rect.left) / state.editMapZoom;
                    state.linkingMousePos.y = (e.clientY - rect.top) / state.editMapZoom;
                    const srcNode = state.editMapNodes.find(n => n.id === state.linkingSourceNodeId);
                    updateDraftLink('edit-map-svg', srcNode, state.linkingSourceSide, state.linkingMousePos);
                });
            }
        });
        
        editCanvas.addEventListener('mouseup', (e) => {
            if (editCanvasRafId) {
                cancelAnimationFrame(editCanvasRafId);
                editCanvasRafId = null;
            }
            if (state.linkingSourceNodeId && !e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                const viewport = document.getElementById('edit-map-viewport');
                const rect = viewport.getBoundingClientRect();
                const x = (e.clientX - rect.left) / state.editMapZoom - 90;
                const y = (e.clientY - rect.top) / state.editMapZoom - 45;
                let boundedX = Math.max(0, Math.min(2500 - 180, x));
                let boundedY = Math.max(0, Math.min(2000 - 90, y));
                
                if (state.mapGridActive) {
                    boundedX = Math.round(boundedX / 20) * 20;
                    boundedY = Math.round(boundedY / 20) * 20;
                }
                
                const newId = 'node_' + Date.now();
                state.editMapNodes.push({
                    id: newId,
                    text: '',
                    explanation: '',
                    x: boundedX,
                    y: boundedY,
                    isRoot: state.editMapNodes.length === 0
                });
                
                state.editMapLinks.push({
                    source: state.linkingSourceNodeId,
                    target: newId,
                    sourceSide: state.linkingSourceSide
                });
                
                state.linkingSourceNodeId = null;
                state.linkingSourceSide = null;
                renderEditorNodes('edit-map-nodes-container', state.editMapNodes, state.editMapLinks, 'edit-map-svg', 'edit-arrowhead', true);
            }
        });
        
        editCanvas.addEventListener('click', (e) => {
            if (!e.target.closest('.map-node') && !e.target.closest('.canvas-zoom-controls')) {
                if (!state.linkingSourceNodeId) {
                    hideLinkToolbar(editCanvas);
                    hideNodeToolbar(editCanvas);
                    editCanvas.querySelectorAll('.icon-picker-dropdown').forEach(p => p.remove());
                }
            }
        });
    }
}

export function showExplanationTooltip(nodeEl, text) {
    hideExplanationTooltip();
    playUISound('tooltip');
    
    const tooltip = document.createElement('div');
    tooltip.className = 'node-explanation-tooltip';
    tooltip.textContent = text;
    
    const nx = parseFloat(nodeEl.style.left) || 0;
    const ny = parseFloat(nodeEl.style.top) || 0;
    
    tooltip.style.left = `${nx + 90}px`;
    tooltip.style.top = `${ny - 10}px`;
    
    const container = document.getElementById('practice-map-nodes-container');
    if (container) {
        container.appendChild(tooltip);
    }
}

export function hideExplanationTooltip() {
    const existing = document.querySelectorAll('.node-explanation-tooltip');
    existing.forEach(t => t.remove());
}

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
