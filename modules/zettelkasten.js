import { state } from './state.js';
import { openEditView } from './card/cardCreator.js';

let canvas = null;
let ctx = null;
let nodes = [];
let links = [];
let animFrameId = null;

// Viewport transform
let zoom = 1.0;
let pan = { x: 0, y: 0 };
let isPanning = false;
let startPan = { x: 0, y: 0 };

// Physics constants
const REPULSION = 1200;
const SPRING_STIFFNESS = 0.04;
const SPRING_LENGTH = 140;
const DAMPING = 0.75;
const CENTER_GRAVITY = 0.005;

// Interactive states
let draggedNode = null;
let hoveredNode = null;
let searchQuery = '';
let selectedTag = '';

export function initZettelkastenView() {
    canvas = document.getElementById('zettelkasten-canvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // Resize handler
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Construct Nodes and Links from state.cards
    buildGraphData();
    
    // Set up UI listeners
    initUIControls();
    
    // Set up canvas event listeners
    initCanvasListeners();
    
    // Start physics and render loop
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
    }
    tick();
}

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function buildGraphData() {
    nodes = [];
    links = [];
    
    // 1. Gather all Zettelkasten cards as nodes
    state.cards.forEach(card => {
        if (card.type === 'Zettelkasten') {
            let quote = '';
            let tags = [];
            let cardLinks = [];
            try {
                const ztData = JSON.parse(card.front);
                quote = ztData.quote || card.front;
                tags = ztData.tags || [];
                cardLinks = ztData.links || [];
            } catch (e) {
                quote = card.front;
            }
            
            // Random start position around center
            const cx = canvas ? canvas.width / 2 : 400;
            const cy = canvas ? canvas.height / 2 : 300;
            
            nodes.push({
                id: card.id,
                quote: quote,
                reference: card.back,
                tags: tags,
                cardLinks: cardLinks,
                x: cx + (Math.random() - 0.5) * 300,
                y: cy + (Math.random() - 0.5) * 300,
                vx: 0,
                vy: 0,
                radius: 10 + Math.min(15, cardLinks.length * 2)
            });
        }
    });
    
    // 2. Build link connections
    nodes.forEach(node => {
        node.cardLinks.forEach(link => {
            // Check if the target node exists in our active node pool
            const targetExists = nodes.some(n => n.id === link.targetId);
            if (targetExists) {
                links.push({
                    source: node.id,
                    target: link.targetId,
                    label: link.label || ''
                });
            }
        });
    });
    
    // Center viewport initially
    resetZoom();
    
    // Render tag filter panel dynamically
    renderTagFilters();
}

function renderTagFilters() {
    const tagsContainer = document.getElementById('graph-tags-list');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    // Collect unique tags
    const allTags = new Set();
    nodes.forEach(node => {
        node.tags.forEach(tag => allTags.add(tag));
    });
    
    if (allTags.size === 0) {
        tagsContainer.innerHTML = '<span style="font-size:0.75rem; color:var(--text-secondary);">No tags found.</span>';
        return;
    }
    
    allTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = `tag-pill ${selectedTag === tag ? 'active' : ''}`;
        pill.textContent = `#${tag}`;
        pill.addEventListener('click', () => {
            if (selectedTag === tag) {
                selectedTag = '';
                pill.classList.remove('active');
            } else {
                selectedTag = tag;
                document.querySelectorAll('.tag-pill').forEach(el => el.classList.remove('active'));
                pill.classList.add('active');
            }
        });
        tagsContainer.appendChild(pill);
    });
}

function initUIControls() {
    // Search input
    const searchInput = document.getElementById('graph-search');
    if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
        };
    }
    
    // Zoom Buttons
    const btnZoomIn = document.getElementById('btn-graph-zoom-in');
    if (btnZoomIn) {
        btnZoomIn.onclick = () => {
            zoom = Math.min(3.0, zoom + 0.1);
            updateZoomLabel();
        };
    }
    
    const btnZoomOut = document.getElementById('btn-graph-zoom-out');
    if (btnZoomOut) {
        btnZoomOut.onclick = () => {
            zoom = Math.max(0.2, zoom - 0.1);
            updateZoomLabel();
        };
    }
    
    const btnZoomReset = document.getElementById('btn-graph-zoom-reset');
    if (btnZoomReset) {
        btnZoomReset.onclick = resetZoom;
    }
    
    const btnClearFilters = document.getElementById('btn-clear-graph-filters');
    if (btnClearFilters) {
        btnClearFilters.onclick = () => {
            selectedTag = '';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.tag-pill').forEach(el => el.classList.remove('active'));
        };
    }
}

