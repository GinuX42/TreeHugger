import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {BACKEND_LIMITS, parseViewerRequest} from "../Erweiterung/backend-requests.js";
import {inspectDOM} from "../Erweiterung/capture.js";
import {highlightDOM} from "../Erweiterung/highlight.js";

const HTML = "http://www.w3.org/1999/xhtml";
const SVG = "http://www.w3.org/2000/svg";
const extensionId = "testextension";
const viewerUrl = `chrome-extension://${extensionId}/viewer.html`;
const sender = {id: extensionId, url: viewerUrl + "?tab=7", frameId: 0};
const css = {escape: value => value.replace(/[^a-zA-Z0-9_-]/g, character => "\\" + character)};

async function withGlobals(values, callback) {
  const previous = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {value, writable: true, configurable: true});
  try { return await callback(); }
  finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

function node(type, options = {}, children = []) {
  const localName = type === 1 ? (options.tag || "div") : null;
  const names = {3: "#text", 4: "#cdata-section", 7: "processing", 8: "#comment", 9: "#document", 10: "html"};
  const interfaces = {3: "Text", 4: "CDATASection", 7: "ProcessingInstruction", 8: "Comment", 9: "HTMLDocument", 10: "DocumentType"};
  const attributes = [...(options.attributes || [])];
  if (options.id !== undefined) attributes.push({name: "id", value: options.id});
  if (options.className) attributes.push({name: "class", value: options.className});
  const value = {
    nodeType: type,
    nodeName: type === 1 ? localName.toUpperCase() : names[type],
    name: options.name || "html",
    localName,
    namespaceURI: type === 1 ? (options.namespace || HTML) : null,
    attributes,
    nodeValue: options.value || "",
    childNodes: children,
    parentNode: null,
    [Symbol.toStringTag]: options.interfaceName || (type === 1 ? "HTMLElement" : interfaces[type])
  };
  Object.defineProperties(value, {
    id: {get: () => attributes.find(attribute => attribute.name === "id")?.value || ""},
    children: {get: () => children.filter(child => child.nodeType === 1)},
    parentElement: {get: () => value.parentNode?.nodeType === 1 ? value.parentNode : null},
    previousElementSibling: {get() {
      const siblings = value.parentNode?.children || [];
      return siblings[siblings.indexOf(value) - 1] || null;
    }}
  });
  for (const child of children) child.parentNode = value;
  return value;
}

function createDocument(children, title = "DOM-Prüfung") {
  const document = node(9, {}, [node(10), node(1, {tag: "html"}, [node(1, {tag: "body"}, children)])]);
  document.title = title;
  document.documentElement = document.children[0];
  const elements = () => {
    const result = [];
    function visit(current) {
      if (current.nodeType === 1) result.push(current);
      current.childNodes.forEach(visit);
    }
    visit(document);
    return result;
  };
  document.querySelectorAll = query => {
    if (!query || query === "[") throw new Error("SyntaxError");
    const [first, ...steps] = query.split(" > ");
    let matches;
    if (first === ":root") matches = [document.documentElement];
    else if (first.startsWith("#")) matches = elements().filter(element => element.id === first.slice(1).replace(/\\(.)/g, "$1"));
    else if (first.startsWith(".")) matches = document.getElementsByClassName(first.slice(1));
    else matches = elements().filter(element => first === "*" || element.localName === first);
    for (const step of steps) {
      const position = /^\*:nth-child\((\d+)\)$/.exec(step);
      if (!position) throw new Error("Nicht unterstützter Testselektor: " + step);
      matches = matches.map(element => element.children[Number(position[1]) - 1]).filter(Boolean);
    }
    return matches;
  };
  document.querySelector = query => document.querySelectorAll(query)[0] || null;
  document.getElementById = id => elements().find(element => element.id === id) || null;
  document.getElementsByClassName = query => {
    const classes = query.trim().split(/\s+/).filter(Boolean);
    if (!classes.length) return [];
    return elements().filter(element => {
      const actual = (element.attributes.find(attribute => attribute.name === "class")?.value || "").split(/\s+/);
      return classes.every(name => actual.includes(name));
    });
  };
  document.getElementsByTagName = tag => elements().filter(element => tag === "*" || element.localName === tag);
  return document;
}

