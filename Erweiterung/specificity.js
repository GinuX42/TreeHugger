const MAX_LENGTH = 4096;
const MAX_DEPTH = 24;
const MAX_SELECTORS = 128;
const SPACE = /[\t\n\f\r ]/;
const NAME_START = /[a-zA-Z_\u0080-\uFFFF]/;
const NAME_CHAR = /[a-zA-Z0-9_\u0080-\uFFFF-]/;
const HEX = /[0-9a-fA-F]/;
const LEGACY_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);
const SIMPLE_ELEMENTS = new Set([...LEGACY_ELEMENTS, "selection", "marker", "placeholder", "backdrop", "file-selector-button", "spelling-error", "grammar-error", "target-text", "details-content", "checkmark", "picker-icon", "view-transition"]);
const SIMPLE_CLASSES = new Set(("active any-link autofill blank checked default defined disabled empty enabled first-child first-of-type focus focus-visible focus-within fullscreen future host hover indeterminate in-range invalid last-child last-of-type link local-link modal muted only-child only-of-type open optional out-of-range past paused picture-in-picture placeholder-shown playing popover-open read-only read-write required root scope seeking stalled target target-within user-invalid user-valid valid visited volume-locked buffering").split(" "));
const FUNCTIONAL_ELEMENTS = new Set(["part", "highlight", "view-transition-group", "view-transition-image-pair", "view-transition-old", "view-transition-new"]);

class SelectorError extends Error {
  constructor(message, kind = "invalid") {
    super(message);
    this.kind = kind;
  }
}

function fail(message, kind) {
  throw new SelectorError(message, kind);
}

export function compareSpecificity(left, right) {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}

function sum(left, right) {
  return left.map((value, index) => value + right[index]);
}

function maximum(selectors) {
  return selectors.reduce((result, selector) => compareSpecificity(selector.specificity, result) > 0
    ? selector.specificity : result, [0, 0, 0]);
}

function escapeEnd(text, index) {
  let end = index + 1;
  if (end >= text.length || /[\n\r\f]/.test(text[end])) fail("Der CSS-Escape ist unvollständig.");
  if (!HEX.test(text[end])) return end + 1;
  while (end < text.length && end < index + 7 && HEX.test(text[end])) end++;
  if (SPACE.test(text[end] ?? "")) {
    if (text[end] === "\r" && text[end + 1] === "\n") end++;
    end++;
  }
  return end;
}

function stringEnd(text, index) {
  const quote = text[index];
  for (let end = index + 1; end < text.length; end++) {
    if (text[end] === quote) return end + 1;
    if (text[end] === "\\") {
      if (text[end + 1] === "\r" && text[end + 2] === "\n") end += 2;
      else end++;
    } else if (/[\r\n\f]/.test(text[end])) fail("Ein Zeichenkettenwert enthält einen ungeschützten Zeilenumbruch.");
  }
  fail("Ein Anführungszeichen wurde nicht geschlossen.");
}

function commentEnd(text, index) {
  const end = text.indexOf("*/", index + 2);
  if (end < 0) fail("Ein CSS-Kommentar wurde nicht geschlossen.");
  return end + 2;
}

function identifierEnd(text, index) {
  let end = index;
  const first = text[end];
  if (first === "-") {
    end++;
    if (!(text[end] === "-" || text[end] === "\\" || NAME_START.test(text[end] ?? ""))) return index;
  } else if (!(first === "\\" || NAME_START.test(first ?? ""))) return index;
  while (end < text.length) {
    if (text[end] === "\\") end = escapeEnd(text, end);
    else if (NAME_CHAR.test(text[end])) end++;
    else break;
  }
  return end;
}

function decodeIdentifier(text) {
  return text.replace(/\\([0-9a-fA-F]{1,6})(?:\r\n|[\t\n\f\r ])?|\\([^\r\n\f])/g, (_, digits, character) => {
    if (character) return character;
    const value = Number.parseInt(digits, 16);
    return value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff) ? "\uFFFD" : String.fromCodePoint(value);
  });
}

