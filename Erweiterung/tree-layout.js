import {getVisibleChildren} from "./node-presentation.js";

export const CARD_WIDTH = 280;
export const CARD_HEIGHT = 152;
const COLUMN_GAP = 342;
const ROW_GAP = CARD_HEIGHT + 32;
const MAX_VISIBLE_NODES = 600;

export function createTreeLayout({rootId, nodes, expandedIds, filters}) {
  const positions = new Map();
  const links = [];
  let nextRow = 0;
  let deepestLevel = 0;
  let visitedCount = 0;
  let limited = false;

  function placeNode(node, depth) {
    if (visitedCount >= MAX_VISIBLE_NODES) {
      limited = true;
      return null;
    }
    visitedCount++;
    deepestLevel = Math.max(deepestLevel, depth);
    const children = expandedIds.has(node.id) ? getVisibleChildren(node, nodes, filters) : [];
    const childPositions = [];
    for (const child of children) {
      const position = placeNode(child, depth + 1);
      if (!position) break;
      childPositions.push(position);
      links.push({parentId: node.id, childId: child.id});
    }
    const y = childPositions.length
      ? (childPositions[0].y + childPositions.at(-1).y) / 2
      : 36 + nextRow++ * ROW_GAP;
    const position = {x: 30 + depth * COLUMN_GAP, y, node};
    positions.set(node.id, position);
    return position;
  }

  const root = nodes.get(rootId);
  if (root) placeNode(root, 0);
  return {
    positions,
    links,
    width: (deepestLevel + 1) * COLUMN_GAP + 40,
    height: Math.max(230, nextRow * ROW_GAP + 50),
    limited
  };
}

export function getInitiallyExpandedIds(rootId, nodes, filters, openDepth) {
  const expandedIds = new Set();
  function visit(id, depth) {
    const node = nodes.get(id);
    if (!node || depth >= openDepth) return;
    if (node.localName === "head" && id !== rootId) return;
    expandedIds.add(id);
    for (const child of getVisibleChildren(node, nodes, filters)) visit(child.id, depth + 1);
  }
  visit(rootId, 0);
  return expandedIds;
}
