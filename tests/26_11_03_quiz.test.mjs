import assert from "node:assert/strict";
import {test} from "node:test";
import {Script} from "node:vm";
import {QUIZ_QUESTIONS, QUIZ_TOPICS, QUIZ_LEVELS, createQuizRound} from "../Erweiterung/quiz-model.js";
import {createQuizView} from "../Erweiterung/quiz-view.js";
import {analyzeSpecificity} from "../Erweiterung/specificity.js";

const ORDERED_ROUND = createQuizRound({shuffle: false, shuffleChoices: true, random: () => 0.25});

test("shuffling answers keeps the correct text and each explanation together without changing the bank", () => {
  const before = JSON.stringify(QUIZ_QUESTIONS);
  const round = createQuizRound({shuffle: false, shuffleChoices: true, random: () => 0});
  for (const [index, task] of round.entries()) {
    const original = QUIZ_QUESTIONS[index];
    assert.notDeepEqual(task.choices, original.choices, task.id);
    assert.equal(task.choices[task.correctIndex], original.choices[original.correctIndex], task.id);
    task.choices.forEach((text, position) => {
      assert.equal(task.choiceExplanations[position], original.choiceExplanations[original.choices.indexOf(text)], task.id);
    });
    assert.ok(Object.isFrozen(task) && Object.isFrozen(task.choices));
  }
  assert.equal(JSON.stringify(QUIZ_QUESTIONS), before);
});

test("all JavaScript examples parse as scripts without running their contents", () => {
  const tasks = QUIZ_QUESTIONS.filter(task => task.code);
  assert.equal(tasks.length, 39);
  for (const task of tasks) assert.doesNotThrow(() => new Script(task.code), task.id);
});

test("advanced specificity examples agree with the teaching calculator", () => {
  const examples = [
    ['#portal .karte[data-status="frei"] > p.hinweis::first-line', [1, 3, 2]],
    [':is(#archiv, .karte) .hinweis', [1, 1, 0]],
    [':where(#portal, .karte) p.hinweis', [0, 1, 1]],
    ['p:not(.ausgebucht, #sperre)', [1, 0, 1]],
    ['.karte:has(> p.hinweis, #extra)', [1, 1, 0]],
    ['li:nth-child(2 of .hinweis, #ziel)', [1, 1, 1]]
  ];
  for (const [selector, expected] of examples) {
    assert.ok(QUIZ_QUESTIONS.some(task => task.css?.includes(selector)), selector);
    const result = analyzeSpecificity(selector);
    assert.equal(result.ok, true, selector);
    assert.deepEqual(result.selectors[0].specificity, expected, selector);
  }
});

class Element {
  constructor(tagName) {
    Object.assign(this, {tagName, children: [], ownText: "", value: "", hidden: false, disabled: false,
      attributes: new Map(), listeners: new Map(), className: ""});
  }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(""); }
  set innerHTML(_value) { throw new Error("Question contents must remain inert text"); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ""; this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  async dispatch(name) { return this.listeners.get(name)?.({preventDefault() {}}); }
}

function descendants(element) {
  return element.children.flatMap(child => [child, ...descendants(child)]);
}

async function fixture(work) {
  const previous = globalThis.document;
  const created = [];
  const activeChanges = [];
  globalThis.document = {
    createElement(tag) { const element = new Element(tag); created.push(element); return element; }
  };
  try {
    const view = createQuizView({onActiveChange: active => activeChanges.push(active), random: () => 0.25});
    const get = id => created.find(element => element.id === id);
    const radios = () => descendants(get("quizChoices")).filter(element => element.tagName === "input");
    const labels = () => get("quizChoices").children.filter(element => element.tagName === "label");
    const start = async ({format = "choice", limit = "all", topic = "all"} = {}) => {
      get("quizFormat").value = format;
      get("quizLength").value = limit;
      get("quizTopic").value = topic;
      get("quizOrder").value = "ordered";
      await get("teachingQuiz").dispatch("click");
    };
    const choose = async index => {
      const options = radios();
      options.forEach((input, current) => { input.checked = current === index; });
      await options[index].dispatch("change");
    };
    await work({view, get, start, choose, radios, labels, activeChanges});
  } finally {
    if (previous === undefined) delete globalThis.document; else globalThis.document = previous;
  }
}