function splitList(text) {
  const branches = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "\\") index = escapeEnd(text, index) - 1;
    else if (character === '"' || character === "'") index = stringEnd(text, index) - 1;
    else if (text.startsWith("/*", index)) index = commentEnd(text, index) - 1;
    else if (character === "(" || character === "[") {
      stack.push(character);
      if (stack.length > MAX_DEPTH) fail("Der Selektor ist für diese Ansicht zu tief verschachtelt.", "limit");
    } else if (character === ")" || character === "]") {
      if (stack.pop() !== (character === ")" ? "(" : "[")) fail("Die Klammern des Selektors passen nicht zusammen.");
    } else if (character === "," && !stack.length) {
      branches.push(text.slice(start, index).trim());
      start = index + 1;
    } else if (character === "{" || character === "}") fail("Geben Sie nur den Selektor ein, ohne CSS-Deklarationen und geschweifte Klammern.");
  }
  if (stack.length) fail("Eine Klammer wurde nicht geschlossen.");
  branches.push(text.slice(start).trim());
  if (branches.length > MAX_SELECTORS) fail("Die Selektorliste ist für diese Ansicht zu lang.", "limit");
  return branches;
}

class SelectorParser {
  constructor(text, depth, context) {
    this.text = text;
    this.index = 0;
    this.depth = depth;
    this.context = context;
    this.parts = [];
    this.specificity = [0, 0, 0];
    this.compounds = 0;
    this.hasPseudoElement = false;
  }

  add(start, kind, specificity, explanation, children = []) {
    this.parts.push({text: this.text.slice(start, this.index), kind, specificity, explanation, children});
    this.specificity = sum(this.specificity, specificity);
  }

  trivia() {
    const start = this.index;
    let whitespace = false;
    while (this.index < this.text.length) {
      if (SPACE.test(this.text[this.index])) { whitespace = true; this.index++; }
      else if (this.text.startsWith("/*", this.index)) this.index = commentEnd(this.text, this.index);
      else break;
    }
    if (this.index > start) this.add(start, "zero", [0, 0, 0], "Leerraum und Kommentare erhöhen die Spezifität nicht.");
    return whitespace;
  }

  identifier() {
    const start = this.index;
    this.index = identifierEnd(this.text, start);
    if (this.index === start) fail("Hier fehlt ein gültiger CSS-Name.");
    return decodeIdentifier(this.text.slice(start, this.index));
  }

