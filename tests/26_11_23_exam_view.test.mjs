import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.value = ''; this.textContent = ''; }
  get childElementCount() { return this.children.length; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, fn) { this['on' + name] = fn; }
  descendants() { return this.children.flatMap(c => [c, ...c.descendants()]); }
}

test('the viewer opens the exam and its controls run selection, answer, submission, grading and reload', async t => {
  const viewer = readFileSync(new URL('../Erweiterung/viewer.html', import.meta.url), 'utf8');
  assert.match(viewer, /href="exam\.html"/);
  const html = readFileSync(new URL('../Erweiterung/exam.html', import.meta.url), 'utf8');
  const nodes = Object.fromEntries([...html.matchAll(/<(\w+)[^>]*?\bid="([^"]+)"/g)].map(([, tag, id]) => [id, new Element(tag)]));
  const saved = new Map();
  for (const [name, value] of Object.entries({
    document: {getElementById: id => nodes[id], createElement: tag => new Element(tag)},
    localStorage: {getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v)},
    confirm: () => true
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {value, configurable: true});
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
  }
  await import('../Erweiterung/exam-view.js');
  assert.equal(nodes.bank.childElementCount, 66);
  nodes.chooseExam.onclick();
  assert.equal(nodes.selected.textContent, '12 ausgewählt · 60 Punkte');
  nodes.start.onclick();
  const cards = () => nodes.attempt.descendants();
  const answer = cards().find(n => n.tag === 'textarea');
  answer.value = 'Zwei Treffer';
  answer.oninput();
  assert.equal(cards().some(n => n.textContent === 'Musterlösung'), false);
  cards().find(n => n.textContent === 'Bearbeitung abgeben und auswerten').onclick();
  assert.equal(cards().filter(n => n.textContent === 'Musterlösung').length, 12);
  assert.ok(cards().filter(n => n.tag === 'textarea').every(n => n.disabled));
  const grade = cards().find(n => n.type === 'number');
  Object.assign(grade, {validity: {valid: true}, value: '2.5', valueAsNumber: 2.5});
  grade.onchange();
  assert.match(cards().find(n => n.className === 'result').textContent, /2.5 von 60/);
  await import('../Erweiterung/exam-view.js?reload');
  nodes.practice.onclick();
  assert.equal(cards().find(n => n.tag === 'textarea').value, 'Zwei Treffer');
  assert.match(cards().find(n => n.className === 'result').textContent, /11 offene Antworten/);
});