test("the immutable question bank has 54 distinct tasks with exactly four unique choices and one answer key", () => {
  assert.equal(QUIZ_QUESTIONS.length, 54);
  assert.equal(new Set(QUIZ_QUESTIONS.map(question => question.id)).size, 54);
  const descriptions = new Set();
  const correctPositions = new Set();
  for (const question of QUIZ_QUESTIONS) {
    assert.ok(Object.isFrozen(question));
    assert.ok(Object.isFrozen(question.choices));
    assert.ok(Object.isFrozen(question.choiceExplanations));
    assert.ok(Object.isFrozen(question.answer));
    assert.ok(Object.isFrozen(question.answer.lines));
    assert.equal(question.choices.length, 4, question.id);
    assert.equal(new Set(question.choices.map(choice => choice.trim().toLowerCase())).size, 4, question.id);
    assert.ok(question.choices.every(choice => typeof choice === "string" && choice.trim().length > 0), question.id);
    assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4, question.id);
    correctPositions.add(question.correctIndex);
    assert.equal(question.choiceExplanations.length, 4, question.id);
    assert.ok(question.choiceExplanations.every(explanation => typeof explanation === "string" && explanation.trim().length > 0), question.id);
    assert.ok(question.question && question.context && question.title && question.topic, question.id);
    assert.ok(question.html || question.css || question.code, question.id);
    assert.ok(question.answer.heading && question.answer.lines.length > 0 && question.answer.explanation, question.id);
    descriptions.add(JSON.stringify([question.question, question.html, question.css, question.code]));
  }
  assert.equal(descriptions.size, 54);
  assert.equal(correctPositions.size, 4);
  assert.ok(Object.isFrozen(QUIZ_QUESTIONS));
  assert.ok(Object.isFrozen(QUIZ_TOPICS));
  assert.throws(() => { QUIZ_QUESTIONS[0].choices[0] = "Ersetzt"; }, TypeError);
});

test("round filtering, limits and shuffling preserve membership without mutating or duplicating the bank", () => {
  const originalOrder = QUIZ_QUESTIONS.map(question => question.id);
  const ordered = createQuizRound({shuffle: false});
  assert.deepEqual(ordered.map(question => question.id), originalOrder);
  assert.ok(Object.isFrozen(ordered));
  for (const topic of QUIZ_TOPICS) {
    const filtered = createQuizRound({topic, shuffle: false});
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every(question => question.topic === topic));
    assert.deepEqual(filtered, QUIZ_QUESTIONS.filter(question => question.topic === topic));
  }
  const shuffled = createQuizRound({random: () => 0});
  assert.equal(new Set(shuffled.map(question => question.id)).size, 54);
  assert.deepEqual([...shuffled.map(question => question.id)].sort(), [...originalOrder].sort());
  assert.notDeepEqual(shuffled.map(question => question.id), originalOrder);
  assert.deepEqual(QUIZ_QUESTIONS.map(question => question.id), originalOrder);
  assert.equal(createQuizRound({limit: "10", shuffle: false}).length, 10);
  assert.equal(createQuizRound({limit: "20", shuffle: false}).length, 20);
  assert.equal(createQuizRound({limit: 100, shuffle: false}).length, 54);
  assert.throws(() => createQuizRound({topic: "NICHT VORHANDEN"}), /Thema/);
  for (const limit of [0, -1, 2.5, "abc", Infinity]) {
    assert.throws(() => createQuizRound({limit}), /Anzahl/);
  }
});

test("multiple choice starts with four neutral radio choices and requires a choice before revealing any answer", async () => {
  await fixture(async ({view, get, start, choose, radios, labels}) => {
    await start();
    assert.equal(view.active, true);
    assert.equal(radios().length, 4);
    assert.ok(radios().every(input => input.type === "radio" && input.name === "quiz-answer"));
    assert.ok(labels().every(label => label.className === "quiz-choice"));
    assert.equal(get("quizCheck").disabled, true);
    assert.equal(get("teachingNext").disabled, true);
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(view.element.textContent.includes(ORDERED_ROUND[0].answer.explanation), false);
    await get("quizCheck").dispatch("click");
    assert.equal(get("quizAnswer").textContent, "");
    await get("teachingNext").dispatch("click");
    assert.match(get("teachingProgress").textContent, /Aufgabe 1 von 54/);
    await choose(ORDERED_ROUND[0].correctIndex);
    assert.equal(get("quizCheck").disabled, false);
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(view.element.textContent.includes(ORDERED_ROUND[0].choiceExplanations[ORDERED_ROUND[0].correctIndex]), false);
    await get("quizCheck").dispatch("click");
    assert.match(get("quizAnswer").textContent, /Ihre Antwort ist richtig/);
    assert.ok(get("quizAnswer").textContent.includes(ORDERED_ROUND[0].answer.explanation));
    assert.equal(get("quizCheck").getAttribute("aria-expanded"), "true");
    assert.ok(radios().every(input => input.disabled));
  });
});

