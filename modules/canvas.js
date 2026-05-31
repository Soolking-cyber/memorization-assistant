import { state } from './state.js';
import { ICONS } from './icons.js';
import { playUISound } from './sound.js';
import { fontSizeMap } from './uiHelpers.js';

export function getNodeBoundaryIntersection(src, tgt, w = 180, h = 90) {
    const cx = src.x + w / 2;
    const cy = src.y + h / 2;
    const tx = tgt.x + w / 2;
    const ty = tgt.y + h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const w2 = w / 2;
    const h2 = h / 2;
    let scale = 1;
    if (absDx * h2 > absDy * w2) {
        scale = w2 / absDx;
    } else {
        scale = h2 / absDy;
    }
    return {
        x: cx + dx * scale,
        y: cy + dy * scale
    };
}

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

export function getNodeSideCoords(node, side, w = 180, h = 90) {
    if (side === 'top') {
        return { x: node.x + w / 2, y: node.y };
    } else if (side === 'right') {
        return { x: node.x + w, y: node.y + h / 2 };
    } else if (side === 'bottom') {
        return { x: node.x + w / 2, y: node.y + h };
    } else if (side === 'left') {
        return { x: node.x, y: node.y + h / 2 };
    }
    return { x: node.x + w / 2, y: node.y + h / 2 };
}

export function getClosestSides(src, tgt, w = 180, h = 90) {
    const sides = ['top', 'right', 'bottom', 'left'];
    let minD = Infinity;
    let bestSrcSide = 'right';
    let bestTgtSide = 'left';
    
    sides.forEach(sSide => {
        const sPt = getNodeSideCoords(src, sSide, w, h);
        sides.forEach(tSide => {
            const tPt = getNodeSideCoords(tgt, tSide, w, h);
            const dx = tPt.x - sPt.x;
            const dy = tPt.y - sPt.y;
            const dist = dx * dx + dy * dy;
            if (dist < minD) {
                minD = dist;
                bestSrcSide = sSide;
                bestTgtSide = tSide;
            }
        });
    });
    return { srcSide: bestSrcSide, tgtSide: bestTgtSide };
}

export function getClosestTargetSide(sPt, tgt, w = 180, h = 90) {
    const sides = ['top', 'right', 'bottom', 'left'];
    let minD = Infinity;
    let bestTgtSide = 'left';
    
    sides.forEach(tSide => {
        const tPt = getNodeSideCoords(tgt, tSide, w, h);
        const dx = tPt.x - sPt.x;
        const dy = tPt.y - sPt.y;
        const dist = dx * dx + dy * dy;
        if (dist < minD) {
            minD = dist;
            bestTgtSide = tSide;
        }
    });
    return bestTgtSide;
}

export function updateDraftLink(svgId, srcNode, side, mousePos) {
    const svg = document.getElementById(svgId);
    if (!svg || !srcNode) return;
    
    const draftPathId = `${svgId}-draft-connection-path`;
    let draftPath = document.getElementById(draftPathId);
    
    const sPt = getNodeSideCoords(srcNode, side || 'right');
    const tPt = mousePos;
    
    const dx = tPt.x - sPt.x;
    const dy = tPt.y - sPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(150, Math.max(35, dist * 0.35));
    
    let tSide = 'left';
    if (side === 'left') tSide = 'right';
    else if (side === 'right') tSide = 'left';
    else if (side === 'top') tSide = 'bottom';
    else if (side === 'bottom') tSide = 'top';
    
    const cp1 = { x: sPt.x, y: sPt.y };
    if (side === 'left') cp1.x -= offset;
    else if (side === 'right') cp1.x += offset;
    else if (side === 'top') cp1.y -= offset;
    else if (side === 'bottom') cp1.y += offset;
    
    const cp2 = { x: tPt.x, y: tPt.y };
    if (tSide === 'left') cp2.x -= offset;
    else if (tSide === 'right') cp2.x += offset;
    else if (tSide === 'top') cp2.y -= offset;
    else if (tSide === 'bottom') cp2.y += offset;
    
    const pathData = `M ${sPt.x} ${sPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tPt.x} ${tPt.y}`;
    
    if (!draftPath) {
        draftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        draftPath.id = draftPathId;
        draftPath.className.baseVal = 'svg-link-element';
        draftPath.setAttribute('stroke', '#22c55e');
        draftPath.setAttribute('stroke-width', '2');
        draftPath.setAttribute('stroke-dasharray', '6,4');
        draftPath.setAttribute('fill', 'none');
        draftPath.style.opacity = '0.8';
        svg.appendChild(draftPath);
    }
    
    draftPath.setAttribute('d', pathData);
}

