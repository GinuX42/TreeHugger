import assert from "node:assert/strict";
import {test} from "node:test";
import {createTeachingView} from "../Erweiterung/teaching-view.js";
import {EXAMPLE_TASKS} from "../Erweiterung/teaching-model.js";

class Element {
  constructor(tagName) {
    Object.assign(this, {tagName, children: [], ownText: "", value: "", hidden: false, disabled: false,
      attributes: new Map(), listeners: new Map()});
  }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(""); }
  set innerHTML(_value) { throw new Error("Untrusted contents must never be parsed as HTML"); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ""; this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  async dispatch(name) { return this.listeners.get(name)?.({preventDefault() {}}); }
}

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};

async function fixture(work, overrides = {}) {
  const previous = globalThis.document;
  const created = [];
  const pane = new Element("section");
  pane.id = "teachingPane";
  created.push(pane);
  globalThis.document = {
    getElementById: id => created.find(element => element.id === id),
    createElement: tag => { const element = new Element(tag); created.push(element); return element; }
  };
  const busy = [];
  const get = id => globalThis.document.getElementById(id);
  try {
    const view = createTeachingView({request: async () => { throw new Error("Unexpected request"); },
      getSnapshot: () => ({nodes: new Map()}), onBusyChange: value => busy.push(value), isDemo: false, ...overrides});
    const form = created.find(element => element.tagName === "form");
    await work({view, pane, created, get, busy, prepare: () => form.dispatch("submit")});
  } finally {
    if (previous === undefined) delete globalThis.document; else globalThis.document = previous;
  }
}

const result = (label = '<p class="hinweis">') => ({
  resultType: "NodeList", total: 1, method: "querySelectorAll", query: ".hinweis", live: false,
  capturedAt: "2026-11-02T11:00:00Z", notes: [],
  items: [{nodeType: 1, localName: "p", label, selector: ".hinweis", interfaceName: "HTMLParagraphElement"}]
});

async function selectSource(get, value) {
  get("teachingSource").value = value;
  await get("teachingSource").dispatch("change");
}

test("example answers are absent from the DOM until reveal and hiding removes them while preserving the prediction", async () => {
  await fixture(async ({view, get, pane}) => {
    await view.activate();
    const expected = EXAMPLE_TASKS[0].answer;
    assert.equal(get("teachingAnswer").children.length, 0);
    assert.equal(get("teachingAnswer").hidden, true);
    assert.equal(pane.textContent.includes(expected.explanation), false);
    assert.equal(get("teachingReveal").disabled, false);
    get("teachingPrediction").value = "Meine eigene Begründung";
    await get("teachingReveal").dispatch("click");
    assert.equal(get("teachingAnswer").hidden, false);
    assert.ok(get("teachingAnswer").textContent.includes(expected.explanation));
    assert.equal(get("teachingReveal").getAttribute("aria-expanded"), "true");
    await get("teachingReveal").dispatch("click");
    assert.equal(get("teachingAnswer").textContent, "");
    assert.equal(get("teachingPrediction").value, "Meine eigene Begründung");
    await get("teachingRestart").dispatch("click");
    assert.equal(get("teachingPrediction").value, "");
    assert.equal(get("teachingAnswer").textContent, "");
    assert.equal(get("teachingReveal").disabled, false);
  });
});

test("source selection is captured during preparation but its result is only rendered on explicit reveal", async () => {
  const pending = deferred();
  const requests = [];
  await fixture(async ({view, get, prepare, pane}) => {
    await view.activate();
    await selectSource(get, "selection");
    const running = prepare();
    assert.equal(get("teachingReveal").disabled, true);
    assert.equal(get("teachingAnswer").textContent, "");
    pending.resolve(result("<p>Geheimes Ergebnis</p>"));
    await running;
    assert.deepEqual(requests, [["inspectSelection", {method: "querySelectorAll", query: ".hinweis"}]]);
    assert.equal(pane.textContent.includes("Geheimes Ergebnis"), false);
    assert.equal(get("teachingAnswer").children.length, 0);
    await get("teachingReveal").dispatch("click");
    assert.ok(get("teachingAnswer").textContent.includes("Geheimes Ergebnis"));
    get("teachingQuery").value = "#anderes";
    await get("teachingQuery").dispatch("input");
    assert.equal(get("teachingAnswer").textContent, "");
    assert.equal(get("teachingReveal").disabled, true);
  }, {request: (...args) => { requests.push(args); return pending.promise; }});
});