  bracket(open, close) {
    const start = ++this.index;
    let depth = 1;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === "\\") this.index = escapeEnd(this.text, this.index);
      else if (character === '"' || character === "'") this.index = stringEnd(this.text, this.index);
      else if (this.text.startsWith("/*", this.index)) this.index = commentEnd(this.text, this.index);
      else {
        if (character === open) depth++;
        else if (character === close) {
          depth--;
          if (depth === 0) return this.text.slice(start, this.index++);
        }
        this.index++;
      }
    }
    fail("Eine Klammer wurde nicht geschlossen.");
  }

  type() {
    const start = this.index;
    let universal = false;
    if (this.text[this.index] === "|") this.index++;
    else {
      if (this.text[this.index] === "*") { universal = true; this.index++; }
      else if (identifierEnd(this.text, this.index) > this.index) this.identifier();
      else return false;
      if (this.text[this.index] !== "|" || this.text[this.index + 1] === "|") {
        this.add(start, universal ? "zero" : "type", universal ? [0, 0, 0] : [0, 0, 1], universal ? "Der Universalselektor zählt nicht." : "Ein Elementname zählt in Gruppe C.");
        return true;
      }
      this.index++;
    }
    universal = this.text[this.index] === "*";
    if (universal) this.index++; else this.identifier();
    this.add(start, universal ? "zero" : "type", universal ? [0, 0, 0] : [0, 0, 1], "Der Namensraum zählt nicht; nur ein konkreter Elementname zählt in Gruppe C.");
    return true;
  }

  attribute() {
    const start = this.index;
    const content = this.bracket("[", "]");
    validateAttribute(content);
    this.add(start, "class", [0, 1, 0], "Ein Attributselektor zählt einmal in Gruppe B, unabhängig von seinem Wert.");
  }

  selectorArguments(content, options = {}) {
    return parseList(content, this.depth + 1, {...this.context, relative: false, compoundOnly: false, allowEmpty: false, forbidPseudoElements: true, ...options});
  }

  pseudo() {
    const start = this.index++;
    const doubleColon = this.text[this.index] === ":";
    if (doubleColon) this.index++;
    const name = this.identifier().toLowerCase();
    const isElement = doubleColon || LEGACY_ELEMENTS.has(name);
    if (isElement && this.context.forbidPseudoElements) fail("Pseudoelemente sind in diesem Selektorargument nicht erlaubt.");
    if (this.text[this.index] !== "(") {
      if (!(isElement ? SIMPLE_ELEMENTS : SIMPLE_CLASSES).has(name)) fail(`„${isElement ? "::" : ":"}${name}“ wird von dieser Berechnung nicht unterstützt.`, "unsupported");
      this.add(start, isElement ? "type" : "class", isElement ? [0, 0, 1] : [0, 1, 0], isElement ? "Ein Pseudoelement zählt in Gruppe C." : "Eine Pseudoklasse zählt in Gruppe B.");
    } else {
      const content = this.bracket("(", ")");
      if (isElement) this.functionalElement(start, name, content);
      else this.functionalClass(start, name, content);
    }
    this.hasPseudoElement ||= isElement;
  }

  functionalElement(start, name, content) {
    if (name === "slotted") {
      const children = this.selectorArguments(content, {compoundOnly: true});
      if (children.length !== 1) fail("::slotted() benötigt genau einen zusammengesetzten Selektor.");
      this.add(start, "special", sum([0, 0, 1], children[0].specificity), "::slotted() zählt als Pseudoelement; sein Argument wird zusätzlich gezählt.", children);
    } else if (FUNCTIONAL_ELEMENTS.has(name)) {
      const identifiers = content.trim().split(/\s+/);
      const valid = identifiers.every(value => value === "*" && name.startsWith("view-transition-") || identifierEnd(value, 0) === value.length && value.length > 0);
      if (!valid || name !== "part" && identifiers.length !== 1) fail("Das Pseudoelement benötigt einen passenden Namen als Argument.");
      this.add(start, "type", [0, 0, 1], "Das Pseudoelement zählt einmal; die Namen im Argument sind keine Selektoren.");
    } else fail(`„::${name}()“ wird von dieser Berechnung nicht unterstützt.`, "unsupported");
  }

  functionalClass(start, name, content) {
    if (["is", "not", "has", "where"].includes(name)) {
      if (name === "has" && this.context.inHas) fail(":has() darf nicht in :has() verschachtelt werden.");
      let children;
      try {
        children = this.selectorArguments(content, {relative: name === "has", inHas: this.context.inHas || name === "has", allowEmpty: name === "is" || name === "where"});
      } catch (error) {
        if ((name === "is" || name === "where") && error.kind === "invalid") fail(`:${name}() enthält einen nicht auswertbaren Zweig. Die Fehlerbehandlung solcher Listen wird hier nicht nachgebildet.`, "unsupported");
        throw error;
      }
      const specificity = name === "where" ? [0, 0, 0] : maximum(children);
      this.add(start, name === "where" ? "zero" : "special", specificity, name === "where"
        ? ":where() und sein gesamter Inhalt zählen null."
        : `:${name}() übernimmt nur die höchste Spezifität seiner Argumente, unabhängig davon, welcher Zweig zutrifft.`, children);
    } else if (["nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type"].includes(name)) {
      if (content.includes("/*") || content.includes("\\")) fail("Kommentare und CSS-Escapes in Positionsformeln werden hier nicht ausgewertet.", "unsupported");
      const {formula, selectors} = splitNth(content);
      if (!/^(?:odd|even|[+-]?\d+|[+-]?(?:\d+)?n(?:\s*[+-]\s*\d+)?)$/i.test(formula)) fail("Die Positionsformel muss zum Beispiel odd, 2n+1 oder -n+3 lauten.");
      if (selectors !== null && name.includes("of-type")) fail("Bei :nth-of-type() und :nth-last-of-type() ist „of“ nicht erlaubt.");
      const children = selectors === null ? [] : this.selectorArguments(selectors);
      this.add(start, children.length ? "special" : "class", sum([0, 1, 0], maximum(children)), children.length
        ? "Eine Pseudoklasse in Gruppe B plus die höchste Spezifität der Selektoren nach „of“."
        : "Die Positions-Pseudoklasse zählt in Gruppe B; ihre Zahlen zählen nicht.", children);
    } else if (name === "host" || name === "host-context") {
      const children = this.selectorArguments(content, {compoundOnly: true});
      if (children.length !== 1) fail(`:${name}() benötigt genau einen zusammengesetzten Selektor.`);
      this.add(start, "special", sum([0, 1, 0], children[0].specificity), "Die Host-Pseudoklasse zählt in Gruppe B; ihr Argument wird zusätzlich gezählt.", children);
    } else if (name === "lang" || name === "dir" || name === "state") {
      validateValueFunction(name, content);
      this.add(start, "class", [0, 1, 0], "Eine Pseudoklasse zählt in Gruppe B. Ihr Wert ist kein zusätzlicher Selektor.");
    } else fail(`„:${name}()“ wird von dieser Berechnung nicht unterstützt.`, "unsupported");
  }

  compound() {
    this.compounds++;
    if (this.context.compoundOnly && this.compounds > 1) fail("Hier ist kein Kombinator erlaubt.");
    let found = this.type();
    while (this.index < this.text.length) {
      const start = this.index;
      const character = this.text[this.index];
      if (this.text.startsWith("/*", this.index)) {
        this.index = commentEnd(this.text, this.index);
        this.add(start, "zero", [0, 0, 0], "Kommentare zählen nicht.");
        continue;
      }
      if (this.hasPseudoElement && ["#", ".", "["].includes(character)) fail("Nach einem Pseudoelement ist dieser Selektorbestandteil nicht erlaubt.");
      if (character === "#" || character === ".") {
        this.index++;
        this.identifier();
        this.add(start, character === "#" ? "id" : "class", character === "#" ? [1, 0, 0] : [0, 1, 0], character === "#" ? "Ein ID-Selektor zählt in Gruppe A." : "Ein Klassenselektor zählt in Gruppe B.");
      } else if (character === "[") this.attribute();
      else if (character === ":") {
        if (this.hasPseudoElement) fail("Zusätze nach Pseudoelementen werden hier nicht ausgewertet.", "unsupported");
        this.pseudo();
      } else if (character === "&") fail("Für CSS-Nesting mit & wird der übergeordnete Selektor benötigt. Rechnen Sie hier mit einem vollständigen, nicht verschachtelten Selektor.", "unsupported");
      else break;
      found = true;
    }
    if (!found) fail("An dieser Stelle fehlt ein Selektorbestandteil.");
  }

  combinator() {
    const start = this.index;
    if (this.text.startsWith("||", this.index)) this.index += 2;
    else if (/[>+~]/.test(this.text[this.index] ?? "")) this.index++;
    else return false;
    this.add(start, "zero", [0, 0, 0], "Der Kombinator beschreibt eine Beziehung und erhöht die Spezifität nicht.");
    return true;
  }

  parse() {
    this.trivia();
    if (this.context.relative && this.combinator()) this.trivia();
    this.compound();
    while (this.index < this.text.length) {
      const hadSpace = this.trivia();
      if (this.index === this.text.length) break;
      if (this.hasPseudoElement) fail("Beziehungen nach Pseudoelementen werden hier nicht ausgewertet.", "unsupported");
      const explicit = this.combinator();
      if (!hadSpace && !explicit) fail("Zwischen diesen Selektorbestandteilen fehlt eine gültige Verbindung.");
      if (explicit) this.trivia();
      this.compound();
    }
    return {selector: this.text, specificity: this.specificity, parts: this.parts};
  }
}

