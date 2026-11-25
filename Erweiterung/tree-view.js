import {byId, createElement, createSvgElement, setText, shortenText} from "./ui-dom.js";
import {getNodeKind, getNodeLabel, getTagPreview, getVisibleChildren, isWhitespaceNode} from "./node-presentation.js";
import {describeElement} from "./semantics.js";
import {CARD_HEIGHT, CARD_WIDTH, createTreeLayout} from "./tree-layout.js";
import {renderElementGroupLegend, renderNodeLegend} from "./legend.js";

const FONT = "Segoe UI, Arial, sans-serif";
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const OVERVIEW_ZOOM = 0.9;

export function createTreeView({onSelect, onToggle, onMessage}) {
  const tree = byId("tree");
  const viewport = byId("viewport");
  const drawing = byId("drawing");
  let scale = 1;
  let layout = {positions: new Map(), width: 1000, height: 500};
  let dragStart = null;
  let selectedId = null;
  let cardViews = [];
  renderElementGroupLegend();

  function applyZoom() {
    for (const element of [tree, drawing]) {
      element.style.width = layout.width * scale + "px";
      element.style.height = layout.height * scale + "px";
    }
    setText(byId("zoomLabel"), Math.round(scale * 100) + " %");
    updateCardPresentation(scale);
  }

  function updateCardPresentation(displayScale) {
    const overview = displayScale < OVERVIEW_ZOOM;
    tree.setAttribute("data-presentation", overview ? "overview" : "detail");
    for (const {details, compact, primary, secondary, node, toggle, toggleCircle, toggleText} of cardViews) {
      details.setAttribute("display", overview ? "none" : "inline");
      compact.setAttribute("display", overview ? "inline" : "none");
      const primaryWidth = CARD_WIDTH * displayScale - 16;
      const secondaryWidth = primaryWidth - (toggle ? 26 : 0);
      const [label, note] = getOverviewLabels(node);
      primary.textContent = shortenText(label, Math.max(3, Math.floor(primaryWidth / 8)));
      secondary.textContent = shortenText(note, Math.max(3, Math.floor(secondaryWidth / 7.2)));
      for (const [text, fontSize, y] of [[primary, 13, 19], [secondary, 12, 36]]) {
        text.setAttribute("font-size", fontSize / displayScale);
        text.setAttribute("x", 8 / displayScale);
        text.setAttribute("y", y / displayScale);
      }
      if (toggle) {
        toggle.setAttribute("transform", overview
          ? `translate(${CARD_WIDTH - 23 / displayScale} ${CARD_HEIGHT - 24 / displayScale}) scale(${1 / displayScale})`
          : "translate(252 4)");
        toggleCircle.setAttribute("stroke", overview ? getNodeKind(node).color : "#fff");
        toggleText.setAttribute("font-size", overview ? 16 : 18);
      }
    }
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

  function readableZoom() {
    const position = layout.positions.get(selectedId);
    const centerX = position ? position.x + CARD_WIDTH / 2 : (viewport.scrollLeft + viewport.clientWidth / 2) / scale;
    const centerY = position ? position.y + CARD_HEIGHT / 2 : (viewport.scrollTop + viewport.clientHeight / 2) / scale;
    scale = 1;
    applyZoom();
    viewport.scrollTo(Math.max(0, centerX - viewport.clientWidth / 2), Math.max(0, centerY - viewport.clientHeight / 2));
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
    const tagPreview = node.type === 1 ? getTagPreview(node) : null;
    const label = tagPreview?.fullTag ?? getNodeLabel(node);
    const card = createSvgElement("g", {
      transform: `translate(${x} ${y})`, role: "group",
      "aria-label": kind.name + ": " + label, "data-node-id": node.id
    });
    const selectButton = createSvgElement("g", {
      role: "button", tabindex: 0, "data-focus-key": node.id,
      "aria-label": kind.name + ": " + label, "aria-pressed": String(selected)
    });
    selectButton.append(
      createSvgElement("title", {}, `${kind.name}: ${label}${category ? " · " + category.name + ": " + category.meaning : ""}${node.value ? " · " + node.value.slice(0, 250) : ""}`),
    );
    const details = createSvgElement("g", {"data-card-detail": "true"});
    details.append(
      createSvgElement("rect", {width: CARD_WIDTH, height: CARD_HEIGHT, rx: 10, fill: selected ? kind.fill : "#fff", stroke: kind.color, "stroke-width": selected ? 3.5 : 1.8}),
      createSvgElement("rect", {width: CARD_WIDTH, height: 31, rx: 9, fill: kind.color}),
      createSvgElement("rect", {x: 0, y: 18, width: CARD_WIDTH, height: 13, fill: kind.color}),
      createText(14, 21, kind.name, {fill: "#fff", "font-weight": 700}),
      ...(tagPreview ? tagPreview.lines : [shortenText(label, 19)]).map((line, index) =>
        createText(14, 51 + index * 16, line, {fill: "#173149", "font-size": tagPreview ? 13 : 20, "font-family": "Consolas, monospace", "font-weight": 600})),
      createSvgElement("rect", {x: 14, y: 93, width: 252, height: 27, rx: 5, fill: category?.color ?? kind.color}),
      createText(23, 111, category ? shortenText(category.name + " · " + category.meaning, 34) : "Node · kein Element", {fill: "#fff", "font-weight": 600}),
      createText(14, 140, getCardDetail(node, visibleChildren.length, tagPreview), {fill: "#3d5264"})
    );
    const primary = createText(14, 51, "", {fill: "#173149", "font-family": "Consolas, monospace", "font-weight": 700});
    const secondary = createText(14, 80, "", {fill: "#3d5264", "font-family": "Consolas, monospace"});
    const compact = createSvgElement("g", {"data-card-overview": "true", display: "none", "aria-hidden": "true"});
    compact.append(
      createSvgElement("rect", {width: CARD_WIDTH, height: CARD_HEIGHT, rx: 10, fill: selected ? kind.fill : "#fff", stroke: kind.color, "stroke-width": selected ? 5 : 3}),
      primary, secondary
    );
    selectButton.append(details, compact);
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
    const toggle = visibleChildren.length ? createBranchToggle(node, state.expandedIds.has(node.id), kind) : null;
    if (toggle) card.append(toggle);
    cardViews.push({details, compact, primary, secondary, node, toggle,
      toggleCircle: toggle?.children[0], toggleText: toggle?.children[1]});
    return card;
  }

  function render(state, shouldFit = false) {
    const focusedKey = tree.contains(document.activeElement)
      ? document.activeElement.getAttribute("data-focus-key") : null;
    layout = createTreeLayout(state);
    selectedId = state.selectedId;
    cardViews = [];
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
      // Export the original full-detail cards, independent of the current overview zoom.
      updateCardPresentation(1);
      const clone = tree.cloneNode(true);
      updateCardPresentation(scale);
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
    } finally {
      updateCardPresentation(scale);
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
  byId("readableZoom")?.addEventListener("click", readableZoom);
  return {render, reveal, applyZoom, exportSvg, readableZoom};
}

function getOverviewLabels(node) {
  if (node.type === 1) {
    const name = node.localName ?? node.nodeName ?? "Element";
    const id = node.attributes?.find(attribute => attribute.name === "id")?.value;
    const className = node.attributes?.find(attribute => attribute.name === "class")?.value?.trim().split(/\s+/)[0];
    return [name, id ? "#" + id : className ? "." + className : "Element"];
  }
  if (node.type === 3) return [isWhitespaceNode(node) ? "Leerraum" : "Text", node.value?.trim() ?? ""];
  if (node.type === 8) return ["Kommentar", node.value?.trim() ?? ""];
  if (node.type === 9) return ["document", "Dokument"];
  if (node.type === 10) return ["doctype", node.nodeName ?? ""];
  return [getNodeLabel(node) ?? "Knoten", "Node"];
}

function getCardDetail(node, visibleChildCount, tagPreview) {
  if (tagPreview) {
    const capturedCount = node.attributes?.length ?? 0;
    const totalCount = node.attributesCount ?? capturedCount;
    if (!totalCount) return "Keine Attribute";
    if (totalCount > capturedCount) return `${capturedCount} von ${totalCount} Attributen · Details`;
    const countLabel = totalCount === 1 ? "1 Attribut" : `${totalCount} Attribute`;
    return `${countLabel}${tagPreview.truncated ? " · gekürzt" : ""} · Details öffnen`;
  }
  if (visibleChildCount) return `${visibleChildCount} sichtbare direkte Kindknoten`;
  return isWhitespaceNode(node) ? "Leerzeichen / Zeilenumbrüche" : "";
}

export function getExportFilename(date) {
  const parts = [String(date.getFullYear()).slice(-2), date.getMonth() + 1, date.getDate()];
  return parts.map(part => String(part).padStart(2, "0")).join("_") + "_DOM_Baum.svg";
}
