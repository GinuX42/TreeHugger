import {byId, formatTime, setText} from "./ui-dom.js";
import {createSourceClient} from "./source-client.js";
import {createExampleSnapshot} from "./example-data.js";
import {createTreeView} from "./tree-view.js";
import {createDetailsView} from "./node-details.js";
import {createSelectionView} from "./selection.js";
import {getInitiallyExpandedIds} from "./tree-layout.js";
import {isWhitespaceNode} from "./node-presentation.js";
import {createNoticeView} from "./notice-view.js";
import {createFocusView} from "./focus-view.js";
import {createSourceView} from "./source-view.js";
import {createTeachingView} from "./teaching-view.js";

const source = createSourceClient(location, globalThis.chrome?.runtime);
const state = {
  snapshot: null,
  nodes: new Map(),
  selectedId: null,
  rootId: null,
  capturedSelector: "",
  expandedIds: new Set(),
  filters: readFilters(),
  mode: "tree",
  capturePending: false,
  selectionPending: false,
  sourcePending: false,
  teachingPending: false,
  notices: []
};

const noticeView = createNoticeView();
const treeView = createTreeView({onSelect: selectNode, onToggle: toggleBranch, onMessage: noticeView.showMessage});
const focusView = createFocusView({onChange: treeView.applyZoom});
const detailsView = createDetailsView({
  onSelect: revealNode,
  onHighlight: highlightNode,
  onScope: showSubtree,
  onRestore: restoreTree,
  canHighlight: source.available
});
const selectionView = createSelectionView({
  request: source.request,
  showElement: selector => {
    setMode("tree");
    byId("scope").value = selector;
    capture();
  },
  onBusyChange: pending => {
    state.selectionPending = pending;
    updateButtons();
  }
});
const sourceView = createSourceView({
  request: source.request,
  isDemo: !source.isExtension,
  onBusyChange: pending => {
    state.sourcePending = pending;
    updateButtons();
  }
});

const teachingView = createTeachingView({
  request: source.request,
  getSnapshot: () => ({snapshot: state.snapshot, nodes: state.nodes, selectedId: state.selectedId}),
  isDemo: !source.available,
  onBusyChange: pending => {
    state.teachingPending = pending;
    updateButtons();
  }
});

function readFilters() {
  return {text: byId("textNodes").checked, whitespace: byId("whiteSpace").checked, comments: byId("comments").checked};
}

function updateButtons() {
  const pendingByMode = {tree: state.capturePending, selection: state.selectionPending, source: state.sourcePending, teaching: state.teachingPending};
  byId("refresh").disabled = pendingByMode[state.mode];
  byId("export").disabled = state.mode !== "tree" || !state.snapshot || state.capturePending;
  byId("focusToggle").disabled = state.mode !== "tree" || !state.snapshot;
}

function setMode(mode) {
  if (mode !== "tree") focusView.exit();
  if (mode !== "source") sourceView.deactivate();
  if (mode !== "teaching") teachingView.deactivate();
  state.mode = mode;
  const showTree = mode === "tree";
  byId("workspace").classList.toggle("selection-mode", mode === "selection");
  byId("workspace").classList.toggle("source-mode", mode === "source");
  byId("workspace").classList.toggle("teaching-mode", mode === "teaching");
  for (const id of ["treePane", "details", "scopeForm"]) byId(id).hidden = !showTree;
  byId("selectionPane").hidden = mode !== "selection";
  byId("sourcePane").hidden = mode !== "source";
  byId("teachingPane").hidden = mode !== "teaching";
  byId("treeMode").setAttribute("aria-pressed", String(showTree));
  byId("selectionMode").setAttribute("aria-pressed", String(mode === "selection"));
  byId("sourceMode").setAttribute("aria-pressed", String(mode === "source"));
  byId("teachingMode").setAttribute("aria-pressed", String(mode === "teaching"));
  const refreshLabels = {tree: "Seite neu einlesen", selection: "Auswahl erneut ausführen", source: "Quellcode neu einlesen", teaching: "Neue Vorhersage"};
  setText(byId("refresh"), refreshLabels[mode]);
  updateButtons();
  if (showTree) treeView.applyZoom();
  if (mode === "source") sourceView.activate();
  if (mode === "teaching") teachingView.activate();
}

function resetExpandedBranches() {
  state.expandedIds = getInitiallyExpandedIds(state.rootId, state.nodes, state.filters, Number(byId("depth").value));
}

function render(shouldFit = false) {
  if (!state.snapshot) return;
  const limited = treeView.render(state, shouldFit && state.mode === "tree");
  detailsView.render(state);
  noticeView.setNotices([...state.notices,
    limited ? "Die Ansicht zeigt höchstens 600 Knoten. Wählen Sie einen kleineren Ausschnitt oder schließen Sie Äste." : ""
  ]);
}

