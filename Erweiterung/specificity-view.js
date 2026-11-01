import {createElement, setText} from "./ui-dom.js";
import {analyzeSpecificity, compareSpecificity, extractStylesheetSelectors} from "./specificity.js";

const GROUPS = [
  {name: "A · IDs", kind: "id"},
  {name: "B · Klassen, Attribute, Pseudoklassen", kind: "class"},
  {name: "C · Elementnamen, Pseudoelemente", kind: "type"}
];
const EXAMPLES = [
  {name: "ID und Klasse", a: "p.hinweis", b: "#meldung", note: 'Beispiel: <p id="meldung" class="hinweis">Hinweis</p>. Beide Selektoren passen auf dieses Element.'},
  {name: ":where() zählt null", a: ":where(#inhalt) p", b: ".hinweis", note: ":where() kann genau auswählen, ohne die Spezifität zu erhöhen."},
  {name: ":is() übernimmt das Maximum", a: ":is(#inhalt, .karte) p", b: ".karte p.hinweis", note: "Auch wenn nur .karte zutrifft: Die ID im Argument von :is() bestimmt dessen Gewichtung."},
  {name: "Gleichstand", a: "main .hinweis", b: ".karte p", note: "Gleiche Spezifität genügt noch nicht zur Entscheidung über eine CSS-Deklaration."},
  {name: "Position mit of", a: "li:nth-child(2n of .aktiv, #wahl)", b: "#liste li", note: "Die Pseudoklasse zählt zusätzlich zum stärksten Selektor nach of."}
];

function button(label, action) {
  const element = createElement("button", label);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
}

function weight(value) {
  return value.join(" – ");
}

function renderWeight(specificity) {
  const row = createElement("div", undefined, "spec-weight");
  GROUPS.forEach((group, index) => {
    const cell = createElement("div", undefined, "spec-weight-cell spec-" + group.kind);
    cell.append(createElement("strong", specificity[index]), createElement("span", group.name));
    row.append(cell);
  });
  return row;
}

function renderParts(result) {
  const code = createElement("code", undefined, "spec-colored-selector");
  for (const part of result.parts) {
    const span = createElement("span", part.text, "spec-part spec-" + part.kind);
    span.title = `${part.explanation} Beitrag: ${weight(part.specificity)}`;
    code.append(span);
  }
  const details = createElement("details", undefined, "spec-breakdown");
  details.append(createElement("summary", "Berechnung Schritt für Schritt"));
  const list = createElement("ul");
  for (const part of result.parts.filter(item => item.text.trim() && !item.text.trim().startsWith("/*"))) {
    const item = createElement("li");
    item.append(createElement("code", part.text, "spec-part spec-" + part.kind),
      createElement("strong", weight(part.specificity), "spec-contribution"),
      createElement("span", part.explanation));
    if (part.children.length) {
      const argumentsList = createElement("ul", undefined, "spec-arguments");
      for (const child of part.children) {
        const entry = createElement("li");
        entry.append(createElement("code", child.selector), createElement("span", weight(child.specificity)));
        argumentsList.append(entry);
      }
      item.append(argumentsList);
    }
    list.append(item);
  }
  details.append(list);
  return [code, details];
}

function createInputSide(name) {
  const side = createElement("section", undefined, "spec-side");
  const label = createElement("label", "Selektor " + name.toUpperCase());
  const input = createElement("input");
  input.type = "text";
  input.maxLength = 4096;
  input.spellcheck = false;
  input.autocomplete = "off";
  label.append(input);
  const branchLabel = createElement("label", "Eintrag der Liste für den Vergleich");
  const branch = createElement("select");
  branchLabel.append(branch);
  branchLabel.hidden = true;
  const output = createElement("div", undefined, "spec-analysis");
  side.append(label, branchLabel, output);
  return {side, input, branch, branchLabel, output, analysis: null};
}

