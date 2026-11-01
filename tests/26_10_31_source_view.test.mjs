import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import vm from 'node:vm';
import {findCodeMatches, getMatchPage, splitCodePages} from '../Erweiterung/code-document.js';
import {renderCodePage} from '../Erweiterung/code-renderer.js';
import {tokenizeCode} from '../Erweiterung/code-highlight.js';
import {formatCode} from '../Erweiterung/code-format.js';
import {createSourceView} from '../Erweiterung/source-view.js';

const directory = new URL('../Erweiterung/', import.meta.url);

class Element {
  constructor(tagName, ownerDocument) {
    Object.assign(this, {tagName, ownerDocument, children: [], attributes: new Map(), listeners: new Map(),
      style: {}, className: '', value: '', checked: false, hidden: false, disabled: false, ownText: ''});
    this.classList = {
      add: name => this.toggleClass(name, true), remove: name => this.toggleClass(name, false),
      toggle: (name, enabled) => this.toggleClass(name, enabled),
      contains: name => this.className.split(/\s+/).includes(name)
    };
  }
  toggleClass(name, enabled) {
    const classes = new Set(this.className.split(/\s+/).filter(Boolean));
    const include = enabled ?? !classes.has(name);
    if (include) classes.add(name); else classes.delete(name);
    this.className = [...classes].join(' ');
    return include;
  }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  set innerHTML(_value) { throw new Error('Unsafe HTML parsing sink'); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ''; this.children = [...children]; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(name, callback) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(callback);
    this.listeners.set(name, listeners);
  }
  dispatch(name, overrides = {}) {
    const event = {target: this, preventDefault() {}, ...overrides};
    return Promise.all((this.listeners.get(name) ?? []).map(callback => callback(event)));
  }
  focus() { this.ownerDocument.activeElement = this; }
  click() { this.clickCount = (this.clickCount ?? 0) + 1; return this.dispatch('click'); }
  scrollTo(left, top) { this.scrollLeft = left; this.scrollTop = top; }
  scrollIntoView() { this.ownerDocument.scrolledElement = this; }
  querySelectorAll() { return []; }
}

class Document {
  constructor() {
    this.ids = new Map();
    this.created = [];
    this.body = this.createElement('body');
    const html = readFileSync(new URL('viewer.html', directory), 'utf8');
    for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
      const element = this.createElement(match[1]);
      element.checked = /\bchecked\b/.test(match[2]);
      element.hidden = /\bhidden\b/.test(match[2]);
      this.ids.set(match[3], element);
    }
  }
  createElement(name) { const element = new Element(name, this); this.created.push(element); return element; }
  getElementById(id) { return this.ids.get(id) ?? null; }
}

