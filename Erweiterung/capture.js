// Chrome kopiert diese Funktion und ihre Argumente in die isolierte Umgebung
// der Ursprungsseite. Gemeinsame DOM-Helfer bleiben innerhalb dieser Grenze.
export function inspectDOM(request, limits) {
  const notes = new Set();
  const encoder = new TextEncoder();
  const selectorCache = new WeakMap();
  const positionCache = new WeakMap();
  const ownOverlay = globalThis[Symbol.for("dom-baum-unterricht-overlay")]?.host;
  const capturedAt = new Date().toISOString();
  const htmlNamespace = "http://www.w3.org/1999/xhtml";
  const svgNamespace = "http://www.w3.org/2000/svg";
  let remainingBytes = limits.maxPayloadBytes - limits.payloadReserveBytes;
  let siblingScans = 0;

  function failure(error) {
    return {ok: false, error};
  }

  function byteLength(value) {
    return encoder.encode(JSON.stringify(value)).length;
  }

  function finish(data) {
    const response = {ok: true, data: {...data, capturedAt, notes: Array.from(notes)}};
    if (byteLength(response) > limits.maxPayloadBytes) {
      return failure("Die Datenmenge überschreitet die Ausgabegrenze. Wählen Sie einen kleineren Ausschnitt oder eine genauere Abfrage.");
    }
    return response;
  }

  function reserveRecord(record) {
    const bytes = byteLength(record) + 16;
    if (bytes > remainingBytes) {
      notes.add("Die Ausgabe wurde an der Datengrenze von 2 MB begrenzt. Wählen Sie einen kleineren Ausschnitt oder eine genauere Abfrage.");
      return false;
    }
    remainingBytes -= bytes;
    return true;
  }

  function clip(value, maximum) {
    const content = String(value ?? "");
    if (content.length <= maximum) return content;
    notes.add("Lange Namen, Textinhalte, Attributwerte oder Seitenangaben werden gekürzt angezeigt.");
    return /^\s*$/.test(content) ? content.slice(0, maximum) : content.slice(0, maximum - 1) + "…";
  }

  function describeInterface(node) {
    return {
      interfaceName: clip(Object.prototype.toString.call(node).slice(8, -1), limits.maxInterfaceLength),
      namespaceURI: node.namespaceURI == null ? null : clip(node.namespaceURI, limits.maxNamespaceLength),
      localName: node.localName == null ? null : clip(node.localName, limits.maxNameLength)
    };
  }

  function noteMissingSelector() {
    notes.add("Für einzelne Elemente war innerhalb der Grenzen kein eindeutiger CSS-Selektor möglich. Diese Elemente lassen sich nicht auf der Webseite markieren.");
    return "";
  }

  function childPosition(element) {
    if (positionCache.has(element)) return positionCache.get(element);
    const pending = [];
    let cursor = element;
    while (cursor && !positionCache.has(cursor)) {
      if (++siblingScans > limits.maxSiblingScan) return null;
      pending.push(cursor);
      cursor = cursor.previousElementSibling;
    }
    let index = cursor ? positionCache.get(cursor) : 0;
    for (let position = pending.length - 1; position >= 0; position--) {
      positionCache.set(pending[position], ++index);
    }
    return positionCache.get(element);
  }

  function uniqueIdSelector(element) {
    if (typeof element.id !== "string" || !element.id || element.id.length > limits.maxSelectorLength) return "";
    const selector = "#" + CSS.escape(element.id);
    if (selector.length > limits.maxSelectorLength) return "";
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element ? selector : "";
  }

  function selectorFor(element) {
    if (selectorCache.has(element)) return selectorCache.get(element);
    const parts = [];
    let current = element;
    let depth = 0;
    try {
      while (current && current.nodeType === 1) {
        if (++depth > limits.maxSelectorDepth) return noteMissingSelector();
        const cached = selectorCache.get(current);
        if (cached) { parts.unshift(cached); break; }
        const idSelector = uniqueIdSelector(current);
        if (idSelector) { parts.unshift(idSelector); break; }
        if (!current.parentElement) { parts.unshift(":root"); break; }
        const position = childPosition(current);
        if (position === null) return noteMissingSelector();
        parts.unshift("*:nth-child(" + position + ")");
        current = current.parentElement;
      }
      const selector = parts.join(" > ");
      if (!selector || selector.length > limits.maxSelectorLength) return noteMissingSelector();
      const matches = document.querySelectorAll(selector);
      if (matches.length !== 1 || matches[0] !== element) return noteMissingSelector();
      selectorCache.set(element, selector);
      return selector;
    } catch {
      return noteMissingSelector();
    }
  }

  function readAttributes(node) {
    const count = node.attributes?.length || 0;
    const attributes = [];
    for (let index = 0; index < Math.min(count, limits.maxAttributes); index++) {
      const attribute = node.attributes[index];
      attributes.push({
        name: clip(attribute.name, limits.maxAttributeNameLength),
        value: clip(attribute.value, limits.maxAttributeValueLength)
      });
    }
    if (count > attributes.length) {
      notes.add("Bei Elementen mit vielen Attributen werden nur die ersten 32 Attribute gezeigt. Die Gesamtzahl bleibt erhalten.");
    }
    return {attributes, attributesCount: count};
  }

  function nodeLabel(node, metadata) {
    if (node.nodeType === 1) return "<" + metadata.localName + ">";
    if (node.nodeType === 10) return "<!DOCTYPE " + clip(node.name, limits.maxNameLength) + ">";
    return clip(node.nodeName, limits.maxNameLength);
  }

  function describeNode(node, id, parentId) {
    const types = {
      1: "element", 3: "text", 4: "cdata", 7: "processingInstruction",
      8: "comment", 9: "document", 10: "doctype", 11: "fragment"
    };
    const metadata = describeInterface(node);
    const overlayChild = ownOverlay?.parentNode === node ? 1 : 0;
    return {
      id, parentId,
      type: node.nodeType,
      typeName: types[node.nodeType] || "other",
      nodeName: clip(node.nodeName, limits.maxNameLength),
      label: nodeLabel(node, metadata),
      ...metadata,
      value: [3, 4, 7, 8].includes(node.nodeType) ? clip(node.nodeValue, limits.maxTextLength) : "",
      isWhitespace: node.nodeType === 3 && /^\s*$/.test(node.nodeValue || ""),
      ...readAttributes(node),
      childIds: [],
      elementChildrenCount: (node.children?.length || 0) - overlayChild,
      childNodesCount: node.childNodes.length - overlayChild,
      selector: node.nodeType === 1 ? selectorFor(node) : "",
      omitted: false
    };
  }

  function omitSourceText(node) {
    if (node.nodeType !== 1) return false;
    if (node.namespaceURI === htmlNamespace && node.localName === "iframe") {
      notes.add("Eingebettete Seiten in iframe-Elementen werden nicht eingelesen. Öffnen Sie diese bei Bedarf in einem eigenen Tab.");
    }
    if (node.shadowRoot) notes.add("Shadow-DOM-Inhalte werden nicht eingelesen; dargestellt wird der normale Dokumentbaum (Light DOM).");
    if (node.namespaceURI === htmlNamespace && node.localName === "template") {
      notes.add("Der separate Inhalt von template-Elementen wird hier nicht eingelesen.");
    }
    const scriptingNamespace = node.namespaceURI === htmlNamespace || node.namespaceURI === svgNamespace;
    const isSource = node.localName === "script" || node.localName === "style";
    if (scriptingNamespace && isSource && node.childNodes.length) {
      notes.add("Textinhalte von script- und style-Elementen sind ausgeblendet. Die Elemente selbst bleiben im Baum.");
      return true;
    }
    return false;
  }

  function captureTree() {
    let start = document;
    if (request.selector) {
      try { start = document.querySelector(request.selector); }
      catch { return failure("Der CSS-Selektor ist ungültig. Verwenden Sie zum Beispiel main, #inhalt oder .karte."); }
      if (!start) return failure("Kein Element passt zu diesem CSS-Selektor. Prüfen Sie die Schreibweise oder lesen Sie die ganze Seite ein.");
    }
    const title = clip(document.title || "Unbenannte Seite", limits.maxTitleLength);
    const url = clip(location.href, limits.maxUrlLength);
    const nodes = [];
    let truncated = false;

    function appendNode(node, parentId, depth) {
      if (nodes.length >= limits.maxNodes) {
        truncated = true;
        notes.add("Der Baum ist auf 3.500 Knoten begrenzt. Lesen Sie bei großen Seiten einen Teilbaum ein.");
        return null;
      }
      const record = describeNode(node, "n" + nodes.length, parentId);
      if (!reserveRecord(record)) { truncated = true; return null; }
      nodes.push(record);
      if (omitSourceText(node)) { record.omitted = true; return record.id; }
      if (depth >= limits.maxDepth && node.childNodes.length) {
        record.omitted = true;
        truncated = true;
        notes.add("Sehr tiefe Teilbäume werden ab Ebene 80 abgeschnitten. Wählen Sie einen kleineren Teilbaum.");
        return record.id;
      }
      for (const child of node.childNodes) {
        if (child === ownOverlay) continue;
        const childId = appendNode(child, record.id, depth + 1);
        if (childId === null) { record.omitted = true; break; }
        record.childIds.push(childId);
      }
      return record.id;
    }

    const root = appendNode(start, null, 0);
    if (root === null) return failure("Der gewählte Ausschnitt überschreitet die Datengrenze. Wählen Sie ein kleineres Element.");
    return finish({title, url, root, nodes, truncated});
  }

  function queryDocument(method, query) {
    switch (method) {
      case "querySelector": return document.querySelector(query);
      case "querySelectorAll": return document.querySelectorAll(query);
      case "getElementById": return document.getElementById(query);
      case "getElementsByClassName": return document.getElementsByClassName(query);
      case "getElementsByTagName": return document.getElementsByTagName(query);
      default: throw new Error("Unbekannte Methode");
    }
  }

  function inspectSelection() {
    const {method, query} = request;
    let result;
    try { result = queryDocument(method, query); }
    catch { return failure("Die DOM-Abfrage ist ungültig. Prüfen Sie die Methode und bei querySelector oder querySelectorAll den CSS-Selektor."); }
    const single = method === "querySelector" || method === "getElementById";
    const total = single ? (result ? 1 : 0) : result.length;
    const items = [];
    for (let index = 0; index < Math.min(total, limits.maxItems); index++) {
      const element = single ? result : result[index];
      const metadata = describeInterface(element);
      const item = {
        selector: selectorFor(element),
        label: "<" + metadata.localName + ">",
        nodeType: element.nodeType,
        ...metadata
      };
      if (!reserveRecord(item)) break;
      items.push(item);
    }
    if (total > items.length) {
      notes.add("Die Abfrage liefert " + total + " Treffer. Die ersten " + items.length + " werden einzeln angezeigt.");
    }
    return finish({
      method, query,
      resultType: single ? (result ? "Element" : "null") : method === "querySelectorAll" ? "NodeList" : "HTMLCollection",
      interfaceName: single && result ? describeInterface(result).interfaceName : null,
      live: single ? null : method !== "querySelectorAll",
      total, items, truncated: total > items.length
    });
  }

  if (request.type === "capture") return captureTree();
  if (request.type === "inspectSelection") return inspectSelection();
  return failure("Diese DOM-Aktion wird nicht unterstützt.");
}
