import {byId, createElement, formatTime, setText} from "./ui-dom.js";
import {EXAMPLE_TASKS, createChildrenTask, createSelectionTask} from "./teaching-model.js";

const METHOD_INPUT_HINTS = new Map([
  ["querySelector", "CSS-Selektor, zum Beispiel .hinweis oder #kurse."],
  ["querySelectorAll", "CSS-Selektor, zum Beispiel .hinweis oder #kurse > p."],
  ["getElementById", "ID ohne #, zum Beispiel kurse."],
  ["getElementsByClassName", "Klassenname ohne Punkt, zum Beispiel hinweis. Mehrere Klassen durch Leerzeichen trennen."],
  ["getElementsByTagName", "Tagname ohne spitze Klammern, zum Beispiel p."]
]);

function control(tag, id, text) {
  const element = createElement(tag, text);
  element.id = id;
  return element;
}

function labeledControl(label, element) {
  const wrapper = createElement("label", undefined, "teaching-field");
  wrapper.append(createElement("span", label), element);
  return wrapper;
}

function addOption(select, value, label, disabled = false) {
  const option = createElement("option", label);
  option.value = value;
  option.disabled = disabled;
  select.append(option);
}

export function createTeachingView({request, getSnapshot, onBusyChange, isDemo}) {
  const pane = byId("teachingPane");
  const source = control("select", "teachingSource");
  addOption(source, "example", "Eingebautes Beispiel");
  addOption(source, "children", "Kindknoten des gewählten Elements");
  addOption(source, "selection", "Auswahl auf der aktuellen Webseite", isDemo);
  source.value = "example";
  const example = control("select", "teachingExample");
  for (const task of EXAMPLE_TASKS) addOption(example, task.id, task.title);
  example.value = EXAMPLE_TASKS[0].id;
  const method = control("select", "teachingMethod");
  for (const name of METHOD_INPUT_HINTS.keys()) addOption(method, name, name);
  method.value = "querySelectorAll";
  const query = control("input", "teachingQuery");
  query.value = ".hinweis";
  query.maxLength = 4096;
  query.spellcheck = false;
  query.autocomplete = "off";
  const prepareButton = control("button", "teachingPrepare", "Aufgabe vorbereiten");
  prepareButton.type = "submit";
  const form = createElement("form", undefined, "teaching-controls");
  const exampleField = labeledControl("Beispiel", example);
  const selectionFields = createElement("div", undefined, "teaching-selection-fields");
  const queryHint = control("small", "teachingQueryHint");
  queryHint.className = "teaching-hint";
  query.setAttribute("aria-describedby", "teachingQueryHint");
  selectionFields.append(labeledControl("Auswahlmethode", method), labeledControl("Suchwert", query), queryHint);
  const childrenHint = createElement("p", "Wählen Sie im Reiter DOM-Baum ein Element aus und kehren Sie hierher zurück. Die Aufgabe verwendet dessen eingelesene Momentaufnahme.", "teaching-hint");
  form.append(labeledControl("Aufgabenquelle", source), exampleField, selectionFields, prepareButton, childrenHint);
  const intro = createElement("div", undefined, "teaching-intro");
  intro.append(createElement("h2", "Erst vorhersagen, dann aufdecken"),
    createElement("p", "Formulieren Sie Ihre Vermutung und begründen Sie sie. Erst „Ergebnis aufdecken“ zeigt die Antwort. Vergleichen Sie anschließend Ihre Überlegung mit der Erklärung."));
  if (isDemo) intro.append(createElement("p", "Vorschau mit Beispieldaten. Abfragen der aktuellen Webseite stehen beim Öffnen über das Erweiterungssymbol zur Verfügung.", "teaching-hint"));
  const quizBar = createElement("div", undefined, "teaching-actions");
  const quizToggle = control("button", "teachingQuiz", "Quizrunde starten");
  quizToggle.type = "button";
  const quizNext = control("button", "teachingNext", "Nächste Aufgabe");
  quizNext.type = "button";
  const quizProgress = control("p", "teachingProgress");
  quizProgress.setAttribute("role", "status");
  quizBar.append(quizToggle, quizNext, quizProgress);
  const samples = createElement("details", undefined, "teaching-samples");
  samples.append(createElement("summary", "Musterseiten für den Unterricht"),
    createElement("p", "Laden Sie eine Musterseite herunter und öffnen Sie die gespeicherte HTML-Datei in Chrome. Starten Sie dort TreeHugger über das Erweiterungssymbol. Für lokale Dateien muss in den Erweiterungsdetails „Zugriff auf Datei-URLs zulassen“ aktiviert sein. Wählen Sie im Baum den angegebenen Ausschnitt, damit die Darstellung übersichtlich bleibt."));
  const sampleList = createElement("ul");
  for (const [filename, title, description] of [
    ["26_11_02_Musterseite_Selektoren.html", "Selektoren: Kursportal", "Ausschnitt #kurse · IDs, Klassen, direkte Kinder und Nachfahren vergleichen."],
    ["26_11_02_Musterseite_Kindknoten.html", "Kindknoten: Text und Leerraum", "Ausschnitt #kurs · Elemente, Textknoten und Kommentare untersuchen."],
    ["26_11_02_Musterseite_DOM_Aenderungen.html", "DOM-Veränderungen: Kursliste", "Ausschnitt #kurse · Absätze ergänzen und entfernen; gespeicherte Sammlungen vergleichen."]
  ]) {
    const link = createElement("a", title + " herunterladen");
    link.href = filename;
    link.download = filename;
    const item = createElement("li");
    item.append(link, createElement("p", description));
    sampleList.append(item);
  }
  samples.append(sampleList);
  const status = control("p", "teachingStatus");
  status.className = "teaching-status";
  status.setAttribute("role", "status");
  const question = control("section", "teachingQuestion");
  question.className = "teaching-question";
  question.setAttribute("aria-label", "Vorhersageaufgabe");
  const prediction = control("textarea", "teachingPrediction");
  prediction.rows = 4;
  prediction.maxLength = 4000;
  prediction.placeholder = "Ihre Vermutung und Begründung …";
  const predictionField = labeledControl("Ihre Vorhersage (freiwillig)", prediction);
  predictionField.className += " teaching-prediction";
  predictionField.append(createElement("small", "Ihre Notiz wird nicht gespeichert. Eine neue Aufgabe oder ein Ansichtswechsel löscht sie.", "teaching-hint"));
  const reveal = control("button", "teachingReveal", "Ergebnis aufdecken");
  reveal.type = "button";
  reveal.className = "primary";
  reveal.setAttribute("aria-controls", "teachingAnswer");
  const restart = control("button", "teachingRestart", "Neue Vorhersage");
  restart.type = "button";
  const actions = createElement("div", undefined, "teaching-actions");
  actions.append(reveal, restart);
  const answer = control("section", "teachingAnswer");
  answer.className = "teaching-answer";
  answer.setAttribute("aria-label", "Aufgedecktes Ergebnis");
  answer.setAttribute("aria-live", "polite");
  pane.replaceChildren(intro, samples, quizBar, form, status, question, predictionField, actions, answer);

  let active = false;
  let revision = 0;
  let pending = false;
  let currentTask = null;
  let revealed = false;
  let quizIndex = null;

  function updateQuiz() {
    const inQuiz = quizIndex !== null;
    form.hidden = inQuiz;
    quizNext.hidden = !inQuiz;
    quizNext.disabled = !revealed || pending || !active;
    quizToggle.disabled = pending || !active;
    setText(quizToggle, inQuiz ? "Quizrunde beenden" : "Quizrunde starten");
    setText(quizNext, quizIndex === EXAMPLE_TASKS.length - 1 ? "Quizrunde abschließen" : "Nächste Aufgabe");
    setText(quizProgress, inQuiz ? `Aufgabe ${quizIndex + 1} von ${EXAMPLE_TASKS.length} · offene Fragen zur Selbstkontrolle` : "");
  }

  function updateControls() {
    prepareButton.disabled = pending || !active;
    restart.disabled = pending || !active;
    reveal.disabled = !currentTask || pending || !active;
    prediction.disabled = !currentTask || pending || !active;
    pane.setAttribute("aria-busy", String(pending));
    updateQuiz();
  }

  function setBusy(value) {
    pending = value;
    onBusyChange(value);
    updateControls();
  }

  function hideAnswer() {
    revealed = false;
    answer.replaceChildren();
    answer.hidden = true;
    reveal.setAttribute("aria-expanded", "false");
    setText(reveal, "Ergebnis aufdecken");
  }

  function clearTask(message = "") {
    revision++;
    currentTask = null;
    question.replaceChildren();
    prediction.value = "";
    hideAnswer();
    setText(status, message);
    status.setAttribute("role", "status");
    setBusy(false);
  }

  function configure() {
    exampleField.hidden = source.value !== "example";
    selectionFields.hidden = source.value !== "selection";
    childrenHint.hidden = source.value !== "children";
    setText(queryHint, METHOD_INPUT_HINTS.get(method.value) ?? "");
    clearTask("Die Angaben sind geändert. Bereiten Sie die neue Aufgabe vor.");
  }

  function showQuestion(task, capturedAt) {
    question.replaceChildren(createElement("h3", task.title), createElement("p", task.question));
    if (task.context) question.append(createElement("p", task.context, "teaching-hint"));
    if (task.html) {
      question.append(createElement("h4", "HTML zum Untersuchen"), createElement("pre", task.html, "teaching-code"));
    }
    if (task.code) question.append(createElement("h4", "Was liefert dieser Code?"), createElement("pre", task.code, "teaching-code"));
    if (capturedAt) {
      question.append(createElement("p", "Momentaufnahme · " + formatTime(capturedAt) + ". Das Ergebnis bleibt bis zur nächsten Vorbereitung unverändert, auch wenn sich die Quellseite später ändert.", "teaching-hint"));
    }
    currentTask = task;
    setText(status, "Ihre Vorhersage kann mündlich erfolgen oder hier notiert werden. Die Antwort ist noch verborgen.");
  }

  async function prepare() {
    if (!active || pending) return;
    clearTask();
    const requestRevision = revision;
    const chosenSource = quizIndex !== null ? "example" : source.value;
    setBusy(true);
    setText(status, "Aufgabe wird vorbereitet …");
    try {
      let task;
      let capturedAt;
      if (chosenSource === "example") {
        task = quizIndex !== null ? EXAMPLE_TASKS[quizIndex] : EXAMPLE_TASKS.find(item => item.id === example.value);
        if (!task) throw new Error("Wählen Sie ein vorhandenes Beispiel.");
      } else if (chosenSource === "children") {
        const current = getSnapshot();
        const selected = current?.nodes?.get(current.selectedId);
        if (selected?.type !== 1) throw new Error("Wählen Sie zuerst im DOM-Baum ein Element aus. Dokument-, Text- und Kommentarknoten sind hier nicht geeignet.");
        task = createChildrenTask(selected, current.nodes);
        capturedAt = current.snapshot?.capturedAt;
      } else if (chosenSource === "selection") {
        if (isDemo) throw new Error("Öffnen Sie TreeHugger über das Erweiterungssymbol auf der gewünschten Webseite.");
        if (!METHOD_INPUT_HINTS.has(method.value)) throw new Error("Wählen Sie eine angebotene Auswahlmethode.");
        if (query.value.length > 4096) throw new Error("Der Suchwert darf höchstens 4.096 Zeichen enthalten.");
        const result = await request("inspectSelection", {method: method.value, query: query.value});
        if (!active || requestRevision !== revision) return;
        task = createSelectionTask(result);
        capturedAt = result.capturedAt;
      } else {
        throw new Error("Wählen Sie eine angebotene Aufgabenquelle.");
      }
      if (active && requestRevision === revision) showQuestion(task, capturedAt);
    } catch (error) {
      if (active && requestRevision === revision) {
        setText(status, error.message);
        status.setAttribute("role", "alert");
      }
    } finally {
      if (active && requestRevision === revision) setBusy(false);
    }
  }

  function toggleAnswer() {
    if (!active || pending || !currentTask) return;
    if (revealed) {
      hideAnswer();
      updateQuiz();
      setText(status, "Die Antwort ist wieder verborgen. Ihre Vorhersage bleibt erhalten.");
      return;
    }
    const result = currentTask.answer;
    const lines = createElement("ul");
    for (const line of result.lines) lines.append(createElement("li", line));
    answer.replaceChildren(createElement("h3", result.heading), lines, createElement("p", result.explanation));
    for (const note of currentTask.notes ?? []) answer.append(createElement("p", note, "teaching-hint"));
    answer.hidden = false;
    revealed = true;
    updateQuiz();
    reveal.setAttribute("aria-expanded", "true");
    setText(reveal, "Antwort wieder verbergen");
    setText(status, "Vergleichen Sie Ihre Vorhersage mit dem Ergebnis. Welche Stelle im HTML erklärt den Unterschied?");
  }

  form.addEventListener("submit", event => { event.preventDefault(); return prepare(); });
  for (const input of [source, example, method]) input.addEventListener("change", configure);
  query.addEventListener("input", configure);
  reveal.addEventListener("click", toggleAnswer);
  restart.addEventListener("click", prepare);
  quizToggle.addEventListener("click", () => {
    if (!active || pending) return;
    quizIndex = quizIndex === null ? 0 : null;
    return prepare();
  });
  quizNext.addEventListener("click", () => {
    if (!active || pending || !revealed || quizIndex === null) return;
    if (quizIndex < EXAMPLE_TASKS.length - 1) {
      quizIndex++;
      return prepare();
    }
    quizIndex = null;
    clearTask("Quizrunde abgeschlossen. Vergleichen Sie Ihre Begründungen mit den besprochenen Musterantworten. Es wird keine automatische Note vergeben. Sie können eine neue Runde starten oder eine einzelne Aufgabe vorbereiten.");
  });
  configure();
  return {
    activate() { if (active) return; active = true; return prepare(); },
    deactivate() { active = false; quizIndex = null; clearTask(); },
    refresh: prepare
  };
}