async function withGlobals(values, work) {
  const saved = new Map(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {configurable: true, writable: true, value});
  try { return await work(); }
  finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const renderedCode = document => document.getElementById('codeRows').children.map(row => row.children[1].textContent).join('\n');
const snapshot = resources => ({title: 'Testseite', url: 'https://example.test', capturedAt: '2026-10-31T10:00:00Z', resources, notes: []});
const resource = (id, language, content, extra = {}) => ({id, language, content, label: id, origin: 'inline', status: 'ready', url: '', note: '', ...extra});

test('code paging preserves all Unicode text, line offsets, and long lines with strict bounds', () => {
  for (const code of ['', 'ä\nö\nü\n', 'a'.repeat(35), '<style>\n/* a\nb\nc */\n</style>', '😀'.repeat(20)]) {
    const pages = splitCodePages(code, 10, 2);
    assert.equal(pages.map(page => page.content).join(''), code);
    for (const page of pages) {
      assert.equal(page.content.length <= 10, true);
      assert.equal(page.startLine, 1 + (code.slice(0, page.start).match(/\n/g) ?? []).length);
      assert.equal(page.content, code.slice(page.start, page.end));
    }
  }
  assert.throws(() => splitCodePages('a', 0), RangeError);
  assert.throws(() => splitCodePages('a', 5, -1), RangeError);
  assert.deepEqual(splitCodePages('a😀b', 2).map(page => page.content), ['a', '😀', 'b']);
  assert.deepEqual(splitCodePages('😀', 1).map(page => page.content), ['😀']);
});

test('exact search keeps Unicode positions and selects matches across section boundaries', () => {
  const code = 'äA İ i\n0123456789needleEND';
  const pages = splitCodePages(code, 10, 2);
  const matches = findCodeMatches(code, 'needle');
  assert.deepEqual(matches, [{start: code.indexOf('needle'), end: code.indexOf('needle') + 6}]);
  assert.equal(pages[getMatchPage(pages, matches[0])].start <= matches[0].start, true);
  assert.deepEqual(findCodeMatches(code, 'a'), []);
  assert.equal(findCodeMatches('aaaa', 'a', 2).length, 2);
});

test('safe renderer preserves hostile source as text and retains syntax state across pages', async () => {
  const document = new Document();
  await withGlobals({document}, () => {
    const code = '/* first\n<script>danger()</script>\nlast */\nconst x = 1;';
    const page = splitCodePages(code, 40, 1)[1];
    const match = findCodeMatches(code, 'danger')[0];
    const container = document.createElement('div');
    const row = renderCodePage(container, page, 'javascript', [match], match, tokenizeCode(code, 'javascript'));
    assert.equal(container.children.map(item => item.children[1].textContent).join('\n'), page.content);
    assert.equal(row.classList.contains('current-match-line'), true);
    assert.ok(row.children[1].children.every(item => item.classList.contains('syntax-comment')));
    assert.equal(document.created.some(item => item.tagName === 'script'), false);
  });
});

test('bundled formatter assets match recorded hashes and its worker formats all three languages locally', () => {
  const vendor = new URL('vendor/js-beautify/', directory);
  const provenance = JSON.parse(readFileSync(new URL('provenance.json', vendor), 'utf8'));
  assert.equal(provenance.license, 'MIT');
  for (const [name, expected] of Object.entries(provenance.filesSha256)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(name, vendor))).digest('hex'), expected, name);
  }
  const messages = [];
  const context = vm.createContext({postMessage: message => messages.push(message)});
  context.importScripts = (...paths) => {
    for (const path of paths) {
      assert.ok(path.startsWith('./vendor/js-beautify/'));
      vm.runInContext(readFileSync(new URL(path, directory), 'utf8'), context);
    }
  };
  vm.runInContext(readFileSync(new URL('code-format-worker.js', directory), 'utf8'), context);
  for (const [language, source] of [['html', '<main><p>Hello</p><p>World</p></main>'], ['css', '.a{color:red;margin:0}'], ['javascript', 'function f(){return 1;}']]) {
    context.onmessage({data: {source, language}});
    assert.equal(messages.at(-1).ok, true, language);
    assert.ok(messages.at(-1).code.includes('\n'), language);
  }
  context.onmessage({data: {source: 'x'.repeat(500001), language: 'css'}});
  assert.equal(messages.at(-1).ok, false);
  context.onmessage({data: {source: 'x', language: 'unknown'}});
  assert.equal(messages.at(-1).ok, false);
});

test('formatter cancels obsolete workers and rejects oversized or malformed results', async () => {
  const workers = [];
  class Worker {
    constructor(url) { this.url = url; workers.push(this); }
    postMessage(message) { this.message = message; }
    terminate() { this.terminated = true; }
  }
  await withGlobals({Worker}, async () => {
    const first = formatCode('first()', 'javascript');
    const second = formatCode('second()', 'javascript');
    assert.equal((await first).formatted, false);
    assert.equal(workers[0].terminated, true);
    assert.equal(workers[1].url.pathname.endsWith('/code-format-worker.js'), true);
    workers[1].onmessage({data: {ok: true, code: 'second();'}});
    assert.equal((await second).code, 'second();');
    const huge = formatCode('original', 'css');
    workers.at(-1).onmessage({data: {ok: true, code: 'a'.repeat(2000001)}});
    assert.equal((await huge).code, 'original');
    assert.equal(workers.at(-1).terminated, true);
  });
});

