import test from "node:test";
import assert from "node:assert/strict";
import {analyzeSpecificity, compareSpecificity, extractStylesheetSelectors} from "../Erweiterung/specificity.js";
import {createSpecificityView} from "../Erweiterung/specificity-view.js";

function weights(selector) {
  const result = analyzeSpecificity(selector);
  assert.equal(result.ok, true, `${selector}: ${result.error}`);
  return result.selectors.map(entry => entry.specificity);
}

test("The three groups count selector kinds; combinators and universal selectors contribute zero", () => {
  const cases = [
    ["*", [0, 0, 0]], ["LI", [0, 0, 1]], ["ul li", [0, 0, 2]],
    ["ul ol+li", [0, 0, 3]], ["h1 + *[rel=up]", [0, 1, 1]],
    ["ul ol li.red", [0, 1, 3]], ["li.red.level", [0, 2, 1]],
    ["#x34y", [1, 0, 0]], ["#s12:not(FOO)", [1, 0, 1]],
    ["p::before", [0, 0, 2]], ["p:before", [0, 0, 2]],
    ["a[href]:hover", [0, 2, 1]], ["main > .box ~ p + span", [0, 1, 3]],
    ["input:checked:focus-visible", [0, 2, 1]], ["::marker", [0, 0, 1]]
  ];
  for (const [selector, expected] of cases) assert.deepEqual(weights(selector), [expected], selector);
});

test("Specificity compares lexicographically, without carrying hundreds of classes into IDs", () => {
  assert.equal(compareSpecificity([1, 0, 0], [0, 200, 300]), 1);
  assert.equal(compareSpecificity([0, 1, 0], [0, 0, 400]), 1);
  assert.equal(compareSpecificity([0, 0, 5], [0, 1, 0]), -1);
  assert.equal(compareSpecificity([2, 10, 0], [2, 10, 0]), 0);
  assert.deepEqual(weights(".x".repeat(100)), [[0, 100, 0]]);
});

test(":where zeroes its argument; :is, :not and :has take the maximum, never the sum", () => {
  const cases = [
    ["div:where(#x, .y) p", [0, 0, 2]],
    [":is(.one, #two, div p)", [1, 0, 0]],
    [":not(.one, #two)", [1, 0, 0]],
    ["section:has(> h2, > #featured)", [1, 0, 1]],
    [":is(.x.y.z, #id) .other", [1, 1, 0]],
    [":is(:where(#zero), :not(.a, p.b))", [0, 1, 1]],
    [":where(:is(#x)) .a", [0, 1, 0]],
    [":is()", [0, 0, 0]], [":where()", [0, 0, 0]]
  ];
  for (const [selector, expected] of cases) assert.deepEqual(weights(selector), [expected], selector);
});

test("nth-child adds its own class weight and the strongest of selector; positional values do not count", () => {
  const cases = [
    ["li:nth-child(odd)", [0, 1, 1]],
    [":nth-child(2n + 1 of #x, .a)", [1, 1, 0]],
    [":nth-last-child(-n+3 of li.important)", [0, 2, 1]],
    [":nth-child(2 of :where(#x))", [0, 1, 0]],
    [":nth-child(2n of#x)", [1, 1, 0]],
    ["p:nth-of-type(5)", [0, 1, 1]], ["p:nth-last-of-type(n-1)", [0, 1, 1]]
  ];
  for (const [selector, expected] of cases) assert.deepEqual(weights(selector), [expected], selector);
  for (const selector of [":nth-child(2n+-1)", ":nth-child(2 n)", ":nth-of-type(2 of p)", ":nth-child(2 of >p)"]) assert.equal(analyzeSpecificity(selector).ok, false, selector);
});

test("A top-level selector list keeps separate weights; commas inside quoted attributes are not branches", () => {
  assert.deepEqual(weights('p.x, #id, [data-note="#fake,.fake,:hover"]'), [[0, 1, 1], [1, 0, 0], [0, 1, 0]]);
  assert.deepEqual(weights('a[data-value="x]y(z),#id" i]'), [[0, 1, 1]]);
  assert.deepEqual(weights('[data-x="value"i]'), [[0, 1, 0]]);
  assert.deepEqual(weights('[lang|="de"]'), [[0, 1, 0]]);
});

test("Namespaced selectors and escaped identifiers count the actual token types", () => {
  const cases = [
    ["svg|a", [0, 0, 1]], ["*|*", [0, 0, 0]], ["|p", [0, 0, 1]],
    ["svg|*", [0, 0, 0]], ["[*|href]", [0, 1, 0]], ["[xml|lang]", [0, 1, 0]],
    [String.raw`#\31 23`, [1, 0, 0]], [String.raw`.a\:b`, [0, 1, 0]],
    [String.raw`.foo\,bar`, [0, 1, 0]], [String.raw`:i\73(#x,.y)`, [1, 0, 0]],
    [".übersicht#größe", [1, 1, 0]], ["div/**/.foo", [0, 1, 1]]
  ];
  for (const [selector, expected] of cases) assert.deepEqual(weights(selector), [expected], selector);
});

test("Shadow selectors have the specified extra weight; non-selector functional values do not", () => {
  const cases = [
    [":host", [0, 1, 0]], [":host(.active)", [0, 2, 0]],
    [":host-context(#root)", [1, 1, 0]], ["::slotted(span.active)", [0, 1, 2]],
    ["::slotted(:is(div span))", [0, 0, 3]],
    ["::part(button)", [0, 0, 1]], ["::highlight(search)", [0, 0, 1]],
    [":lang(de, \"en-US\")", [0, 1, 0]], [":dir(rtl)", [0, 1, 0]], [":state(open)", [0, 1, 0]]
  ];
  for (const [selector, expected] of cases) assert.deepEqual(weights(selector), [expected], selector);
});