export function createSpecificityView({container}) {
  container.classList.add("specificity-panel");
  const heading = createElement("h2", "CSS-Spezifität verstehen");
  const introduction = createElement("p", "Vergleichen Sie von links nach rechts: zuerst A, dann B, dann C. Die erste unterschiedliche Gruppe entscheidet. Die Zahlen sind keine addierbaren Punkte.", "spec-introduction");
  const sourceTools = createElement("div", undefined, "spec-source-tools");
  const sourceLabel = createElement("label", "Selektor aus dieser CSS-Quelle");
  const sourceSelect = createElement("select");
  sourceLabel.append(sourceSelect);
  const sourceNote = createElement("p", undefined, "spec-source-note");
  let sourceEntries = [];
  const sides = {a: createInputSide("a"), b: createInputSide("b")};
  const pickA = button("Als A übernehmen", () => selectSource("a"));
  const pickB = button("Als B übernehmen", () => selectSource("b"));
  sourceTools.append(sourceLabel, pickA, pickB);
  const examples = createElement("div", undefined, "spec-examples");
  examples.append(createElement("span", "Beispiele:"));
  const exampleNote = createElement("p", undefined, "spec-example-note");
  EXAMPLES.forEach(example => examples.append(button(example.name, () => {
    sides.a.input.value = example.a;
    sides.b.input.value = example.b;
    setText(exampleNote, example.note);
    analyze();
  })));
  const form = createElement("form", undefined, "spec-form");
  const columns = createElement("div", undefined, "spec-columns");
  columns.append(sides.a.side, sides.b.side);
  const submit = createElement("button", "Spezifität vergleichen", "primary");
  submit.type = "submit";
  const comparison = createElement("div", undefined, "spec-comparison");
  comparison.setAttribute("role", "status");
  const resultHeading = createElement("strong");
  const resultReason = createElement("p");
  comparison.append(resultHeading, resultReason);
  form.append(columns, submit, comparison);
  form.addEventListener("submit", event => { event.preventDefault(); analyze(); });

  const cascade = createElement("details", undefined, "spec-cascade");
  cascade.append(createElement("summary", "Wann gewinnt die CSS-Regel tatsächlich?"),
    createElement("p", "Hier werden Selektoren verglichen. Ob eine Deklaration wirkt, hängt zusätzlich vom Elementtreffer, gültigen Bedingungen und der CSS-Kaskade ab. Herkunft, !important, Shadow-DOM-Kontext, Inline-Stile und Kaskadenebenen können vorher entscheiden."),
    createElement("p", "Bei gleicher Spezifität kann die Nähe einer @scope-Regel entscheiden; danach die Reihenfolge. !important gehört zur Deklaration und erhöht die Spezifität nicht. Inline-Stile sind keine Selektoren dieses Rechners."),
    createElement("p", "Bei einer Selektorliste zählt für ein Element der stärkste tatsächlich passende Eintrag. In :is(), :not() und :has() zählt dagegen das stärkste Argument. :where() zählt immer null. Für CSS-Nesting mit & braucht man den Elternkontext."),
    createElement("p", "Die Ansicht berechnet unterstützte Selektoren, prüft aber weder Elementtreffer noch alle Browser- und Namensraumregeln. Nicht unterstützte Schreibweisen werden ausdrücklich angezeigt."));
  const sources = createElement("p", undefined, "spec-references");
  for (const [label, url] of [
    ["Selektoren", "https://www.w3.org/TR/selectors-4/#specificity-rules"],
    ["Kaskade", "https://www.w3.org/TR/css-cascade-6/#cascade-sort"],
    ["CSS-Nesting", "https://www.w3.org/TR/css-nesting-1/#nest-selector"]
  ]) {
    const link = createElement("a", label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    sources.append(link);
  }
  cascade.append(sources);
  container.replaceChildren(heading, introduction, sourceTools, sourceNote, examples, exampleNote, form, cascade);

  function renderSide(side) {
    side.output.replaceChildren();
    if (!side.analysis.ok) {
      const error = createElement("p", side.analysis.error, "spec-error");
      error.setAttribute("role", "alert");
      side.output.append(error);
      return null;
    }
    const result = side.analysis.selectors[Number(side.branch.value) || 0];
    if (!result) return null;
    side.output.append(renderWeight(result.specificity), ...renderParts(result));
    return result;
  }

  function compare() {
    const left = renderSide(sides.a);
    const right = renderSide(sides.b);
    if (!left || !right) {
      setText(resultHeading, "Noch kein Vergleich möglich");
      setText(resultReason, "Prüfen Sie die Hinweise bei A und B.");
      return;
    }
    const order = compareSpecificity(left.specificity, right.specificity);
    setText(resultHeading, order === 0 ? "Gleiche Spezifität" : `Selektor ${order > 0 ? "A" : "B"} hat die höhere Spezifität`);
    if (order === 0) setText(resultReason, `${weight(left.specificity)} = ${weight(right.specificity)}. Die Spezifität entscheidet hier nicht zwischen A und B.`);
    else {
      const index = left.specificity.findIndex((value, index) => value !== right.specificity[index]);
      setText(resultReason, `${weight(left.specificity)} ${order > 0 ? ">" : "<"} ${weight(right.specificity)}. Entscheidend ist Gruppe ${String.fromCharCode(65 + index)}; spätere Gruppen können das nicht ausgleichen. Gleicher sonstiger Vorrang in der Kaskade ist Voraussetzung für eine Entscheidung über die Deklaration.`);
    }
  }

  function analyze() {
    for (const side of Object.values(sides)) {
      side.analysis = analyzeSpecificity(side.input.value);
      side.branch.replaceChildren();
      side.branchLabel.hidden = !side.analysis.ok || side.analysis.selectors.length < 2;
      if (side.analysis.ok) side.analysis.selectors.forEach((entry, index) => {
        const option = createElement("option", entry.selector);
        option.value = String(index);
        side.branch.append(option);
      });
      side.branch.value = "0";
    }
    compare();
  }

  function updateSourceButtons() {
    const selected = sourceEntries[Number(sourceSelect.value)];
    pickA.disabled = pickB.disabled = !selected || selected.nested;
  }

  function setStylesheet(cssText) {
    const result = extractStylesheetSelectors(cssText);
    sourceEntries = result.selectors;
    sourceSelect.replaceChildren();
    result.selectors.forEach((entry, index) => {
      const option = createElement("option", (entry.nested ? "[verschachtelt] " : "") + entry.selector.slice(0, 180));
      option.value = String(index);
      sourceSelect.append(option);
    });
    sourceSelect.value = "0";
    sourceSelect.disabled = !sourceEntries.length;
    setText(sourceNote, result.note);
    updateSourceButtons();
  }

  function selectSource(side) {
    const entry = sourceEntries[Number(sourceSelect.value)];
    if (entry && !entry.nested) {
      setSelector(entry.selector, side);
      setText(exampleNote, "Aus der gewählten CSS-Quelle übernommen. Ein tatsächlicher Treffer auf ein Element ist damit nicht nachgewiesen.");
    }
  }

  function setSelector(selector, side = "a") {
    if (!Object.hasOwn(sides, side)) return;
    sides[side].input.value = String(selector ?? "");
    setText(exampleNote, "");
    analyze();
  }

  for (const side of Object.values(sides)) side.branch.addEventListener("change", compare);
  sourceSelect.addEventListener("change", updateSourceButtons);
  sides.a.input.value = EXAMPLES[0].a;
  sides.b.input.value = EXAMPLES[0].b;
  setText(exampleNote, EXAMPLES[0].note);
  setStylesheet(null);
  analyze();
  return {setSelector, setStylesheet, analyze};
}
