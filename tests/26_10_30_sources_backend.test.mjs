import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import {readPageSources} from "../Erweiterung/page-sources.js";
import {SOURCE_LIMITS, parseViewerRequest} from "../Erweiterung/backend-requests.js";

const HTML = "http://www.w3.org/1999/xhtml";
const encoder = new TextEncoder();

function text(value) {
  return {nodeType: 3, nodeName: "#text", nodeValue: value, childNodes: []};
}

function element(tag, attributes = {}, children = []) {
  const node = {
    nodeType: 1, nodeName: tag.toUpperCase(), localName: tag, namespaceURI: HTML,
    attributes: Object.entries(attributes).map(([name, value]) => ({name, value})), childNodes: children,
    getAttribute(name) { return this.attributes.find(attribute => attribute.name === name)?.value ?? null; },
    contains(candidate) { return candidate === this || this.childNodes.some(child => child.contains?.(candidate)); }
  };
  return node;
}

function createDocument(children) {
  const body = element("body", {}, children);
  const root = element("html", {lang: "de"}, [body]);
  const document = {
    nodeType: 9, nodeName: "#document", title: "Quellcode-Test", baseURI: "https://example.test/unterricht/",
    childNodes: [{nodeType: 10, name: "html", publicId: "", systemId: "", childNodes: []}, root],
    getElementsByTagName(tag) {
      const result = [];
      function visit(node) {
        if (node.nodeType === 1 && (tag === "*" || node.localName === tag)) result.push(node);
        for (const child of node.childNodes ?? []) visit(child);
      }
      visit(this);
      return result;
    }
  };
  return document;
}

