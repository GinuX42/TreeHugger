import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {NODE_COLORS, COLLECTION_COLORS, ELEMENT_GROUP_COLORS} from "../Erweiterung/palette.js";
import {getNodeKind, NODE_LEGEND_TYPES} from "../Erweiterung/node-presentation.js";
import {ELEMENT_GROUPS, describeElement} from "../Erweiterung/semantics.js";
import {renderNodeLegend, renderElementGroupLegend} from "../Erweiterung/legend.js";
import {createTreeView} from "../Erweiterung/tree-view.js";
import {createDetailsView} from "../Erweiterung/node-details.js";
import {createSelectionView} from "../Erweiterung/selection.js";

function luminance(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  return hex.slice(1).match(/../g).map(pair => Number.parseInt(pair, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("Semantic labels stay readable on every filled badge and selected card", () => {
  for (const [family, colors] of [["Node", NODE_COLORS], ["Elementgruppe", ELEMENT_GROUP_COLORS]]) {
    const used = new Set();
    for (const [name, swatch] of Object.entries(colors)) {
      assert.ok(contrast("#FFFFFF", swatch.color) >= 4.5, `${family}/${name}: white badge text`);
      assert.ok(contrast("#173149", swatch.fill) >= 4.5, `${family}/${name}: card label`);
      assert.ok(contrast("#3D5264", swatch.fill) >= 4.5, `${family}/${name}: card details`);
      assert.equal(used.has(swatch.color.toLowerCase()), false, `${family}: repeated semantic color`);
      used.add(swatch.color.toLowerCase());
    }
  }
  assert.equal(new Set(Object.values(COLLECTION_COLORS)).size, Object.keys(COLLECTION_COLORS).length);
  for (const color of Object.values(COLLECTION_COLORS)) assert.ok(contrast("#FFFFFF", color) >= 4.5);
});

test("Node types and element meanings use the shared palette without losing their labels", () => {
  for (const type of NODE_LEGEND_TYPES) {
    const kind = getNodeKind({type});
    assert.equal(kind.color, NODE_COLORS[type].color);
    assert.equal(kind.fill, NODE_COLORS[type].fill);
    assert.ok(kind.name.length > 3);
  }
  for (const [key, group] of Object.entries(ELEMENT_GROUPS)) {
    assert.equal(group.color, ELEMENT_GROUP_COLORS[key].color);
    assert.equal(group.fill, ELEMENT_GROUP_COLORS[key].fill);
    assert.ok(group.name.length > 3);
  }
  const paragraph = describeElement({type: 1, localName: "p", namespaceURI: "http://www.w3.org/1999/xhtml"});
  assert.equal(paragraph.color, ELEMENT_GROUP_COLORS.text.color);
  assert.equal(paragraph.meaning, "Absatz");
  assert.notEqual(paragraph.color, getNodeKind({type: 3}).color, "A text-content element is not a text node");
});

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.style = {};
    this.children = [];
    this.text = "";
    this.attributes = new Map();
    this.className = "";
    this.value = "";
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(" "); }
  replaceChildren(...children) { this.children = children; this.text = ""; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener() {}
  contains(candidate) { return candidate === this || this.children.some(child => child.contains(candidate)); }
}

function descendants(element) {
  return element.children.flatMap(child => [child, ...descendants(child)]);
}

test("Tree, details, and selection preserve both color meanings and collection identities", async () => {
  const previous = globalThis.document;
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element("div"));
    return elements.get(id);
  };
  globalThis.document = {
    activeElement: null,
    createElement: name => new Element(name),
    createElementNS: (_namespace, name) => new Element(name),
    getElementById: get
  };
  try {
    const node = {id: "paragraph", type: 1, localName: "p", nodeName: "P", label: "<p>",
      namespaceURI: "http://www.w3.org/1999/xhtml", childIds: ["text"], attributes: [{name: "class", value: "example"}]};
    const textNode = {id: "text", type: 3, value: "Hallo", parentId: node.id, childIds: []};
    const state = {nodes: new Map([[node.id, node], [textNode.id, textNode]]), rootId: node.id,
      selectedId: node.id, expandedIds: new Set([node.id]), snapshot: {root: node.id},
      filters: {text: true, whitespace: false, comments: true}};
    createTreeView({onSelect() {}, onToggle() {}, onMessage() {}}).render(state);
    const treeNodes = descendants(get("tree"));
    const card = treeNodes.find(element => element.getAttribute("data-node-id") === node.id);
    const coloredRects = descendants(card).filter(element => element.tagName === "rect");
    assert.equal(coloredRects.find(element => element.getAttribute("height") === "31").getAttribute("fill"), NODE_COLORS[1].color);
    assert.equal(coloredRects.find(element => element.getAttribute("height") === "27").getAttribute("fill"), ELEMENT_GROUP_COLORS.text.color);
    assert.match(card.textContent, /Element · auch Node/);
    assert.match(card.textContent, /Textinhalt · Absatz/);
    const textCard = treeNodes.find(element => element.getAttribute("data-node-id") === textNode.id);
    assert.match(textCard.textContent, /Textknoten/);
    assert.match(textCard.textContent, /Node · kein Element/);

    createDetailsView({onSelect() {}, onHighlight() {}, onScope() {}, onRestore() {}, canHighlight: false}).render(state);
    const details = descendants(get("details"));
    assert.equal(details.find(element => element.className === "tag").style.background, NODE_COLORS[1].color);
    assert.equal(details.find(element => element.className === "category-detail").style.background, ELEMENT_GROUP_COLORS.text.color);
    assert.deepEqual(details.filter(element => element.tagName === "summary").map(element => element.style.background),
      [COLLECTION_COLORS.NodeList, COLLECTION_COLORS.HTMLCollection]);
    assert.equal(details.find(element => element.tagName === "caption").style.background, COLLECTION_COLORS.NamedNodeMap);

    get("selectionMethod").value = "querySelectorAll";
    get("selectionQuery").value = "p";
    let resultType = "NodeList";
    const selection = createSelectionView({onBusyChange() {}, showElement() {}, request: async () => ({
      resultType, method: "querySelectorAll", query: "p", total: 1, capturedAt: 0,
      items: resultType === "null" ? [] : [{...node, nodeType: 1}], live: resultType === "HTMLCollection"
    })});
    for (const type of ["Element", "NodeList", "HTMLCollection", "null"]) {
      resultType = type;
      await selection.run();
      const result = get("selectionResult");
      const tags = descendants(result).filter(element => element.className === "tag");
      assert.equal(tags[0].style.background, type === "Element" ? NODE_COLORS[1].color : COLLECTION_COLORS[type]);
      if (type === "null") {
        assert.equal(tags.length, 1);
      } else {
        assert.equal(tags[1].style.background, NODE_COLORS[1].color);
        assert.equal(descendants(result).find(element => element.className === "category-detail").style.background, ELEMENT_GROUP_COLORS.text.color);
      }
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("Legends describe only captured node types and all element groups using their actual colors", () => {
  const previous = globalThis.document;
  const nodeLegend = new Element("div");
  const groupLegend = new Element("div");
  globalThis.document = {
    createElement: name => new Element(name),
    getElementById: id => ({nodeLegend, elementGroupLegend: groupLegend})[id]
  };
  try {
    renderNodeLegend(new Map([["doc", {type: 9}], ["text", {type: 3}], ["text2", {type: 3}], ["other", {type: 42}]]));
    assert.deepEqual(nodeLegend.children.slice(1).map(chip => chip.textContent), ["Dokumentknoten", "Textknoten", "Knoten"]);
    assert.deepEqual(nodeLegend.children.slice(1).map(chip => chip.style.background), [NODE_COLORS[9].color, NODE_COLORS[3].color, getNodeKind({type: 42}).color]);
    renderElementGroupLegend();
    assert.deepEqual(groupLegend.children.map(chip => chip.textContent), Object.values(ELEMENT_GROUPS).map(group => group.name));
    assert.deepEqual(groupLegend.children.map(chip => chip.style.background), Object.values(ELEMENT_GROUPS).map(group => group.color));
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("Specificity contributions have distinct solid backgrounds and readable white text", () => {
  const css = readFileSync(new URL("../Erweiterung/specificity.css", import.meta.url), "utf8");
  const backgrounds = new Set();
  for (const kind of ["id", "class", "type", "special", "zero"]) {
    const rule = new RegExp(`\\.spec-${kind} \\{([^}]+)\\}`).exec(css)?.[1];
    assert.ok(rule, kind);
    const foreground = /color:\s*(#[\da-f]{3,6})/i.exec(rule)?.[1];
    const background = /background:\s*(#[\da-f]{6})/i.exec(rule)?.[1];
    assert.equal(foreground, "#fff");
    assert.ok(contrast("#FFFFFF", background) >= 4.5, kind);
    backgrounds.add(background.toLowerCase());
  }
  assert.equal(backgrounds.size, 5);
});