function validateAttribute(content) {
  const parser = new SelectorParser(content.trim(), 0, {});
  const text = parser.text;
  if (!text) fail("Der Attributselektor ist leer.");
  if (text[0] === "|") parser.index++;
  else {
    if (text[0] === "*") parser.index++; else parser.identifier();
    if (text[parser.index] === "|" && text[parser.index + 1] !== "=") parser.index++;
    else {
      if (text[0] === "*") fail("Nach dem Namensraum fehlt der Attributname.");
      parser.trivia();
      return finishAttribute(parser);
    }
  }
  parser.identifier();
  parser.trivia();
  finishAttribute(parser);
}

function finishAttribute(parser) {
  if (parser.index === parser.text.length) return;
  const remainder = parser.text.slice(parser.index);
  const operator = remainder.match(/^(?:[~|^$*]?=)/)?.[0];
  if (!operator) fail("Der Attributvergleich ist nicht vollständig.");
  parser.index += operator.length;
  parser.trivia();
  if (parser.text[parser.index] === '"' || parser.text[parser.index] === "'") parser.index = stringEnd(parser.text, parser.index);
  else parser.identifier();
  parser.trivia();
  if (parser.index < parser.text.length) {
    if (!["i", "s"].includes(parser.identifier().toLowerCase())) fail("Nach dem Attributwert ist nur die Kennzeichnung i oder s erlaubt.");
    parser.trivia();
  }
  if (parser.index !== parser.text.length) fail("Der Attributselektor enthält zusätzliche Zeichen.");
}