test('formatter timeout and worker startup errors preserve the input and terminate the worker', async () => {
  const workers = [];
  let expire;
  class Worker {
    constructor() { workers.push(this); }
    postMessage() {}
    terminate() { this.terminated = true; }
  }
  await withGlobals({Worker, setTimeout: callback => { expire = callback; return 1; }, clearTimeout() {}}, async () => {
    const timedOut = formatCode('/* unusual */', 'css');
    expire();
    const result = await timedOut;
    assert.equal(result.code, '/* unusual */');
    assert.equal(result.formatted, false);
    assert.match(result.note, /abgebrochen/);
    assert.equal(workers[0].terminated, true);
    const failed = formatCode('let original = true;', 'javascript');
    let prevented = false;
    workers[1].onerror({preventDefault() { prevented = true; }});
    assert.equal((await failed).code, 'let original = true;');
    assert.equal(workers[1].terminated, true);
    assert.equal(prevented, true);
  });
});

test('source viewer switches languages, searches, restores focus, and never executes page text', async () => {
  const document = new Document();
  await withGlobals({document, Worker: undefined}, async () => {
    const view = createSourceView({isDemo: true, request: () => {throw new Error('unexpected request');}, onBusyChange() {}});
    await view.load();
    assert.match(renderedCode(document), /<html lang="de">/);
    assert.equal(document.getElementById('specificityToggle').hidden, true);
    await document.getElementById('codeTab-css').dispatch('click');
    assert.match(renderedCode(document), /\.hinweis/);
    assert.equal(document.getElementById('specificityToggle').hidden, false);
    await document.getElementById('specificityToggle').dispatch('click');
    assert.equal(document.getElementById('specificityPanel').hidden, false);
    document.getElementById('codeSearch').value = 'color';
    await document.getElementById('codeSearch').dispatch('keydown', {key: 'Enter'});
    assert.equal(document.getElementById('codeMatches').textContent, '1 / 1');
    assert.ok(document.scrolledElement);
    await document.getElementById('codeFocus').dispatch('click');
    assert.equal(document.body.classList.contains('code-focus'), true);
    await document.body.dispatch('keydown', {key: 'Escape'});
    assert.equal(document.body.classList.contains('code-focus'), false);
    assert.equal(document.activeElement, document.getElementById('codeFocus'));
    await document.getElementById('codeTab-javascript').dispatch('click');
    assert.equal(document.getElementById('specificityPanel').hidden, true);
    assert.equal(document.getElementById('specificityToggle').hidden, true);
    assert.match(renderedCode(document), /addEventListener/);
    assert.equal(document.created.some(element => element.tagName === 'script'), false);
  });
});

test('external files require a click, use pinned identifiers, and late responses do not replace another selection', async () => {
  const document = new Document();
  const calls = [];
  let completeFile;
  await withGlobals({document, Worker: undefined}, async () => {
    const external = resource('link:0', 'css', null, {origin: 'external', status: 'external', url: 'https://example.test/site.css'});
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async (type, payload) => {
      calls.push({type, payload});
      if (type === 'readSources') return snapshot([resource('html', 'html', '<p>Page</p>'), external, resource('script:0', 'javascript', 'const answer = 42;')]);
      return new Promise(resolve => { completeFile = resolve; });
    }});
    await view.load();
    await document.getElementById('codeTab-css').dispatch('click');
    assert.equal(calls.length, 1);
    assert.equal(document.getElementById('codeViewKind').textContent, '');
    const loading = document.getElementById('loadCodeFile').dispatch('click');
    assert.deepEqual(calls[1], {type: 'readSourceFile', payload: {resourceId: 'link:0', expectedUrl: external.url}});
    await document.getElementById('codeTab-javascript').dispatch('click');
    completeFile({...external, content: '.late { color: red; }', status: 'ready'});
    await loading;
    await settle();
    assert.equal(renderedCode(document), 'const answer = 42;');
    await document.getElementById('codeTab-css').dispatch('click');
    assert.match(renderedCode(document), /\.late/);
    assert.equal(document.getElementById('loadCodeFile').hidden, true);
  });
});