test("Malformed or ambiguous constructs never receive a plausible numeric result", () => {
  for (const selector of ["", " ", "a,", ",p", ".", "#", "#123", "a >", "a ++ p", "a b#", "[x=]", "[]", "[x=12]", "[x=y nonsense]", "[x='abc]", ":not()", ":has(:has(p))", ":not(::before)", "div/**/span", "p {color: red}", "p !important", ":dir(up)", "::slotted(div p)", ":host(.a,.b)"]) {
    const result = analyzeSpecificity(selector);
    assert.equal(result.ok, false, selector);
    assert.equal(Object.hasOwn(result, "selectors"), false, selector);
    assert.ok(result.error.length > 5, selector);
  }
});

test("Unsupported nesting, new pseudo syntax and forgiving invalid branches are explicit", () => {
  for (const selector of ["& .card", "article > &", ":future-function(.a)", ":made-up", ":is(.valid, ???)", "a::before:hover", "a::before + p", ":nth-child(2n/**/+1)"]) {
    const result = analyzeSpecificity(selector);
    assert.equal(result.ok, false, selector);
    assert.equal(result.kind, "unsupported", selector);
  }
});

test("Size and depth limits fail safely; rendered parts preserve original selector text and totals", () => {
  assert.equal(analyzeSpecificity("a".repeat(4097)).kind, "limit");
  assert.equal(analyzeSpecificity(":is(".repeat(25) + ".x" + ")".repeat(25)).kind, "limit");
  assert.equal(analyzeSpecificity(Array(130).fill("a").join(",")).kind, "limit");
  assert.equal(analyzeSpecificity(null).ok, false);
  for (const selector of [String.raw`div  >  #\31 23 .a\:b:hover`, ':where(#x) [value="<script>"]', "p/* comment */.a"]) {
    const result = analyzeSpecificity(selector).selectors[0];
    assert.equal(result.parts.map(part => part.text).join(""), selector);
    assert.deepEqual(result.parts.reduce((total, part) => total.map((value, index) => value + part.specificity[index]), [0, 0, 0]), result.specificity);
  }
});

test("CSS extraction parses detached rules, marks nesting and never follows imported stylesheets", () => {
  let parsed;
  let reads = 0;
  class Sheet {
    replaceSync(text) { parsed = text; }
    get cssRules() {
      return [
        {selectorText: ".a", cssRules: [{selectorText: "&:hover"}, {cssRules: [{selectorText: ".implicit-child"}]}]},
        {cssRules: [{selectorText: "#media"}]},
        {get styleSheet() { reads++; throw Error("Do not follow imports"); }}
      ];
    }
  }
  const result = extractStylesheetSelectors("@import 'https://example.invalid'; .a{}", Sheet);
  assert.match(parsed, /@import/);
  assert.equal(reads, 0);
  assert.deepEqual(result.selectors, [
    {selector: ".a", nested: false}, {selector: "&:hover", nested: true},
    {selector: ".implicit-child", nested: true}, {selector: "#media", nested: false}
  ]);
  assert.match(result.note, /nicht nachgeladen/);
});

test("CSS extraction bounds input, rule count and nesting, with manual fallback", () => {
  assert.equal(extractStylesheetSelectors(null).selectors.length, 0);
  assert.equal(extractStylesheetSelectors("p{}", null).selectors.length, 0);
  class Forbidden { constructor() { throw Error("Must not construct"); } }
  assert.match(extractStylesheetSelectors("x".repeat(300001), Forbidden).note, /zu groß/);
  class Many { replaceSync() {} get cssRules() { return Array.from({length: 250}, (_, index) => ({selectorText: `.x${index}`})); } }
  assert.equal(extractStylesheetSelectors("p{}", Many).selectors.length, 200);
  assert.match(extractStylesheetSelectors("p{}", Many).note, /begrenzt/);
  class Deep { replaceSync() {} get cssRules() { let rule = {selectorText: ".deep"}; for (let i = 0; i < 30; i++) rule = {cssRules: [rule]}; return [rule]; } }
  assert.match(extractStylesheetSelectors("p{}", Deep).note, /begrenzt/);
});

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.attributes = {}; this.events = {}; this.text = ""; this.classList = {add() {}}; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(" "); }
  set innerHTML(_) { throw Error("HTML insertion is forbidden"); }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.text = ""; this.children = children; }
  addEventListener(name, handler) { this.events[name] = handler; }
}

test("Teaching view renders readable weights and safely treats hostile selector text as text", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {createElement: tag => new Element(tag)};
  try {
    const container = new Element("section");
    const view = createSpecificityView({container});
    assert.match(container.textContent, /Selektor B hat die höhere Spezifität/);
    assert.match(container.textContent, /keine addierbaren Punkte/);
    view.setSelector('[data-x="<img src=x onerror=alert(1)>"]', "a");
    assert.match(container.textContent, /<img src=x onerror=alert\(1\)>/);
    view.setSelector(":where(#x)", "b");
    assert.match(container.textContent, /Selektor A hat die höhere Spezifität/);
    view.setSelector("& .nested", "a");
    assert.match(container.textContent, /Noch kein Vergleich möglich/);
    view.setStylesheet(null);
    assert.match(container.textContent, /Wählen Sie eine gelesene CSS-Quelle/);
  } finally { globalThis.document = previousDocument; }
});
