import {byId, createElement, createSvgElement, setText, shortenText} from "./ui-dom.js";
import {getAttribute, getNodeKind, getNodeLabel, getVisibleChildren, isWhitespaceNode} from "./node-presentation.js";
import {describeElement} from "./semantics.js";
import {CARD_HEIGHT, CARD_WIDTH, createTreeLayout} from "./tree-layout.js";
import {renderElementGroupLegend, renderNodeLegend} from "./legend.js";

const FONT = "Segoe UI, Arial, sans-serif";
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;

export function createTreeView({onSelect, onToggle, onMessage}) {
  const tree = byId("tree");
  const viewport = byId("viewport");
  const drawing = byId("drawing");
  let scale = 1;
  let layout = {positions: new Map(), width: 1000, height: 500};
  let dragStart = null;
  renderElementGroupLegend();

  function applyZoom() {
    for (const element of [tree, drawing]) {
      element.style.width = layout.width * scale + "px";
      element.style.height = layout.height * scale + "px";
    }
    setText(byId("zoomLabel"), Math.round(scale * 100) + " %");
  }

  function fit() {
    scale = Math.max(MIN_ZOOM, Math.min(1,
      (viewport.clientWidth - 20) / layout.width,
      (viewport.clientHeight - 20) / layout.height));
    applyZoom();
    viewport.scrollTo(0, 0);
  }

  function zoom(factor) {
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / scale;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / scale;
    scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * factor));
    applyZoom();
    viewport.scrollTo(centerX * scale - viewport.clientWidth / 2, centerY * scale - viewport.clientHeight / 2);
  }

  function createText(x, y, content, attributes = {}) {
    return createSvgElement("text", {x, y, "font-family": FONT, "font-size": 12, ...attributes}, content);
  }

  function createBranchToggle(node, expanded, kind) {
    const toggle = createSvgElement("g", {
      transform: "translate(252 4)", role: "button", tabindex: 0,
      "data-focus-key": node.id + "-toggle",
      "aria-label": expanded ? "Ast schließen" : "Ast öffnen",
      "aria-expanded": String(expanded)
    });
    toggle.append(
      createSvgElement("circle", {cx: 12, cy: 12, r: 11, fill: "#fff", stroke: "#fff"}),
      createText(12, 17, expanded ? "−" : "+", {"text-anchor": "middle", "font-size": 18, fill: kind.color})
    );
    function activate(event) {
      event.preventDefault();
      event.stopPropagation();
      onToggle(node.id, !expanded);
    }
    toggle.addEventListener("click", activate);
    toggle.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") activate(event);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        onToggle(node.id, event.key === "ArrowRight");
      }
    });
    return toggle;
  }

  function createNodeCard(position, state) {
    const {x, y, node} = position;
    const kind = getNodeKind(node);
    const category = describeElement(node);
    const selected = node.id === state.selectedId;
    const visibleChildren = getVisibleChildren(node, state.nodes, state.filters);
    const card = createSvgElement("g", {
      transform: `translate(${x} ${y})`, role: "group",
      "aria-label": kind.name + ": " + getNodeLabel(node), "data-node-id": node.id
    });
    const selectButton = createSvgElement("g", {
      role: "button", tabindex: 0, "data-focus-key": node.id,
      "aria-label": kind.name + ": " + getNodeLabel(node), "aria-pressed": String(selected)
    });
    selectButton.append(
      createSvgElement("title", {}, `${kind.name}: ${node.label || node.nodeName}${category ? " · " + category.name + ": " + category.meaning : ""}${node.value ? " · " + node.value.slice(0, 250) : ""}`),
      createSvgElement("rect", {width: CARD_WIDTH, height: CARD_HEIGHT, rx: 10, fill: selected ? kind.fill : "#fff", stroke: kind.color, "stroke-width": selected ? 3.5 : 1.8}),
      createSvgElement("rect", {width: CARD_WIDTH, height: 31, rx: 9, fill: kind.color}),
      createSvgElement("rect", {x: 0, y: 18, width: CARD_WIDTH, height: 13, fill: kind.color}),
      createText(14, 21, kind.name, {fill: "#fff", "font-weight": 700}),
      createText(14, 55, shortenText(getNodeLabel(node), 19), {fill: "#173149", "font-size": 20, "font-family": "Consolas, monospace", "font-weight": 600}),
      createSvgElement("rect", {x: 14, y: 65, width: 252, height: 27, rx: 5, fill: category?.color ?? kind.color}),
      createText(23, 83, category ? shortenText(category.name + " · " + category.meaning, 34) : "Node · kein Element", {fill: "#fff", "font-weight": 600}),
      createText(14, 113, getCardDetail(node, category, visibleChildren.length), {fill: "#3d5264"})
    );
    selectButton.addEventListener("click", () => onSelect(node.id));
    selectButton.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(node.id);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        onToggle(node.id, event.key === "ArrowRight");
      }
    });
    card.append(selectButton);
    if (visibleChildren.length) card.append(createBranchToggle(node, state.expandedIds.has(node.id), kind));
    return card;
  }

  function render(state, shouldFit = false) {
    const focusedKey = tree.contains(document.activeElement)
      ? document.activeElement.getAttribute("data-focus-key") : null;
    layout = createTreeLayout(state);
    renderNodeLegend(state.nodes);
    tree.replaceChildren();
    tree.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    tree.append(createSvgElement("rect", {x: 0, y: 0, width: layout.width, height: layout.height, fill: "#f3f6fa"}));
    for (const {parentId, childId} of layout.links) {
      const parent = layout.positions.get(parentId);
      const child = layout.positions.get(childId);
      const startX = parent.x + CARD_WIDTH;
      const startY = parent.y + CARD_HEIGHT / 2;
      const endY = child.y + CARD_HEIGHT / 2;
      tree.append(createSvgElement("path", {
        d: `M ${startX} ${startY} C ${startX + 30} ${startY}, ${child.x - 30} ${endY}, ${child.x} ${endY}`,
        fill: "none", stroke: "#9eb3c6", "stroke-width": 2
      }));
    }
    for (const position of layout.positions.values()) tree.append(createNodeCard(position, state));
    byId("empty").hidden = true;
    setText(byId("count"), `${layout.positions.size} sichtbar · ${state.nodes.size} eingelesen`);
    if (shouldFit) fit(); else applyZoom();
    if (focusedKey) {
      const replacement = Array.from(tree.querySelectorAll("[data-focus-key]"))
        .find(element => element.getAttribute("data-focus-key") === focusedKey);
      replacement?.focus({preventScroll: true});
    }
    return layout.limited;
  }

  function reveal(nodeId) {
    const position = layout.positions.get(nodeId);
    if (!position) return false;
    viewport.scrollTo({left: Math.max(0, position.x * scale - 40), top: Math.max(0, position.y * scale - 100), behavior: "smooth"});
    return true;
  }

  function exportSvg(title) {
    if (!layout.positions.size) return;
    try {
      const clone = tree.cloneNode(true);
      clone.style.width = layout.width + "px";
      clone.style.height = layout.height + "px";
      clone.setAttribute("width", layout.width);
      clone.setAttribute("height", layout.height);
      clone.insertBefore(createSvgElement("title", {}, title + " · sichtbarer DOM-Ausschnitt"), clone.firstChild);
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const downloadLink = createElement("a");
      downloadLink.href = url;
      downloadLink.download = getExportFilename(new Date());
      downloadLink.hidden = true;
      document.body.append(downloadLink);
      try {
        downloadLink.click();
        onMessage("Die SVG-Datei wurde an Chrome zum Speichern übergeben.");
      } finally {
        downloadLink.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      onMessage("Die Grafik konnte nicht exportiert werden: " + error.message);
    }
  }

  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("[role=button]")) return;
    dragStart = {x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop};
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("dragging");
  });
  viewport.addEventListener("pointermove", event => {
    if (!dragStart) return;
    viewport.scrollLeft = dragStart.left + dragStart.x - event.clientX;
    viewport.scrollTop = dragStart.top + dragStart.y - event.clientY;
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    viewport.addEventListener(eventName, () => {
      dragStart = null;
      viewport.classList.remove("dragging");
    });
  }
  byId("fit").addEventListener("click", fit);
  byId("zoomIn").addEventListener("click", () => zoom(1.2));
  byId("zoomOut").addEventListener("click", () => zoom(1 / 1.2));
  return {render, reveal, applyZoom, exportSvg};
}

function getCardDetail(node, category, visibleChildCount) {
  const id = getAttribute(node, "id");
  const className = getAttribute(node, "class");
  if (id) return shortenText("#" + id, 34);
  if (className) return shortenText("." + className.trim().split(/\s+/).join("."), 34);
  if (category) return category.name;
  if (visibleChildCount) return `${visibleChildCount} sichtbare direkte Kindknoten`;
  return isWhitespaceNode(node) ? "Leerzeichen / Zeilenumbrüche" : "";
}

export function getExportFilename(date) {
  const parts = [String(date.getFullYear()).slice(-2), date.getMonth() + 1, date.getDate()];
  return parts.map(part => String(part).padStart(2, "0")).join("_") + "_DOM_Baum.svg";
}
