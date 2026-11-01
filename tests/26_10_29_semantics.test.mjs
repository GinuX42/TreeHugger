import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  describeElement,
  getTypeHierarchy,
  ELEMENT_GROUPS,
  isHtmlList,
} from '../Erweiterung/semantics.js';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

function htmlElement(localName, interfaceName = 'HTMLElement') {
  return { type: 1, localName, namespaceURI: HTML_NAMESPACE, interfaceName };
}

test('HTML elements retain their German teaching meanings and interface hierarchy', () => {
  const button = htmlElement('button', 'HTMLButtonElement');
  assert.equal(describeElement(button).meaning, 'Schaltfläche');
  assert.equal(describeElement(button).name, ELEMENT_GROUPS.form.name);
  assert.deepEqual(getTypeHierarchy(button), ['HTMLButtonElement', 'HTMLElement', 'Element', 'Node']);
  assert.equal(describeElement(htmlElement('footer')).meaning, 'Fußbereich');
  assert.equal(describeElement(htmlElement('H1')).meaning, 'Überschrift – Ebene 1');
});

test('HTML lists and their entries are elements rather than collection objects', () => {
  for (const tag of ['ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu']) {
    assert.equal(isHtmlList(htmlElement(tag)), true, tag);
    assert.equal(describeElement(htmlElement(tag)).name, 'HTML-Liste', tag);
  }
  assert.equal(isHtmlList(htmlElement('select')), false);
  assert.equal(isHtmlList({ interfaceName: 'NodeList' }), false);
  assert.equal(isHtmlList({ interfaceName: 'HTMLCollection' }), false);
  assert.deepEqual(getTypeHierarchy({ interfaceName: 'NodeList' }), []);
  assert.deepEqual(getTypeHierarchy({ interfaceName: 'HTMLCollection' }), []);
});

test('XML without a namespace never becomes an HTML element because of its tag name', () => {
  for (const namespaceURI of [null, undefined]) {
    const xmlList = { type: 1, localName: 'ul', namespaceURI, interfaceName: 'Element' };
    assert.equal(isHtmlList(xmlList), false);
    assert.equal(describeElement(xmlList).name, 'Weiteres Element');
    assert.equal(describeElement(xmlList).meaning, 'Element <ul> ohne Namensraum');
    assert.deepEqual(getTypeHierarchy(xmlList), ['Element', 'Node']);
  }
  const namespacedXml = { type: 1, localName: 'CustomerName', namespaceURI: 'urn:example', interfaceName: 'Element' };
  assert.equal(describeElement(namespacedXml).meaning, 'Element <CustomerName> im angegebenen Namensraum');
});

test('SVG and MathML use their own namespaces, meanings, and base interfaces', () => {
  const svg = { type: 1, localName: 'linearGradient', namespaceURI: SVG_NAMESPACE, interfaceName: 'SVGLinearGradientElement' };
  assert.equal(describeElement(svg).meaning, 'SVG-Element <linearGradient>');
  assert.deepEqual(getTypeHierarchy(svg), ['SVGLinearGradientElement', 'SVGElement', 'Element', 'Node']);
  assert.equal(isHtmlList({ ...svg, localName: 'ul' }), false);
  const math = { type: 1, localName: 'math', namespaceURI: MATHML_NAMESPACE, interfaceName: 'MathMLElement' };
  assert.equal(describeElement(math).meaning, 'MathML-Element <math>');
  assert.deepEqual(getTypeHierarchy(math), ['MathMLElement', 'Element', 'Node']);
});

test('prototype-like tag names are handled as data and never as inherited properties', () => {
  for (const tag of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    const description = describeElement(htmlElement(tag));
    assert.equal(typeof description, 'object', tag);
    assert.equal(description.name, 'Weiteres Element', tag);
    assert.equal(description.meaning, 'HTML-Element <' + tag.toLowerCase() + '>', tag);
  }
  assert.equal(describeElement(htmlElement('unknown', 'HTMLUnknownElement')).meaning, 'Unbekanntes HTML-Element');
  assert.equal(describeElement(htmlElement('course-card')).meaning, 'HTML-Element mit eigenem Tag-Namen');
});

test('HTMLDocument is an alias while XMLDocument retains its Document base', () => {
  for (const interfaceName of ['Document', 'HTMLDocument', undefined]) {
    assert.deepEqual(getTypeHierarchy({ type: 9, interfaceName }), ['Document', 'Node']);
  }
  assert.deepEqual(getTypeHierarchy({ type: 9, interfaceName: 'XMLDocument' }), ['XMLDocument', 'Document', 'Node']);
});

test('CharacterData ancestry includes Text, Comment, CDATA and ProcessingInstruction', () => {
  assert.deepEqual(getTypeHierarchy({ type: 3 }), ['Text', 'CharacterData', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 8 }), ['Comment', 'CharacterData', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 4 }), ['CDATASection', 'Text', 'CharacterData', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 7 }), ['ProcessingInstruction', 'CharacterData', 'Node']);
  for (const type of [3, 4, 7, 8]) {
    assert.equal(describeElement({ type }), null);
    assert.equal(isHtmlList({ type }), false);
  }
});

test('fragments, document types, attributes and unknown nodes do not become elements', () => {
  assert.deepEqual(getTypeHierarchy({ type: 11 }), ['DocumentFragment', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 11, interfaceName: 'ShadowRoot' }), ['ShadowRoot', 'DocumentFragment', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 10 }), ['DocumentType', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 2 }), ['Attr', 'Node']);
  assert.deepEqual(getTypeHierarchy({ type: 99 }), []);
  assert.deepEqual(getTypeHierarchy(null), []);
  assert.equal(describeElement(null), null);
  assert.equal(isHtmlList(null), false);
});

test('real DOM nodeType takes priority over an input element type property', () => {
  const input = { ...htmlElement('input', 'HTMLInputElement'), nodeType: 1, type: 'text' };
  assert.equal(describeElement(input).meaning, 'Eingabefeld');
  assert.deepEqual(getTypeHierarchy(input), ['HTMLInputElement', 'HTMLElement', 'Element', 'Node']);
});

test('the module does not create a global and exported group definitions are immutable', () => {
  assert.equal(Object.hasOwn(globalThis, 'DOMTypes'), false);
  assert.equal(Object.isFrozen(ELEMENT_GROUPS), true);
  assert.equal(Object.isFrozen(ELEMENT_GROUPS.form), true);
  assert.throws(() => { describeElement(htmlElement('button')).meaning = 'changed'; }, TypeError);
  const hierarchy = getTypeHierarchy({ type: 3 });
  hierarchy.push('changed');
  assert.deepEqual(getTypeHierarchy({ type: 3 }), ['Text', 'CharacterData', 'Node']);
});