async function inDocument(document, callback, url = "https://example.test/") {
  return withGlobals({document, CSS: css, location: {href: url}}, callback);
}

function capture(limits = BACKEND_LIMITS, selector = "") {
  return inspectDOM({type: "capture", selector}, limits);
}

function selection(method, query, limits = BACKEND_LIMITS) {
  return inspectDOM({type: "inspectSelection", method, query}, limits);
}

test("Anfragen: eigener Viewer, passender Tab, erlaubte Typen und Feldgrenzen", () => {
  const valid = {type: "capture", tabId: 7, selector: " main ", ignored: "evil"};
  assert.deepEqual(parseViewerRequest(valid, sender, extensionId, viewerUrl).request, {type: "capture", tabId: 7, selector: "main"});
  for (const foreign of [
    {...sender, id: "foreign"}, {...sender, url: "https://example.test/viewer.html?tab=7"},
    {...sender, url: viewerUrl.replace("viewer.html", "hilfe.html") + "?tab=7"},
    {...sender, url: viewerUrl + "/fake?tab=7"}, {...sender, url: viewerUrl + "?tab=7#fake"},
    {...sender, frameId: 1}
  ]) assert.equal(parseViewerRequest(valid, foreign, extensionId, viewerUrl).authorized, false);
  for (const query of ["tab=8", "tab=07", "tab=", "tab=7&tab=7", "tab=7&extra=1"]) {
    assert.equal(parseViewerRequest(valid, {...sender, url: viewerUrl + "?" + query}, extensionId, viewerUrl).ok, false);
  }
  for (const invalid of [
    {...valid, tabId: -1}, {...valid, tabId: "7"}, {...valid, type: "eval"},
    {...valid, selector: {}}, {...valid, selector: "x".repeat(4097)},
    {type: "inspectSelection", tabId: 7, method: "constructor", query: "x"},
    {type: "inspectSelection", tabId: 7, method: "querySelector", query: null},
    {type: "inspectSelection", tabId: 7, method: "querySelector", query: "p", contextSelector: "main"}
  ]) assert.equal(parseViewerRequest(invalid, sender, extensionId, viewerUrl).ok, false);
  const spaces = parseViewerRequest({type: "inspectSelection", tabId: 7, method: "getElementById", query: " id "}, sender, extensionId, viewerUrl);
  assert.equal(spaces.request.query, " id ");
});

test("Capture: Interfaces, echte Kinderzahlen, Attribute sowie CDATA und PI", async () => {
  const paragraph = node(1, {tag: "p", id: "inhalt", interfaceName: "HTMLParagraphElement"}, [
    node(3, {value: "Grüße"}), node(4, {value: "a < b"}), node(7, {value: "mode=test"}), node(8, {value: "Kommentar"})
  ]);
  const script = node(1, {tag: "script"}, [node(3, {value: "privateCode()"})]);
  const customScript = node(1, {tag: "script", namespace: "urn:lesson"}, [node(3, {value: "XML-Inhalt"})]);
  await inDocument(createDocument([paragraph, script, customScript]), () => {
    const result = capture();
    assert(result.ok);
    const record = result.data.nodes.find(entry => entry.selector === "#inhalt");
    assert.equal(record.interfaceName, "HTMLParagraphElement");
    assert.equal(record.childNodesCount, 4);
    assert.equal(record.elementChildrenCount, 0);
    assert.equal(record.attributesCount, 1);
    assert.equal(record.localName, "p");
    assert.equal(record.namespaceURI, HTML);
    assert(result.data.nodes.some(entry => entry.type === 4 && entry.value === "a < b"));
    assert(result.data.nodes.some(entry => entry.type === 7 && entry.value === "mode=test"));
    assert(!result.data.nodes.some(entry => entry.value === "privateCode()"));
    assert(result.data.nodes.some(entry => entry.value === "XML-Inhalt"));
    assert.equal(new Date(result.data.capturedAt).toISOString(), result.data.capturedAt);
  });
});