test("a submitted wrong answer cannot be changed and hiding removes all answer text and correctness classes", async () => {
  await fixture(async ({get, start, choose, radios, labels}) => {
    await start();
    const correct = ORDERED_ROUND[0].correctIndex;
    const wrong = (correct + 1) % 4;
    await choose(wrong);
    await get("quizCheck").dispatch("click");
    assert.match(get("quizAnswer").textContent, /Ihre Antwort ist noch nicht richtig/);
    assert.equal(labels()[correct].className, "quiz-choice correct");
    assert.equal(labels()[wrong].className, "quiz-choice incorrect");
    assert.ok(radios().every(input => input.disabled));
    await get("quizCheck").dispatch("click");
    assert.equal(get("quizAnswer").children.length, 0);
    assert.equal(get("quizAnswer").hidden, true);
    assert.ok(labels().every(label => label.className === "quiz-choice"));
    assert.equal(get("quizCheck").getAttribute("aria-expanded"), "false");
    assert.equal(get("teachingNext").disabled, true);
    await choose(correct);
    await get("quizCheck").dispatch("click");
    assert.match(get("quizAnswer").textContent, /Ihre Antwort ist noch nicht richtig/);
    assert.equal(labels()[wrong].className, "quiz-choice incorrect");
    await get("teachingNext").dispatch("click");
    assert.match(get("teachingProgress").textContent, /Aufgabe 2 von 54/);
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(get("quizPrediction").value, "");
    assert.equal(get("quizCheck").disabled, true);
    assert.ok(radios().every(input => !input.disabled));
    assert.ok(labels().every(label => label.className === "quiz-choice"));
  });
});

test("the full 54-question round scores only the first submitted answer even after retrying a question", async () => {
  await fixture(async ({view, get, start, choose, activeChanges}) => {
    await start();
    for (const [index, task] of ORDERED_ROUND.entries()) {
      assert.ok(get("quizQuestion").textContent.includes(task.question), task.id);
      assert.equal(get("quizAnswer").textContent, "", task.id);
      assert.equal(get("quizPrediction").value, "", task.id);
      get("quizPrediction").value = `Begründung zu ${task.id}`;
      await choose(index === 0 ? (task.correctIndex + 1) % 4 : task.correctIndex);
      await get("quizCheck").dispatch("click");
      if (index === 0) {
        view.resetCurrent();
        assert.equal(get("quizAnswer").textContent, "");
        assert.equal(get("quizPrediction").value, "");
        await choose(task.correctIndex);
        await get("quizCheck").dispatch("click");
        assert.match(get("quizAnswer").textContent, /Ihre Antwort ist richtig/);
      }
      assert.equal(get("teachingNext").textContent, index === 53 ? "Quizrunde abschließen" : "Nächste Aufgabe");
      await get("teachingNext").dispatch("click");
    }
    assert.equal(view.active, false);
    assert.equal(get("quizQuestion").textContent, "");
    assert.equal(get("quizChoices").children.length, 0);
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(get("quizPrediction").value, "");
    assert.equal(get("quizSummary").hidden, false);
    assert.match(get("quizSummary").textContent, /53 von 54 ersten Antworten waren richtig/);
    assert.ok(get("quizSummary").textContent.includes(ORDERED_ROUND[0].title));
    assert.deepEqual(activeChanges, [true, false]);
    await start({limit: "10"});
    assert.equal(get("quizSummary").textContent, "");
    assert.equal(get("quizSummary").hidden, true);
  });
});

