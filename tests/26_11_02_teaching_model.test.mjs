import assert from "node:assert/strict";
import test from "node:test";
import {EXAMPLE_TASKS, createChildrenTask, createSelectionTask} from "../Erweiterung/teaching-model.js";

const examples = new Map(EXAMPLE_TASKS.map(task => [task.id, task]));

function childrenFixture() {
  const parent = {id: "parent", type: 1, localName: "div", attributes: [{name: "id", value: "kurs"}],
    childNodesCount: 5, elementChildrenCount: 1, childIds: ["before", "p", "between", "comment", "after"]};
  const nodes = new Map([
    ["parent", parent], ["before", {type: 3, value: "\n  ", isWhitespace: true}],
    ["p", {type: 1, localName: "p", attributes: [{name: "class", value: "hinweis"}]}],
    ["between", {type: 3, value: "\n  ", isWhitespace: true}],
    ["comment", {type: 8, value: "Kursinformation"}], ["after", {type: 3, value: "\n", isWhitespace: true}]
  ]);
  return {parent, nodes};
}

function selectionResult(overrides = {}) {
  return {method: "querySelectorAll", query: ".hinweis", resultType: "NodeList", total: 1,
    items: [{label: "<p>", localName: "p", selector: "#frei"}], notes: [], ...overrides};
}

test("example tasks keep answers separately and are immutable without pre-reveal answer titles", () => {
  assert.equal(EXAMPLE_TASKS.length, 6);
  assert.equal(examples.size, 6);
  for (const task of EXAMPLE_TASKS) {
    assert.ok(task.question.endsWith("?") || task.question.endsWith("."));
    assert.equal(typeof task.html, "string");
    assert.ok(task.code.length > 0);
    assert.ok(task.answer.lines.length > 0);
    assert.ok(Object.isFrozen(task));
    assert.ok(Object.isFrozen(task.answer));
    assert.ok(Object.isFrozen(task.answer.lines));
    assert.ok(!task.title.includes(task.answer.heading));
  }
  assert.throws(() => { EXAMPLE_TASKS.push({}); }, TypeError);
  assert.throws(() => { examples.get("first-match").answer.lines[0] = "changed"; }, TypeError);
  assert.match(examples.get("first-match").title, /querySelector/);
  assert.match(examples.get("all-matches").title, /querySelectorAll/);
  assert.doesNotMatch(examples.get("no-match").title, /null|leer|kein/i);
});

test("selection examples identify the actual matching HTML elements in document order", () => {
  const first = examples.get("first-match");
  const all = examples.get("all-matches");
  const matchingTags = [...first.html.matchAll(/<p id="[^"]+" class="hinweis">/g)].map(match => match[0]);
  assert.deepEqual(matchingTags, ['<p id="frei" class="hinweis">', '<p id="kontakt" class="hinweis">']);
  assert.equal(first.answer.lines[0], matchingTags[0]);
  assert.equal(all.html, first.html);
  assert.ok(all.answer.lines.includes(`length = ${matchingTags.length}`));
  matchingTags.forEach((tag, index) => assert.ok(all.answer.lines.includes(`[${index}]: ${tag}`)));
  const missing = examples.get("no-match");
  assert.doesNotMatch(missing.html, /class="[^"]*ausgebucht/);
  assert.match(missing.answer.lines[0], /→ null$/);
  assert.match(missing.answer.lines[1], /NodeList mit length = 0$/);
});

test("the exact child-count example preserves three whitespace nodes, one element and one comment", () => {
  const task = examples.get("child-nodes");
  const inner = task.html.replace(/^<div id="kurs">/, "").replace(/<\/div>$/, "");
  const directNodes = inner.match(/<p\b[^>]*>[\s\S]*?<\/p>|<!--[\s\S]*?-->|[^<]+/g);
  assert.equal(directNodes.length, 5);
  assert.equal(directNodes.filter(text => /^\s+$/.test(text)).length, 3);
  assert.equal(directNodes.filter(text => text.startsWith("<p ")).length, 1);
  assert.equal(directNodes.filter(text => text.startsWith("<!--")).length, 1);
  assert.deepEqual(task.answer.lines.slice(0, 2), ["children.length = 1", "childNodes.length = 5"]);
  assert.match(task.answer.explanation, /„Hallo“ ist ein Kind des p-Elements/);
});

