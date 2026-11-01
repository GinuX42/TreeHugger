import assert from "node:assert/strict";
import {test} from "node:test";
import {tokenizeCode} from "../Erweiterung/code-highlight.js";

const TOKEN_KINDS = new Set(["plain", "comment", "string", "keyword", "number", "tag", "attribute", "punctuation"]);

function checkedTokens(source, language) {
  const tokens = tokenizeCode(source, language);
  assert.equal(tokens.map(token => token.text).join(""), source);
  assert.ok(tokens.every(token => token.text.length > 0 && TOKEN_KINDS.has(token.kind)));
  return tokens;
}

function withKind(tokens, kind) {
  return tokens.filter(token => token.kind === kind).map(token => token.text);
}

test("HTML tags, attributes and entity spelling remain intact without parsing markup", () => {
  const source = '<!doctype html>\r\n<div class="karte aktiv" data-label="A &amp; B" hidden>Grüße &lt;DOM&gt; <input value=42></div>';
  const tokens = checkedTokens(source, "html");
  assert.ok(withKind(tokens, "tag").includes("div"));
  assert.ok(withKind(tokens, "attribute").includes("data-label"));
  assert.ok(withKind(tokens, "attribute").includes("hidden"));
  assert.ok(withKind(tokens, "string").includes('"A &amp; B"'));
  assert.ok(withKind(tokens, "plain").some(text => text.includes("Grüße &lt;DOM&gt;")));
});

test("HTML scripts and styles receive their respective syntax colors", () => {
  const source = '<style>.karte { color: #ab12ef; }</style>\n<script>const value = "<b>Text</b>"; // Kommentar\n</script>';
  const tokens = checkedTokens(source, "html");
  assert.ok(withKind(tokens, "attribute").includes("color"));
  assert.ok(withKind(tokens, "number").includes("#ab12ef"));
  assert.ok(withKind(tokens, "keyword").includes("const"));
  assert.ok(withKind(tokens, "string").includes('"<b>Text</b>"'));
  assert.deepEqual(withKind(tokens, "comment"), ["// Kommentar"]);
});

test("HTML raw text follows the first real closing tag and preserves hostile-looking strings", () => {
  const source = '<script>const raw = "</script><img src=x onerror=attack()>";</script><textarea><b>Text &amp; Zeichen</b></textarea><!-- Ende -->';
  const tokens = checkedTokens(source, "html");
  assert.ok(withKind(tokens, "tag").includes("img"));
  assert.ok(withKind(tokens, "attribute").includes("onerror"));
  assert.ok(withKind(tokens, "plain").includes("<b>Text &amp; Zeichen</b>"));
  assert.equal(globalThis.attack, undefined);
});

test("JavaScript URLs and comment-like characters inside strings are not comments", () => {
  const source = String.raw`const url = "https://example.test/a/*b*/"; const quote = 'it\'s // text'; /* real */ // end`;
  const tokens = checkedTokens(source, "javascript");
  assert.deepEqual(withKind(tokens, "comment"), ["/* real */", "// end"]);
  assert.ok(withKind(tokens, "string").includes('"https://example.test/a/*b*/"'));
  assert.ok(withKind(tokens, "string").some(text => text.includes("it\\'s // text")));
});

test("JavaScript regex literals protect escaped slashes and character classes while division remains an operator", () => {
  const source = String.raw`const url = /https?:\/\/[^/]+\/x\/*/gi; const ratio = total / count / 2; if (ready) /[/*]/.test(value);`;
  const tokens = checkedTokens(source, "javascript");
  const literals = withKind(tokens, "string");
  assert.deepEqual(literals, [String.raw`/https?:\/\/[^/]+\/x\/*/gi`, "/[/*]/"]);
  assert.deepEqual(withKind(tokens, "comment"), []);
  assert.ok(withKind(tokens, "number").includes("2"));
});

test("nested multiline templates stay one protected string including interpolation comments and regex", () => {
  const template = '`Hallo\n${{title: `innen ${1 + 2}`, check: /[}]/}.title /* } */}\nEnde`';
  const source = "const result = " + template + "; // außerhalb\n";
  const tokens = checkedTokens(source, "javascript");
  assert.deepEqual(withKind(tokens, "string"), [template]);
  assert.deepEqual(withKind(tokens, "comment"), ["// außerhalb"]);
});

test("CSS distinguishes custom properties, selectors, colors, units, strings and URLs", () => {
  const source = '@media (min-width: 30rem) { #abc { --farbe: #abc; color: var(--farbe); width: 2.5em; background: url("https://example.test/a/*b*/.png"); content: "/* kein Kommentar */"; } } /* Ende */';
  const tokens = checkedTokens(source, "css");
  assert.ok(withKind(tokens, "keyword").includes("@media"));
  assert.ok(withKind(tokens, "attribute").includes("--farbe"));
  assert.ok(withKind(tokens, "number").includes("#abc"));
  assert.ok(withKind(tokens, "number").includes("2.5em"));
  assert.ok(withKind(tokens, "string").includes('url("https://example.test/a/*b*/.png")'));
  assert.deepEqual(withKind(tokens, "comment"), ["/* Ende */"]);
});

test("escaped quotes and Unicode characters retain exact spelling", () => {
  const samples = [
    ["javascript", String.raw`let grüße = "ÄÖÜäöüß 😀 \"\\"; const größe = 1_000.5e-2;`],
    ["html", '<p title="erste\nzweite Zeile">&#x1f600; &amp; &nbsp;</p>'],
    ["css", String.raw`.größe::before { content: "\2192"; --höhe: 100%; }`]
  ];
  for (const [language, source] of samples) checkedTokens(source, language);
});

test("incomplete syntax is preserved and never creates empty or unknown tokens", () => {
  const samples = [
    ["javascript", 'const a = "unterminiert\nnext(); /* offen'],
    ["javascript", "const a = /unterminiert\\/weiter\nnext();"],
    ["javascript", "const a = `offen ${ { value: 'text' }"],
    ["css", 'a { background: url("offen'],
    ["html", '<div title="offen\n<script>const x = 2;'],
    ["html", "<style>/* ohne Ende"],
    ["html", "1 < 2 && 3 > 1; <!-- offen"]
  ];
  for (const [language, source] of samples) checkedTokens(source, language);
});

test("empty input is empty, unknown languages stay plain, and non-text input is rejected", () => {
  assert.deepEqual(tokenizeCode("", "html"), []);
  assert.deepEqual(tokenizeCode("<script>run()</script>", "unknown"), [{text: "<script>run()</script>", kind: "plain"}]);
  assert.throws(() => tokenizeCode({toString() { throw new Error("must not run"); }}, "html"), TypeError);
});

test("large and adversarial inputs preserve all characters without recursive stack growth", () => {
  const source = ('const n = 12; const text = "// <script>ä😀</script>"; /* klar */\n').repeat(3500);
  checkedTokens(source, "javascript");
  checkedTokens("/" + "\\/".repeat(100000), "javascript");
  checkedTokens("`" + "${`".repeat(12000) + "x" + "`}".repeat(12000) + "`", "javascript");
  checkedTokens('<p class="x">Text &amp; mehr</p>'.repeat(7000), "html");
  checkedTokens('.x{background:url("/*abc*/");--color:#c0ffee;color:var(--color)}'.repeat(3500), "css");
});
