import { state } from '../state.js';
import { renderEditorNodes } from './nodeManager.js';
import { updateDraftLink } from './linkRenderer.js';
import { hideLinkToolbar, hideNodeToolbar } from './toolbarMenus.js';

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
