import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createSelectionView } from '../Erweiterung/selection.js';
import { createElement, createSvgElement } from '../Erweiterung/ui-dom.js';
import { createSourceClient, getSourceTabId } from '../Erweiterung/source-client.js';
import { createNoticeView } from '../Erweiterung/notice-view.js';
import { createFocusView } from '../Erweiterung/focus-view.js';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HOSTILE_TEXT = '<img src=x onerror="globalThis.compromised=true"><script>bad()</script>';
const VIEWER_DIRECTORY = new URL('../Erweiterung/', import.meta.url);

// The mock deliberately rejects HTML parsing sinks. It models only text, attributes,
// child nodes, and the browser events used by these modules, not a browser engine.
class MockElement {
  constructor(tagName, ownerDocument, namespaceURI = HTML_NAMESPACE) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.namespaceURI = namespaceURI;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.className = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.clientWidth = 1000;
    this.clientHeight = 700;
    this.ownText = '';
    this.classList = {
      add: name => this.changeClass(name, true),
      remove: name => this.changeClass(name, false),
      toggle: (name, force) => this.changeClass(name, force),
      contains: name => this.className.split(/\s+/).includes(name),
    };
  }

  changeClass(name, force) {
    const classes = new Set(this.className.split(/\s+/).filter(Boolean));
    const include = force ?? !classes.has(name);
    if (include) classes.add(name); else classes.delete(name);
    this.className = [...classes].join(' ');
    return include;
  }

  get textContent() {
    return this.ownText + this.children.map(child => child.textContent).join('');
  }

  set textContent(value) {
    this.ownText = String(value);
    this.children = [];
  }

  set innerHTML(_value) {
    throw new Error('Unexpected innerHTML: source content must remain text.');
  }

  set outerHTML(_value) {
    throw new Error('Unexpected outerHTML: source content must remain text.');
  }

  insertAdjacentHTML() {
    throw new Error('Unexpected HTML parsing sink.');
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
  }

  replaceChildren(...children) {
    this.ownText = '';
    this.children = [];
    this.append(...children);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) ?? [];
    callbacks.push(callback);
    this.listeners.set(name, callbacks);
  }

  dispatch(name, values = {}) {
    const event = {
      target: this,
      prevented: false,
      preventDefault() { this.prevented = true; },
      stopPropagation() {},
      ...values,
    };
    for (const callback of this.listeners.get(name) ?? []) callback(event);
    return event;
  }

  contains(candidate) {
    return candidate === this || this.children.some(child => child.contains(candidate));
  }

  querySelectorAll(selector) {
    assert.equal(selector, '[data-focus-key]', 'Only the focus-restoration selector is needed by the smoke test.');
    return descendants(this).filter(node => node.attributes.has('data-focus-key'));
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  scrollTo(left, top) {
    this.scrollLeft = typeof left === 'object' ? left.left : left;
    this.scrollTop = typeof left === 'object' ? left.top : top;
  }
}

class MockDocument {
  constructor() {
    this.ids = new Map();
    this.createdElements = [];
    this.activeElement = null;
    this.body = this.createElement('body');
  }

  createElement(tagName) {
    return this.createElementNS(HTML_NAMESPACE, tagName);
  }

  createElementNS(namespaceURI, tagName) {
    const element = new MockElement(tagName, this, namespaceURI);
    this.createdElements.push(element);
    return element;
  }

  getElementById(id) {
    return this.ids.get(id) ?? null;
  }

  addId(id, tagName = 'div') {
    const element = this.createElement(tagName);
    element.setAttribute('id', id);
    this.ids.set(id, element);
    return element;
  }
}

function descendants(element) {
  return element.children.flatMap(child => [child, ...descendants(child)]);
}

