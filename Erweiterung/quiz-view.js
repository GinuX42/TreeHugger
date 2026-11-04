import {createElement, setText} from "./ui-dom.js";
import {createQuizRound, QUIZ_QUESTIONS, QUIZ_TOPICS, QUIZ_LEVELS} from "./quiz-model.js";

function control(tag, id, text) {
  const element = createElement(tag, text);
  element.id = id;
  return element;
}

function button(id, text) {
  const element = control("button", id, text);
  element.type = "button";
  return element;
}

function selectField(id, label, options, value) {
  const input = control("select", id);
  for (const [key, text] of options) {
    const option = createElement("option", text);
    option.value = key;
    input.append(option);
  }
  input.value = value;
  const field = createElement("label", undefined, "teaching-field");
  field.append(createElement("span", label), input);
  return {input, field};
}

export function createQuizView({onActiveChange, random = Math.random}) {
  const element = createElement("section", undefined, "quiz-area");
  element.setAttribute("aria-label", "Quiz mit offenen Fragen oder Multiple Choice");
  const heading = createElement("h3", `Quiz · ${QUIZ_QUESTIONS.length} Fragen`);
  const introduction = createElement("p", "Wenden Sie Ihr Wissen auf kleine Codebeispiele an. Bei Multiple Choice ist genau eine von vier Antworten richtig. Jede Antwort wird nach der Abgabe erklärt.");
  const settings = createElement("div", undefined, "quiz-settings");
  const format = selectField("quizFormat", "Antwortform", [["open", "Offene Vorhersage"], ["choice", "Multiple Choice · 4 Antworten"]], "open");
  const level = selectField("quizLevel", "Level", [["all", "Alle Level"], ...QUIZ_LEVELS.map(name => [name, name])], "all");
  const topic = selectField("quizTopic", "Thema", [["all", "Alle Themen"], ...QUIZ_TOPICS.map(name => [name, name])], "all");
  const length = selectField("quizLength", "Fragen pro Runde", [["10", "10 Fragen"], ["20", "20 Fragen"], ["all", "Alle passenden Fragen"]], "10");
  const order = selectField("quizOrder", "Reihenfolge", [["mixed", "Zufällig mischen"], ["ordered", "Nach Themen geordnet"]], "mixed");
  const levelHint = createElement("p", "Erstie: Code nachvollziehen · Bachelor: mehrere Regeln kombinieren · Master: Wechselwirkungen und Sonderfälle analysieren.", "teaching-hint");
  const available = control("p", "quizAvailable");
  available.setAttribute("role", "status");
  settings.append(format.field, level.field, topic.field, length.field, order.field, levelHint, available);
  const start = button("teachingQuiz", "Quizrunde starten");
  start.className = "primary";
  const exit = button("quizExit", "Quizrunde beenden");
  exit.hidden = true;
  const bar = createElement("div", undefined, "teaching-actions");
  bar.append(start, exit);
  const progress = control("p", "teachingProgress");
  progress.className = "quiz-progress";
  progress.setAttribute("role", "status");
  const body = createElement("div");
  body.hidden = true;
  const question = control("section", "quizQuestion");
  question.className = "teaching-question";
  const choices = control("fieldset", "quizChoices");
  choices.className = "quiz-choices";
  const prediction = control("textarea", "quizPrediction");
  prediction.rows = 3;
  prediction.maxLength = 4000;
  prediction.placeholder = "Ihre Vorhersage und Begründung …";
  const predictionField = createElement("label", undefined, "teaching-field teaching-prediction");
  predictionField.append(createElement("span", "Ihre Begründung (freiwillig)"), prediction);
  const note = createElement("p", "Notizen und Rundenergebnisse bleiben nur in dieser Ansicht. Beim Beenden oder Ansichtswechsel werden sie gelöscht. Die erste abgegebene Auswahl je Frage zählt zur Rundenauswertung.", "teaching-hint");
  const check = button("quizCheck", "Ergebnis aufdecken");
  check.className = "primary";
  check.setAttribute("aria-controls", "quizAnswer");
  const next = button("teachingNext", "Nächste Aufgabe");
  const actions = createElement("div", undefined, "teaching-actions");
  actions.append(check, next);
  const answer = control("section", "quizAnswer");
  answer.className = "teaching-answer";
  answer.setAttribute("aria-live", "polite");
  const summary = control("section", "quizSummary");
  summary.setAttribute("role", "status");
  summary.className = "quiz-summary";
  summary.hidden = true;
  body.append(question, choices, predictionField, note, actions, answer);
  element.append(heading, introduction, settings, bar, progress, body, summary);

  let round = null;
  let index = 0;
  let choiceMode = false;
  let selected = null;
  let checked = false;
  let revealed = false;
  let optionControls = [];
  const results = new Map();

  function updateAvailability() {
    const count = createQuizRound({topic: topic.input.value, level: level.input.value, shuffle: false}).length;
    setText(available, count ? `${count} Fragen passen zu Ihrer Auswahl.` : "Für diese Kombination gibt es noch keine Fragen. Wählen Sie ein anderes Thema oder Level.");
    start.disabled = count === 0;
  }

  function hideAnswer() {
    revealed = false;
    answer.hidden = true;
    answer.replaceChildren();
    check.setAttribute("aria-expanded", "false");
    setText(check, choiceMode ? (checked ? "Antwort erneut anzeigen" : "Antwort prüfen") : "Ergebnis aufdecken");
    for (const {label} of optionControls) label.className = "quiz-choice";
  }

  function renderQuestion() {
    const task = round[index];
    selected = null;
    checked = false;
    prediction.value = "";
    optionControls = [];
    hideAnswer();
    next.disabled = true;
    check.disabled = choiceMode;
    setText(next, index === round.length - 1 ? "Quizrunde abschließen" : "Nächste Aufgabe");
    setText(progress, `Aufgabe ${index + 1} von ${round.length} · ${task.level} · ${task.topic} · ${choiceMode ? "Multiple Choice" : "offene Vorhersage"}`);
    question.replaceChildren(createElement("h3", task.title), createElement("p", task.question));
    if (task.context) question.append(createElement("p", task.context, "teaching-hint"));
    for (const [source, label] of [[task.html, "HTML"], [task.css, "CSS"], [task.code, "JavaScript"]]) {
      if (source) question.append(createElement("h4", label), createElement("pre", source, "teaching-code"));
    }
    choices.replaceChildren();
    choices.hidden = !choiceMode;
    if (choiceMode) {
      choices.append(createElement("legend", "Wählen Sie genau eine Antwort."));
      task.choices.forEach((text, optionIndex) => {
        const input = createElement("input");
        input.type = "radio";
        input.name = "quiz-answer";
        input.value = String(optionIndex);
        const label = createElement("label", undefined, "quiz-choice");
        label.append(input, createElement("span", `${String.fromCharCode(65 + optionIndex)} · ${text}`));
        input.addEventListener("change", () => {
          if (!round || checked) return;
          selected = optionIndex;
          check.disabled = false;
        });
        optionControls.push({input, label});
        choices.append(label);
      });
    }
  }

  function showAnswer() {
    if (!round || (choiceMode && selected === null)) return;
    if (revealed) {
      hideAnswer();
      next.disabled = true;
      return;
    }
    const task = round[index];
    checked = true;
    revealed = true;
    const lines = createElement("ol", undefined, "quiz-answer-steps");
    for (const line of task.answer.lines) lines.append(createElement("li", line));
    const takeaway = createElement("p");
    takeaway.append(createElement("strong", "Merksatz: "), createElement("span", task.answer.explanation));
    answer.replaceChildren(createElement("h3", task.answer.heading), createElement("h4", "Schritt für Schritt"), lines, takeaway);
    if (choiceMode) {
      const correct = selected === task.correctIndex;
      if (!results.has(task.id)) results.set(task.id, correct);
      const feedback = createElement("p", correct ? "Ihre Antwort ist richtig." : "Ihre Antwort ist noch nicht richtig.", correct ? "quiz-feedback correct" : "quiz-feedback incorrect");
      answer.append(feedback, createElement("p", task.choiceExplanations[selected]));
      const comparison = createElement("details", undefined, "quiz-comparison");
      comparison.append(createElement("summary", "Alle vier Antworten vergleichen"));
      const explanations = createElement("ul");
      task.choices.forEach((text, optionIndex) => {
        explanations.append(createElement("li", `${String.fromCharCode(65 + optionIndex)} · ${optionIndex === task.correctIndex ? "Richtig" : "Nicht richtig"}: ${text}\n${task.choiceExplanations[optionIndex]}`));
        const {input, label} = optionControls[optionIndex];
        input.disabled = true;
        label.className = "quiz-choice" + (optionIndex === task.correctIndex ? " correct" : optionIndex === selected ? " incorrect" : "");
      });
      comparison.append(explanations);
      answer.append(comparison);
    }
    answer.hidden = false;
    check.setAttribute("aria-expanded", "true");
    setText(check, "Antwort wieder verbergen");
    next.disabled = false;
  }

  function clearRound() {
    round = null;
    selected = null;
    checked = false;
    optionControls = [];
    results.clear();
    question.replaceChildren();
    choices.replaceChildren();
    prediction.value = "";
    hideAnswer();
    body.hidden = true;
    settings.hidden = false;
    start.hidden = false;
    exit.hidden = true;
    setText(progress, "");
  }

  start.addEventListener("click", () => {
    const questions = createQuizRound({topic: topic.input.value, level: level.input.value, limit: length.input.value, shuffle: order.input.value === "mixed", shuffleChoices: true, random});
    if (!questions.length) { updateAvailability(); return; }
    round = questions;
    index = 0;
    choiceMode = format.input.value === "choice";
    results.clear();
    summary.replaceChildren();
    summary.hidden = true;
    settings.hidden = true;
    start.hidden = true;
    exit.hidden = false;
    body.hidden = false;
    onActiveChange(true);
    renderQuestion();
  });
  level.input.addEventListener("change", updateAvailability);
  topic.input.addEventListener("change", updateAvailability);
  updateAvailability();
  exit.addEventListener("click", () => {
    clearRound();
    summary.replaceChildren();
    summary.hidden = true;
    onActiveChange(false);
  });
  check.addEventListener("click", showAnswer);
  next.addEventListener("click", () => {
    if (!round || !revealed) return;
    if (index + 1 < round.length) {
      index++;
      renderQuestion();
      return;
    }
    const count = round.length;
    const correct = [...results.values()].filter(Boolean).length;
    const missed = round.filter(task => results.get(task.id) === false);
    summary.replaceChildren(createElement("h3", "Quizrunde abgeschlossen"),
      createElement("p", choiceMode ? `${correct} von ${count} ersten Antworten waren richtig. Die Auswertung dient der Selbstkontrolle; es wird keine Note vergeben.` : `${count} offene Fragen bearbeitet. Vergleichen Sie Ihre Begründungen mit den Musterantworten. Es wird keine automatische Note vergeben.`));
    if (missed.length) {
      const list = createElement("ul");
      missed.forEach(task => list.append(createElement("li", `${task.topic}: ${task.title}`)));
      summary.append(createElement("p", "Diese Themen können Sie noch einmal vertiefen:"), list);
    }
    clearRound();
    summary.hidden = false;
    onActiveChange(false);
  });
  return {
    element,
    get active() { return round !== null; },
    resetCurrent() { if (round) renderQuestion(); },
    deactivate() {
      clearRound();
      summary.replaceChildren();
      summary.hidden = true;
      onActiveChange(false);
    }
  };
}
