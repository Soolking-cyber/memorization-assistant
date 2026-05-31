import { state } from '../state.js';
import { ICONS } from '../icons.js';
import { playUISound } from '../sound.js';
import { drawLinks } from './linkRenderer.js';
import { renderEditorNodes } from '../canvas.js';

export let activeSelectedLink = null;

export function hideLinkToolbar(container) {
    const existing = container.querySelector('.map-link-toolbar');
    if (existing) {
        existing.remove();
    }
    activeSelectedLink = null;
}


export function showLinkToolbar(midX, midY, container, link, nodes, links, svgId, arrowheadId, containerId, isEdit) {
    if (activeSelectedLink && activeSelectedLink.link.source === link.source && activeSelectedLink.link.target === link.target) {
        hideLinkToolbar(container);
        return;
    }
    
    hideLinkToolbar(container);
    
    activeSelectedLink = { link, svgId, containerId, nodes, links, arrowheadId, isEdit };
    
    const toolbar = document.createElement('div');
    toolbar.className = 'map-link-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.zIndex = '1000';
    
    let scrollContainer = null;
    let zoom = 1.0;
    
    if (isEdit) {
        scrollContainer = document.getElementById('edit-map-canvas-container');
        zoom = state.editMapZoom;
    } else if (containerId === 'create-map-nodes-container') {
        scrollContainer = document.getElementById('create-map-canvas-container');
        zoom = state.createMapZoom;
    } else if (containerId === 'practice-map-nodes-container') {
        scrollContainer = document.getElementById('practice-map-canvas-container');
        zoom = state.practiceMapZoom;
    }
    
    if (!scrollContainer && containerId) {
        const scrollContainerId = containerId.replace('nodes-container', 'canvas-container');
        scrollContainer = document.getElementById(scrollContainerId);
    }
    if (!scrollContainer && container) {
        scrollContainer = container.closest('[id$="-canvas-container"]') || container.parentNode;
    }
    
    let clampedMidX = midX;
    let toolbarTop = midY - 45;
    let transformY = 'translate(-50%, -100%)';
    
    if (scrollContainer) {
        const toolbarWidth = 220;
        const toolbarHeight = 245; 
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        
        const padding = 15;
        const halfWidth = toolbarWidth / 2;
        
        const visibleMinX = scrollLeft / zoom;
        const visibleMaxX = (scrollLeft + containerWidth) / zoom;
        const visibleMinY = scrollTop / zoom;
        const visibleMaxY = (scrollTop + containerHeight) / zoom;
        
        const minClampedX = visibleMinX + halfWidth + padding;
        const maxClampedX = visibleMaxX - halfWidth - padding;
        
        if (minClampedX < maxClampedX) {
            clampedMidX = Math.max(minClampedX, Math.min(maxClampedX, midX));
        } else {
            clampedMidX = visibleMinX + (visibleMaxX - visibleMinX) / 2;
        }
        
        const spaceAbove = midY - 45 - visibleMinY;
        
        if (spaceAbove < toolbarHeight + padding) {
            toolbarTop = midY + 35;
            transformY = 'translate(-50%, 0)';
            
            if (toolbarTop + toolbarHeight + padding > visibleMaxY) {
                toolbarTop = Math.max(visibleMinY + padding, visibleMaxY - toolbarHeight - padding);
            }
        } else {
            toolbarTop = midY - 45;
            transformY = 'translate(-50%, -100%)';
            
            if (toolbarTop - toolbarHeight < visibleMinY + padding) {
                toolbarTop = visibleMinY + toolbarHeight + padding;
            }
        }
    }
    
    toolbar.style.left = `${clampedMidX}px`;
    toolbar.style.top = `${toolbarTop}px`;
    toolbar.style.transform = transformY;
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toolbar-close-btn';
    closeBtn.innerHTML = ICONS.closeSmall;
    closeBtn.style = 'position: absolute; right: 4px; top: 4px; border: none; background: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 2px;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideLinkToolbar(container);
    });
    toolbar.appendChild(closeBtn);

    const inputGroup = document.createElement('div');
    inputGroup.style = 'display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; width: 100%;';
    
    const label = document.createElement('label');
    label.textContent = 'Connection Label';
    label.className = 'toolbar-section-label';
    label.style.marginTop = '0';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = link.label || '';
    input.placeholder = 'e.g. causes, belongs to...';
    input.className = 'toolbar-input';
    input.style = 'padding: 6px 8px; font-size: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;';
    
    input.addEventListener('input', (e) => {
        link.label = e.target.value;
        drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
    });
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    toolbar.appendChild(inputGroup);
    
    const thickLabel = document.createElement('div');
    thickLabel.textContent = 'Arrow Thickness';
    thickLabel.className = 'toolbar-section-label';
    toolbar.appendChild(thickLabel);
    
    const thicknessDiv = document.createElement('div');
    thicknessDiv.className = 'segmented-control';
    thicknessDiv.style.marginBottom = '6px';
    
    const thickOptions = [1, 2, 3, 4];
    thickOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = `${opt}px`;
        btn.className = `segmented-btn ${(link.thickness || 2) === opt ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            link.thickness = opt;
            thicknessDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (thickOptions[i] === opt) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        thicknessDiv.appendChild(btn);
    });
    toolbar.appendChild(thicknessDiv);
    
    const styleLabel = document.createElement('div');
    styleLabel.textContent = 'Line Style';
    styleLabel.className = 'toolbar-section-label';
    toolbar.appendChild(styleLabel);
    
    const stylesDiv = document.createElement('div');
    stylesDiv.className = 'segmented-control';
    stylesDiv.style.marginBottom = '6px';
    
    const styleOptions = [
        { name: 'Solid', value: 'solid' },
        { name: 'Dashed', value: 'dashed' },
        { name: 'Dotted', value: 'dotted' }
    ];
    styleOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.name;
        btn.className = `segmented-btn ${(link.style || 'solid') === opt.value ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            link.style = opt.value;
            stylesDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (styleOptions[i].value === opt.value) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        stylesDiv.appendChild(btn);
    });
    toolbar.appendChild(stylesDiv);
    
    const colorOptions = [
        { name: 'Default', value: '' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Purple', value: '#a855f7' }
    ];
    
    const arrowColorLabel = document.createElement('div');
    arrowColorLabel.textContent = 'Arrow Color';
    arrowColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(arrowColorLabel);
    
    const arrowColorsDiv = document.createElement('div');
    arrowColorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 6px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-secondary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((link.color || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            link.color = opt.value;
            arrowColorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        arrowColorsDiv.appendChild(dot);
    });
    toolbar.appendChild(arrowColorsDiv);
    
    const textColorLabel = document.createElement('div');
    textColorLabel.textContent = 'Text Color';
    textColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(textColorLabel);
    
    const textColorsDiv = document.createElement('div');
    textColorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 10px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-primary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((link.textColor || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            link.textColor = opt.value;
            textColorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        });
        textColorsDiv.appendChild(dot);
    });
    toolbar.appendChild(textColorsDiv);
    
    const hr = document.createElement('div');
    hr.style = 'border-top: 1px solid var(--border-color); margin-bottom: 8px; width: 100%;';
    toolbar.appendChild(hr);
    
    const deleteRow = document.createElement('div');
    deleteRow.style = 'display: flex; justify-content: flex-end; align-items: center; width: 100%;';
    
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'link-delete-btn';
    delBtn.innerHTML = ICONS.trash;
    delBtn.title = 'Delete Connection';
    delBtn.style = 'border: none; background: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; padding: 2px; transition: transform 0.1s;';
    delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (await window.confirm("Are you sure you want to delete this connection?")) {
            const idx = links.indexOf(link);
            if (idx !== -1) {
                links.splice(idx, 1);
            }
            hideLinkToolbar(container);
            drawLinks(nodes, links, svgId, arrowheadId, true, containerId, isEdit);
        }
    });
    deleteRow.appendChild(delBtn);
    toolbar.appendChild(deleteRow);
    const viewport = container.querySelector('[id$="-viewport"]');
    if (viewport) {
        viewport.appendChild(toolbar);
    } else {
        container.appendChild(toolbar);
    }
}