test("old responses cannot replace a newer task or clear its busy state after inputs change", async () => {
  const first = deferred();
  const second = deferred();
  let calls = 0;
  await fixture(async ({view, get, prepare}) => {
    await view.activate();
    await selectSource(get, "selection");
    const oldRequest = prepare();
    get("teachingQuery").value = ".neue";
    await get("teachingQuery").dispatch("input");
    const newRequest = prepare();
    first.resolve(result("ALTES ERGEBNIS"));
    await oldRequest;
    assert.equal(get("teachingPrepare").disabled, true);
    assert.equal(get("teachingAnswer").textContent, "");
    second.resolve({...result("NEUES ERGEBNIS"), query: ".neue"});
    await newRequest;
    await get("teachingReveal").dispatch("click");
    assert.ok(get("teachingAnswer").textContent.includes("NEUES ERGEBNIS"));
    assert.equal(get("teachingAnswer").textContent.includes("ALTES ERGEBNIS"), false);
  }, {request: () => (++calls === 1 ? first.promise : second.promise)});
});

test("deactivation clears predictions and rejects late answers and errors without reviving the view", async () => {
  for (const fails of [false, true]) {
    const pending = deferred();
    await fixture(async ({view, get, prepare, pane}) => {
      await view.activate();
      await selectSource(get, "selection");
      const running = prepare();
      get("teachingPrediction").value = "Entwurf";
      view.deactivate();
      if (fails) pending.reject(new Error("VERALTETER FEHLER")); else pending.resolve(result("VERALTETE ANTWORT"));
      await running;
      assert.equal(get("teachingPrediction").value, "");
      assert.equal(get("teachingQuestion").textContent, "");
      assert.equal(get("teachingAnswer").textContent, "");
      assert.equal(get("teachingReveal").disabled, true);
      assert.equal(/VERALTET/.test(pane.textContent), false);
    }, {request: () => pending.promise});
  }
});

test("children tasks require a selected element and keep original counts hidden until reveal", async () => {
  let selected = {id: "doc", type: 9};
  await fixture(async ({view, get, prepare}) => {
    await view.activate();
    await selectSource(get, "children");
    await prepare();
    assert.equal(get("teachingStatus").getAttribute("role"), "alert");
    assert.equal(get("teachingReveal").disabled, true);
    selected = {id: "p", type: 1, nodeName: "P", localName: "p", selector: "p", label: "<p>",
      childIds: [], childNodesCount: 7, elementChildrenCount: 2, attributes: []};
    await prepare();
    assert.equal(get("teachingAnswer").textContent, "");
    await get("teachingReveal").dispatch("click");
    assert.match(get("teachingAnswer").textContent, /7/);
    assert.match(get("teachingAnswer").textContent, /2/);
    get("teachingPrediction").value = "Neue Überlegung";
    await view.refresh();
    assert.equal(get("teachingPrediction").value, "");
    assert.equal(get("teachingAnswer").textContent, "");
  }, {getSnapshot: () => ({selectedId: selected.id, nodes: new Map([[selected.id, selected]]), snapshot: {capturedAt: "2026-11-02T11:00:00Z"}})});
});

test("page content and errors stay text, while unavailable or oversized queries never call the backend", async () => {
  const hostile = '<img src=x onerror="danger()"><script>bad()</script>';
  await fixture(async ({view, get, prepare, created}) => {
    await view.activate();
    await selectSource(get, "selection");
    await prepare();
    await get("teachingReveal").dispatch("click");
    assert.ok(get("teachingAnswer").textContent.includes(hostile));
    assert.equal(created.some(element => ["img", "script"].includes(element.tagName)), false);
    get("teachingQuery").value = "a".repeat(4097);
    await get("teachingQuery").dispatch("input");
    await prepare();
    assert.match(get("teachingStatus").textContent, /4.096/);
    assert.equal(get("teachingReveal").disabled, true);
  }, {request: async () => result(hostile)});
  await fixture(async ({view, get, prepare, created}) => {
    await view.activate();
    await selectSource(get, "selection");
    await prepare();
    assert.equal(get("teachingStatus").textContent, hostile);
    assert.equal(created.some(element => ["img", "script"].includes(element.tagName)), false);
  }, {request: async () => { throw new Error(hostile); }});
  await fixture(async ({view, get, prepare}) => {
    await view.activate();
    await selectSource(get, "selection");
    await prepare();
    assert.match(get("teachingStatus").textContent, /Erweiterungssymbol/);
    assert.equal(get("teachingReveal").disabled, true);
  }, {isDemo: true});
});