export function drawLinks(nodes, links, svgId, arrowheadId, interactive = false, containerId = null, isEdit = false) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    
    const activeIds = new Set();
    
    links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        
        if (!src || !tgt) return;
        
        let sSide = link.sourceSide;
        let tSide = link.targetSide;
        
        if (!sSide) {
            const closest = getClosestSides(src, tgt);
            sSide = closest.srcSide;
            tSide = closest.tgtSide;
        } else if (!tSide) {
            const sPtTemp = getNodeSideCoords(src, sSide);
            tSide = getClosestTargetSide(sPtTemp, tgt);
        }
        
        const sPt = getNodeSideCoords(src, sSide);
        const tPtRaw = getNodeSideCoords(tgt, tSide);
        
        let tPt = { x: tPtRaw.x, y: tPtRaw.y };
        if (tSide === 'top') tPt.y -= 6;
        else if (tSide === 'bottom') tPt.y += 6;
        else if (tSide === 'left') tPt.x -= 6;
        else if (tSide === 'right') tPt.x += 6;
        
        const dx = tPt.x - sPt.x;
        const dy = tPt.y - sPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = Math.min(150, Math.max(35, dist * 0.35));
        
        const cp1 = { x: sPt.x, y: sPt.y };
        if (sSide === 'left') cp1.x -= offset;
        else if (sSide === 'right') cp1.x += offset;
        else if (sSide === 'top') cp1.y -= offset;
        else if (sSide === 'bottom') cp1.y += offset;
        
        const cp2 = { x: tPt.x, y: tPt.y };
        if (tSide === 'left') cp2.x -= offset;
        else if (tSide === 'right') cp2.x += offset;
        else if (tSide === 'top') cp2.y -= offset;
        else if (tSide === 'bottom') cp2.y += offset;
        
        const pathData = `M ${sPt.x} ${sPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tPt.x} ${tPt.y}`;
        const lineColor = link.color || 'var(--text-secondary)';
        
        const pathId = `${svgId}-link-path-${link.source}-${link.target}`;
        activeIds.add(pathId);
        
        let path = document.getElementById(pathId);
        if (!path) {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.id = pathId;
            path.className.baseVal = 'svg-link-element';
            svg.appendChild(path);
        }
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', link.thickness || 2);
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', `url(#${arrowheadId})`);
        path.style.opacity = '0.7';
        path.style.color = lineColor;
        
        if (link.style === 'dashed') {
            path.setAttribute('stroke-dasharray', '6,4');
        } else if (link.style === 'dotted') {
            path.setAttribute('stroke-dasharray', '2,3');
        } else {
            path.removeAttribute('stroke-dasharray');
        }
        
        const midX = 0.125 * sPt.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * tPt.x;
        const midY = 0.125 * sPt.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * tPt.y;
        
        if (interactive && containerId) {
            const overlayId = `${svgId}-link-overlay-${link.source}-${link.target}`;
            activeIds.add(overlayId);
            
            let overlay = document.getElementById(overlayId);
            if (!overlay) {
                overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                overlay.id = overlayId;
                overlay.className.baseVal = 'svg-link-element';
                overlay.setAttribute('stroke', 'transparent');
                overlay.setAttribute('stroke-width', '12');
                overlay.setAttribute('fill', 'none');
                overlay.style.cursor = 'pointer';
                overlay.style.pointerEvents = 'stroke';
                
                overlay.onclick = (e) => {
                    e.stopPropagation();
                    const container = document.getElementById(containerId);
                    if (container) {
                        showLinkToolbar(
                            parseFloat(overlay.dataset.midX),
                            parseFloat(overlay.dataset.midY),
                            container,
                            link,
                            nodes,
                            links,
                            svgId,
                            arrowheadId,
                            containerId,
                            isEdit
                        );
                    }
                };
                svg.appendChild(overlay);
            }
            
            overlay.setAttribute('d', pathData);
            overlay.dataset.midX = midX;
            overlay.dataset.midY = midY;
        }
        
        const labelGroupId = `${svgId}-link-label-group-${link.source}-${link.target}`;
        if (link.label && link.label.trim().length > 0) {
            activeIds.add(labelGroupId);
            
            let group = document.getElementById(labelGroupId);
            let rect, text;
            
            if (!group) {
                group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                group.id = labelGroupId;
                group.className.baseVal = 'svg-link-element';
                group.style.userSelect = 'none';
                
                if (interactive) {
                    group.style.cursor = 'pointer';
                    group.style.pointerEvents = 'auto';
                    group.onclick = (e) => {
                        e.stopPropagation();
                        const container = document.getElementById(containerId);
                        if (container) {
                            showLinkToolbar(
                                parseFloat(group.dataset.midX),
                                parseFloat(group.dataset.midY),
                                container,
                                link,
                                nodes,
                                links,
                                svgId,
                                arrowheadId,
                                containerId,
                                isEdit
                            );
                        }
                    };
                }
                
                rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                
                group.appendChild(rect);
                group.appendChild(text);
                svg.appendChild(group);
            } else {
                rect = group.querySelector('rect');
                text = group.querySelector('text');
            }
            
            group.dataset.midX = midX;
            group.dataset.midY = midY;
            
            const labelLength = link.label.length;
            const rWidth = Math.max(45, labelLength * 6.5 + 10);
            const rHeight = 18;
            
            rect.setAttribute('width', rWidth);
            rect.setAttribute('height', rHeight);
            rect.setAttribute('x', midX - rWidth / 2);
            rect.setAttribute('y', midY - rHeight / 2);
            rect.setAttribute('rx', '4');
            rect.setAttribute('ry', '4');
            rect.setAttribute('fill', 'var(--bg-card)');
            rect.setAttribute('stroke', link.textColor || 'var(--border-color)');
            rect.setAttribute('stroke-width', '1');
            
            text.setAttribute('x', midX);
            text.setAttribute('y', midY + 4);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', '700');
            text.setAttribute('fill', link.textColor || 'var(--text-primary)');
            text.textContent = link.label;
        } else {
            const group = document.getElementById(labelGroupId);
            if (group) group.remove();
        }
    });
    
    const draftPathId = `${svgId}-draft-connection-path`;
    let draftPath = document.getElementById(draftPathId);
    
    if (interactive && state.linkingSourceNodeId) {
        activeIds.add(draftPathId);
        const srcNode = nodes.find(n => n.id === state.linkingSourceNodeId);
        if (srcNode) {
            const sSide = state.linkingSourceSide || 'right';
            const sPt = getNodeSideCoords(srcNode, sSide);
            const tPt = state.linkingMousePos;
            
            const dx = tPt.x - sPt.x;
            const dy = tPt.y - sPt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offset = Math.min(150, Math.max(35, dist * 0.35));
            
            let tSide = 'left';
            if (sSide === 'left') tSide = 'right';
            else if (sSide === 'right') tSide = 'left';
            else if (sSide === 'top') tSide = 'bottom';
            else if (sSide === 'bottom') tSide = 'top';
            
            const cp1 = { x: sPt.x, y: sPt.y };
            if (sSide === 'left') cp1.x -= offset;
            else if (sSide === 'right') cp1.x += offset;
            else if (sSide === 'top') cp1.y -= offset;
            else if (sSide === 'bottom') cp1.y += offset;
            
            const cp2 = { x: tPt.x, y: tPt.y };
            if (tSide === 'left') cp2.x -= offset;
            else if (tSide === 'right') cp2.x += offset;
            else if (tSide === 'top') cp2.y -= offset;
            else if (tSide === 'bottom') cp2.y += offset;
            
            const pathData = `M ${sPt.x} ${sPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tPt.x} ${tPt.y}`;
            
            if (!draftPath) {
                draftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                draftPath.id = draftPathId;
                draftPath.className.baseVal = 'svg-link-element';
                draftPath.setAttribute('stroke', '#22c55e');
                draftPath.setAttribute('stroke-width', '2');
                draftPath.setAttribute('stroke-dasharray', '6,4');
                draftPath.setAttribute('fill', 'none');
                draftPath.style.opacity = '0.8';
                svg.appendChild(draftPath);
            }
            draftPath.setAttribute('d', pathData);
        } else if (draftPath) {
            draftPath.remove();
        }
    } else if (draftPath) {
        draftPath.remove();
    }
    
    const staleElements = svg.querySelectorAll('.svg-link-element');
    staleElements.forEach(el => {
        if (!activeIds.has(el.id)) {
            el.remove();
        }
    });
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