test("open questions have no rendered answer choices and finish without automatically grading the prediction", async () => {
  await fixture(async ({view, get, start, radios}) => {
    await start({format: "open", limit: "10"});
    for (let index = 0; index < 10; index++) {
      assert.equal(get("quizChoices").hidden, true);
      assert.equal(radios().length, 0);
      assert.equal(get("quizChoices").textContent, "");
      assert.equal(get("quizCheck").disabled, false);
      assert.equal(get("quizAnswer").textContent, "");
      get("quizPrediction").value = index % 2 ? "Beliebiger freier Text" : "";
      await get("quizCheck").dispatch("click");
      assert.ok(get("quizAnswer").textContent.includes(ORDERED_ROUND[index].answer.explanation));
      assert.doesNotMatch(get("quizAnswer").textContent, /Ihre Antwort ist (?:noch nicht )?richtig/);
      await get("teachingNext").dispatch("click");
    }
    assert.equal(view.active, false);
    assert.match(get("quizSummary").textContent, /10 offene Fragen bearbeitet/);
    assert.match(get("quizSummary").textContent, /keine automatische Note/);
    assert.doesNotMatch(get("quizSummary").textContent, /ersten Antworten waren richtig/);
  });
});

test("exit and deactivation remove all answers, predictions, progress and results", async () => {
  await fixture(async ({view, get, start, choose}) => {
    for (const end of [() => get("quizExit").dispatch("click"), () => view.deactivate()]) {
      await start();
      get("quizPrediction").value = "Nicht gespeicherte Notiz";
      await choose(ORDERED_ROUND[0].correctIndex);
      await get("quizCheck").dispatch("click");
      await end();
      assert.equal(view.active, false);
      for (const id of ["quizQuestion", "quizChoices", "quizAnswer", "quizSummary", "teachingProgress"]) {
        assert.equal(get(id).textContent, "", id);
      }
      assert.equal(get("quizPrediction").value, "");
      assert.equal(get("quizSummary").hidden, true);
      assert.equal(get("teachingQuiz").hidden, false);
      assert.equal(get("quizExit").hidden, true);
      await get("quizCheck").dispatch("click");
      await get("teachingNext").dispatch("click");
      assert.equal(get("quizAnswer").textContent, "");
      assert.equal(get("teachingProgress").textContent, "");
    }
  });
});

test("each question has one defined level and level/topic intersections never include other tasks", () => {
  assert.deepEqual(QUIZ_LEVELS, ["Erstie", "Bachelor", "Master"]);
  assert.ok(QUIZ_QUESTIONS.every(task => QUIZ_LEVELS.includes(task.level)));
  for (const level of QUIZ_LEVELS) {
    assert.ok(createQuizRound({level}).length >= 10);
    for (const topic of QUIZ_TOPICS) {
      const expected = QUIZ_QUESTIONS.filter(task => task.level === level && task.topic === topic);
      assert.deepEqual(createQuizRound({level, topic, shuffle: false}), expected);
    }
  }
  assert.throws(() => createQuizRound({level: "Doktor"}), /Stufe/);
});

test("level selection updates availability, handles an empty intersection and limits the started round", async () => {
  await fixture(async ({view, get}) => {
    get("quizLevel").value = "Master";
    await get("quizLevel").dispatch("change");
    const master = QUIZ_QUESTIONS.filter(task => task.level === "Master");
    assert.match(get("quizAvailable").textContent, new RegExp(`${master.length} Fragen`));
    get("quizOrder").value = "ordered";
    get("quizLength").value = "all";
    await get("teachingQuiz").dispatch("click");
    assert.match(get("teachingProgress").textContent, /Master/);
    assert.ok(get("quizQuestion").textContent.includes(master[0].question));
    await get("quizExit").dispatch("click");
    get("quizLevel").value = "Erstie";
    get("quizTopic").value = "Ereignisse";
    await get("quizTopic").dispatch("change");
    assert.equal(get("teachingQuiz").disabled, true);
    assert.match(get("quizAvailable").textContent, /keine Fragen/);
    await get("teachingQuiz").dispatch("click");
    assert.equal(view.active, false);
    get("quizTopic").value = "all";
    await get("quizTopic").dispatch("change");
    assert.equal(get("teachingQuiz").disabled, false);
  });
});