test("starting the new quiz hides and clears the individual task, while refresh resets only the quiz question", async () => {
  await fixture(async ({view, get, created}) => {
    await view.activate();
    get("teachingPrediction").value = "Vorherige Notiz";
    await get("teachingReveal").dispatch("click");
    get("quizFormat").value = "open";
    get("quizLength").value = "10";
    get("quizOrder").value = "ordered";
    await get("teachingQuiz").dispatch("click");
    const form = created.find(element => element.tagName === "form");
    const lesson = created.find(element => element.children.includes(form));
    assert.equal(lesson.hidden, true);
    assert.equal(get("teachingPrediction").value, "");
    assert.equal(get("teachingAnswer").textContent, "");
    assert.match(get("teachingProgress").textContent, /Aufgabe 1 von 10/);
    assert.equal(get("quizAnswer").textContent, "");
    get("quizPrediction").value = "Vorhersage im Quiz";
    await get("quizCheck").dispatch("click");
    assert.ok(get("quizAnswer").textContent.length > 0);
    await view.refresh();
    assert.equal(get("quizPrediction").value, "");
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(get("teachingNext").disabled, true);
    assert.match(get("teachingProgress").textContent, /Aufgabe 1 von 10/);
    assert.equal(lesson.hidden, true);
    await get("quizExit").dispatch("click");
    assert.equal(lesson.hidden, false);
    assert.equal(get("teachingProgress").textContent, "");
    assert.ok(get("teachingQuestion").textContent.includes(EXAMPLE_TASKS[0].question));
    assert.equal(get("teachingAnswer").textContent, "");
  });
});

test("starting a quiz invalidates a pending page task so late results cannot restore its answer", async () => {
  const pending = deferred();
  await fixture(async ({view, get, prepare, pane, created}) => {
    await view.activate();
    await selectSource(get, "selection");
    const running = prepare();
    await get("teachingQuiz").dispatch("click");
    const quizQuestion = get("quizQuestion").textContent;
    pending.resolve(result("VERALTETE AUSWAHL"));
    await running;
    assert.equal(get("quizQuestion").textContent, quizQuestion);
    assert.equal(get("teachingQuestion").textContent, "");
    assert.equal(get("teachingAnswer").textContent, "");
    assert.equal(pane.textContent.includes("VERALTETE AUSWAHL"), false);
    const form = created.find(element => element.tagName === "form");
    assert.equal(created.find(element => element.children.includes(form)).hidden, true);
  }, {request: () => pending.promise});
});

test("leaving the teaching tab clears the quiz and returning opens an individual task with its answer hidden", async () => {
  await fixture(async ({view, get, created}) => {
    await view.activate();
    await get("teachingQuiz").dispatch("click");
    get("quizPrediction").value = "Quiznotiz";
    await get("quizCheck").dispatch("click");
    view.deactivate();
    assert.equal(get("quizQuestion").textContent, "");
    assert.equal(get("quizPrediction").value, "");
    assert.equal(get("quizAnswer").textContent, "");
    assert.equal(get("quizSummary").textContent, "");
    assert.equal(get("teachingProgress").textContent, "");
    await view.activate();
    const form = created.find(element => element.tagName === "form");
    assert.equal(created.find(element => element.children.includes(form)).hidden, false);
    assert.equal(get("teachingQuiz").hidden, false);
    assert.equal(get("quizExit").hidden, true);
    assert.ok(get("teachingQuestion").textContent.includes(EXAMPLE_TASKS[0].question));
    assert.equal(get("teachingAnswer").textContent, "");
  });
});

test("sample downloads use only the three fixed local HTML filenames", async () => {
  await fixture(({created}) => {
    const links = created.filter(element => element.tagName === "a");
    const filenames = [
      "26_11_03_Musterseite_Selektoren.html",
      "26_11_03_Musterseite_Kindknoten.html",
      "26_11_03_Musterseite_DOM_Aenderungen.html"
    ];
    assert.deepEqual(links.map(link => link.href), filenames);
    assert.deepEqual(links.map(link => link.download), filenames);
    assert.ok(links.every(link => !/[/:?#]/.test(link.href)));
  });
});