async function withGlobals(values, callback) {
  const previous = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    return await callback();
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

function selectionDocument() {
  const document = new MockDocument();
  for (const id of ['selectionMethod', 'selectionQuery', 'selectionResult', 'methodHint', 'selectionCode', 'runSelection', 'selectionForm']) {
    document.addId(id);
  }
  document.getElementById('selectionMethod').value = 'querySelectorAll';
  document.getElementById('selectionQuery').value = '.hinweis';
  return document;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((fulfill, fail) => { resolve = fulfill; reject = fail; });
  return { promise, resolve, reject };
}

function selectionResult(overrides = {}) {
  return {
    method: 'querySelectorAll', query: '.hinweis', resultType: 'NodeList', live: false,
    total: 0, items: [], notes: [], capturedAt: '2026-10-30T08:00:00.000Z', ...overrides,
  };
}

function selectedElement(overrides = {}) {
  return {
    nodeType: 1, localName: 'p', interfaceName: 'HTMLParagraphElement',
    namespaceURI: HTML_NAMESPACE, label: '<p>', selector: '.hinweis', ...overrides,
  };
}

test('HTML and SVG source snippets remain literal text without creating markup', async () => {
  const document = new MockDocument();
  await withGlobals({ document }, () => {
    const label = createElement('p', HOSTILE_TEXT, 'caption');
    const svgLabel = createSvgElement('text', { x: 12, 'aria-label': HOSTILE_TEXT }, HOSTILE_TEXT);
    assert.equal(label.textContent, HOSTILE_TEXT);
    assert.equal(label.className, 'caption');
    assert.equal(svgLabel.textContent, HOSTILE_TEXT);
    assert.equal(svgLabel.namespaceURI, SVG_NAMESPACE);
    assert.equal(svgLabel.getAttribute('aria-label'), HOSTILE_TEXT);
    assert.equal(svgLabel.getAttribute('x'), '12');
    assert.deepEqual(label.children, []);
    assert.deepEqual(svgLabel.children, []);
    assert.equal(document.createdElements.some(node => node.tagName === 'img' || node.tagName === 'script'), false);
    assert.equal(createElement('span', null).textContent, '');
    assert.equal(createElement('span', 0).textContent, '0');
    assert.equal(createElement('span', false).textContent, 'false');
  });
});

test('a pending answer cannot replace results after an input changes, even if the value changes back', async () => {
  const document = selectionDocument();
  const oldAnswer = deferred();
  const requests = [];
  const busyChanges = [];
  await withGlobals({ document }, async () => {
    const view = createSelectionView({
      request: (type, payload) => { requests.push({ type, payload }); return oldAnswer.promise; },
      showElement() {}, onBusyChange: busy => busyChanges.push(busy),
    });
    const run = view.run();
    await view.run();
    assert.equal(requests.length, 1, 'A second click while busy must not send a duplicate query.');
    assert.equal(document.getElementById('runSelection').disabled, true);
    const input = document.getElementById('selectionQuery');
    input.value = '#changed';
    input.dispatch('input');
    input.value = '.hinweis';
    input.dispatch('input');
    const preparedText = document.getElementById('selectionResult').textContent;
    oldAnswer.resolve(selectionResult({ notes: ['STALE_ANSWER_SHOULD_NOT_APPEAR'] }));
    await run;
    assert.equal(document.getElementById('selectionResult').textContent, preparedText);
    assert.doesNotMatch(preparedText, /STALE_ANSWER|NodeList · Sammlung/);
    assert.equal(document.getElementById('runSelection').disabled, false);
    assert.deepEqual(busyChanges, [true, false]);
    assert.deepEqual(requests[0], { type: 'inspectSelection', payload: { method: 'querySelectorAll', query: '.hinweis' } });
  });
});

test('a stale failure after a method change stays hidden and a fresh query can succeed', async () => {
  const document = selectionDocument();
  const oldAnswer = deferred();
  let calls = 0;
  await withGlobals({ document }, async () => {
    const view = createSelectionView({
      request: () => ++calls === 1 ? oldAnswer.promise : Promise.resolve(selectionResult({ resultType: 'null', method: 'getElementById', query: 'missing' })),
      showElement() {}, onBusyChange() {},
    });
    const firstRun = view.run();
    document.getElementById('selectionMethod').value = 'getElementById';
    document.getElementById('selectionMethod').dispatch('change');
    document.getElementById('selectionQuery').value = 'missing';
    document.getElementById('selectionQuery').dispatch('input');
    oldAnswer.reject(new Error('STALE_FAILURE'));
    await firstRun;
    assert.doesNotMatch(document.getElementById('selectionResult').textContent, /STALE_FAILURE/);
    await view.run();
    assert.match(document.getElementById('selectionResult').textContent, /null – kein Treffer/);
    assert.equal(calls, 2);
  });
});

test('empty collections, one-item collections, single elements, and null keep distinct visible types', async () => {
  const cases = [
    { result: selectionResult(), expected: ['NodeList · Sammlung', 'length = 0', 'nicht null'], cardCount: 0 },
    { result: selectionResult({ resultType: 'HTMLCollection', method: 'getElementsByClassName', live: true, total: 1, items: [selectedElement()] }), expected: ['HTMLCollection · Sammlung', 'length = 1', 'Auch mit genau einem Eintrag bleibt dies eine Sammlung', '[0]'], cardCount: 1 },
    { result: selectionResult({ resultType: 'Element', method: 'querySelector', total: 1, interfaceName: 'HTMLParagraphElement', items: [selectedElement()] }), expected: ['Einzelnes Element', 'HTMLParagraphElement', 'einzeln'], cardCount: 1 },
    { result: selectionResult({ resultType: 'null', method: 'querySelector' }), expected: ['null – kein Treffer', 'weder ein Node noch ein Element noch eine Sammlung'], cardCount: 0 },
  ];
  for (const scenario of cases) {
    const document = selectionDocument();
    await withGlobals({ document }, async () => {
      const view = createSelectionView({ request: async () => scenario.result, showElement() {}, onBusyChange() {} });
      await view.run();
      const resultArea = document.getElementById('selectionResult');
      for (const text of scenario.expected) assert.ok(resultArea.textContent.includes(text), `${scenario.result.resultType}: ${text}`);
      assert.equal(descendants(resultArea).filter(node => node.tagName === 'article').length, scenario.cardCount);
    });
  }
});

test('queries, labels, selectors, notes, and error messages are rendered as safe text', async () => {
  const document = selectionDocument();
  const shownSelectors = [];
  let fail = false;
  await withGlobals({ document }, async () => {
    const view = createSelectionView({
      request: async () => {
        if (fail) throw new Error(HOSTILE_TEXT);
        return selectionResult({ query: HOSTILE_TEXT, total: 1, items: [selectedElement({ label: HOSTILE_TEXT, selector: HOSTILE_TEXT })], notes: [HOSTILE_TEXT] });
      },
      showElement: selector => shownSelectors.push(selector), onBusyChange() {},
    });
    await view.run();
    const resultArea = document.getElementById('selectionResult');
    assert.ok(resultArea.textContent.includes(HOSTILE_TEXT));
    const showButton = descendants(resultArea).find(node => node.tagName === 'button');
    showButton.dispatch('click');
    assert.deepEqual(shownSelectors, [HOSTILE_TEXT]);
    assert.equal(document.createdElements.some(node => ['script', 'img'].includes(node.tagName)), false);
    fail = true;
    await view.run();
    assert.equal(resultArea.textContent, HOSTILE_TEXT);
    assert.equal(resultArea.children[0].className, 'selection-error');
    assert.equal(document.getElementById('runSelection').disabled, false);
  });
});

test('unknown result types show an error instead of a misleading collection', async () => {
  const document = selectionDocument();
  await withGlobals({ document }, async () => {
    const view = createSelectionView({ request: async () => selectionResult({ resultType: 'constructor' }), showElement() {}, onBusyChange() {} });
    await view.run();
    assert.match(document.getElementById('selectionResult').textContent, /unbekannten Rückgabetyp/);
    assert.equal(document.getElementById('selectionResult').children[0].className, 'selection-error');
  });
});

test('the source client pins the source tab and requested operation despite conflicting payload fields', async () => {
  const messages = [];
  const expected = { resultType: 'NodeList' };
  const client = createSourceClient({ protocol: 'chrome-extension:', search: '?tab=42' }, {
    async sendMessage(message) { messages.push(message); return { ok: true, data: expected }; },
  });
  assert.equal(client.available, true);
  const result = await client.request('inspectSelection', { tabId: 999, type: 'highlight', method: 'querySelectorAll', query: '.hinweis' });
  assert.equal(result, expected);
  assert.deepEqual(messages, [{ tabId: 42, type: 'inspectSelection', method: 'querySelectorAll', query: '.hinweis' }]);
});

test('missing, malformed, unsafe, or non-extension source tabs cannot send a request', async () => {
  const invalidSearches = ['', '?tab=', '?tab=-1', '?tab=01', '?tab=+1', '?tab=1.5', '?tab=Infinity', '?tab=NaN', '?tab=9007199254740992', '?tab=1x'];
  assert.equal(getSourceTabId('?tab=0'), 0);
  assert.equal(getSourceTabId('?tab=42'), 42);
  let sends = 0;
  const runtime = { async sendMessage() { sends++; return { ok: true }; } };
  for (const search of invalidSearches) {
    assert.equal(getSourceTabId(search), null, search);
    const client = createSourceClient({ protocol: 'chrome-extension:', search }, runtime);
    assert.equal(client.available, false, search);
    await assert.rejects(client.request('capture'), /benötigt die Quellseite/);
  }
  for (const protocol of ['file:', 'https:', 'http:']) {
    const client = createSourceClient({ protocol, search: '?tab=42' }, runtime);
    assert.equal(client.available, false);
    await assert.rejects(client.request('capture'), /benötigt die Quellseite/);
  }
  const withoutRuntime = createSourceClient({ protocol: 'chrome-extension:', search: '?tab=42' }, undefined);
  assert.equal(withoutRuntime.available, false);
  await assert.rejects(withoutRuntime.request('capture'), /benötigt die Quellseite/);
  assert.equal(sends, 0);
});

test('source transport errors and refused or missing replies produce useful errors', async () => {
  const pageLocation = { protocol: 'chrome-extension:', search: '?tab=42' };
  const unavailable = createSourceClient(pageLocation, { async sendMessage() { throw new Error('transport detail'); } });
  await assert.rejects(unavailable.request('capture'), /Erweiterung ist nicht erreichbar/);
  const refused = createSourceClient(pageLocation, { async sendMessage() { return { ok: false, error: 'Geschützte Seite' }; } });
  await assert.rejects(refused.request('capture'), /Geschützte Seite/);
  for (const reply of [undefined, null, {}, { ok: false }]) {
    const missing = createSourceClient(pageLocation, { async sendMessage() { return reply; } });
    await assert.rejects(missing.request('capture'), /Quellseite konnte nicht gelesen/);
  }
});

async function documentFromViewerIds() {
  const source = await readFile(new URL('viewer.html', VIEWER_DIRECTORY), 'utf8');
  const document = new MockDocument();
  for (const match of source.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
    const [, tagName, attributes, id] = match;
    const element = document.addId(id, tagName);
    element.value = /\bvalue="([^"]*)"/.exec(attributes)?.[1] ?? '';
    element.checked = /\bchecked\b/.test(attributes);
    element.hidden = /\bhidden\b/.test(attributes);
    for (const [, name, value] of attributes.matchAll(/([a-z-]+)="([^"]*)"/gi)) element.setAttribute(name, value);
    if (tagName === 'select') {
      const contentStart = match.index + match[0].length;
      const content = source.slice(contentStart, source.indexOf('</select>', contentStart));
      const options = [...content.matchAll(/<option\b([^>]*)>/g)];
      const option = options.find(([, attributes]) => /\bselected\b/.test(attributes)) ?? options[0];
      element.value = /\bvalue="([^"]*)"/.exec(option?.[1] ?? '')?.[1] ?? '';
    }
  }
  return document;
}