test('failed refresh retains prior code and hostile error text remains literal', async () => {
  const document = new Document();
  let fail = false;
  const message = '<img src=x onerror=alert(1)> Zugriff verweigert';
  await withGlobals({document, Worker: undefined}, async () => {
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async () => {
      if (fail) throw new Error(message);
      return snapshot([resource('html', 'html', '<p>Retained</p>')]);
    }});
    await view.load();
    fail = true;
    await view.load();
    assert.equal(renderedCode(document), '<p>Retained</p>');
    assert.ok(document.getElementById('codeStatus').textContent.includes(message));
    assert.equal(document.getElementById('codeStatus').getAttribute('role'), 'alert');
    assert.equal(document.created.some(element => element.tagName === 'img'), false);
  });
});

test('a newer file selection cancels formatting and clipboard receives the original source', async () => {
  const document = new Document();
  const workers = [];
  const copied = [];
  class Worker {
    constructor() { workers.push(this); }
    postMessage(message) { this.message = message; }
    terminate() { this.terminated = true; }
  }
  await withGlobals({document, Worker, navigator: {clipboard: {async writeText(value) { copied.push(value); }}}}, async () => {
    const css = '.a{color:red}';
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async () => snapshot([
      resource('html', 'html', '<p>First</p>'), resource('css', 'css', css)
    ])});
    const reading = view.load();
    await settle();
    assert.equal(workers.length, 1);
    const changing = document.getElementById('codeTab-css').dispatch('click');
    assert.equal(workers[0].terminated, true);
    assert.equal(workers.length, 2);
    workers[1].onmessage({data: {ok: true, code: '.a {\n  color: red;\n}'}});
    await reading;
    await changing;
    assert.equal(renderedCode(document), '.a {\n  color: red;\n}');
    await document.getElementById('copyCode').dispatch('click');
    assert.deepEqual(copied, [css]);
    assert.match(document.getElementById('codeViewKind').textContent, /Ansicht formatiert/);
    assert.equal(workers[1].terminated, true);
  });
});

test('a late clipboard reply does not overwrite the status of a newer source', async () => {
  const document = new Document();
  let finishCopy;
  await withGlobals({document, Worker: undefined, navigator: {clipboard: {writeText: () => new Promise(resolve => { finishCopy = resolve; })}}}, async () => {
    const view = createSourceView({isDemo: true, onBusyChange() {}, request() {}});
    await view.load();
    const copying = document.getElementById('copyCode').dispatch('click');
    await document.getElementById('codeTab-css').dispatch('click');
    const latestStatus = document.getElementById('codeStatus').textContent;
    finishCopy();
    await copying;
    assert.equal(document.getElementById('codeStatus').textContent, latestStatus);
    assert.doesNotMatch(latestStatus, /wurde kopiert/);
  });
});

const localScript = id => resource(id, 'javascript', null, {origin: 'external', status: 'external', url: `file:///C:/Unterricht/${id}.js`});

test('local JavaScript uses an explicit file picker, supports cancel and reopening, and displays literal source', async () => {
  const document = new Document();
  const calls = [];
  await withGlobals({document, Worker: undefined}, async () => {
    const linked = localScript('app');
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async type => {
      calls.push(type);
      assert.equal(type, 'readSources');
      return snapshot([resource('html', 'html', '<p>Test</p>'), linked]);
    }});
    await view.load();
    await document.getElementById('codeTab-javascript').dispatch('click');
    const open = document.getElementById('openLocalCodeFile');
    const input = document.getElementById('localCodeFile');
    assert.equal(open.hidden, false);
    assert.equal(document.getElementById('loadCodeFile').hidden, true);
    assert.match(document.getElementById('codeEmpty').textContent, /Lokale Datei öffnen/);
    await open.dispatch('click');
    assert.equal(input.clickCount, 1);
    assert.match(input.accept, /\.mjs/);
    await input.dispatch('cancel');
    input.files = [new File(['ignored()'], 'app.js')];
    await input.dispatch('change');
    assert.equal(linked.content, null);
    await open.dispatch('click');
    const code = 'globalThis.__localViewExecuted = true;\nconst x = "<img src=x onerror=alert(1)>";';
    input.files = [new File([code], 'app.js')];
    await input.dispatch('change');
    assert.equal(renderedCode(document), code);
    assert.equal(globalThis.__localViewExecuted, undefined);
    assert.equal(document.created.some(element => element.tagName === 'img'), false);
    assert.equal(document.getElementById('codeFileOrigin').textContent, 'Lokale Dateiauswahl');
    assert.match(document.getElementById('codeFileUrl').textContent, /^Verknüpfung im HTML:/);
    assert.match(document.getElementById('codeStatus').textContent, /nicht geprüft/);
    assert.equal(input.value, '');
    assert.equal(open.textContent, 'Lokale Datei erneut öffnen');
    await open.dispatch('click');
    input.files = [new File(['const updated = true;'], 'app.js')];
    await input.dispatch('change');
    assert.equal(renderedCode(document), 'const updated = true;');
    assert.deepEqual(calls, ['readSources']);
  });
});