test("position and collection examples use actual elements and describe distinct membership", () => {
  const task = examples.get("position-index");
  const tags = [...task.html.matchAll(/<(?:h2|p) id="[^"]+">/g)].map(match => match[0]);
  assert.equal(task.answer.lines[0], tags[1]);
  assert.match(task.code, /:nth-child\(2\)/);
  assert.match(task.code, /children\[1\]/);
  const live = examples.get("live-collection");
  const originalCount = [...live.html.matchAll(/class="hinweis"/g)].length;
  assert.equal(originalCount, 1);
  assert.match(live.code, /neu\.className = "hinweis"/);
  assert.match(live.code, /\.append\(neu\)/);
  assert.deepEqual(live.answer.lines, [`lebend.length = ${originalCount + 1}`, `statisch.length = ${originalCount}`]);
});

test("children tasks count original source totals and enumerate whitespace and comments only in the answer", () => {
  const {parent, nodes} = childrenFixture();
  const task = createChildrenTask(parent, nodes);
  assert.deepEqual(task.answer.lines.slice(0, 2), ["children.length = 1", "childNodes.length = 5"]);
  assert.ok(task.answer.lines.includes("childNodes[0]: Leerraum-Textknoten"));
  assert.ok(task.answer.lines.includes("childNodes[3]: Kommentar: Kursinformation"));
  assert.ok(task.context.includes('<div id="kurs">'));
  assert.doesNotMatch(task.context, /5|1 Eintrag|length/);
  assert.equal(task.html, undefined);
  assert.match(task.answer.explanation, /Leerraum-Schalter verändert nur die Baumdarstellung/);
});

test("incomplete capture never replaces original children counts with the displayed child list", () => {
  const {parent, nodes} = childrenFixture();
  parent.childIds = ["p"];
  parent.childNodesCount = 900;
  parent.elementChildrenCount = 250;
  const task = createChildrenTask(parent, nodes);
  assert.deepEqual(task.answer.lines.slice(0, 2), ["children.length = 250", "childNodes.length = 900"]);
  assert.match(task.answer.lines.at(-1), /nicht vollständig einzeln erfasst/);
  assert.equal(task.answer.lines.some(line => line.startsWith("childNodes[")), false);
  parent.childNodesCount = 1;
  parent.elementChildrenCount = 1;
  parent.childIds = ["missing"];
  assert.match(createChildrenTask(parent, nodes).answer.lines.at(-1), /nicht vollständig/);
});

test("children tasks reject document nodes and missing or impossible original counts", () => {
  const {parent, nodes} = childrenFixture();
  assert.throws(() => createChildrenTask({...parent, type: 9}, nodes), /zuerst ein Element/);
  for (const values of [{childNodesCount: undefined}, {childNodesCount: NaN}, {elementChildrenCount: -1}, {elementChildrenCount: 6}]) {
    assert.throws(() => createChildrenTask({...parent, ...values}, nodes), /Zählwerte/);
  }
});

test("null, an empty NodeList and a one-element HTMLCollection remain different answers", () => {
  const missing = createSelectionTask(selectionResult({method: "querySelector", resultType: "null", total: 0, items: []}));
  const empty = createSelectionTask(selectionResult({total: 0, items: []}));
  const one = createSelectionTask(selectionResult({method: "getElementsByClassName", query: "hinweis", resultType: "HTMLCollection", live: true}));
  assert.deepEqual(missing.answer.lines, ["Rückgabetyp: null"]);
  assert.deepEqual(empty.answer.lines, ["Rückgabetyp: NodeList", "length = 0"]);
  assert.equal(one.answer.lines[0], "Rückgabetyp: HTMLCollection");
  assert.equal(one.answer.lines[1], "length = 1");
  assert.match(one.answer.explanation, /lebende HTMLCollection/);
  assert.match(one.answer.explanation, /nicht automatisch aktualisiert/);
  assert.equal(empty.question, one.question);
  assert.equal(empty.context, missing.context);
});

test("selection tasks freeze displayed answers at preparation and bound listed results without changing totals", () => {
  const result = selectionResult({total: 500, items: Array.from({length: 80}, (_, index) => ({label: "<p>", selector: `#p${index}`}))});
  const task = createSelectionTask(result);
  assert.ok(task.answer.lines.includes("length = 500"));
  assert.equal(task.answer.lines.filter(line => /^\[\d+\]/.test(line)).length, 20);
  assert.match(task.answer.lines.at(-1), /20 von 500 Treffern/);
  result.total = 1000;
  result.items[0].selector = "#changed";
  assert.ok(task.answer.lines.includes("length = 500"));
  assert.ok(task.answer.lines.some(line => line.includes("#p0")));
  assert.equal(task.answer.lines.some(line => line.includes("#changed")), false);
});

test("hostile-looking queries and labels remain inert strings and invalid result types are rejected", () => {
  const query = '"><script>globalThis.compromised=true</script>';
  const task = createSelectionTask(selectionResult({query, items: [{label: query}]}));
  assert.equal(task.code, `document.querySelectorAll(${JSON.stringify(query)})`);
  assert.ok(task.answer.lines.some(line => line.includes(query)));
  assert.equal(globalThis.compromised, undefined);
  for (const overrides of [{method: "__proto__"}, {resultType: "Array"}, {total: -1}, {items: null}, {method: "querySelector", resultType: "Element", total: 2}]) {
    assert.throws(() => createSelectionTask(selectionResult(overrides)), /gültige Rückgabe/);
  }
});
