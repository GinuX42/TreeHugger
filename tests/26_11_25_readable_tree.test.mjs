import assert from 'node:assert/strict';
import test from 'node:test';
import {createTreeView} from '../Erweiterung/tree-view.js';
import {CARD_WIDTH, CARD_HEIGHT, createTreeLayout} from '../Erweiterung/tree-layout.js';

class Element {
  constructor(tag, document) {
    this.tagName = tag;
    this.ownerDocument = document;
    this.attributes = new Map();
    this.children = [];
    this.listeners = new Map();
    this.style = {};
    this.ownText = '';
    this.clientWidth = 700;
    this.clientHeight = 400;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.classList = {add() {}, remove() {}};
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  set textContent(text) { this.ownText = String(text); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; this.ownText = ''; }
  insertBefore(child) { this.children.unshift(child); }
  get firstChild() { return this.children[0]; }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  dispatch(name, values = {}) {
    return this.listeners.get(name)?.({preventDefault() {}, stopPropagation() {}, ...values});
  }
  click() { this.dispatch('click'); }
  remove() {}
  contains(candidate) { return candidate === this || this.children.some(child => child.contains(candidate)); }
  querySelectorAll() { return descendants(this).filter(node => node.attributes.has('data-focus-key')); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollTo(left, top) {
    this.scrollLeft = typeof left === 'object' ? left.left : left;
    this.scrollTop = typeof left === 'object' ? left.top : top;
  }
  cloneNode() {
    const clone = new Element(this.tagName, this.ownerDocument);
    clone.attributes = new Map(this.attributes);
    clone.style = {...this.style};
    clone.ownText = this.ownText;
    clone.children = this.children.map(child => child.cloneNode(true));
    return clone;
  }
}
function descendants(element) { return element.children.flatMap(child => [child, ...descendants(child)]); }
function fixture(callback) {
  const saved = new Map(['document', 'XMLSerializer', 'setTimeout'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const elements = new Map();
  const document = {activeElement: null};
  document.createElement = tag => new Element(tag, document);
  document.createElementNS = (_namespace, tag) => document.createElement(tag);
  document.getElementById = id => {
    if (!elements.has(id)) elements.set(id, document.createElement('div'));
    return elements.get(id);
  };
  document.body = document.createElement('body');
  globalThis.document = document;
  try { return callback(document.getElementById, document); }
  finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}
function largeTree() {
  const root = {id: 'root', type: 1, localName: 'section', nodeName: 'SECTION', childIds: [], attributes: [{name: 'id', value: 'courses'}]};
  const nodes = new Map([[root.id, root]]);
  for (let i = 0; i < 60; i++) {
    const id = 'node-' + i;
    root.childIds.push(id);
    nodes.set(id, {id, type: 1, localName: 'article', nodeName: 'ARTICLE', childIds: [], attributes: [{name: 'id', value: 'card-' + i}]});
  }
  return {nodes, rootId: 'root', selectedId: 'node-40', expandedIds: new Set(['root']), filters: {text: true, whitespace: true, comments: true}};
}
const controls = {onSelect() {}, onToggle() {}, onMessage() {}};

test('fit uses readable overview cards instead of microscopic rich cards', () => fixture(get => {
  const view = createTreeView(controls);
  view.render(largeTree(), true);
  assert.equal(get('zoomLabel').textContent, '30 %');
  assert.equal(get('tree').getAttribute('data-presentation'), 'overview');
  const compact = descendants(get('tree')).filter(node => node.attributes.has('data-card-overview'));
  assert.equal(compact.length, 61);
  for (const card of compact) {
    assert.equal(card.getAttribute('display'), 'inline');
    for (const text of card.children.filter(child => child.tagName === 'text')) {
      assert.ok(Number(text.getAttribute('font-size')) * 0.3 >= 12);
      assert.ok(text.textContent.length <= 8);
    }
  }
  assert.ok(descendants(get('tree')).filter(node => node.attributes.has('data-card-detail')).every(node => node.getAttribute('display') === 'none'));
  const select = descendants(get('tree')).find(node => node.getAttribute('data-focus-key') === 'root');
  assert.match(select.getAttribute('aria-label'), /section id="courses"/);
}));

test('overview preserves selection, branch controls, focus and manual zoom', () => fixture((get, document) => {
  const selected = [], toggled = [];
  const view = createTreeView({...controls, onSelect: id => selected.push(id), onToggle: (...args) => toggled.push(args)});
  view.render(largeTree(), true);
  const nodes = descendants(get('tree'));
  const select = nodes.find(node => node.getAttribute('data-focus-key') === 'root');
  const toggle = nodes.find(node => node.getAttribute('data-focus-key') === 'root-toggle');
  select.dispatch('click');
  select.dispatch('keydown', {key: 'Enter'});
  toggle.dispatch('click');
  toggle.dispatch('keydown', {key: 'ArrowRight'});
  assert.deepEqual(selected, ['root', 'root']);
  assert.deepEqual(toggled, [['root', false], ['root', true]]);
  assert.match(toggle.getAttribute('transform'), /scale\(3\.333/);
  toggle.focus();
  get('zoomIn').click();
  assert.equal(get('zoomLabel').textContent, '36 %');
  assert.equal(document.activeElement, toggle);
  assert.ok(get('tree').contains(select));
  for (let i = 0; i < 20; i++) get('zoomOut').click();
  assert.equal(get('zoomLabel').textContent, '30 %');
}));

test('Lesbar restores rich cards at 100% around the selected node', () => fixture(get => {
  const state = largeTree();
  const position = createTreeLayout(state).positions.get(state.selectedId);
  const view = createTreeView(controls);
  view.render(state, true);
  get('readableZoom').click();
  assert.equal(get('zoomLabel').textContent, '100 %');
  assert.equal(get('tree').getAttribute('data-presentation'), 'detail');
  assert.equal(get('viewport').scrollLeft, Math.max(0, position.x + CARD_WIDTH / 2 - 350));
  assert.equal(get('viewport').scrollTop, Math.max(0, position.y + CARD_HEIGHT / 2 - 200));
  assert.ok(descendants(get('tree')).filter(node => node.attributes.has('data-card-detail')).every(node => node.getAttribute('display') === 'inline'));
  const toggle = descendants(get('tree')).find(node => node.getAttribute('data-focus-key') === 'root-toggle');
  assert.equal(toggle.getAttribute('transform'), 'translate(252 4)');
}));

test('Lesbar keeps the current center if the selected node is not visible', () => fixture(get => {
  const state = largeTree();
  state.selectedId = 'hidden';
  const view = createTreeView(controls);
  view.render(state, true);
  get('viewport').scrollTo(80, 240);
  view.readableZoom();
  assert.equal(get('viewport').scrollLeft, (80 + 350) / 0.3 - 350);
  assert.equal(get('viewport').scrollTop, (240 + 200) / 0.3 - 200);
}));

test('SVG export retains rich cards while restoring the live overview and zoom', () => fixture(get => {
  let exported;
  globalThis.XMLSerializer = class { serializeToString(element) { exported = element; return '<svg/>'; } };
  globalThis.setTimeout = callback => { callback(); return 0; };
  const view = createTreeView(controls);
  view.render(largeTree(), true);
  view.exportSvg('Demo');
  assert.ok(exported);
  assert.equal(exported.getAttribute('data-presentation'), 'detail');
  assert.ok(descendants(exported).filter(node => node.attributes.has('data-card-detail')).every(node => node.getAttribute('display') === 'inline'));
  assert.equal(get('tree').getAttribute('data-presentation'), 'overview');
  assert.equal(get('zoomLabel').textContent, '30 %');
}));