test('a local file selection stays attached to the source chosen when the dialog opened', async () => {
  const document = new Document();
  const first = localScript('first');
  const second = localScript('second');
  let finishReading;
  await withGlobals({document, Worker: undefined}, async () => {
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async () => snapshot([first, second])});
    await view.load();
    await document.getElementById('codeTab-javascript').dispatch('click');
    await document.getElementById('openLocalCodeFile').dispatch('click');
    await document.getElementById('codeFiles').children[1].dispatch('click');
    const input = document.getElementById('localCodeFile');
    input.files = [{name: 'first.js', size: 10, slice: () => ({arrayBuffer: () => new Promise(resolve => { finishReading = resolve; })})}];
    const reading = input.dispatch('change');
    assert.equal(document.getElementById('sourcePane').getAttribute('aria-busy'), 'true');
    finishReading(new TextEncoder().encode('first();').buffer);
    await reading;
    assert.equal(first.content, 'first();');
    assert.equal(second.content, null);
    assert.equal(document.getElementById('codeFileTitle').textContent, 'second');
    assert.equal(renderedCode(document), '');
    assert.equal(document.getElementById('sourcePane').getAttribute('aria-busy'), 'false');
    await document.getElementById('codeFiles').children[0].dispatch('click');
    await settle();
    assert.equal(renderedCode(document), 'first();');
  });
});

test('refresh invalidates an open local picker even if the new snapshot reuses resource identifiers', async () => {
  const document = new Document();
  const old = localScript('app');
  const fresh = localScript('app');
  let requests = 0;
  await withGlobals({document, Worker: undefined}, async () => {
    const view = createSourceView({isDemo: false, onBusyChange() {}, request: async () => snapshot([++requests === 1 ? old : fresh])});
    await view.load();
    await document.getElementById('codeTab-javascript').dispatch('click');
    await document.getElementById('openLocalCodeFile').dispatch('click');
    await view.load();
    const input = document.getElementById('localCodeFile');
    input.files = [new File(['stale();'], 'app.js')];
    await input.dispatch('change');
    assert.equal(old.content, null);
    assert.equal(fresh.content, null);
    assert.equal(renderedCode(document), '');
  });
});

test('failed local reread preserves prior contents and clears busy state', async () => {
  const document = new Document();
  const linked = localScript('app');
  const busy = [];
  await withGlobals({document, Worker: undefined}, async () => {
    const view = createSourceView({isDemo: false, onBusyChange: value => busy.push(value), request: async () => snapshot([linked])});
    await view.load();
    await document.getElementById('codeTab-javascript').dispatch('click');
    const open = document.getElementById('openLocalCodeFile');
    const input = document.getElementById('localCodeFile');
    await open.dispatch('click');
    input.files = [new File(['const retained = 1;'], 'app.js')];
    await input.dispatch('change');
    await open.dispatch('click');
    input.files = [{name: 'app.js', size: 10, slice() { throw new Error('private path'); }}];
    await input.dispatch('change');
    assert.equal(renderedCode(document), 'const retained = 1;');
    assert.match(document.getElementById('codeStatus').textContent, /bisherige Inhalt bleibt sichtbar/);
    assert.doesNotMatch(document.getElementById('codeStatus').textContent, /private path/);
    assert.equal(document.getElementById('codeStatus').getAttribute('role'), 'alert');
    assert.equal(open.disabled, false);
    assert.equal(busy.at(-1), false);
  });
});
