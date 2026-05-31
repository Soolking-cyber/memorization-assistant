import { state } from '../state.js';
import { showLinkToolbar } from './toolbarMenus.js';

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