function updateZoomLabel() {
    const label = document.getElementById('graph-zoom-label');
    if (label) {
        label.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function resetZoom() {
    zoom = 1.0;
    updateZoomLabel();
    if (canvas) {
        pan = {
            x: canvas.width / 2 - (canvas.width / 2) * zoom,
            y: canvas.height / 2 - (canvas.height / 2) * zoom
        };
    } else {
        pan = { x: 0, y: 0 };
    }
}

function initCanvasListeners() {
    if (!canvas) return;
    
    canvas.onmousedown = (e) => {
        const mousePos = getTransformedMousePos(e);
        
        // Check if clicking a node
        const clickedNode = findNodeAtPos(mousePos.x, mousePos.y);
        if (clickedNode) {
            draggedNode = clickedNode;
            canvas.style.cursor = 'grabbing';
        } else {
            isPanning = true;
            startPan = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            canvas.style.cursor = 'grabbing';
        }
    };
    
    canvas.onmousemove = (e) => {
        const mousePos = getTransformedMousePos(e);
        
        if (draggedNode) {
            draggedNode.x = mousePos.x;
            draggedNode.y = mousePos.y;
            draggedNode.vx = 0;
            draggedNode.vy = 0;
        } else if (isPanning) {
            pan.x = e.clientX - startPan.x;
            pan.y = e.clientY - startPan.y;
        } else {
            // Hover logic
            const node = findNodeAtPos(mousePos.x, mousePos.y);
            if (node !== hoveredNode) {
                hoveredNode = node;
                updateTooltip(e, node);
            } else if (hoveredNode) {
                // Keep updating tooltip position
                updateTooltip(e, hoveredNode);
            }
        }
    };
    
    canvas.onmouseup = () => {
        draggedNode = null;
        isPanning = false;
        canvas.style.cursor = 'grab';
    };
    
    canvas.onmouseleave = () => {
        draggedNode = null;
        isPanning = false;
        hoveredNode = null;
        updateTooltip(null, null);
    };
    
    canvas.onwheel = (e) => {
        e.preventDefault();
        
        const zoomIntensity = 0.05;
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);
        
        const nextZoom = Math.min(3.0, Math.max(0.2, zoom * zoomFactor));
        
        // Zoom centered on mouse pointer
        pan.x = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
        pan.y = mouseY - (mouseY - pan.y) * (nextZoom / zoom);
        zoom = nextZoom;
        updateZoomLabel();
    };
    
    canvas.ondblclick = (e) => {
        const mousePos = getTransformedMousePos(e);
        const node = findNodeAtPos(mousePos.x, mousePos.y);
        if (node) {
            // Cancel anim frame before jumping views
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            updateTooltip(null, null);
            openEditView(node.id);
        }
    };
}

function getTransformedMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    return { x, y };
}

function findNodeAtPos(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= node.radius + 8) {
            return node;
        }
    }
    return null;
}