test("Capture und Abfragen benutzen dieselben eindeutigen Selektoren bei doppelten IDs und gemischten Namensräumen", async () => {
  const first = node(1, {tag: "a", id: "doppelt", namespace: HTML});
  const second = node(1, {tag: "a", id: "doppelt", namespace: SVG, interfaceName: "SVGAElement"});
  const document = createDocument([node(1, {id: "gruppe"}, [first, second])]);
  await inDocument(document, () => {
    const captured = capture().data.nodes.filter(entry => entry.localName === "a");
    const inspected = selection("querySelectorAll", "a").data.items;
    assert.notEqual(captured[0].selector, captured[1].selector);
    assert.deepEqual(captured.map(entry => entry.selector), inspected.map(entry => entry.selector));
    assert.equal(document.querySelector(captured[0].selector), first);
    assert.equal(document.querySelector(captured[1].selector), second);
    assert.equal(inspected[1].interfaceName, "SVGAElement");
  });
});

test("Alle fünf Abfragemethoden: Element/null, statische NodeList, lebende HTMLCollection und 200-Treffer-Grenze", async () => {
  const elements = Array.from({length: 201}, (_, index) => node(1, {tag: "p", id: "p" + index, className: "karte", interfaceName: "HTMLParagraphElement"}));
  await inDocument(createDocument(elements), () => {
    for (const [method, query, resultType, live, total] of [
      ["querySelector", "p", "Element", null, 1],
      ["querySelectorAll", "p", "NodeList", false, 201],
      ["getElementById", "p0", "Element", null, 1],
      ["getElementsByClassName", "karte", "HTMLCollection", true, 201],
      ["getElementsByTagName", "p", "HTMLCollection", true, 201]
    ]) {
      const result = selection(method, query);
      assert(result.ok);
      assert.equal(result.data.resultType, resultType);
      assert.equal(result.data.live, live);
      assert.equal(result.data.total, total);
      assert.equal(result.data.items.length, Math.min(total, 200));
      assert.equal(result.data.truncated, total > 200);
    }
    assert.equal(selection("getElementById", "missing").data.resultType, "null");
    assert.equal(selection("querySelectorAll", "missing").data.total, 0);
    assert.equal(selection("querySelectorAll", "[").ok, false);
    assert.equal(capture(BACKEND_LIMITS, "[").ok, false);
    assert.equal(capture(BACKEND_LIMITS, "#missing").ok, false);
  });
});

test("Datengrenzen: Attribute, Namen, Titel, URL, Texte und tatsächlich serialisierte Gesamtgröße", async () => {
  const attributes = Array.from({length: 80}, (_, index) => ({name: "data-" + index + "x".repeat(150), value: "ä".repeat(600)}));
  const elements = Array.from({length: 180}, () => node(1, {tag: "p", attributes}, [node(3, {value: "z".repeat(2400)})]));
  const document = createDocument(elements, "T".repeat(2000));
  await inDocument(document, () => {
    const result = capture();
    assert(result.ok);
    assert(result.data.truncated);
    assert(Buffer.byteLength(JSON.stringify(result), "utf8") <= BACKEND_LIMITS.maxPayloadBytes);
    assert(result.data.title.length <= 300);
    assert(result.data.url.length <= 2000);
    const record = result.data.nodes.find(entry => entry.localName === "p");
    assert.equal(record.attributesCount, 80);
    assert.equal(record.attributes.length, 32);
    assert(record.attributes.every(attribute => attribute.name.length <= 120 && attribute.value.length <= 300));
    assert(result.data.nodes.every(entry => entry.value.length <= 1200));
    assert(result.data.notes.some(note => note.includes("Datengrenze")));
  }, "https://example.test/" + "x".repeat(4000));
});