async function withGlobals(values, callback) {
  const previous = new Map(Reflect.ownKeys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of Reflect.ownKeys(values)) Object.defineProperty(globalThis, key, {value: values[key], configurable: true, writable: true});
  try { return await callback(); }
  finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

async function inDocument(document, callback, extra = {}) {
  return withGlobals({document, location: {href: "https://example.test/unterricht/index.html"}, ...extra}, callback);
}

function readSources(limits = SOURCE_LIMITS) {
  return readPageSources({type: "readSources"}, limits);
}

function readFile(resourceId, expectedUrl, limits = SOURCE_LIMITS) {
  return readPageSources({type: "readSourceFile", resourceId, expectedUrl}, limits);
}

function streamedResponse(chunks, {contentType = "text/javascript; charset=utf-8", status = 200} = {}) {
  const metrics = {reads: 0, cancelled: false, released: false};
  const queue = chunks.map(chunk => typeof chunk === "string" ? encoder.encode(chunk) : chunk);
  const response = {
    ok: status >= 200 && status < 300, status,
    headers: {get: name => name === "content-type" ? contentType : null},
    body: {
      cancel: async () => { metrics.cancelled = true; },
      getReader() {
        return {
          async read() { metrics.reads++; return queue.length ? {value: queue.shift(), done: false} : {done: true}; },
          async cancel() { metrics.cancelled = true; },
          releaseLock() { metrics.released = true; }
        };
      }
    }
  };
  return {response, metrics};
}

test("source requests retain the viewer/tab boundary and reject arbitrary resource identifiers", () => {
  const extensionId = "testextension";
  const viewerUrl = `chrome-extension://${extensionId}/viewer.html`;
  const sender = {id: extensionId, url: viewerUrl + "?tab=7", frameId: 0};
  const parse = message => parseViewerRequest(message, sender, extensionId, viewerUrl);
  assert.deepEqual(parse({type: "readSources", tabId: 7, url: "https://evil.test"}).request, {type: "readSources", tabId: 7});
  assert.deepEqual(parse({type: "readSourceFile", tabId: 7, resourceId: "script:0", expectedUrl: "https://example.test/a.js", url: "https://evil.test"}).request,
    {type: "readSourceFile", tabId: 7, resourceId: "script:0", expectedUrl: "https://example.test/a.js"});
  for (const change of [
    {resourceId: "https://evil.test"}, {resourceId: "script:-1"}, {resourceId: "style:0"},
    {resourceId: "script:100000"}, {expectedUrl: ""}, {expectedUrl: null},
    {expectedUrl: "x".repeat(4097)}, {tabId: 8}
  ]) assert.equal(parse({type: "readSourceFile", tabId: 7, resourceId: "script:0", expectedUrl: "https://example.test/a.js", ...change}).ok, false);
  assert.equal(parseViewerRequest({type: "readSources", tabId: 7}, {...sender, url: "https://evil.test/"}, extensionId, viewerUrl).authorized, false);
});

test("the inventory captures current HTML, inline code and attribute sources without any fetch", async () => {
  const hostile = '<img src=x onerror="bad()">';
  const template = element("template");
  template.content = {nodeType: 11, childNodes: [element("p", {}, [text("Vorlage")])]};
  const overlay = element("div", {"data-overlay": "our-only-overlay"});
  const document = createDocument([
    element("p", {id: "gruss", title: 'A " & < B', style: "color: teal;"}, [text("Grüße < DOM")]),
    element("button", {onclick: 'this.textContent = "Los";'}, [text("Start")]),
    element("style", {}, [text(".karte { color: teal; }")]),
    element("script", {}, [text('const markup = ' + JSON.stringify(hostile) + ";")]),
    element("script", {type: "application/ld+json"}, [text('{"name":"Kurs"}')]),
    element("link", {rel: "stylesheet", href: "../base.css"}),
    element("script", {src: "app.js"}), template, overlay
  ]);
  let fetches = 0;
  await inDocument(document, async () => {
    const response = await readSources();
    assert.equal(response.ok, true);
    const resources = response.data.resources;
    const html = resources.find(resource => resource.language === "html");
    assert.equal(html.origin, "dom");
    assert.match(html.note, /nicht der ursprüngliche HTML-Text/);
    assert.match(html.content, /^<!DOCTYPE html>/);
    assert.match(html.content, /title="A &quot; &amp; &lt; B"/);
    assert.match(html.content, /Grüße &lt; DOM/);
    assert.match(html.content, /<template><p>Vorlage<\/p><\/template>/);
    assert.ok(!html.content.includes("our-only-overlay"));
    assert.match(resources.find(resource => resource.id === "script:0").content, /const markup/);
    assert.match(resources.find(resource => resource.id === "script:1").note, /Datenblock/);
    assert.equal(resources.find(resource => resource.id === "script:2").url, "https://example.test/unterricht/app.js");
    assert.equal(resources.find(resource => resource.id === "link:0").url, "https://example.test/base.css");
    assert.match(resources.find(resource => resource.id === "attributes:style").content, /color: teal;/);
    assert.match(resources.find(resource => resource.id === "attributes:events").content, /this.textContent/);
    assert.equal(fetches, 0);
  }, {fetch: () => { fetches++; throw new Error("The inventory must not fetch"); }, [Symbol.for("dom-baum-unterricht-overlay")]: {host: overlay}});
});

test("HTML, inline text, resource count and complete serialized response obey independent limits", async () => {
  const scripts = Array.from({length: 100}, () => element("script", {}, [text("\u0001".repeat(60000) + "ä😀".repeat(90000))]));
  await inDocument(createDocument(scripts), async () => {
    const response = await readSources();
    assert.equal(response.ok, true);
    assert.ok(Buffer.byteLength(JSON.stringify(response), "utf8") <= SOURCE_LIMITS.maxPayloadBytes);
    assert.ok(response.data.resources.length <= SOURCE_LIMITS.maxResources);
    const html = response.data.resources[0];
    assert.ok(Buffer.byteLength(html.content, "utf8") <= SOURCE_LIMITS.maxDomBytes);
    assert.equal(html.truncated, true);
    for (const resource of response.data.resources.filter(resource => resource.origin === "inline")) {
      assert.ok(Buffer.byteLength(resource.content, "utf8") <= SOURCE_LIMITS.maxInlineBytes);
      assert.ok(!/[\uD800-\uDBFF]$/.test(resource.content));
    }
    assert.ok(response.data.notes.some(note => /Gesamtgrenze/.test(note)));
  });
});

test("the inventory stops reading inline resources once its output capacity is exhausted", async () => {
  let unnecessaryReads = 0;
  const laterText = text("later");
  Object.defineProperty(laterText, "nodeValue", {get() { unnecessaryReads++; return "later"; }});
  const document = createDocument([
    element("script", {}, [text("const first = 1;")]),
    element("script", {}, [laterText])
  ]);
  await inDocument(document, async () => {
    const result = await readSources({...SOURCE_LIMITS, maxDomBytes: 0, maxResources: 2});
    assert.equal(result.ok, true);
    assert.equal(result.data.resources.length, 2);
    assert.equal(unnecessaryReads, 0);
    assert.match(result.data.notes.join(" "), /Suche nach weiteren Einträgen wurde beendet/);
  });
});

test("changed links, unexpected schemes and credentials cannot trigger requests", async () => {
  const script = element("script", {src: "new.js"});
  let calls = 0;
  const document = createDocument([script]);
  await inDocument(document, async () => {
    assert.equal((await readFile("script:0", "https://example.test/unterricht/old.js")).ok, false);
    assert.equal((await readFile("script:9", "https://example.test/unterricht/new.js")).ok, false);
    for (const url of ["javascript:alert(1)", "data:text/javascript,alert(1)", "blob:https://example.test/id", "https://user:secret@example.test/a.js"]) {
      script.attributes[0].value = url;
      const response = await readFile("script:0", url);
      assert.equal(response.ok, true);
      assert.equal(response.data.status, "unavailable");
    }
    script.attributes[0].value = "https://example.test/" + "x".repeat(5000);
    const inventory = await readSources();
    assert.ok(!inventory.data.resources.some(resource => resource.id === "script:0"));
    assert.match(inventory.data.notes.join(" "), /überlange Dateiadresse/);
    assert.equal(calls, 0);
  }, {fetch: async () => { calls++; throw new Error("must not run"); }});
});

test("one requested file uses CORS, same-origin credentials, no referrer and no redirects", async () => {
  const {response, metrics} = streamedResponse(['const grüße = "Hal', 'lo";']);
  const calls = [];
  await inDocument(createDocument([element("script", {src: "app.js"})]), async () => {
    const result = await readFile("script:0", "https://example.test/unterricht/app.js");
    assert.equal(result.ok, true);
    assert.equal(result.data.status, "ready");
    assert.equal(result.data.content, 'const grüße = "Hallo";');
    assert.equal(result.data.truncated, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://example.test/unterricht/app.js");
    for (const [name, expected] of Object.entries({method: "GET", mode: "cors", credentials: "same-origin", redirect: "error", referrerPolicy: "no-referrer"})) {
      assert.equal(calls[0].options[name], expected);
    }
    assert.equal(metrics.released, true);
  }, {fetch: async (url, options) => { calls.push({url, options}); return response; }});
});

test("streaming truncates large files and leaves incomplete UTF-8 characters out", async () => {
  const {response, metrics} = streamedResponse([encoder.encode("ä".repeat(300000))]);
  await inDocument(createDocument([element("script", {src: "large.js"})]), async () => {
    const result = await readFile("script:0", "https://example.test/unterricht/large.js", {...SOURCE_LIMITS, maxFileBytes: 499999});
    assert.equal(result.data.truncated, true);
    assert.equal(result.data.content.includes("�"), false);
    assert.ok(Buffer.byteLength(result.data.content, "utf8") <= 499999);
    assert.equal(metrics.cancelled, true);
    assert.equal(metrics.released, true);
  }, {fetch: async () => response});
});

test("local CSS may use labelled CSSOM; local JavaScript never initiates a fetch", async () => {
  const link = element("link", {rel: "stylesheet", href: "file:///C:/lesson/site.css"});
  link.sheet = {cssRules: [{cssText: "p { color: teal; }"}]};
  const script = element("script", {src: "file:///C:/lesson/app.js"});
  let calls = 0;
  await inDocument(createDocument([link, script]), async () => {
    const css = await readFile("link:0", "file:///C:/lesson/site.css");
    assert.equal(css.data.origin, "cssom");
    assert.equal(css.data.status, "ready");
    assert.match(css.data.note, /Originalformatierung und Kommentare fehlen/);
    assert.match(css.data.content, /color: teal/);
    const js = await readFile("script:0", "file:///C:/lesson/app.js");
    assert.equal(js.data.status, "unavailable");
    assert.equal(js.data.content, null);
    assert.equal(calls, 0);
  }, {fetch: async () => { calls++; throw new Error("must not run"); }});
});

test("CORS/HTTP/type errors are explained and CSSOM fallback is never presented as original source", async () => {
  const link = element("link", {rel: "stylesheet", href: "https://cdn.test/site.css"});
  link.sheet = {cssRules: [{cssText: "body { margin: 0px; }"}]};
  const script = element("script", {src: "https://cdn.test/app.js"});
  await inDocument(createDocument([link, script]), async () => {
    const css = await readFile("link:0", "https://cdn.test/site.css");
    assert.equal(css.data.origin, "cssom");
    assert.match(css.data.note, /CORS-Regeln/);
    const js = await readFile("script:0", "https://cdn.test/app.js");
    assert.equal(js.data.status, "unavailable");
  }, {fetch: async () => { throw new TypeError("Failed to fetch"); }});
  for (const options of [{status: 404}, {contentType: "text/html"}]) {
    const {response, metrics} = streamedResponse(["not script"], options);
    await inDocument(createDocument([script]), async () => {
      const result = await readFile("script:0", "https://cdn.test/app.js");
      assert.equal(result.data.status, "unavailable");
      assert.equal(result.data.content, null);
      assert.equal(metrics.cancelled, true);
      assert.equal(metrics.reads, 0);
    }, {fetch: async () => response});
  }
});

test("CSSOM fallback never substitutes rules from a link changed during the file request", async () => {
  const link = element("link", {rel: "stylesheet", href: "https://cdn.test/old.css"});
  link.sheet = {cssRules: [{cssText: "body { color: teal; }"}]};
  await inDocument(createDocument([link]), async () => {
    const result = await readFile("link:0", "https://cdn.test/old.css");
    assert.equal(result.data.status, "unavailable");
    assert.equal(result.data.origin, "external");
    assert.equal(result.data.content, null);
  }, {fetch: async () => {
    link.attributes.find(attribute => attribute.name === "href").value = "https://cdn.test/new.css";
    throw new TypeError("Failed to fetch");
  }});
});

test("the fetch deadline aborts the request and returns a usable failure result", async () => {
  let cleared = false;
  await inDocument(createDocument([element("script", {src: "slow.js"})]), async () => {
    const result = await readFile("script:0", "https://example.test/unterricht/slow.js");
    assert.equal(result.data.status, "unavailable");
    assert.match(result.data.note, /zu lange gedauert/);
    assert.equal(cleared, true);
  }, {
    setTimeout(callback, duration) { assert.equal(duration, 8000); queueMicrotask(callback); return 1; },
    clearTimeout() { cleared = true; },
    fetch: async (_url, {signal}) => new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(new Error("AbortError")), {once: true}))
  });
});

