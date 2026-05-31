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

import {
    renderEditorNodes,
    showExplanationTooltip,
    hideExplanationTooltip
} from './canvas/nodeManager.js';

import {
    setCreateMapZoom,
    setEditMapZoom,
    setPracticeMapZoom,
    adjustPracticeViewportCentering,
    updateGridButtonsUI,
    toggleGridSnapping,
    initMapCanvasListeners
} from './canvas/viewport.js';

// We import renderPracticeNodes from the practice canvas domain to maintain complete backwards compatibility
import { renderPracticeNodes } from './practice/practiceCanvas.js';

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
    showNodeToolbar,
    
    renderEditorNodes,
    showExplanationTooltip,
    hideExplanationTooltip,
    
    setCreateMapZoom,
    setEditMapZoom,
    setPracticeMapZoom,
    adjustPracticeViewportCentering,
    updateGridButtonsUI,
    toggleGridSnapping,
    initMapCanvasListeners,
    
    renderPracticeNodes
};