function updateTooltip(e, node) {
    const tooltip = document.getElementById('graph-tooltip');
    if (!tooltip) return;
    
    if (!node || !e) {
        tooltip.classList.remove('visible');
        tooltip.style.display = 'none';
        return;
    }
    
    tooltip.innerHTML = `
        <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-secondary); margin-bottom:4px; letter-spacing:0.5px; font-weight:700;">Zettelkasten Quote</div>
        <blockquote style="margin:0 0 8px 0; font-style:italic; line-height:1.4; color:var(--text-primary); font-size:0.85rem;">"${node.quote.length > 200 ? node.quote.substring(0, 200) + '...' : node.quote}"</blockquote>
        <div style="font-size:0.8rem; font-weight:700; color:var(--accent); margin-bottom:6px;">— ${node.reference}</div>
        ${node.tags.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">${node.tags.map(t => `<span class="word-type-badge" style="margin:0; font-size:0.65rem; padding: 2px 6px;">#${t}</span>`).join('')}</div>` : ''}
        <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:8px; border-top: 1px solid var(--border-color); padding-top: 4px;">Double-click node to Edit</div>
    `;
    
    tooltip.style.display = 'block';
    tooltip.classList.add('visible');
    
    const rect = canvas.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    let xPos = e.clientX - rect.left + 15;
    let yPos = e.clientY - rect.top + 15;
    
    // Bounds checking
    if (xPos + tooltipWidth > canvas.width) {
        xPos = e.clientX - rect.left - tooltipWidth - 15;
    }
    if (yPos + tooltipHeight > canvas.height) {
        yPos = e.clientY - rect.top - tooltipHeight - 15;
    }
    
    tooltip.style.left = `${xPos}px`;
    tooltip.style.top = `${yPos}px`;
}

// Check if a node matches current active filters
function matchesFilter(node) {
    if (selectedTag && !node.tags.includes(selectedTag)) {
        return false;
    }
    
    if (searchQuery) {
        const inQuote = node.quote.toLowerCase().includes(searchQuery);
        const inRef = node.reference.toLowerCase().includes(searchQuery);
        const inTag = node.tags.some(t => t.toLowerCase().includes(searchQuery));
        return inQuote || inRef || inTag;
    }
    
    return true;
}

function tick() {
    if (!canvas || !ctx) return;
    
    // Check if the graph view is hidden
    const viewZettel = document.getElementById('view-zettelkasten');
    if (viewZettel && viewZettel.classList.contains('hidden')) {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        return;
    }
    
    // 1. Run physics simulation step
    updatePhysics();
    
    // 2. Draw scene
    draw();
    
    animFrameId = requestAnimationFrame(tick);
}

function updatePhysics() {
    const w = canvas.width;
    const h = canvas.height;
    
    // Coulomb Repulsion: push nodes away
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const u = nodes[i];
            const v = nodes[j];
            const dx = u.x - v.x;
            const dy = u.y - v.y;
            let distSq = dx * dx + dy * dy;
            if (distSq === 0) distSq = 1;
            const dist = Math.sqrt(distSq);
            
            // Repulsion strength
            const force = REPULSION / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            u.vx += fx;
            u.vy += fy;
            v.vx -= fx;
            v.vy -= fy;
        }
    }
    
    // Hooke Attraction: pull connected nodes together
    links.forEach(link => {
        const u = nodes.find(n => n.id === link.source);
        const v = nodes.find(n => n.id === link.target);
        if (!u || !v) return;
        
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Attraction spring force
        const force = SPRING_STIFFNESS * (dist - SPRING_LENGTH);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        u.vx += fx;
        u.vy += fy;
        v.vx -= fx;
        v.vy -= fy;
    });
    
    // Center gravity: pull everyone to viewport center
    const cx = w / 2;
    const cy = h / 2;
    nodes.forEach(node => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        
        node.vx += dx * CENTER_GRAVITY;
        node.vy += dy * CENTER_GRAVITY;
    });
    
    // Apply damping and update positions
    nodes.forEach(node => {
        if (node === draggedNode) return;
        
        node.x += node.vx;
        node.y += node.vy;
        
        node.vx *= DAMPING;
        node.vy *= DAMPING;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    // Apply pan and zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    const hasActiveFilters = !!(selectedTag || searchQuery);
    
    // Check neighbors if hovering
    const neighbors = new Set();
    if (hoveredNode) {
        neighbors.add(hoveredNode.id);
        links.forEach(link => {
            if (link.source === hoveredNode.id) neighbors.add(link.target);
            if (link.target === hoveredNode.id) neighbors.add(link.source);
        });
    }
    
    // 1. Draw Links / Edges
    links.forEach(link => {
        const u = nodes.find(n => n.id === link.source);
        const v = nodes.find(n => n.id === link.target);
        if (!u || !v) return;
        
        // Determine link opacity
        let opacity = 0.25;
        if (hasActiveFilters) {
            opacity = (matchesFilter(u) && matchesFilter(v)) ? 0.35 : 0.05;
        }
        if (hoveredNode) {
            const isRelevant = (link.source === hoveredNode.id || link.target === hoveredNode.id);
            opacity = isRelevant ? 0.8 : 0.05;
        }
        
        ctx.strokeStyle = `rgba(100, 108, 255, ${opacity})`;
        ctx.lineWidth = hoveredNode && (link.source === hoveredNode.id || link.target === hoveredNode.id) ? 2.5 : 1.5;
        
        // Draw edge line
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
        
        // Draw arrowhead at target edge boundary
        drawArrowhead(ctx, u.x, u.y, v.x, v.y, v.radius, opacity);
        
        // Draw relationship text label
        if (link.label && opacity > 0.1) {
            drawLinkLabel(ctx, u.x, u.y, v.x, v.y, link.label, opacity);
        }
    });
    
    // 2. Draw Nodes
    nodes.forEach(node => {
        const matches = matchesFilter(node);
        const isHovered = hoveredNode === node;
        const isNeighbor = hoveredNode && neighbors.has(node.id) && !isHovered;
        
        // Opacity
        let opacity = 1.0;
        if (hasActiveFilters) {
            opacity = matches ? 1.0 : 0.15;
        }
        if (hoveredNode) {
            opacity = (isHovered || isNeighbor) ? 1.0 : 0.15;
        }
        
        // Glow effect for nodes matching filters or hover states
        ctx.shadowBlur = (isHovered || isNeighbor || (matches && hasActiveFilters)) ? 12 : 0;
        ctx.shadowColor = isHovered ? 'var(--accent)' : 'rgba(100, 108, 255, 0.5)';
        
        // Outer border
        ctx.fillStyle = isHovered ? 'var(--accent)' : (isNeighbor ? 'rgba(100, 108, 255, 0.8)' : 'rgba(30, 30, 40, 0.9)');
        ctx.strokeStyle = isHovered ? '#fff' : (isNeighbor ? 'var(--accent)' : 'rgba(100, 108, 255, 0.6)');
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow for text drawing
        ctx.shadowBlur = 0;
        
        // Draw text label centered below node
        if (opacity > 0.3) {
            ctx.fillStyle = isHovered ? 'var(--accent)' : 'var(--text-primary)';
            ctx.font = isHovered ? 'bold 11px Outfit, sans-serif' : '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // Truncate label quote snippet
            const snippet = node.quote.length > 18 ? node.quote.substring(0, 15) + '...' : node.quote;
            ctx.fillText(snippet, node.x, node.y + node.radius + 6);
            
            // Secondary smaller text for source reference
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '8px Outfit, sans-serif';
            const refSnippet = node.reference.length > 20 ? node.reference.substring(0, 17) + '...' : node.reference;
            ctx.fillText(refSnippet, node.x, node.y + node.radius + 18);
        }
    });
    
    ctx.restore();
}

function drawArrowhead(ctx, x1, y1, x2, y2, radius, opacity) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 30) return;
    
    // Intersection point at node edge
    const arrowX = x2 - (dx / len) * radius;
    const arrowY = y2 - (dy / len) * radius;
    
    const angle = Math.atan2(dy, dx);
    const arrowSize = 6;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(100, 108, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowSize * Math.cos(angle - Math.PI / 6), arrowY - arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - arrowSize * Math.cos(angle + Math.PI / 6), arrowY - arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawLinkLabel(ctx, x1, y1, x2, y2, label, opacity) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(mx, my);
    // Maintain text readable right-side up
    if (Math.abs(angle) > Math.PI / 2) {
        ctx.rotate(angle + Math.PI);
    } else {
        ctx.rotate(angle);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'italic 8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Draw background block for label text
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(15, 15, 20, 0.8)';
    ctx.fillRect(-textWidth/2 - 4, -9, textWidth + 8, 10);
    
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.fillText(label, 0, 0);
    ctx.restore();
}

window.initZettelkastenView = initZettelkastenView;
