import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isLocalSource, readLocalSource} from '../Erweiterung/local-source.js';

const source = (extra = {}) => ({id: 'script:0', language: 'javascript', url: 'file:///C:/Unterricht/mein%20script.js', origin: 'external', ...extra});
const file = (content, name = 'mein script.js') => new File([content], name);

test('local selection accepts only linked file URLs for JavaScript or CSS', async () => {
  assert.equal(isLocalSource(source()), true);
  assert.equal(isLocalSource(source({language: 'css'})), true);
  for (const candidate of [null, {}, source({language: 'html'}), source({url: 'https://example.test/a.js'}), source({url: 'not a URL'})]) {
    assert.equal(isLocalSource(candidate), false);
    await assert.rejects(readLocalSource(file('x'), candidate), /lokal verknüpfte/);
  }
});

test('manually chosen UTF-8 source is preserved without evaluation and does not claim path verification', async () => {
  const code = 'globalThis.__localSourceExecuted = true;\nconst text = "äöüß <script>alert(1)</script>";';
  const result = await readLocalSource(file(code), source());
  assert.equal(result.content, code);
  assert.equal(globalThis.__localSourceExecuted, undefined);
  assert.equal(result.origin, 'local');
  assert.equal(result.status, 'ready');
  assert.equal(result.label, 'mein script.js');
  assert.equal(result.url, source().url);
  assert.match(result.note, /Übereinstimmung.*nicht geprüft/);
  assert.doesNotMatch(result.note, /weicht/);
  assert.equal(result.truncated, false);
});

test('local reader handles Unicode BOMs, empty files and malformed UTF-8 explicitly', async () => {
  const examples = [
    [new Uint8Array([0xef, 0xbb, 0xbf, 0xc3, 0xa4]), 'ä', 'UTF-8'],
    [new Uint8Array([0xff, 0xfe, 0xe4, 0x00, 0xdf, 0x00]), 'äß', 'UTF-16LE'],
    [new Uint8Array([0xfe, 0xff, 0x00, 0xe4, 0x00, 0xdf]), 'äß', 'UTF-16BE']
  ];
  for (const [bytes, content, encoding] of examples) {
    const result = await readLocalSource(file(bytes), source());
    assert.equal(result.content, content);
    assert.ok(result.note.includes(encoding));
  }
  assert.equal((await readLocalSource(file(''), source())).content, '');
  const invalid = await readLocalSource(file(new Uint8Array([0xff, 0x61])), source());
  assert.equal(invalid.content, '\ufffda');
  assert.match(invalid.note, /Zeichen.*ersetzt/);
});

test('local reader slices before reading and does not leave a broken Unicode tail at the byte limit', async () => {
  const chosen = file('a'.repeat(499999) + 'ä' + 'more');
  const slices = [];
  const observed = {name: chosen.name, size: chosen.size, slice(start, end) { slices.push([start, end]); return chosen.slice(start, end); }};
  const result = await readLocalSource(observed, source());
  assert.deepEqual(slices, [[0, 500000]]);
  assert.equal(result.content, 'a'.repeat(499999));
  assert.equal(result.truncated, true);
  assert.match(result.note, /500 kB/);
  assert.doesNotMatch(result.note, /ersetzt/);
  const exact = await readLocalSource(file('a'.repeat(500000)), source());
  assert.equal(exact.content.length, 500000);
  assert.equal(exact.truncated, false);
});

test('different local filename remains visible and is flagged even when its text is readable', async () => {
  const result = await readLocalSource(file('body {}', 'andere.css'), source({language: 'css'}));
  assert.equal(result.label, 'andere.css');
  assert.match(result.note, /weicht.*mein script\.js/);
  assert.match(result.note, /nicht geprüft/);
});

test('invalid files, unreadable files and oversized returned buffers fail with useful errors', async () => {
  for (const chosen of [null, {}, {name: 'x', size: -1, slice() {}}, {name: 'x', size: NaN, slice() {}}]) {
    await assert.rejects(readLocalSource(chosen, source()), /nicht als Text/);
  }
  await assert.rejects(readLocalSource({name: 'x', size: 1, slice() { throw new Error('private system details'); }}, source()), /konnte nicht gelesen werden/);
  await assert.rejects(readLocalSource({name: 'x', size: 1, slice: () => ({arrayBuffer: async () => new ArrayBuffer(500001)})}, source()), /Lesegrenze/);
  await assert.rejects(readLocalSource({name: 'x', size: 1, slice: () => ({arrayBuffer: async () => 'not bytes'})}, source()), /Lesegrenze/);
});

test('stalled local reads time out instead of keeping the viewer busy indefinitely', async () => {
  const stalled = {name: 'x.js', size: 1, slice: () => ({arrayBuffer: () => new Promise(() => {})})};
  await assert.rejects(readLocalSource(stalled, source(), 5), /Lesen dauert zu lange/);
});
