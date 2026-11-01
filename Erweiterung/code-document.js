export function splitCodePages(code, maxCharacters = 100000, maxLines = 2500) {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 1 || !Number.isInteger(maxLines) || maxLines < 1) {
    throw new RangeError("Die Abschnittsgrenzen müssen positive ganze Zahlen sein.");
  }
  const pages = [];
  let start = 0;
  let startLine = 1;
  while (start < code.length) {
    let end = Math.min(code.length, start + maxCharacters);
    let cursor = start;
    let newlineCount = 0;
    let lastNewline = -1;
    while (cursor < end) {
      const newline = code.indexOf("\n", cursor);
      if (newline < 0 || newline >= end) break;
      lastNewline = newline;
      newlineCount++;
      cursor = newline + 1;
      if (newlineCount >= maxLines) {
        end = cursor;
        break;
      }
    }
    if (end < code.length && lastNewline >= start) end = lastNewline + 1;
    const before = code.charCodeAt(end - 1);
    const after = code.charCodeAt(end);
    if (before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff) {
      end += end - start > 1 ? -1 : 1;
    }
    const content = code.slice(start, end);
    pages.push({start, end, startLine, content});
    startLine += newlineCount;
    start = end;
  }
  return pages.length ? pages : [{start: 0, end: 0, startLine: 1, content: ""}];
}

export function findCodeMatches(code, query, limit = 2000) {
  if (!query) return [];
  const matches = [];
  let cursor = 0;
  // Exakte Suche erhält die Zeichenpositionen auch bei Unicode-Buchstaben.
  while (matches.length < limit) {
    const start = code.indexOf(query, cursor);
    if (start < 0) break;
    matches.push({start, end: start + query.length});
    cursor = start + Math.max(1, query.length);
  }
  return matches;
}

export function getMatchPage(pages, match) {
  return Math.max(0, pages.findIndex(page => match.start >= page.start && match.start < page.end));
}