test("Knoten-, Tiefen- und Selektorgrenzen bleiben sichtbar und liefern keine gekürzten, falschen Selektoren", async () => {
  let deep = node(1, {tag: "p", id: "ziel"}, [node(3, {value: " ".repeat(2000)})]);
  for (let index = 0; index < 90; index++) deep = node(1, {}, [deep]);
  await inDocument(createDocument([deep]), () => {
    assert(capture().data.truncated);
    assert(capture().data.notes.some(note => note.includes("Ebene 80")));
  });
  const longId = node(1, {tag: "p", id: "x".repeat(10000)}, [node(3, {value: " ".repeat(2000)})]);
  const document = createDocument([longId, ...Array.from({length: 30}, () => node(1))]);
  await inDocument(document, () => {
    const result = capture({...BACKEND_LIMITS, maxNodes: 8});
    assert(result.data.truncated);
    assert.equal(result.data.nodes.length, 8);
    assert(result.data.nodes.some(entry => entry.type === 3 && entry.isWhitespace && /^\s*$/.test(entry.value)));
    const item = selection("querySelector", "p").data.items[0];
    assert(item.selector.length <= BACKEND_LIMITS.maxSelectorLength);
    assert.equal(document.querySelector(item.selector), longId);
    const limited = selection("querySelector", "p", {...BACKEND_LIMITS, maxSelectorDepth: 1});
    assert.equal(limited.data.items[0].selector, "");
    assert(limited.data.notes.length > 0);
  });
});

test("Serialisierte Injektionsfunktionen funktionieren ohne Modul-Closures; das Bytebudget umfasst breite childIds-Listen", () => {
  const document = createDocument(Array.from({length: 1200}, () => node(1, {tag: "p"})));
  const isolated = vm.createContext({document, CSS: css, location: {href: "https://example.test/"}, TextEncoder});
  const injected = vm.runInContext("(" + inspectDOM.toString() + ")", isolated);
  const limits = {...BACKEND_LIMITS, maxPayloadBytes: 200000};
  const response = injected({type: "capture", selector: ""}, limits);
  assert(response.ok);
  assert(response.data.truncated);
  assert(Buffer.byteLength(JSON.stringify(response), "utf8") <= limits.maxPayloadBytes);
  const records = new Map(response.data.nodes.map(record => [record.id, record]));
  assert(response.data.nodes.some(record => record.childIds.length > 100));
  for (const record of records.values()) {
    for (const childId of record.childIds) {
      assert(records.has(childId));
      assert.equal(records.get(childId).parentId, record.id);
    }
  }
  const result = injected({type: "inspectSelection", method: "querySelectorAll", query: "p"}, BACKEND_LIMITS);
  assert(result.ok);
  assert.equal(result.data.total, 1200);
  assert.equal(result.data.items.length, 200);
  const hidden = {localName: "p", isConnected: true, scrollIntoView() {}, getBoundingClientRect: () => ({width: 0, height: 0})};
  const highlightContext = vm.createContext({
    document: {querySelector: () => hidden},
    window: {getComputedStyle: () => ({display: "none", visibility: "visible"})}
  });
  const injectedHighlight = vm.runInContext("(" + highlightDOM.toString() + ")", highlightContext);
  assert.equal(injectedHighlight("p").ok, false);
});