function splitNth(content) {
  const match = content.match(/^(.*?)\s+of(?=\s|[.#[:*|])/is);
  if (!match) return {formula: content.trim(), selectors: null};
  return {formula: match[1].trim(), selectors: content.slice(match[0].length).trim()};
}

function validateValueFunction(name, content) {
  if (name === "dir") {
    if (!/^(ltr|rtl)$/i.test(content.trim())) fail(":dir() benötigt ltr oder rtl.");
    return;
  }
  const values = splitList(content);
  if (name === "state" && values.length !== 1) fail(":state() benötigt genau einen Zustandsnamen.");
  for (const value of values) {
    const quoted = value[0] === '"' || value[0] === "'";
    if (name === "lang" && quoted && stringEnd(value, 0) === value.length) continue;
    if (!value || identifierEnd(value, 0) !== value.length) fail(`Das Argument von :${name}() wird in dieser Schreibweise nicht unterstützt.`, "unsupported");
  }
}

function parseList(text, depth = 0, context = {}) {
  if (depth > MAX_DEPTH) fail("Der Selektor ist für diese Ansicht zu tief verschachtelt.", "limit");
  if (!text.trim() && context.allowEmpty) return [];
  return splitList(text).map(branch => {
    if (!branch) fail("Die Selektorliste enthält einen leeren Eintrag.");
    return new SelectorParser(branch, depth, context).parse();
  });
}

export function analyzeSpecificity(source) {
  if (typeof source !== "string") return {ok: false, kind: "invalid", error: "Geben Sie einen CSS-Selektor ein."};
  if (source.length > MAX_LENGTH) return {ok: false, kind: "limit", error: "Bitte verwenden Sie höchstens 4096 Zeichen pro Eingabe."};
  try {
    return {ok: true, selectors: parseList(source)};
  } catch (error) {
    if (error instanceof SelectorError) return {ok: false, kind: error.kind, error: error.message};
    throw error;
  }
}

export function extractStylesheetSelectors(cssText, Stylesheet = globalThis.CSSStyleSheet) {
  if (typeof cssText !== "string") return {selectors: [], note: "Wählen Sie eine gelesene CSS-Quelle oder geben Sie eigene Selektoren ein."};
  if (cssText.length > 300000) return {selectors: [], note: "Die CSS-Quelle ist für die Selektorauswahl zu groß. Kopieren Sie einen einzelnen Selektor in A oder B."};
  if (typeof Stylesheet !== "function") return {selectors: [], note: "Die automatische Selektorauswahl ist hier nicht verfügbar. Die manuelle Eingabe bleibt nutzbar."};
  try {
    const sheet = new Stylesheet();
    // Detached by design: source CSS must never style this viewer or load imports.
    sheet.replaceSync(cssText);
    const selectors = [];
    let limited = false;
    let visited = 0;
    function visit(rules, depth, nested) {
      if (depth > 12) { limited = true; return; }
      for (const rule of rules ?? []) {
        if (++visited > 1000 || selectors.length >= 200) { limited = true; return; }
        const isStyle = typeof rule.selectorText === "string";
        if (isStyle) selectors.push({selector: rule.selectorText, nested});
        if (rule.cssRules) visit(rule.cssRules, depth + 1, nested || isStyle);
      }
    }
    visit(sheet.cssRules, 0, false);
    return {selectors, note: (limited ? "Die Auswahl wurde begrenzt. " : "") + "Selektoren der gewählten CSS-Quelle; @import wird nicht nachgeladen. Bedingungen und Elementtreffer werden nicht geprüft. Verschachtelte Regeln benötigen ihren Elternkontext."};
  } catch {
    return {selectors: [], note: "Die CSS-Quelle lässt sich hier nicht in eine Selektorauswahl umwandeln. Geben Sie einen Selektor direkt ein."};
  }
}
