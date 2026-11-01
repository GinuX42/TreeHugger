export function getSourceTabId(search) {
  const value = new URLSearchParams(search).get("tab");
  if (!value || !/^(0|[1-9]\d*)$/.test(value)) return null;
  const tabId = Number(value);
  return Number.isSafeInteger(tabId) ? tabId : null;
}

export function createSourceClient(pageLocation, runtime) {
  const tabId = getSourceTabId(pageLocation.search);
  const isExtension = pageLocation.protocol === "chrome-extension:";
  const available = isExtension && tabId !== null && Boolean(runtime);

  async function request(type, payload = {}) {
    if (!available) throw new Error("Diese Abfrage benötigt die Quellseite. Öffnen Sie eine Webseite und starten Sie TreeHugger über das Erweiterungssymbol.");
    let reply;
    try {
      reply = await runtime.sendMessage({...payload, type, tabId});
    } catch {
      throw new Error("Die Erweiterung ist nicht erreichbar. Öffnen Sie sie auf der Ursprungsseite erneut; möglicherweise wurde sie inzwischen aktualisiert.");
    }
    if (!reply?.ok) throw new Error(reply?.error || "Die Quellseite konnte nicht gelesen werden.");
    return reply.data;
  }

  return {request, available, isExtension};
}