test('viewer imports and renders its built-in demo with every ID from the real HTML and no browser connection', async () => {
  const document = await documentFromViewerIds();
  let requests = 0;
  await withGlobals({
    document,
    location: { protocol: 'file:', search: '' },
    chrome: { runtime: { async sendMessage() { requests++; throw new Error('The demo must not request a source tab.'); } } },
  }, async () => {
    await import(new URL('viewer.js?node-smoke-test', VIEWER_DIRECTORY));
    assert.equal(document.getElementById('pageTitle').textContent, 'Kursportal · Beispieldiagramm');
    assert.equal(document.getElementById('pageUrl').textContent, 'Eingebautes Beispiel');
    assert.equal(document.getElementById('empty').hidden, true);
    assert.match(document.getElementById('count').textContent, /sichtbar · 13 eingelesen/);
    assert.match(document.getElementById('messageContent').textContent, /Vorschau mit eingebautem Beispiel/);
    assert.match(document.getElementById('details').textContent, /Document → Node/);
    assert.ok(descendants(document.getElementById('tree')).some(node => node.tagName === 'path'));
    assert.ok(descendants(document.getElementById('tree')).some(node => node.textContent.includes('Element · auch Node')));
    assert.equal(document.getElementById('export').disabled, false);
    assert.equal(document.getElementById('scope').disabled, false);
    const diagram = document.getElementById('tree');
    const firstCard = descendants(diagram).find(node => node.getAttribute('data-node-id'));
    const zoomLabel = document.getElementById('zoomLabel').textContent;
    document.getElementById('closeNotices').dispatch('click');
    assert.equal(document.getElementById('message').hidden, true);
    document.getElementById('focusToggle').dispatch('click');
    assert.equal(document.body.classList.contains('tree-focus'), true);
    assert.equal(document.getElementById('focusToggle').textContent, '← Zurück');
    document.body.dispatch('keydown', {key: 'Escape'});
    assert.equal(document.body.classList.contains('tree-focus'), false);
    assert.equal(document.getElementById('zoomLabel').textContent, zoomLabel);
    assert.ok(descendants(diagram).includes(firstCard), 'The view switch must retain the existing diagram');
    document.getElementById('comments').dispatch('change');
    assert.equal(document.getElementById('message').hidden, true, 'Rendering the tree must not reopen dismissed notices');
    document.getElementById('selectionMode').dispatch('click');
    assert.equal(document.getElementById('selectionPane').hidden, false);
    assert.equal(document.getElementById('treePane').hidden, true);
    assert.equal(document.getElementById('export').disabled, true);
    document.getElementById('sourceMode').dispatch('click');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(document.getElementById('sourcePane').hidden, false);
    assert.equal(document.getElementById('selectionPane').hidden, true);
    assert.equal(document.getElementById('sourceMode').getAttribute('aria-pressed'), 'true');
    assert.match(document.getElementById('codeRows').textContent, /<main id="kurse">/);
    assert.equal(document.getElementById('refresh').textContent, 'Quellcode neu einlesen');
    document.getElementById('codeFocus').dispatch('click');
    assert.equal(document.body.classList.contains('code-focus'), true);
    document.body.dispatch('keydown', {key: 'Escape'});
    assert.equal(document.body.classList.contains('code-focus'), false);
    document.getElementById('treeMode').dispatch('click');
    assert.equal(document.getElementById('treePane').hidden, false);
    assert.equal(document.getElementById('selectionPane').hidden, true);
    assert.equal(document.getElementById('sourcePane').hidden, true);
    assert.equal(requests, 0);
  });
});

