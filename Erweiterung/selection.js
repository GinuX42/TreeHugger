import {byId, createBadge, createElement, formatTime, setText} from "./ui-dom.js";
import {describeElement, getTypeHierarchy, isHtmlList} from "./semantics.js";
import {NODE_COLORS, COLLECTION_COLORS} from "./palette.js";

const METHOD_HINTS = new Map([
  ["querySelector", "CSS-Selektor, z. B. .hinweis oder #kurse. Rückgabe: erstes passendes Element oder null."],
  ["querySelectorAll", "CSS-Selektor, z. B. .hinweis. Rückgabe: statische NodeList mit allen passenden Elementen."],
  ["getElementById", "ID ohne #, z. B. kurse. Rückgabe: einzelnes Element oder null."],
  ["getElementsByClassName", "Klassenname ohne Punkt, z. B. hinweis. Mehrere Klassen durch Leerzeichen trennen. Rückgabe: lebende HTMLCollection."],
  ["getElementsByTagName", "Tagname ohne Klammern, z. B. p oder li. Rückgabe: lebende HTMLCollection."]
]);

const RESULT_TYPES = new Map([
  ["Element", {title: "Einzelnes Element", color: NODE_COLORS[1].color, explanation: "Ein einzelnes Elementobjekt. Dieses Element ist auch ein Node. Es ist keine Sammlung."}],
  ["null", {title: "null – kein Treffer", color: COLLECTION_COLORS.null, explanation: "Es wurde kein passendes Element gefunden. null ist weder ein Node noch ein Element noch eine Sammlung."}],
  ["NodeList", {title: "NodeList · Sammlung", color: COLLECTION_COLORS.NodeList, explanation: "Die Sammlung selbst ist kein Node und kein Element. querySelectorAll liefert darin ausschließlich passende Elemente – auch wenn der Name NodeList lautet."}],
  ["HTMLCollection", {title: "HTMLCollection · Sammlung", color: COLLECTION_COLORS.HTMLCollection, explanation: "Die Sammlung selbst ist kein Node und kein Element. Ihre Einträge sind Verweise auf passende Elemente."}]
]);

export function createSelectionView({request, showElement, onBusyChange}) {
  const methodInput = byId("selectionMethod");
  const queryInput = byId("selectionQuery");
  const resultArea = byId("selectionResult");
  let pending = false;
  let inputRevision = 0;

  function updateHint(clearResult = true) {
    inputRevision++;
    setText(byId("methodHint"), METHOD_HINTS.get(methodInput.value));
    setText(byId("selectionCode"), formatQuery(methodInput.value, queryInput.value));
    if (clearResult) resultArea.replaceChildren(createElement("p", "Die Suchangabe ist vorbereitet. „Auswahl ausführen“ zeigt den Rückgabetyp.", "explanation"));
  }

  function createResultCard(item, index, resultType) {
    const node = {...item, type: item.nodeType, nodeName: item.localName};
    const category = describeElement(node);
    const card = createElement("article", undefined, "result-item");
    const header = createElement("div", undefined, "result-item-head");
    header.append(createBadge("Element · auch Node", NODE_COLORS[1].color), createElement("strong", resultType === "Element" ? "einzeln" : `[${index}]`));
    card.append(header, createElement("h3", item.label));
    if (category) {
      const description = createElement("p", category.name + " · " + category.meaning, "category-detail");
      description.style.color = "#fff";
      description.style.background = category.color;
      card.append(description);
    }
    card.append(createElement("pre", getTypeHierarchy(node).join(" → ")));
    if (isHtmlList(node)) card.append(createElement("p", "Dieses HTML-Listenelement ist ein einzelner Node. Es ist selbst keine NodeList.", "muted"));
    if (item.selector) {
      const showButton = createElement("button", "Im Baum zeigen");
      showButton.addEventListener("click", () => showElement(item.selector));
      card.append(createElement("p", "Eindeutiger CSS-Selektor", "muted"), createElement("pre", item.selector), showButton);
    }
    return card;
  }

  function renderResult(result) {
    const presentation = RESULT_TYPES.get(result.resultType);
    if (!presentation) throw new Error("Die Abfrage hat einen unbekannten Rückgabetyp geliefert.");
    const summary = createElement("div", undefined, "result-summary");
    summary.style.borderColor = presentation.color;
    summary.append(createBadge(presentation.title, presentation.color),
      createElement("pre", formatQuery(result.method, result.query)),
      createElement("h3", getResultHeading(result)), createElement("p", presentation.explanation));
    if (result.resultType === "NodeList" || result.resultType === "HTMLCollection") appendCollectionExplanation(summary, result);
    summary.append(createElement("p", "Abfrage auf dem gesamten Quelldokument · " + formatTime(result.capturedAt), "muted"));
    const cards = createElement("div", undefined, "result-grid");
    result.items.forEach((item, index) => cards.append(createResultCard(item, index, result.resultType)));
    resultArea.replaceChildren(summary, cards);
    for (const note of result.notes ?? []) resultArea.append(createElement("p", note, "explanation"));
  }

  async function run() {
    if (pending) return;
    pending = true;
    byId("runSelection").disabled = true;
    onBusyChange(true);
    const revision = inputRevision;
    const method = methodInput.value;
    const query = queryInput.value;
    try {
      const result = await request("inspectSelection", {method, query});
      // Eine alte Antwort darf eine inzwischen geänderte Eingabe nicht überschreiben.
      if (revision === inputRevision) renderResult(result);
    } catch (error) {
      if (revision === inputRevision) resultArea.replaceChildren(createElement("p", error.message, "selection-error"));
    } finally {
      pending = false;
      byId("runSelection").disabled = false;
      onBusyChange(false);
    }
  }

  byId("selectionForm").addEventListener("submit", event => {
    event.preventDefault();
    run();
  });
  methodInput.addEventListener("change", () => updateHint());
  queryInput.addEventListener("input", () => updateHint());
  updateHint(false);
  return {run};
}

export function formatQuery(method, query) {
  return `document.${method}(${JSON.stringify(query)})`;
}

function getResultHeading(result) {
  if (result.resultType === "null") return "Kein einzelnes Objekt gefunden";
  if (result.resultType === "Element") return result.interfaceName || "Element";
  return "length = " + result.total;
}

function appendCollectionExplanation(summary, result) {
  summary.append(createElement("p", result.live
    ? "Lebend im Quelldokument: Die Mitgliedschaft passt sich passenden DOM-Änderungen an."
    : "Statisch: Die Mitgliedschaft dieser zurückgegebenen NodeList wird durch spätere DOM-Änderungen nicht neu zusammengestellt.", "result-behavior"));
  summary.append(createElement("p", "Die Anzeige hier ist eine Momentaufnahme. „Auswahl erneut ausführen“ erstellt eine neue Abfrage. Dies ist keine gespeicherte, fortlaufend beobachtete Sammlung.", "muted"));
  if (result.total === 0) summary.append(createElement("p", `Leere Sammlung: length = 0. Die Rückgabe ist trotzdem ${result.resultType} und nicht null.`, "explanation"));
  if (result.total === 1) summary.append(createElement("p", "Auch mit genau einem Eintrag bleibt dies eine Sammlung. Der Eintrag [0] ist ein einzelnes Element.", "explanation"));
  if (result.resultType === "NodeList") summary.append(createElement("p", "NodeList ist nicht immer statisch: childNodes liefert eine lebende NodeList und kann auch Text- und Kommentarknoten enthalten.", "muted"));
}
