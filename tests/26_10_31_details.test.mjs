import assert from 'node:assert/strict';
import test from 'node:test';
import {createDetailsView} from '../Erweiterung/node-details.js';

class Element {
  constructor(tagName) {
    Object.assign(this, {tagName, children: [], style: {}, className: '', ownText: ''});
  }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ''; this.children = children; }
  addEventListener() {}
  set innerHTML(_) { throw new Error('Source text must never be parsed as HTML.'); }
}

function inDetailsView(callback) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const panel = new Element('aside');
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {
    getElementById(id) { assert.equal(id, 'details'); return panel; },
    createElement(tag) { return new Element(tag); }
  }});
  try {
    const view = createDetailsView({onSelect() {}, onHighlight() {}, onScope() {}, onRestore() {}, canHighlight: false});
    callback(view, panel);
  } finally {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else delete globalThis.document;
  }
}

function exampleState() {
  const root = {id: 'root', type: 1, label: '<div>', localName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml',
    childIds: ['before', 'paragraph', 'after', 'comment'], childNodesCount: 4, elementChildrenCount: 1};
  const children = [
    {id: 'before', type: 3, value: '\n  ', isWhitespace: true, parentId: 'root'},
    {id: 'paragraph', type: 1, label: '<p>', parentId: 'root'},
    {id: 'after', type: 3, value: '\n', isWhitespace: true, parentId: 'root'},
    {id: 'comment', type: 8, value: 'A comment', parentId: 'root'}
  ];
  return {snapshot: {root: root.id}, rootId: root.id, selectedId: root.id,
    nodes: new Map([root, ...children].map(node => [node.id, node])),
    filters: {text: true, whitespace: false, comments: false}};
}

const collections = panel => panel.children.filter(child => child.className === 'collection-box');
const relations = parent => parent.children.filter(child => child.className === 'relation');
const collectionCounts = panel => collections(panel).map(box => box.children[0].children[1].textContent);

test('whitespace and comment filters change displayed relations but never childNodes/children membership or totals', () => {
  inDetailsView((view, panel) => {
    const state = exampleState();
    view.render(state);
    assert.deepEqual(collectionCounts(panel), ['childNodes · 4 Einträge', 'children · 1 Einträge']);
    assert.deepEqual(collections(panel).map(box => relations(box).length), [4, 1]);
    assert.equal(relations(panel).length, 1);
    state.filters = {text: true, whitespace: true, comments: true};
    view.render(state);
    assert.deepEqual(collectionCounts(panel), ['childNodes · 4 Einträge', 'children · 1 Einträge']);
    assert.deepEqual(collections(panel).map(box => relations(box).length), [4, 1]);
    assert.equal(relations(panel).length, 4);
    state.filters = {text: false, whitespace: false, comments: false};
    view.render(state);
    assert.deepEqual(collectionCounts(panel), ['childNodes · 4 Einträge', 'children · 1 Einträge']);
    assert.deepEqual(collections(panel).map(box => relations(box).length), [4, 1]);
    assert.equal(relations(panel).length, 1);
  });
});

test('a bounded snapshot preserves original source totals instead of substituting captured or visible counts', () => {
  inDetailsView((view, panel) => {
    const state = exampleState();
    const root = state.nodes.get('root');
    root.childNodesCount = 100;
    root.elementChildrenCount = 25;
    state.nodes.delete('after');
    view.render(state);
    assert.deepEqual(collectionCounts(panel), ['childNodes · 100 Einträge', 'children · 25 Einträge']);
    assert.deepEqual(collections(panel).map(box => relations(box).length), [3, 1]);
    assert.equal(relations(panel).length, 1);
  });
});