export let activeSelectedNode = null;

export function hideNodeToolbar(container) {
    if (!container) return;
    const existing = container.querySelector('.map-node-toolbar') || 
                     (container.parentNode && container.parentNode.querySelector('.map-node-toolbar')) ||
                     document.querySelector('.map-node-toolbar');
    if (existing) {
        existing.remove();
    }
    activeSelectedNode = null;
}


export function showNodeToolbar(node, container, containerId, nodes, links, svgId, arrowheadId, isEdit) {
    if (activeSelectedNode && activeSelectedNode.node.id === node.id) {
        hideNodeToolbar(container);
        return;
    }
    
    hideNodeToolbar(container);
    
    activeSelectedNode = { node, containerId, isEdit };
    
    const toolbar = document.createElement('div');
    toolbar.className = 'map-node-toolbar';
    toolbar.style.position = 'absolute';
    toolbar.style.zIndex = '1000';
    
    let scrollContainer = null;
    let zoom = 1.0;
    
    if (isEdit) {
        scrollContainer = document.getElementById('edit-map-canvas-container');
        zoom = state.editMapZoom;
    } else if (containerId === 'create-map-nodes-container') {
        scrollContainer = document.getElementById('create-map-canvas-container');
        zoom = state.createMapZoom;
    } else if (containerId === 'practice-map-nodes-container') {
        scrollContainer = document.getElementById('practice-map-canvas-container');
        zoom = state.practiceMapZoom;
    }
    
    if (!scrollContainer && containerId) {
        const scrollContainerId = containerId.replace('nodes-container', 'canvas-container');
        scrollContainer = document.getElementById(scrollContainerId);
    }
    if (!scrollContainer && container) {
        scrollContainer = container.closest('[id$="-canvas-container"]') || container.parentNode;
    }
    
    const nodeCenterX = node.x + 90; 
    const nodeTopY = node.y; 
    
    let clampedMidX = nodeCenterX;
    let toolbarTop = nodeTopY - 15;
    let transformY = 'translate(-50%, -100%)';
    
    if (scrollContainer) {
        const toolbarWidth = 220;
        const toolbarHeight = 180; 
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollTop = scrollContainer.scrollTop;
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        
        const padding = 15;
        const halfWidth = toolbarWidth / 2;
        
        const visibleMinX = scrollLeft / zoom;
        const visibleMaxX = (scrollLeft + containerWidth) / zoom;
        const visibleMinY = scrollTop / zoom;
        const visibleMaxY = (scrollTop + containerHeight) / zoom;
        
        const minClampedX = visibleMinX + halfWidth + padding;
        const maxClampedX = visibleMaxX - halfWidth - padding;
        
        if (minClampedX < maxClampedX) {
            clampedMidX = Math.max(minClampedX, Math.min(maxClampedX, nodeCenterX));
        } else {
            clampedMidX = visibleMinX + (visibleMaxX - visibleMinX) / 2;
        }
        
        const spaceAbove = nodeTopY - 15 - visibleMinY;
        
        if (spaceAbove < toolbarHeight + padding) {
            toolbarTop = nodeTopY + 90 + 15;
            transformY = 'translate(-50%, 0)';
            
            if (toolbarTop + toolbarHeight + padding > visibleMaxY) {
                toolbarTop = Math.max(visibleMinY + padding, visibleMaxY - toolbarHeight - padding);
            }
        } else {
            toolbarTop = nodeTopY - 15;
            transformY = 'translate(-50%, -100%)';
            
            if (toolbarTop - toolbarHeight < visibleMinY + padding) {
                toolbarTop = visibleMinY + toolbarHeight + padding;
            }
        }
    }
    
    toolbar.style.left = `${clampedMidX}px`;
    toolbar.style.top = `${toolbarTop}px`;
    toolbar.style.transform = transformY;
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toolbar-close-btn';
    closeBtn.innerHTML = ICONS.closeSmall;
    closeBtn.style = 'position: absolute; right: 4px; top: 4px; border: none; background: none; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 2px;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideNodeToolbar(container);
    });
    toolbar.appendChild(closeBtn);
    
    const title = document.createElement('div');
    title.textContent = 'Card Styling';
    title.style = 'font-size: 0.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 10px; padding-right: 16px;';
    toolbar.appendChild(title);
    
    const textColorLabel = document.createElement('div');
    textColorLabel.textContent = 'Text Color';
    textColorLabel.className = 'toolbar-section-label';
    toolbar.appendChild(textColorLabel);
    
    const colorOptions = [
        { name: 'Default', value: '' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Purple', value: '#a855f7' }
    ];
    
    const colorsDiv = document.createElement('div');
    colorsDiv.style = 'display: flex; gap: 6px; margin-bottom: 12px;';
    colorOptions.forEach(opt => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'color-dot';
        dot.title = opt.name;
        dot.style = `width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border-color); cursor: pointer; padding: 0; background-color: ${opt.value || 'var(--text-primary)'}; transition: transform 0.1s; position: relative;`;
        
        if ((node.textColor || '') === opt.value) {
            dot.style.transform = 'scale(1.2)';
            dot.style.borderColor = 'var(--text-primary)';
            dot.style.boxShadow = '0 0 4px var(--accent)';
        }
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            node.textColor = opt.value;
            colorsDiv.querySelectorAll('.color-dot').forEach((d, i) => {
                d.style.transform = '';
                d.style.borderColor = 'var(--border-color)';
                d.style.boxShadow = '';
                if (colorOptions[i].value === opt.value) {
                    d.style.transform = 'scale(1.2)';
                    d.style.borderColor = 'var(--text-primary)';
                    d.style.boxShadow = '0 0 4px var(--accent)';
                }
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        colorsDiv.appendChild(dot);
    });
    toolbar.appendChild(colorsDiv);
    
    const sizeLabel = document.createElement('div');
    sizeLabel.textContent = 'Text Size';
    sizeLabel.className = 'toolbar-section-label';
    toolbar.appendChild(sizeLabel);
    
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'segmented-control';
    
    const sizeOptions = [
        { name: 'Small', value: 'small' },
        { name: 'Medium', value: 'medium' },
        { name: 'Large', value: 'large' },
        { name: 'XL', value: 'xl' }
    ];
    
    sizeOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.name;
        btn.className = `segmented-btn ${(node.fontSize || 'medium') === opt.value ? 'active' : ''}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            node.fontSize = opt.value;
            sizeDiv.querySelectorAll('.segmented-btn').forEach((b, i) => {
                if (sizeOptions[i].value === opt.value) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            renderEditorNodes(containerId, nodes, links, svgId, arrowheadId, isEdit);
        });
        sizeDiv.appendChild(btn);
    });
    toolbar.appendChild(sizeDiv);
    
    const viewport = container.querySelector('[id$="-viewport"]') || container.parentNode;
    if (viewport) {
        viewport.appendChild(toolbar);
    } else {
        container.appendChild(toolbar);
    }
}
