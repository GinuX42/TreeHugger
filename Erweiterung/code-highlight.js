const JAVASCRIPT_KEYWORDS = new Set([
  "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "from",
  "function", "get", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return",
  "set", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined",
  "var", "void", "while", "with", "yield"
]);
const EXPRESSION_KEYWORDS = new Set(["await", "case", "delete", "else", "in", "instanceof", "new", "of", "return", "throw", "typeof", "void", "yield"]);
const CONTROL_KEYWORDS = new Set(["if", "for", "while", "with", "switch", "catch"]);
const JAVASCRIPT_IDENTIFIER = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/uy;
const JAVASCRIPT_NUMBER = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*n?|0[bB][01](?:_?[01])*n?|0[oO][0-7](?:_?[0-7])*n?|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?n?)/y;
const CSS_IDENTIFIER = /(?:--)?-?[_\p{ID_Start}][\w\p{ID_Continue}-]*/uy;
const CSS_NUMBER = /(?:\d*\.)?\d+(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?/y;
const CSS_COLOR = /#(?:[\da-fA-F]{8}|[\da-fA-F]{6}|[\da-fA-F]{4}|[\da-fA-F]{3})(?![\da-fA-F])/y;
const HTML_TAG_START = /<(\/?)([a-zA-Z][\w:.-]*)/y;

function matchAt(pattern, source, position) {
  pattern.lastIndex = position;
  return pattern.exec(source);
}

function createTokenWriter() {
  const tokens = [];
  function write(text, kind = "plain") {
    if (!text) return;
    const previous = tokens.at(-1);
    if (previous?.kind === kind) previous.text += text;
    else tokens.push({text, kind});
  }
  return {tokens, write};
}

function scanQuoted(source, start, allowLineBreaks = false) {
  const quote = source[start];
  let position = start + 1;
  while (position < source.length) {
    const character = source[position++];
    if (character === "\\") position = Math.min(source.length, position + 1);
    else if (character === quote) break;
    else if (!allowLineBreaks && (character === "\n" || character === "\r")) break;
  }
  return position;
}

function scanLineComment(source, start) {
  let position = start;
  while (position < source.length && source[position] !== "\n" && source[position] !== "\r") position++;
  return position;
}

function scanDelimited(source, start, closing) {
  const end = source.indexOf(closing, start);
  return end < 0 ? source.length : end + closing.length;
}

function scanRegexLiteral(source, start) {
  let position = start + 1;
  let inCharacterClass = false;
  while (position < source.length) {
    const character = source[position];
    if (character === "\n" || character === "\r") return {end: position, closed: false};
    if (character === "\\") {
      position += 2;
      continue;
    }
    position++;
    if (character === "[") inCharacterClass = true;
    else if (character === "]") inCharacterClass = false;
    else if (character === "/" && !inCharacterClass) {
      while (position < source.length && /[a-z]/i.test(source[position])) position++;
      return {end: position, closed: true};
    }
  }
  return {end: source.length, closed: false};
}

function scanTemplateLiteral(source, start) {
  const contexts = [{kind: "template"}];
  let position = start + 1;
  while (position < source.length && contexts.length) {
    const context = contexts.at(-1);
    const character = source[position];
    if (context.kind === "template") {
      if (character === "\\") position = Math.min(source.length, position + 2);
      else if (character === "`") { contexts.pop(); position++; }
      else if (source.startsWith("${", position)) {
        contexts.push({kind: "expression", depth: 1, expressionAllowed: true});
        position += 2;
      } else position++;
      continue;
    }
    if (character === "'" || character === '"') {
      position = scanQuoted(source, position);
      context.expressionAllowed = false;
    } else if (character === "`") {
      contexts.push({kind: "template"});
      context.expressionAllowed = false;
      position++;
    } else if (source.startsWith("//", position)) {
      position = scanLineComment(source, position);
    } else if (source.startsWith("/*", position)) {
      position = scanDelimited(source, position + 2, "*/");
    } else if (character === "/" && context.expressionAllowed) {
      position = scanRegexLiteral(source, position).end;
      context.expressionAllowed = false;
    } else if (character === "{") {
      context.depth++;
      context.expressionAllowed = true;
      position++;
    } else if (character === "}") {
      if (--context.depth === 0) contexts.pop();
      context.expressionAllowed = false;
      position++;
    } else {
      const identifier = matchAt(JAVASCRIPT_IDENTIFIER, source, position);
      const number = identifier ? null : matchAt(JAVASCRIPT_NUMBER, source, position);
      if (identifier || number) {
        position += (identifier || number)[0].length;
        context.expressionAllowed = identifier ? EXPRESSION_KEYWORDS.has(identifier[0]) : false;
      } else {
        if (!/\s/.test(character)) context.expressionAllowed = /[([{=,:;!?&|+*%<>~^-]/.test(character);
        position++;
      }
    }
  }
  return position;
}

function tokenizeJavaScript(source, write) {
  let position = 0;
  let expressionAllowed = true;
  let pendingControl = false;
  let afterDot = false;
  const parentheses = [];
  while (position < source.length) {
    const start = position;
    const character = source[position];
    if (source.startsWith("//", position)) {
      position = scanLineComment(source, position);
      write(source.slice(start, position), "comment");
    } else if (source.startsWith("/*", position)) {
      position = scanDelimited(source, position + 2, "*/");
      write(source.slice(start, position), "comment");
    } else if (character === "'" || character === '"' || character === "`") {
      position = character === "`" ? scanTemplateLiteral(source, position) : scanQuoted(source, position);
      write(source.slice(start, position), "string");
      expressionAllowed = false;
      afterDot = false;
    } else if (character === "/" && expressionAllowed && source[position + 1] !== "=") {
      const literal = scanRegexLiteral(source, position);
      position = literal.end;
      // Ein unvollständiger Regex-Kandidat bleibt neutral, statt den Rest mehrfach zu durchsuchen.
      write(source.slice(start, position), literal.closed ? "string" : "plain");
      expressionAllowed = false;
      afterDot = false;
    } else {
      const identifier = matchAt(JAVASCRIPT_IDENTIFIER, source, position);
      const number = identifier ? null : matchAt(JAVASCRIPT_NUMBER, source, position);
      if (identifier) {
        const word = identifier[0];
        write(word, !afterDot && JAVASCRIPT_KEYWORDS.has(word) ? "keyword" : "plain");
        position += word.length;
        pendingControl = !afterDot && CONTROL_KEYWORDS.has(word);
        expressionAllowed = !afterDot && EXPRESSION_KEYWORDS.has(word);
        afterDot = false;
      } else if (number) {
        write(number[0], "number");
        position += number[0].length;
        expressionAllowed = false;
        afterDot = false;
      } else {
        position++;
        const isPunctuation = /[{}()[\].,;:?~+\-*%&|^!<>=/]/.test(character);
        write(character, isPunctuation ? "punctuation" : "plain");
        if (/\s/.test(character)) continue;
        if (character === "(") {
          parentheses.push(pendingControl);
          expressionAllowed = true;
        } else if (character === ")") expressionAllowed = parentheses.pop() === true;
        else if (character === "]" || character === "}" || character === ".") expressionAllowed = false;
        else if ((character === "+" || character === "-") && source[position] === character) {
          write(source[position++], "punctuation");
        } else expressionAllowed = isPunctuation;
        pendingControl = false;
        afterDot = character === ".";
      }
    }
  }
}

function scanCssUrl(source, start) {
  let position = start;
  while (position < source.length) {
    const character = source[position];
    if (character === "'" || character === '"') position = scanQuoted(source, position, true);
    else if (character === "\\") position = Math.min(source.length, position + 2);
    else if (character === ")") return position + 1;
    else position++;
  }
  return position;
}

function tokenizeCss(source, write) {
  let position = 0;
  let blockDepth = 0;
  let inValue = false;
  while (position < source.length) {
    const start = position;
    const character = source[position];
    if (source.startsWith("/*", position)) {
      position = scanDelimited(source, position + 2, "*/");
      write(source.slice(start, position), "comment");
    } else if (character === "'" || character === '"') {
      position = scanQuoted(source, position, true);
      write(source.slice(start, position), "string");
    } else {
      const color = inValue ? matchAt(CSS_COLOR, source, position) : null;
      const number = color ? null : matchAt(CSS_NUMBER, source, position);
      const identifier = color || number ? null : matchAt(CSS_IDENTIFIER, source, position + (character === "@" ? 1 : 0));
      if (color || number) {
        const value = (color || number)[0];
        write(value, "number");
        position += value.length;
      } else if (identifier) {
        position += identifier[0].length + (character === "@" ? 1 : 0);
        let next = position;
        while (next < source.length && /\s/.test(source[next])) next++;
        if (identifier[0].toLowerCase() === "url" && source[next] === "(") {
          position = scanCssUrl(source, next + 1);
          write(source.slice(start, position), "string");
        } else {
          const property = identifier[0].startsWith("--") || (blockDepth > 0 && source[next] === ":");
          const keyword = character === "@" || source[next] === "(" || identifier[0] === "important";
          write(source.slice(start, position), property ? "attribute" : keyword ? "keyword" : "plain");
        }
      } else {
        write(character, /[{}()[\]:;,>+~*=!|]/.test(character) ? "punctuation" : "plain");
        if (character === "{") { blockDepth++; inValue = false; }
        else if (character === "}") { blockDepth = Math.max(0, blockDepth - 1); inValue = false; }
        else if (character === ";") inValue = false;
        else if (character === ":" && blockDepth) inValue = true;
        position++;
      }
    }
  }
}

function tokenizeTag(source, start, match, write) {
  write("<" + match[1], "punctuation");
  write(match[2], "tag");
  let position = start + match[0].length;
  let expectingValue = false;
  while (position < source.length) {
    const character = source[position];
    if (source.startsWith("/>", position)) { write("/>", "punctuation"); return position + 2; }
    if (character === ">") { write(">", "punctuation"); return position + 1; }
    if (/\s/.test(character)) { write(character); position++; continue; }
    if (character === "=") { write(character, "punctuation"); expectingValue = true; position++; continue; }
    if (character === '"' || character === "'") {
      const end = scanQuoted(source, position, true);
      write(source.slice(position, end), "string");
      position = end;
    } else {
      const valueStart = position;
      while (position < source.length && !/[\s=>]/.test(source[position]) && !source.startsWith("/>", position)) position++;
      write(source.slice(valueStart, position), expectingValue ? "string" : "attribute");
    }
    expectingValue = false;
  }
  return position;
}

function tokenizeHtml(source, write) {
  let position = 0;
  while (position < source.length) {
    const start = position;
    if (source.startsWith("<!--", position)) {
      position = scanDelimited(source, position + 4, "-->");
      write(source.slice(start, position), "comment");
      continue;
    }
    if (source.startsWith("<!", position) || source.startsWith("<?", position)) {
      position = scanDelimited(source, position + 2, source.startsWith("<![CDATA[", position) ? "]]>" : ">");
      write(source.slice(start, position), "tag");
      continue;
    }
    const match = matchAt(HTML_TAG_START, source, position);
    if (match) {
      position = tokenizeTag(source, position, match, write);
      const name = match[2].toLowerCase();
      if (!match[1] && ["script", "style", "textarea", "title"].includes(name)) {
        const closingTag = new RegExp("</" + name + "(?=[\\s/>])", "gi");
        closingTag.lastIndex = position;
        const end = closingTag.exec(source)?.index ?? source.length;
        const content = source.slice(position, end);
        if (name === "script") tokenizeJavaScript(content, write);
        else if (name === "style") tokenizeCss(content, write);
        else write(content);
        position = end;
      }
    } else {
      position = source.indexOf("<", position + 1);
      if (position < 0) position = source.length;
      write(source.slice(start, position));
    }
  }
}

export function tokenizeCode(source, language) {
  if (typeof source !== "string") throw new TypeError("Der Quellcode muss eine Zeichenfolge sein.");
  const {tokens, write} = createTokenWriter();
  if (language === "html") tokenizeHtml(source, write);
  else if (language === "css") tokenizeCss(source, write);
  else if (language === "javascript" || language === "js") tokenizeJavaScript(source, write);
  else write(source);
  return tokens;
}
