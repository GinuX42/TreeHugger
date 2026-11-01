import {createElement} from "./ui-dom.js";
import {tokenizeCode} from "./code-highlight.js";

const TOKEN_KINDS = new Set(["plain", "comment", "string", "keyword", "number", "tag", "attribute", "punctuation"]);

function tokensInPage(tokens, page) {
  const selected = [];
  let start = 0;
  for (const token of tokens) {
    const end = start + token.text.length;
    if (end > page.start && start < page.end) {
      selected.push({kind: token.kind, text: token.text.slice(Math.max(0, page.start - start), Math.min(token.text.length, page.end - start))});
    }
    if (end >= page.end) break;
    start = end;
  }
  return selected;
}

export function renderCodePage(container, page, language, matches = [], activeMatch = null, documentTokens = null) {
  const rows = [];
  let lineNumber = page.startLine;
  let offset = page.start;
  let matchIndex = Math.max(0, matches.findIndex(match => match.end > page.start));
  let activeRow = null;
  let row;
  let codeCell;

  function appendRow() {
    row = createElement("div", undefined, "code-line");
    const number = createElement("span", lineNumber++, "code-line-number");
    number.setAttribute("aria-hidden", "true");
    codeCell = createElement("span", undefined, "code-line-text");
    row.append(number, codeCell);
    rows.push(row);
  }

  function appendPiece(value, kind) {
    if (!value) return;
    const end = offset + value.length;
    let position = offset;
    while (matchIndex < matches.length && matches[matchIndex].end <= position) matchIndex++;
    while (position < end) {
      const match = matches[matchIndex];
      const highlighted = Boolean(match && position >= match.start && position < match.end);
      const nextBoundary = highlighted ? Math.min(end, match.end) : Math.min(end, match?.start ?? end);
      const span = createElement(highlighted ? "mark" : "span", value.slice(position - offset, nextBoundary - offset), "syntax-" + kind);
      if (highlighted && match === activeMatch) {
        span.classList.add("current-match");
        row.classList.add("current-match-line");
        activeRow = row;
      }
      codeCell.append(span);
      position = nextBoundary;
      if (match && position >= match.end) matchIndex++;
    }
    offset = end;
  }

  appendRow();
  const tokens = documentTokens ? tokensInPage(documentTokens, page) : tokenizeCode(page.content, language);
  for (const token of tokens) {
    const kind = TOKEN_KINDS.has(token.kind) ? token.kind : "plain";
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) {
        offset++;
        appendRow();
      }
      appendPiece(part, kind);
    });
  }
  container.replaceChildren(...rows);
  return activeRow;
}
