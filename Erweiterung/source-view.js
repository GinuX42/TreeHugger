import {byId, createElement, formatTime, setText} from "./ui-dom.js";
import {createSourceExample} from "./source-example.js";
import {formatCode} from "./code-format.js";
import {findCodeMatches, getMatchPage, splitCodePages} from "./code-document.js";
import {renderCodePage} from "./code-renderer.js";
import {tokenizeCode} from "./code-highlight.js";
import {createSpecificityView} from "./specificity-view.js";
import {isLocalSource, readLocalSource} from "./local-source.js";

const LANGUAGES = ["html", "css", "javascript"];
const LANGUAGE_LABELS = {html: "HTML", css: "CSS", javascript: "JavaScript"};
const ORIGIN_LABELS = {dom: "Aktueller DOM", inline: "Im Dokument", external: "Verknüpfte Datei", cssom: "Browser-Regeln", local: "Lokale Dateiauswahl"};

export function createSourceView({request, isDemo, onBusyChange}) {
  const state = {
    snapshot: null, language: "html", selectedId: null,
    loading: false, fileLoading: false, generation: 0, renderRevision: 0,
    code: "", tokens: [], pages: splitCodePages(""), pageIndex: 0, matches: [], matchIndex: -1,
    fontSize: 16, focused: false
  };
  let searchTimer;
  let localFileSelection = null;
  const specificityView = createSpecificityView({container: byId("specificityPanel")});

  function setStatus(message, failed = false) {
    const status = byId("codeStatus");
    status.hidden = !message;
    status.classList.toggle("code-error", failed);
    status.setAttribute("role", failed ? "alert" : "status");
    setText(status, message);
  }

  function updateBusy() {
    onBusyChange(state.loading || state.fileLoading);
    byId("loadCodeFile").disabled = state.fileLoading || state.loading;
    byId("openLocalCodeFile").disabled = state.fileLoading || state.loading;
    byId("sourcePane").setAttribute("aria-busy", String(state.loading || state.fileLoading));
  }

  function selectedResource() {
    return state.snapshot?.resources.find(resource => resource.id === state.selectedId);
  }

  function renderFileList() {
    const resources = state.snapshot?.resources ?? [];
    for (const language of LANGUAGES) {
      const button = byId("codeTab-" + language);
      const count = resources.filter(resource => resource.language === language).length;
      setText(button, LANGUAGE_LABELS[language] + " · " + count);
      button.setAttribute("aria-pressed", String(state.language === language));
    }
    const list = byId("codeFiles");
    list.replaceChildren();
    const entries = resources.filter(resource => resource.language === state.language);
    setText(byId("codeFileCount"), entries.length + " Quellen");
    for (const resource of entries) {
      const button = createElement("button", undefined, "code-file");
      button.type = "button";
      button.setAttribute("aria-pressed", String(resource.id === state.selectedId));
      button.title = resource.url || resource.label;
      button.append(createElement("strong", resource.label),
        createElement("span", ORIGIN_LABELS[resource.origin] ?? "Quelle"));
      if (resource.status === "external") button.append(createElement("small", isLocalSource(resource) ? "Lokale Datei auswählen" : "Zum Lesen nachladen"));
      if (resource.status === "unavailable") button.append(createElement("small", "Nicht verfügbar"));
      button.addEventListener("click", () => selectResource(resource.id));
      list.append(button);
    }
    if (!entries.length) list.append(createElement("p", "Für diese Sprache wurden keine Quellen im Hauptdokument gefunden.", "muted"));
  }

  function renderPage(scrollToMatch = false) {
    const page = state.pages[state.pageIndex];
    const activeMatch = state.matches[state.matchIndex] ?? null;
    const activeRow = renderCodePage(byId("codeRows"), page, state.language, state.matches, activeMatch, state.tokens);
    setText(byId("codePageLabel"), `Abschnitt ${state.pageIndex + 1} / ${state.pages.length}`);
    byId("codePreviousPage").disabled = state.pageIndex === 0;
    byId("codeNextPage").disabled = state.pageIndex >= state.pages.length - 1;
    byId("codePager").hidden = state.pages.length <= 1;
    const matchCount = state.matches.length;
    setText(byId("codeMatches"), byId("codeSearch").value
      ? `${matchCount ? state.matchIndex + 1 : 0} / ${matchCount}${matchCount === 2000 ? "+" : ""}` : "");
    byId("codePreviousMatch").disabled = !matchCount;
    byId("codeNextMatch").disabled = !matchCount;
    if (scrollToMatch && activeRow) activeRow.scrollIntoView({block: "center"});
  }

  function updateSearch() {
    state.matches = findCodeMatches(state.code, byId("codeSearch").value);
    state.matchIndex = state.matches.length ? 0 : -1;
    if (state.matches.length) state.pageIndex = getMatchPage(state.pages, state.matches[0]);
    renderPage(true);
  }

  function moveMatch(direction) {
    if (!state.matches.length) return;
    state.matchIndex = (state.matchIndex + direction + state.matches.length) % state.matches.length;
    state.pageIndex = getMatchPage(state.pages, state.matches[state.matchIndex]);
    renderPage(true);
  }

  async function displayResource() {
    const revision = ++state.renderRevision;
    const resource = selectedResource();
    specificityView.setStylesheet(resource?.language === "css" && typeof resource.content === "string" ? resource.content : null);
    state.code = "";
    state.tokens = [];
    state.pages = splitCodePages("");
    state.pageIndex = 0;
    state.matches = [];
    state.matchIndex = -1;
    byId("codeRows").replaceChildren();
    byId("codePager").hidden = true;
    byId("copyCode").disabled = true;
    setText(byId("codeMatches"), "");
    setText(byId("codeViewKind"), "");
    byId("codePreviousMatch").disabled = true;
    byId("codeNextMatch").disabled = true;
    setText(byId("codeFileTitle"), resource?.label ?? "Keine Quelle ausgewählt");
    setText(byId("codeFileOrigin"), resource ? ORIGIN_LABELS[resource.origin] ?? "Quelle" : "");
    const local = isLocalSource(resource);
    setText(byId("codeFileUrl"), resource?.url ? (local ? "Verknüpfung im HTML: " : "") + resource.url : "");
    byId("codeFileUrl").title = resource?.url ?? "";
    byId("loadCodeFile").hidden = !resource || typeof resource.content === "string" || resource.origin !== "external" || (local && resource.language === "javascript");
    setText(byId("loadCodeFile"), local ? "Browser-Regeln lesen" : "Datei laden");
    byId("openLocalCodeFile").hidden = !local;
    setText(byId("openLocalCodeFile"), resource?.origin === "local" ? "Lokale Datei erneut öffnen" : "Lokale Datei öffnen");
    const empty = byId("codeEmpty");
    empty.hidden = false;
    if (!resource) {
      setText(empty, "Wählen Sie HTML, CSS oder JavaScript und anschließend eine Quelle aus.");
      setStatus("");
      return;
    }
    if (typeof resource.content !== "string") {
      if (local) {
        setText(empty, "Klicken Sie auf „Lokale Datei öffnen“ und wählen Sie die neben Ihrer HTML-Datei liegende Quelldatei aus.");
        setStatus("Der Dateiname und die Verknüpfung stehen oben. Die ausgewählte Datei wird nur als Text gelesen; es entsteht keine Netzwerkanfrage.");
        return;
      }
      setText(empty, resource.status === "unavailable" ? "Diese Quelle konnte nicht gelesen werden." : "Diese Datei ist verknüpft. Mit „Datei laden“ lesen Sie ihren Inhalt.");
      setStatus(resource.note || "Die Datei wird erst beim Klick abgerufen; der Browser prüft den Zugriff.", resource.status === "unavailable");
      return;
    }
    setText(empty, "Code wird vorbereitet …");
    const formatted = byId("codePretty").checked
      ? await formatCode(resource.content, resource.language)
      : {code: resource.content, formatted: false, note: ""};
    if (revision !== state.renderRevision) return;
    state.code = formatted.code;
    state.tokens = tokenizeCode(state.code, resource.language);
    state.pages = splitCodePages(state.code);
    byId("copyCode").disabled = false;
    empty.hidden = state.code.length > 0;
    if (!state.code) setText(empty, "Diese Quelle ist leer.");
    setText(byId("codeViewKind"), formatted.formatted ? "Lesbar eingerückt · Ansicht formatiert" : "Eingelesener Text · unverändert");
    const notes = [resource.note, resource.truncated ? "Die Quelle wurde beim Einlesen gekürzt." : "", formatted.note];
    setStatus(notes.filter(Boolean).join(" "));
    updateSearch();
    if (!state.matches.length) byId("codeScroll").scrollTo(0, 0);
  }

  function selectResource(id) {
    state.selectedId = id;
    renderFileList();
    displayResource();
  }

  function selectLanguage(language) {
    state.language = language;
    byId("specificityToggle").hidden = language !== "css";
    if (language !== "css") {
      byId("specificityPanel").hidden = true;
      byId("specificityToggle").setAttribute("aria-expanded", "false");
    }
    const selected = selectedResource();
    if (selected?.language !== language) state.selectedId = state.snapshot?.resources.find(resource => resource.language === language)?.id ?? null;
    renderFileList();
    return displayResource();
  }

  async function load() {
    if (state.loading || state.fileLoading) return;
    state.loading = true;
    localFileSelection = null;
    byId("localCodeFile").value = "";
    ++state.renderRevision;
    const generation = ++state.generation;
    updateBusy();
    setStatus("HTML, CSS und JavaScript werden aus dem Dokument eingelesen …");
    try {
      const snapshot = isDemo ? createSourceExample() : await request("readSources");
      if (generation !== state.generation) return;
      state.snapshot = snapshot;
      setText(byId("codeSourceInfo"), snapshot.title + " · " + formatTime(snapshot.capturedAt));
      byId("codeSourceInfo").title = snapshot.url;
      const notes = byId("codeNotesList");
      notes.replaceChildren(...(snapshot.notes ?? []).map(note => createElement("li", note)));
      byId("codeNotes").hidden = !snapshot.notes?.length;
      await selectLanguage(state.language);
    } catch (error) {
      setStatus(error.message + (state.snapshot ? " Die bisherigen Quellen bleiben als ältere Momentaufnahme sichtbar." : ""), true);
    } finally {
      state.loading = false;
      updateBusy();
    }
  }

  async function loadFile() {
    const resource = selectedResource();
    if (!resource || state.fileLoading || state.loading) return;
    state.fileLoading = true;
    const generation = state.generation;
    updateBusy();
    setStatus("Verknüpfte Datei wird gelesen …");
    try {
      const loaded = await request("readSourceFile", {resourceId: resource.id, expectedUrl: resource.url});
      if (generation !== state.generation) return;
      Object.assign(resource, loaded);
    } catch (error) {
      resource.status = "unavailable";
      resource.note = error.message;
    } finally {
      state.fileLoading = false;
      updateBusy();
      renderFileList();
      if (state.selectedId === resource.id && generation === state.generation) displayResource();
    }
  }

  function openLocalFile() {
    const resource = selectedResource();
    if (!isLocalSource(resource) || state.loading || state.fileLoading) return;
    const input = byId("localCodeFile");
    input.value = "";
    input.accept = resource.language === "css" ? ".css,.txt" : ".js,.mjs,.cjs,.json,.txt";
    // Die Auswahl gehört zu dieser Quelle, auch wenn während des Dialogs die Ansicht wechselt.
    localFileSelection = {resource, generation: state.generation};
    try {
      input.click();
    } catch {
      localFileSelection = null;
      setStatus("Die Dateiauswahl konnte nicht geöffnet werden. Klicken Sie erneut auf „Lokale Datei öffnen“.", true);
    }
  }

  async function acceptLocalFile() {
    const selection = localFileSelection;
    const input = byId("localCodeFile");
    const file = input.files?.[0];
    localFileSelection = null;
    input.value = "";
    if (!file || !selection || selection.generation !== state.generation || state.loading || state.fileLoading) return;
    const {resource, generation} = selection;
    if (!state.snapshot?.resources.includes(resource)) return;
    state.fileLoading = true;
    updateBusy();
    if (state.selectedId === resource.id) setStatus("Die ausgewählte lokale Datei wird gelesen …");
    let loaded = false;
    try {
      const result = await readLocalSource(file, resource);
      if (generation !== state.generation) return;
      Object.assign(resource, result);
      loaded = true;
    } catch (error) {
      if (generation === state.generation && state.selectedId === resource.id) {
        setStatus(error.message + (typeof resource.content === "string" ? " Der bisherige Inhalt bleibt sichtbar." : ""), true);
      }
    } finally {
      state.fileLoading = false;
      updateBusy();
      renderFileList();
      if (loaded && generation === state.generation && state.selectedId === resource.id) await displayResource();
    }
  }

  function setFocused(focused) {
    state.focused = focused;
    document.body.classList.toggle("code-focus", focused);
    setText(byId("codeFocus"), focused ? "← Zurück" : "Nur Code");
    byId("codeFocus").setAttribute("aria-pressed", String(focused));
    if (!focused) byId("codeFocus").focus({preventScroll: true});
  }

  function setFontSize(value) {
    state.fontSize = Math.max(12, Math.min(28, value));
    byId("codeScroll").style.fontSize = state.fontSize + "px";
    setText(byId("codeFontSize"), state.fontSize + " px");
  }

  byId("loadCodeFile").addEventListener("click", loadFile);
  byId("openLocalCodeFile").addEventListener("click", openLocalFile);
  byId("localCodeFile").addEventListener("change", acceptLocalFile);
  byId("localCodeFile").addEventListener("cancel", () => {
    localFileSelection = null;
    byId("localCodeFile").value = "";
  });
  byId("specificityToggle").hidden = true;
  byId("specificityToggle").addEventListener("click", () => {
    const panel = byId("specificityPanel");
    panel.hidden = !panel.hidden;
    byId("specificityToggle").setAttribute("aria-expanded", String(!panel.hidden));
  });
  for (const language of LANGUAGES) byId("codeTab-" + language).addEventListener("click", () => selectLanguage(language));
  byId("codePretty").addEventListener("change", displayResource);
  byId("codeWrap").addEventListener("change", () => byId("codeRows").classList.toggle("code-wrap", byId("codeWrap").checked));
  byId("codeLight").addEventListener("change", () => byId("sourcePane").classList.toggle("light-code", byId("codeLight").checked));
  byId("codeSmaller").addEventListener("click", () => setFontSize(state.fontSize - 2));
  byId("codeLarger").addEventListener("click", () => setFontSize(state.fontSize + 2));
  byId("codeFocus").addEventListener("click", () => setFocused(!state.focused));
  document.body.addEventListener("keydown", event => {
    if (event.key === "Escape" && state.focused) {
      event.preventDefault();
      setFocused(false);
    }
  });
  byId("codeSearch").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(updateSearch, 160);
  });
  byId("codeSearch").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimer);
      updateSearch();
    }
  });
  byId("codeNextMatch").addEventListener("click", () => moveMatch(1));
  byId("codePreviousMatch").addEventListener("click", () => moveMatch(-1));
  for (const [id, direction] of [["codePreviousPage", -1], ["codeNextPage", 1]]) {
    byId(id).addEventListener("click", () => {
      state.pageIndex = Math.max(0, Math.min(state.pages.length - 1, state.pageIndex + direction));
      renderPage();
      byId("codeScroll").scrollTo(0, 0);
    });
  }
  byId("copyCode").addEventListener("click", async () => {
    const content = selectedResource()?.content;
    const revision = state.renderRevision;
    if (typeof content !== "string") return;
    try {
      await navigator.clipboard.writeText(content);
      if (revision !== state.renderRevision) return;
      setStatus("Der eingelesene Code wurde kopiert. Die zusätzliche Einrückung der Ansicht wird nicht übernommen.");
    } catch {
      if (revision !== state.renderRevision) return;
      setStatus("Chrome erlaubt das Kopieren gerade nicht. Markieren Sie den gewünschten Code und kopieren Sie ihn mit Strg+C.", true);
    }
  });

  return {
    load,
    activate: () => { if (!state.snapshot) load(); },
    deactivate: () => { if (state.focused) setFocused(false); }
  };
}
