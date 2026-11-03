import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";
import {runInNewContext} from "node:vm";
import {EXAMPLE_TASKS} from "../Erweiterung/teaching-model.js";

const readSample = name => readFile(new URL(`../Erweiterung/26_11_03_Musterseite_${name}.html`, import.meta.url), "utf8");

test("downloadable sample pages are self-contained and preserve the exact whitespace example", async () => {
  for (const name of ["Selektoren", "Kindknoten", "DOM_Aenderungen"]) {
    const html = await readSample(name);
    assert.match(html, /<html lang="de">/);
    assert.match(html, /<meta charset="utf-8">/);
    assert.doesNotMatch(html, /<(?:script|link|iframe|img)\b[^>]*(?:src|href)\s*=/i);
    const ids = [...html.matchAll(/<[a-z][^>]*\bid="([^"]+)"[^>]*>/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
  }
  const childPage = await readSample("Kindknoten");
  const exactExample = EXAMPLE_TASKS.find(task => task.id === "child-nodes").html;
  assert.ok(childPage.replaceAll("\r\n", "\n").includes(exactExample));
});

function sampleDocument() {
  const controls = new Map();
  for (const id of ["ergebnis", "ergaenzen", "entfernen", "neustart", "aufdecken"]) {
    controls.set("#" + id, {textContent: "", disabled: false,
      addEventListener(_type, listener) { this.click = listener; }});
  }
  const kursliste = {children: [],
    get lastElementChild() { return this.children.at(-1); },
    append(element) {
      this.children.push(element);
      element.remove = () => { this.children.splice(this.children.indexOf(element), 1); };
    }};
  kursliste.append({id: "kurs-1", className: "hinweis", textContent: "Kurs 1: HTML-Grundlagen"});
  controls.set("#kurse", kursliste);
  const matching = () => kursliste.children.filter(element => element.className === "hinweis");
  return {controls, kursliste, document: {
    querySelector: selector => { assert.ok(controls.has(selector)); return controls.get(selector); },
    querySelectorAll: selector => { assert.equal(selector, ".hinweis"); return [...matching()]; },
    getElementsByClassName: name => { assert.equal(name, "hinweis"); return {get length() { return matching().length; }}; },
    createElement: tag => { assert.equal(tag, "p"); return {tagName: tag}; }
  }};
}

test("the changing-page demonstration keeps its original collections and reveals counts only on demand", async () => {
  const html = await readSample("DOM_Aenderungen");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const {controls, kursliste, document} = sampleDocument();
  let reloads = 0;
  runInNewContext(script, {document, location: {reload() { reloads++; }}}, {timeout: 1000});
  const output = controls.get("#ergebnis");
  const click = id => controls.get("#" + id).click();
  assert.equal(output.textContent, "");
  click("ergaenzen");
  assert.equal(kursliste.children.length, 2);
  assert.equal(output.textContent, "");
  click("aufdecken");
  assert.match(output.textContent, /HTMLCollection: length = 2\nGespeicherte NodeList: length = 1/);
  click("entfernen");
  click("entfernen");
  assert.equal(kursliste.children.length, 0);
  assert.equal(output.textContent, "");
  assert.equal(controls.get("#entfernen").disabled, true);
  click("entfernen");
  click("aufdecken");
  assert.match(output.textContent, /HTMLCollection: length = 0\nGespeicherte NodeList: length = 1/);
  for (let i = 0; i < 12; i++) click("ergaenzen");
  assert.equal(kursliste.children.length, 10);
  assert.equal(controls.get("#ergaenzen").disabled, true);
  assert.equal(new Set(kursliste.children.map(element => element.id)).size, 10);
  assert.equal(output.textContent, "");
  click("neustart");
  assert.equal(reloads, 1);
});