test("the injected function works when serialized without its module closure", async () => {
  const document = createDocument([element("style", {}, [text("p { color: teal; }")])]);
  const context = vm.createContext({document, location: {href: "https://example.test/"}, TextEncoder, TextDecoder, URL, AbortController, setTimeout, clearTimeout});
  const callable = vm.runInContext("(" + readPageSources.toString() + ")", context);
  const result = await callable({type: "readSources"}, SOURCE_LIMITS);
  assert.equal(result.ok, true);
  assert.match(result.data.resources.find(resource => resource.id === "style:0").content, /color: teal/);
  assert.ok(Buffer.byteLength(JSON.stringify(result), "utf8") <= SOURCE_LIMITS.maxPayloadBytes);
});

test("the service worker routes both source actions into a standalone isolated function", async () => {
  const extensionId = "sourceextension";
  const viewerUrl = `chrome-extension://${extensionId}/viewer.html`;
  const sender = {id: extensionId, url: viewerUrl + "?tab=7", frameId: 0};
  const document = createDocument([element("script", {src: "app.js"})]);
  const {response} = streamedResponse(["const lesson = 1;"]);
  const injections = [];
  let onMessage;
  const chrome = {
    runtime: {
      id: extensionId, getURL: path => `chrome-extension://${extensionId}/` + path,
      onMessage: {addListener: handler => { onMessage = handler; }}
    },
    action: {onClicked: {addListener() {}}},
    tabs: {get: async () => ({url: "https://example.test/unterricht/index.html"})},
    scripting: {executeScript: async options => {
      injections.push(options);
      assert.deepEqual(options.target, {tabId: 7, frameIds: [0]});
      assert.equal(options.world, "ISOLATED");
      assert.equal(options.func.name, "readPageSources");
      const context = vm.createContext({
        document, location: {href: "https://example.test/unterricht/index.html"},
        TextEncoder, TextDecoder, URL, AbortController, setTimeout, clearTimeout,
        fetch: async () => response
      });
      const callable = vm.runInContext("(" + options.func.toString() + ")", context);
      return [{frameId: 0, result: await callable(...options.args)}];
    }}
  };
  await withGlobals({chrome}, async () => {
    await import("../Erweiterung/background.js");
    const send = message => new Promise(resolve => {
      assert.equal(onMessage(message, sender, resolve), true);
    });
    const inventory = await send({type: "readSources", tabId: 7});
    assert.equal(inventory.ok, true);
    assert.equal(inventory.data.resources.find(resource => resource.id === "script:0").status, "external");
    const file = await send({type: "readSourceFile", tabId: 7, resourceId: "script:0", expectedUrl: "https://example.test/unterricht/app.js"});
    assert.equal(file.ok, true);
    assert.equal(file.data.content, "const lesson = 1;");
    assert.equal(injections.length, 2);
    assert.equal(onMessage({type: "readSources", tabId: 7}, {...sender, url: "https://evil.test/"}, () => assert.fail("Foreign sender")), false);
    assert.equal(injections.length, 2);
  });
});
