// Chrome serialisiert diese Funktion für die isolierte Umgebung der Quellseite.
// Ihre Hilfsfunktionen benötigen deshalb keine importierten Modul-Variablen.
export async function readPageSources(request, limits) {
  const encoder = new TextEncoder();
  const notes = new Set();
  const capturedAt = new Date().toISOString();
  const ownOverlay = globalThis[Symbol.for("dom-baum-unterricht-overlay")]?.host;
  const htmlNamespace = "http://www.w3.org/1999/xhtml";
  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let remainingPayload = limits.maxPayloadBytes - limits.reserveBytes;

  function failure(error) {
    return {ok: false, error};
  }

  function byteLength(value) {
    return encoder.encode(value).length;
  }

  function shortLabel(value, maximum = 160) {
    const content = String(value ?? "");
    return content.length <= maximum ? content : content.slice(0, maximum - 1) + "…";
  }

  function utf8Prefix(value, maximumBytes) {
    const content = String(value ?? "");
    let lower = 0;
    let upper = Math.min(content.length, maximumBytes);
    if (byteLength(content.slice(0, upper)) <= maximumBytes) lower = upper;
    else while (lower < upper) {
      const middle = Math.ceil((lower + upper) / 2);
      if (byteLength(content.slice(0, middle)) <= maximumBytes) lower = middle;
      else upper = middle - 1;
    }
    if (lower > 0 && /[\uD800-\uDBFF]/.test(content[lower - 1])) lower--;
    return content.slice(0, lower);
  }

  function createBuffer(maximumBytes) {
    const chunks = [];
    let bytes = 0;
    let truncated = false;
    function append(value, escape = null) {
      if (truncated) return false;
      const content = String(value ?? "");
      const prefix = utf8Prefix(content, maximumBytes - bytes);
      const escaped = escape ? escape(prefix) : prefix;
      const fitted = utf8Prefix(escaped, maximumBytes - bytes);
      chunks.push(fitted);
      bytes += byteLength(fitted);
      truncated = prefix.length < content.length || fitted.length < escaped.length;
      return !truncated;
    }
    return {append, stop: () => { truncated = true; }, get truncated() { return truncated; }, get content() { return chunks.join(""); }};
  }

  function fitResource(resource) {
    const metadata = {...resource, content: resource.content === null ? null : ""};
    const metadataBytes = byteLength(JSON.stringify(metadata)) + 2;
    if (metadataBytes > remainingPayload) return null;
    let fitted = {...resource};
    if (resource.content !== null && byteLength(JSON.stringify(resource)) + 2 > remainingPayload) {
      let lower = 0;
      let upper = resource.content.length;
      while (lower < upper) {
        const middle = Math.ceil((lower + upper) / 2);
        const candidate = {...resource, content: resource.content.slice(0, middle), truncated: true};
        if (byteLength(JSON.stringify(candidate)) + 2 <= remainingPayload) lower = middle;
        else upper = middle - 1;
      }
      if (lower > 0 && /[\uD800-\uDBFF]/.test(resource.content[lower - 1])) lower--;
      fitted = {...resource, content: resource.content.slice(0, lower), truncated: true};
      notes.add("Die Quellcode-Ausgabe wurde an der Gesamtgrenze von 2 MB gekürzt.");
    }
    remainingPayload -= byteLength(JSON.stringify(fitted)) + 2;
    return fitted;
  }

  function finish(data) {
    const result = {ok: true, data: {...data, capturedAt, notes: Array.from(notes)}};
    return byteLength(JSON.stringify(result)) <= limits.maxPayloadBytes
      ? result : failure("Die Quellcode-Ausgabe ist zu groß und konnte nicht vollständig übernommen werden.");
  }

  function escapeText(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttribute(value) {
    return escapeText(value).replace(/"/g, "&quot;");
  }

  function serializeDocument() {
    const buffer = createBuffer(limits.maxDomBytes);
    let visitedNodes = 0;
    function visit(node, depth, rawText = false) {
      if (node === ownOverlay || buffer.truncated) return;
      if (++visitedNodes > limits.maxDomNodes || depth > limits.maxDomDepth) { buffer.stop(); return; }
      if (node.nodeType === 3) { buffer.append(node.nodeValue, rawText ? null : escapeText); return; }
      if (node.nodeType === 8) { buffer.append("<!--"); buffer.append(node.nodeValue); buffer.append("-->"); return; }
      if (node.nodeType === 4) { buffer.append("<![CDATA["); buffer.append(node.nodeValue); buffer.append("]]>"); return; }
      if (node.nodeType === 7) { buffer.append("<?" + shortLabel(node.target || node.nodeName)); buffer.append(" " + (node.nodeValue || "")); buffer.append("?>"); return; }
      if (node.nodeType === 10) {
        buffer.append("<!DOCTYPE " + shortLabel(node.name));
        if (node.publicId) { buffer.append(' PUBLIC "'); buffer.append(node.publicId, escapeAttribute); buffer.append('"'); }
        if (node.systemId) { buffer.append(node.publicId ? ' "' : ' SYSTEM "'); buffer.append(node.systemId, escapeAttribute); buffer.append('"'); }
        buffer.append(">\n");
        return;
      }
      if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
      const isElement = node.nodeType === 1;
      const tagName = isElement ? (node.namespaceURI === htmlNamespace ? node.localName : node.nodeName) : "";
      if (isElement) {
        buffer.append("<");
        buffer.append(tagName);
        for (let index = 0; index < node.attributes.length && !buffer.truncated; index++) {
          if (index >= limits.maxAttributesPerElement) { buffer.stop(); break; }
          const attribute = node.attributes[index];
          buffer.append(" " + attribute.name + '="');
          buffer.append(attribute.value, escapeAttribute);
          buffer.append('"');
        }
        buffer.append(">");
        if (node.namespaceURI === htmlNamespace && voidElements.has(node.localName)) return;
      }
      const content = node.namespaceURI === htmlNamespace && node.localName === "template" ? node.content : node;
      const childRawText = node.namespaceURI === htmlNamespace && ["script", "style", "xmp", "iframe", "noembed", "noframes", "plaintext"].includes(node.localName);
      for (const child of content?.childNodes ?? []) {
        visit(child, depth + 1, childRawText);
        if (buffer.truncated) break;
      }
      if (isElement) buffer.append("</" + tagName + ">");
    }
    visit(document, 0);
    if (buffer.truncated) notes.add("Der aktuelle HTML-DOM ist auf 500 kB und eine begrenzte Tiefe/Knotenanzahl begrenzt. Das Ende kann ein unvollständiger Ausschnitt sein.");
    return {content: buffer.content, truncated: buffer.truncated};
  }

  function inlineText(element) {
    const buffer = createBuffer(limits.maxInlineBytes);
    let count = 0;
    function read(node, depth) {
      if (buffer.truncated) return;
      if (++count > limits.maxDomNodes || depth > limits.maxDomDepth) { buffer.stop(); return; }
      if (node.nodeType === 3 || node.nodeType === 4) { buffer.append(node.nodeValue); return; }
      for (const child of node.childNodes ?? []) read(child, depth + 1);
    }
    read(element, 0);
    return {content: buffer.content, truncated: buffer.truncated};
  }

  function resolveResource(element, kind, index) {
    const attribute = kind === "script" ? (element.getAttribute("src") ?? element.getAttribute("href")) : element.getAttribute("href");
    if (attribute === null) return null;
    if (kind === "link" && !(element.getAttribute("rel") || "").toLowerCase().split(/\s+/).includes("stylesheet")) return null;
    let url;
    try { url = new URL(attribute, document.baseURI || location.href); }
    catch { return null; }
    if (url.href.length > limits.maxUrlLength) {
      notes.add("Eine überlange Dateiadresse wurde ausgelassen.");
      return null;
    }
    const supported = ["http:", "https:", "file:"].includes(url.protocol) && !url.username && !url.password;
    return {
      id: kind + ":" + index,
      language: kind === "script" ? "javascript" : "css",
      label: shortLabel(url.pathname.split("/").at(-1) || (kind === "script" ? "Verknüpftes Skript" : "Verknüpftes Stylesheet")),
      origin: "external", url: url.href, content: null,
      status: supported ? "external" : "unavailable", truncated: false,
      note: supported
        ? url.protocol === "file:"
          ? "Lokale Verknüpfung. Mit „Lokale Datei öffnen“ wählen Sie die Quelldatei auf Ihrem Rechner aus."
          : "Verknüpfte Datei. Ihr Inhalt wird erst beim Laden angefordert; Änderungen seit dem Seitenaufruf sind möglich."
        : "Dieses Adressformat wird nicht als Quelldatei gelesen."
    };
  }

  function elementLabel(element) {
    const id = element.getAttribute("id");
    return shortLabel("<" + element.localName + (id ? " id=" + JSON.stringify(id) : "") + ">", 120).replace(/\s+/g, " ").replace(/\*\//g, "* /");
  }

  function collectSources() {
    const resources = [];
    let outputFull = false;
    function add(resource) {
      if (resources.length >= limits.maxResources) {
        outputFull = true;
        notes.add("Es werden höchstens 80 Quellcode-Einträge angezeigt.");
        return;
      }
      const fitted = fitResource(resource);
      if (fitted) {
        resources.push(fitted);
        if (fitted.content !== resource.content) outputFull = true;
      } else {
        outputFull = true;
        notes.add("Weitere Quellcode-Einträge passen nicht in die Ausgabegrenze.");
      }
    }
    add({id: "document:0", language: "html", label: "Aktueller HTML-DOM", origin: "dom", url: shortLabel(location.href, limits.maxUrlLength),
      ...serializeDocument(), status: "ready", note: "Aus dem aktuellen DOM serialisiert. Das ist nicht der ursprüngliche HTML-Text vom Server. Änderungen durch JavaScript sind enthalten; Shadow DOM und eingebettete Dokumente fehlen."});
    const styles = createBuffer(limits.maxInlineBytes);
    const handlers = createBuffer(limits.maxInlineBytes);
    const elements = document.getElementsByTagName("*");
    const indices = {script: 0, style: 0, link: 0};
    for (let position = 0; position < Math.min(elements.length, limits.maxScannedElements); position++) {
      if (outputFull) break;
      if (resources.length >= limits.maxResources) {
        notes.add("Es werden höchstens 80 Quellcode-Einträge angezeigt; die Suche nach weiteren Einträgen wurde beendet.");
        break;
      }
      const element = elements[position];
      if (element === ownOverlay || ownOverlay?.contains(element)) continue;
      const tag = element.localName;
      if (["script", "style", "link"].includes(tag)) {
        const index = indices[tag]++;
        const external = tag === "style" ? null : resolveResource(element, tag, index);
        if (external) add(external);
        else if (tag === "style" || (tag === "script" && element.getAttribute("src") === null && element.getAttribute("href") === null)) {
          const scriptType = (element.getAttribute("type") || "").trim().toLowerCase();
          const isData = tag === "script" && scriptType && !["module", "text/javascript", "application/javascript", "text/ecmascript", "application/ecmascript"].includes(scriptType);
          add({id: tag + ":" + index, language: tag === "style" ? "css" : "javascript",
            label: `${tag === "style" ? "Inline-Stylesheet" : isData ? "Skript-Datenblock" : "Inline-Skript"} ${index + 1}`,
            origin: "inline", url: "", ...inlineText(element), status: "ready",
            note: isData ? "Datenblock im script-Element, Typ: " + shortLabel(scriptType) + ". Kein gewöhnliches ausführbares JavaScript."
              : "Direkter Textinhalt des " + tag + "-Elements in der aktuellen Seite."});
        }
      }
      const style = element.getAttribute("style");
      if (style !== null && !styles.truncated) {
        styles.append("/* style-Attribut an " + elementLabel(element) + " */\n");
        styles.append(style);
        styles.append("\n\n");
      }
      for (let index = 0; index < Math.min(element.attributes.length, limits.maxAttributesPerElement) && !handlers.truncated; index++) {
        const attribute = element.attributes[index];
        if (!/^on[a-z][a-z0-9]*$/i.test(attribute.name)) continue;
        handlers.append("// " + shortLabel(attribute.name) + " an " + elementLabel(element) + "\n");
        handlers.append(attribute.value);
        handlers.append("\n\n");
      }
    }
    if (elements.length > limits.maxScannedElements) notes.add("Die Ressourcensuche wurde nach 12.000 Elementen begrenzt.");
    if (styles.content) add({id: "attributes:style", language: "css", label: "style-Attribute", origin: "inline", url: "", content: styles.content,
      status: "ready", truncated: styles.truncated, note: "Sammlung der CSS-Deklarationen aus style-Attributen. Die Kommentare benennen die Elemente; dies ist kein vollständiges Stylesheet."});
    if (handlers.content) add({id: "attributes:events", language: "javascript", label: "Ereignis-Attribute", origin: "inline", url: "", content: handlers.content,
      status: "ready", truncated: handlers.truncated, note: "Quelltext aus Ereignis-Attributen wie onclick. Der Browser führt solche Attribute im Kontext ihres Elements aus; dies ist keine einzelne Skriptdatei."});
    if (resources.some(resource => resource.truncated)) notes.add("Gekennzeichnete Quellcode-Einträge sind gekürzt. Inline-Inhalte sind auf jeweils 200 kB begrenzt.");
    notes.add("Erfasst werden direkt vorhandene script-/style-Elemente und Stylesheet-Verknüpfungen. Nachgeladene Modulimporte, CSS-Imports und mit addEventListener registrierte Funktionen werden nicht automatisch durchsucht.");
    return finish({title: shortLabel(document.title || "Unbenannte Seite", 300), url: shortLabel(location.href, limits.maxUrlLength), resources});
  }

  function cssomResource(element, resource, reason) {
    if (resource.language !== "css") return null;
    try {
      const rules = element.sheet?.cssRules;
      if (!rules) return null;
      const buffer = createBuffer(limits.maxFileBytes);
      for (const rule of rules) {
        buffer.append(rule.cssText);
        buffer.append("\n");
        if (buffer.truncated) break;
      }
      return {...resource, origin: "cssom", status: "ready", content: buffer.content, truncated: buffer.truncated,
        note: reason + " Gezeigt werden vom Browser rekonstruierte CSSOM-Regeln. Originalformatierung und Kommentare fehlen; @import-Dateien werden nicht zusätzlich gelesen."};
    } catch {
      return null;
    }
  }

  async function fetchResource(resource) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), limits.fetchTimeoutMs);
    let reader;
    let response;
    try {
      response = await fetch(resource.url, {method: "GET", mode: "cors", credentials: "same-origin", redirect: "error",
        referrerPolicy: "no-referrer", signal: controller.signal});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const contentType = response.headers.get("content-type") || "";
      if (contentType && !/^(text\/(css|javascript|ecmascript|plain)|application\/(javascript|ecmascript|x-javascript|json|octet-stream))(?:\s*;|$)/i.test(contentType)) {
        throw new Error("Die Antwort ist keine passende Textdatei.");
      }
      if (!response.body?.getReader) throw new Error("Die Datei kann nicht begrenzt gelesen werden.");
      const charset = /charset\s*=\s*["']?([^\s;"']+)/i.exec(contentType)?.[1] || "utf-8";
      let decoder;
      try { decoder = new TextDecoder(charset); } catch { decoder = new TextDecoder("utf-8"); }
      reader = response.body.getReader();
      const chunks = [];
      let bytes = 0;
      let truncated = false;
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        const remaining = limits.maxFileBytes - bytes;
        const part = value.subarray(0, remaining);
        chunks.push(decoder.decode(part, {stream: true}));
        bytes += part.length;
        if (value.length > remaining) { truncated = true; await reader.cancel(); break; }
      }
      if (!truncated) chunks.push(decoder.decode());
      return {...resource, status: "ready", content: chunks.join(""), truncated,
        note: "Auf Anforderung erneut von der verknüpften Adresse gelesen. Der Inhalt kann sich seit dem Laden der Webseite geändert haben." +
          (truncated ? " Die Datei ist auf 500 kB gekürzt." : "")};
    } catch (error) {
      try {
        if (reader) await reader.cancel();
        else await response?.body?.cancel?.();
      } catch {
        // Ein bereits abgebrochener Stream kann kein zweites Mal geschlossen werden.
      }
      const reason = controller.signal.aborted ? "Die Dateianfrage hat zu lange gedauert." :
        error.message.startsWith("HTTP ") ? "Die Dateianfrage wurde mit " + error.message + " beantwortet." :
        "Die Datei konnte nicht gelesen werden. CORS-Regeln, Weiterleitungen, Netzwerkfehler oder ein unpassender Dateityp können dies verhindern.";
      return {...resource, status: "unavailable", content: null, note: reason};
    } finally {
      clearTimeout(timer);
      if (reader) reader.releaseLock();
    }
  }

  async function readSourceFile() {
    const match = /^(script|link):(\d{1,5})$/.exec(request.resourceId || "");
    if (!match) return failure("Die Quelldatei ist nicht bekannt. Lesen Sie die Quellcodeliste erneut ein.");
    const index = Number(match[2]);
    const element = document.getElementsByTagName(match[1])[index];
    if (!element) return failure("Das verknüpfte Element ist nicht mehr vorhanden. Lesen Sie die Quellcodeliste erneut ein.");
    const resource = resolveResource(element, match[1], index);
    if (!resource || resource.url !== request.expectedUrl) return failure("Die Dateiverknüpfung hat sich geändert. Lesen Sie die Quellcodeliste erneut ein.");
    if (resource.status === "unavailable") return finish(fitResource(resource));
    const protocol = new URL(resource.url).protocol;
    if (protocol === "file:") {
      const reconstructed = cssomResource(element, resource, "Lokale Datei: kein zusätzlicher Dateizugriff.");
      return finish(fitResource(reconstructed ?? {...resource, status: "unavailable",
        note: "Für den Originaltext verwenden Sie „Lokale Datei öffnen“ und wählen die verknüpfte Datei auf Ihrem Rechner aus. Lesbare CSSOM-Regeln können zusätzlich aus dem Browser rekonstruiert werden."}));
    }
    const loaded = await fetchResource(resource);
    const unchanged = document.getElementsByTagName(match[1])[index] === element &&
      resolveResource(element, match[1], index)?.url === resource.url;
    const displayed = loaded.status === "ready" || !unchanged ? loaded : cssomResource(element, resource, loaded.note) ?? loaded;
    return finish(fitResource(displayed));
  }

  if (request.type === "readSources") return collectSources();
  if (request.type === "readSourceFile") return readSourceFile();
  return failure("Diese Quellcode-Aktion wird nicht unterstützt.");
}