test("Markierung: eigene Scrollaktion, Resize, Eigentum, wiederholtes Aufräumen und versteckte Ziele", async () => {
  const key = Symbol.for("dom-baum-unterricht-overlay");
  const listeners = new Map();
  const timers = new Map();
  let sequence = 0;
  let bounds = {left: 2, top: 3, width: 100, height: 30};
  let style = {display: "block", visibility: "visible"};
  const target = {localName: "p", isConnected: true, scrollIntoView() {}, getBoundingClientRect: () => bounds};
  const eventKey = (name, options) => name + ":" + (typeof options === "boolean" ? options : !!options?.capture);
  const window = {
    getComputedStyle: () => style,
    addEventListener(name, handler, options) {
      const id = eventKey(name, options);
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id).add(handler);
    },
    removeEventListener(name, handler, options) { listeners.get(eventKey(name, options))?.delete(handler); }
  };
  const document = {
    querySelector: () => target,
    querySelectorAll() { throw new Error("Fremde Overlays dürfen nicht gesucht werden"); },
    createElement() {
      return {
        style: {}, removes: 0, setAttribute() {},
        attachShadow() { return {append: (...children) => { this.shadowChildren = children; }}; },
        remove() { this.removes++; }
      };
    },
    documentElement: {append() {}}
  };
  const dispatch = name => {
    for (const [id, handlers] of listeners) if (id.startsWith(name + ":")) for (const handler of [...handlers]) handler();
  };
  const listenerCount = () => [...listeners.values()].reduce((total, handlers) => total + handlers.size, 0);
  await withGlobals({document, window, setTimeout: (callback, delay) => {
    assert.equal(delay, 2500);
    timers.set(++sequence, callback);
    return sequence;
  }, clearTimeout: id => timers.delete(id)}, () => {
    assert(highlightDOM("#target").ok);
    const first = globalThis[key];
    const oldTimer = timers.get(1);
    dispatch("scroll");
    assert.equal(first.host.removes, 0);
    bounds = {left: 15, top: 25, width: 150, height: 45};
    dispatch("resize");
    assert.equal(first.host.shadowChildren[0].style.left, "15px");
    assert.equal(first.host.shadowChildren[0].style.height, "45px");
    assert(highlightDOM("#target").ok);
    const second = globalThis[key];
    assert.equal(first.host.removes, 1);
    oldTimer();
    assert.equal(globalThis[key], second);
    assert.equal(first.host.removes, 1);
    target.isConnected = false;
    dispatch("scroll");
    second.cleanup();
    assert.equal(second.host.removes, 1);
    assert.equal(listenerCount(), 0);
    assert.equal(timers.size, 0);
    assert.equal(globalThis[key], undefined);
    target.isConnected = true;
    style = {display: "block", visibility: "hidden"};
    assert.equal(highlightDOM("#target").ok, false);
  });
  delete globalThis[key];
});

test("Service Worker: Frame 0/ISOLATED, geprüfter Absender, Datei-Freigabe, geschlossener und geschützter Tab", async () => {
  let messageHandler;
  let actionHandler;
  let sourceUrl = "https://example.test/";
  let fileAllowed = false;
  let closed = false;
  const injections = [];
  const opened = [];
  const document = createDocument([node(1, {tag: "p", id: "text"})]);
  const chrome = {
    runtime: {id: extensionId, getURL: path => `chrome-extension://${extensionId}/` + path, onMessage: {addListener: handler => { messageHandler = handler; }}},
    action: {onClicked: {addListener: handler => { actionHandler = handler; }}},
    tabs: {
      get: async () => { if (closed) throw new Error("closed"); return {url: sourceUrl}; },
      create: async options => opened.push(options), update: async () => {}
    },
    extension: {isAllowedFileSchemeAccess: callback => callback(fileAllowed)},
    scripting: {executeScript: async options => {
      injections.push(options);
      assert.deepEqual(options.target.frameIds, [0]);
      assert.equal(options.world, "ISOLATED");
      const isolated = vm.createContext({document, CSS: css, location: {href: sourceUrl}, TextEncoder});
      const injected = vm.runInContext("(" + options.func.toString() + ")", isolated);
      return [{frameId: 0, result: injected(...options.args)}];
    }}
  };
  await withGlobals({chrome, document, CSS: css, location: {href: sourceUrl}}, async () => {
    await import("../Erweiterung/background.js");
    const send = message => new Promise(resolve => messageHandler(message, sender, resolve));
    actionHandler({id: 7});
    assert.equal(opened[0].url, viewerUrl + "?tab=7");
    assert((await send({type: "capture", tabId: 7})).ok);
    assert((await send({type: "inspectSelection", tabId: 7, method: "querySelectorAll", query: "p"})).ok);
    const count = injections.length;
    assert.equal((await send({type: "capture", tabId: 8})).ok, false);
    assert.equal(injections.length, count);
    assert.equal(messageHandler({type: "capture", tabId: 7}, {...sender, url: "https://evil.test/"}, () => assert.fail("Fremder Absender")), false);
    sourceUrl = "file:///test.html";
    assert.match((await send({type: "capture", tabId: 7})).error, /Datei-URLs/);
    fileAllowed = true;
    assert((await send({type: "capture", tabId: 7})).ok);
    sourceUrl = "chrome://extensions";
    assert.match((await send({type: "capture", tabId: 7})).error, /schützt/);
    closed = true;
    assert.match((await send({type: "capture", tabId: 7})).error, /geschlossen/);
  });
});
