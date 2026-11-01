import assert from "node:assert/strict";
import {test} from "node:test";
import {createTreeLayout, getInitiallyExpandedIds} from "../Erweiterung/tree-layout.js";
import {getVisibleChildren, isWhitespaceNode} from "../Erweiterung/node-presentation.js";
import {createExampleSnapshot} from "../Erweiterung/example-data.js";
import {getExportFilename} from "../Erweiterung/tree-view.js";
import {getSourceTabId} from "../Erweiterung/source-client.js";

const allFilters = {text: true, whitespace: true, comments: true};

test("child filters do not change the underlying captured collection", () => {
  const snapshot = createExampleSnapshot();
  const nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const section = nodes.get("s");
  assert.equal(section.childNodesCount, 3);
  assert.deepEqual(getVisibleChildren(section, nodes, {text: false, whitespace: false, comments: false}).map(node => node.id), ["p"]);
  assert.deepEqual(getVisibleChildren(section, nodes, allFilters).map(node => node.id), ["p", "c", "w"]);
  assert.equal(section.childNodesCount, 3);
  assert.equal(isWhitespaceNode(nodes.get("w")), true);
});

test("layout has one link for each visible child and finite positions", () => {
  const snapshot = createExampleSnapshot();
  const nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const expandedIds = new Set(nodes.keys());
  const layout = createTreeLayout({rootId: snapshot.root, nodes, expandedIds, filters: allFilters});
  assert.equal(layout.positions.size, nodes.size);
  assert.equal(layout.links.length, nodes.size - 1);
  assert.equal(layout.limited, false);
  for (const {x, y} of layout.positions.values()) assert.ok(Number.isFinite(x) && Number.isFinite(y));
  for (const {parentId, childId} of layout.links) {
    assert.ok(layout.positions.get(parentId).x < layout.positions.get(childId).x);
  }
});

test("large sibling sets stop at 600 cards and preserve valid links", () => {
  const nodes = new Map([["root", {id: "root", type: 9, childIds: []}]]);
  for (let index = 0; index < 2000; index++) {
    const id = "child" + index;
    nodes.set(id, {id, type: 1, childIds: []});
    nodes.get("root").childIds.push(id);
  }
  const layout = createTreeLayout({rootId: "root", nodes, expandedIds: new Set(["root"]), filters: allFilters});
  assert.equal(layout.positions.size, 600);
  assert.equal(layout.links.length, 599);
  assert.equal(layout.limited, true);
  assert.ok(layout.positions.has("root"));
});

test("collapsed branches and subtree roots remain self-contained", () => {
  const snapshot = createExampleSnapshot();
  const nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const expandedIds = getInitiallyExpandedIds("s", nodes, allFilters, 1);
  const layout = createTreeLayout({rootId: "s", nodes, expandedIds, filters: allFilters});
  assert.deepEqual(new Set(layout.positions.keys()), new Set(["s", "p", "c", "w"]));
  assert.ok(!layout.positions.has("m"));
  assert.ok(!layout.positions.has("t"));
});

test("source tab identifiers reject ambiguous or unsafe numeric strings", () => {
  for (const search of ["", "?tab=", "?tab=-1", "?tab=01", "?tab=1.2", "?tab=1e3", "?tab=Infinity", "?tab=9007199254740992"]) {
    assert.equal(getSourceTabId(search), null, search);
  }
  assert.equal(getSourceTabId("?tab=123"), 123);
  assert.equal(getSourceTabId("?tab=0"), 0);
});

test("export filenames use the user's date format", () => {
  assert.equal(getExportFilename(new Date(2026, 9, 30)), "26_10_30_DOM_Baum.svg");
  assert.equal(getExportFilename(new Date(2027, 0, 2)), "27_01_02_DOM_Baum.svg");
});