test('dismissed notices stay closed through updates, but new errors can be seen and closed', async () => {
  const document = new MockDocument();
  for (const id of ['message', 'messageContent', 'noticeToggle', 'closeNotices']) document.addId(id);
  await withGlobals({document}, async () => {
    const view = createNoticeView();
    const panel = document.getElementById('message');
    const toggle = document.getElementById('noticeToggle');
    assert.equal(panel.hidden, true);
    assert.equal(toggle.hidden, true);
    view.setNotices(['Grenze erreicht', 'Frames ausgelassen', 'Grenze erreicht']);
    assert.equal(toggle.textContent, 'Hinweise (2)');
    assert.equal(panel.hidden, false);
    document.getElementById('closeNotices').dispatch('click');
    view.setNotices(['Grenze erreicht', 'Frames ausgelassen', 'Ansicht begrenzt']);
    assert.equal(panel.hidden, true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    toggle.dispatch('click');
    assert.equal(panel.hidden, false);
    document.getElementById('closeNotices').dispatch('click');
    view.showMessage('Die Ursprungsseite wurde geschlossen.', {error: true});
    assert.equal(panel.hidden, false);
    assert.equal(document.getElementById('messageContent').getAttribute('role'), 'alert');
    view.setNotices(['Grenze erreicht']);
    assert.match(document.getElementById('messageContent').textContent, /Ursprungsseite wurde geschlossen/);
    document.getElementById('closeNotices').dispatch('click');
    view.clearMessage();
    assert.equal(panel.hidden, true);
    assert.equal(toggle.textContent, 'Hinweise (1)');
    view.setNotices([]);
    assert.equal(toggle.hidden, true);
  });
});

test('tree-only mode exits by button or Escape and restores the previous viewport position', async () => {
  const document = new MockDocument();
  const button = document.addId('focusToggle', 'button');
  const viewport = document.addId('viewport');
  let changes = 0;
  await withGlobals({document}, async () => {
    const view = createFocusView({onChange: () => changes++});
    viewport.scrollTo(150, 230);
    button.dispatch('click');
    assert.equal(document.body.classList.contains('tree-focus'), true);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    viewport.scrollTo(470, 590);
    const event = document.body.dispatch('keydown', {key: 'Escape'});
    assert.equal(event.prevented, true);
    assert.equal(document.body.classList.contains('tree-focus'), false);
    assert.equal(button.textContent, 'Nur Baum');
    assert.equal(viewport.scrollLeft, 150);
    assert.equal(viewport.scrollTop, 230);
    assert.equal(document.activeElement, button);
    assert.equal(document.body.dispatch('keydown', {key: 'Escape'}).prevented, false);
    button.dispatch('click');
    button.dispatch('click');
    assert.equal(document.body.classList.contains('tree-focus'), false);
    assert.equal(changes, 4);
    view.exit();
    assert.equal(changes, 4);
  });
});
