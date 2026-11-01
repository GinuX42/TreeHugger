export const BACKEND_LIMITS = Object.freeze({
  inputLength: 4096,
  maxNodes: 3500,
  maxDepth: 80,
  maxItems: 200,
  maxTextLength: 1200,
  maxAttributes: 32,
  maxAttributeNameLength: 120,
  maxAttributeValueLength: 300,
  maxNameLength: 120,
  maxInterfaceLength: 80,
  maxNamespaceLength: 240,
  maxTitleLength: 300,
  maxUrlLength: 2000,
  maxSelectorLength: 4096,
  maxSelectorDepth: 160,
  maxSiblingScan: 50000,
  maxPayloadBytes: 2000000,
  payloadReserveBytes: 16384
});

export const SELECTION_METHODS = Object.freeze([
  "querySelector", "querySelectorAll", "getElementById",
  "getElementsByClassName", "getElementsByTagName"
]);

export const SOURCE_LIMITS = Object.freeze({
  maxResources: 80,
  maxScannedElements: 12000,
  maxDomNodes: 16000,
  maxDomDepth: 120,
  maxAttributesPerElement: 512,
  maxDomBytes: 500000,
  maxInlineBytes: 200000,
  maxFileBytes: 500000,
  maxPayloadBytes: 2000000,
  reserveBytes: 32768,
  maxUrlLength: 4096,
  fetchTimeoutMs: 8000
});

function isOwnViewer(sender, extensionId, viewerUrl) {
  if (sender?.id !== extensionId || typeof sender.url !== "string") return false;
  if (sender.frameId !== undefined && sender.frameId !== 0) return false;
  try {
    const actual = new URL(sender.url);
    const expected = new URL(viewerUrl);
    return actual.protocol === expected.protocol && actual.host === expected.host &&
      actual.pathname === expected.pathname && actual.hash === "";
  } catch {
    return false;
  }
}

function invalidRequest(error) {
  return {authorized: true, ok: false, error};
}

export function parseViewerRequest(message, sender, extensionId, viewerUrl) {
  if (!isOwnViewer(sender, extensionId, viewerUrl)) return {authorized: false};
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return invalidRequest("Die Anfrage hat kein gültiges Format. Öffnen Sie die Erweiterung erneut.");
  }
  if (!["capture", "highlight", "inspectSelection", "readSources", "readSourceFile"].includes(message.type)) {
    return invalidRequest("Diese Aktion wird nicht unterstützt.");
  }
  if (!Number.isSafeInteger(message.tabId) || message.tabId < 0) {
    return invalidRequest("Die Nummer der Ursprungsseite ist ungültig. Öffnen Sie die Erweiterung erneut.");
  }
  const parameters = new URL(sender.url).searchParams;
  const names = Array.from(parameters.keys());
  if (names.length !== 1 || names[0] !== "tab" || parameters.get("tab") !== String(message.tabId)) {
    return invalidRequest("Die Anfrage gehört nicht zur Ursprungsseite dieses DOM-Baums. Öffnen Sie die Erweiterung dort erneut.");
  }
  const request = {type: message.type, tabId: message.tabId};
  if (message.type === "readSources") {
    return {authorized: true, ok: true, request};
  }
  if (message.type === "readSourceFile") {
    if (typeof message.resourceId !== "string" || !/^(script|link):\d{1,5}$/.test(message.resourceId)) {
      return invalidRequest("Wählen Sie eine verknüpfte Datei aus der eingelesenen Quellcodeliste.");
    }
    if (typeof message.expectedUrl !== "string" || !message.expectedUrl || message.expectedUrl.length > SOURCE_LIMITS.maxUrlLength) {
      return invalidRequest("Die Dateiadresse ist ungültig. Lesen Sie die Quellcodeliste erneut ein.");
    }
    request.resourceId = message.resourceId;
    request.expectedUrl = message.expectedUrl;
  } else if (message.type === "inspectSelection") {
    if (!SELECTION_METHODS.includes(message.method)) {
      return invalidRequest("Wählen Sie eine der fünf angebotenen DOM-Abfragemethoden.");
    }
    if (typeof message.query !== "string" || message.query.length > BACKEND_LIMITS.inputLength) {
      return invalidRequest("Die Suchangabe muss eine Zeichenfolge mit höchstens 4.096 Zeichen sein.");
    }
    if (message.contextSelector !== undefined && message.contextSelector !== "") {
      return invalidRequest("Die Abfrage arbeitet auf dem gesamten Dokument. Ein zusätzlicher Kontextselektor wird nicht unterstützt.");
    }
    request.method = message.method;
    request.query = message.query;
  } else {
    const selector = message.selector === undefined ? "" : message.selector;
    if (typeof selector !== "string" || selector.length > BACKEND_LIMITS.inputLength) {
      return invalidRequest("Der CSS-Selektor muss eine Zeichenfolge mit höchstens 4.096 Zeichen sein.");
    }
    request.selector = selector.trim();
    if (message.type === "highlight" && !request.selector) {
      return invalidRequest("Nur Elemente mit einem eindeutigen CSS-Selektor lassen sich markieren.");
    }
  }
  return {authorized: true, ok: true, request};
}