function selectNode(id) {
  if (!state.nodes.has(id)) return;
  state.selectedId = id;
  render();
}

function toggleBranch(id, expanded) {
  if (expanded) state.expandedIds.add(id); else state.expandedIds.delete(id);
  render();
}

function revealNode(id) {
  const node = state.nodes.get(id);
  if (!node) return;
  const ancestors = new Set([id]);
  let ancestor = node;
  while (ancestor.parentId) {
    ancestors.add(ancestor.parentId);
    state.expandedIds.add(ancestor.parentId);
    ancestor = state.nodes.get(ancestor.parentId);
    if (!ancestor) break;
  }
  if (!ancestors.has(state.rootId)) {
    state.rootId = state.snapshot.root;
    byId("scope").value = state.capturedSelector;
  }
  if (node.type === 3) byId("textNodes").checked = true;
  if (isWhitespaceNode(node)) byId("whiteSpace").checked = true;
  if (node.type === 8) byId("comments").checked = true;
  state.filters = readFilters();
  selectNode(id);
  if (!treeView.reveal(id)) {
    state.rootId = id;
    render(true);
    noticeView.showMessage("Der gewählte Knoten wird als Ausschnitt angezeigt, weil der bisherige Baum die Darstellungsgrenze erreicht hat.");
  }
}

function showSubtree(node) {
  state.rootId = node.id;
  state.selectedId = node.id;
  byId("scope").value = node.selector;
  resetExpandedBranches();
  render(true);
}

function restoreTree() {
  state.rootId = state.snapshot.root;
  state.selectedId = state.rootId;
  byId("scope").value = state.capturedSelector;
  resetExpandedBranches();
  render(true);
}

async function highlightNode(node) {
  try {
    await source.request("highlight", {selector: node.selector});
    noticeView.clearMessage();
  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  focusView.exit();
  noticeView.showMessage(message, {error: true});
}

async function capture() {
  if (state.capturePending) return;
  state.capturePending = true;
  byId("scope").disabled = true;
  updateButtons();
  const selector = byId("scope").value.trim();
  try {
    const snapshot = source.isExtension
      ? await source.request("capture", {selector}) : createExampleSnapshot();
    state.snapshot = snapshot;
    state.capturedSelector = selector;
    state.nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
    state.rootId = snapshot.root;
    state.selectedId = snapshot.root;
    state.notices = [...(snapshot.notes ?? [])];
    if (!source.isExtension) state.notices.unshift("Vorschau mit eingebautem Beispiel. Für die aktuelle Webseite die Erweiterung über ihr Symbol öffnen.");
    noticeView.clearMessage();
    setText(byId("pageTitle"), snapshot.title);
    setText(byId("pageUrl"), snapshot.url);
    setText(byId("captureTime"), "Momentaufnahme · " + formatTime(snapshot.capturedAt));
    resetExpandedBranches();
    render(true);
  } catch (error) {
    if (!state.snapshot) {
      setText(byId("empty"), "Die Seite konnte nicht geöffnet werden. Bitte beachten Sie den Hinweis oben.");
      setText(byId("pageTitle"), "Seite nicht zugänglich");
    }
    showError(error.message + (state.snapshot ? " Der bisherige Baum bleibt als ältere Momentaufnahme sichtbar." : ""));
  } finally {
    state.capturePending = false;
    byId("scope").disabled = false;
    updateButtons();
  }
}

byId("refresh").addEventListener("click", () => {
  if (state.mode === "source") sourceView.load();
  else if (state.mode === "selection") selectionView.run();
  else if (state.mode === "teaching") teachingView.refresh();
  else capture();
});
byId("scopeForm").addEventListener("submit", event => {
  event.preventDefault();
  capture();
});
byId("treeMode").addEventListener("click", () => setMode("tree"));
byId("selectionMode").addEventListener("click", () => setMode("selection"));
byId("sourceMode").addEventListener("click", () => setMode("source"));
byId("teachingMode").addEventListener("click", () => setMode("teaching"));
byId("export").addEventListener("click", () => treeView.exportSvg(state.snapshot?.title ?? "DOM-Baum"));
byId("depth").addEventListener("change", () => {
  resetExpandedBranches();
  render(true);
});
for (const id of ["textNodes", "whiteSpace", "comments"]) {
  byId(id).addEventListener("change", () => {
    if (id === "whiteSpace" && byId(id).checked) byId("textNodes").checked = true;
    if (id === "textNodes" && !byId(id).checked) byId("whiteSpace").checked = false;
    state.filters = readFilters();
    render(true);
  });
}

capture();
