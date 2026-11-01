const MAX_SOURCE_LENGTH = 500000;
const MAX_RESULT_LENGTH = 2000000;
const FORMAT_TIMEOUT_MS = 2000;
const LANGUAGES = new Set(["html", "css", "javascript"]);
let cancelPendingJob = null;

export async function formatCode(source, language) {
  cancelPendingJob?.();
  if (typeof source !== "string") {
    return {code: "", formatted: false, note: "Für diese Auswahl liegt kein lesbarer Code vor."};
  }
  const unchanged = note => ({code: source, formatted: false, note});
  if (!source.trim()) return unchanged("");
  if (!LANGUAGES.has(language)) return unchanged("Diese Sprache wird unverändert angezeigt.");
  if (source.length > MAX_SOURCE_LENGTH) {
    return unchanged("Dieser Code ist für die automatische Einrückung zu groß. Er wird unverändert angezeigt.");
  }
  if (typeof Worker === "undefined") {
    return unchanged("Die automatische Einrückung ist hier nicht verfügbar. Der Code bleibt unverändert.");
  }

  return new Promise(resolve => {
    let worker;
    let timer;
    let completed = false;

    function finish(result) {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
      if (cancelPendingJob === cancelJob) cancelPendingJob = null;
      resolve(result);
    }

    const cancelJob = () => finish(unchanged("Die Formatierung wurde durch eine neue Auswahl ersetzt."));
    cancelPendingJob = cancelJob;

    try {
      // Ein eigener Worker hält auch umfangreichen oder ungewöhnlichen Code von der Oberfläche fern.
      worker = new Worker(new URL("./code-format-worker.js", import.meta.url));
      worker.onmessage = event => {
        const result = event.data;
        if (result?.ok && typeof result.code === "string" && result.code.length <= MAX_RESULT_LENGTH) {
          finish({code: result.code, formatted: true, note: ""});
        } else {
          finish(unchanged("Dieser Code konnte nicht eingerückt werden. Er wird unverändert angezeigt."));
        }
      };
      worker.onerror = event => {
        event.preventDefault?.();
        finish(unchanged("Die automatische Einrückung konnte nicht gestartet werden. Der Code bleibt unverändert."));
      };
      worker.onmessageerror = () => finish(unchanged("Das Formatierungsergebnis war nicht lesbar. Der Code bleibt unverändert."));
      timer = setTimeout(() => {
        finish(unchanged("Die Formatierung wurde abgebrochen, damit die Ansicht bedienbar bleibt. Der Code wird unverändert angezeigt."));
      }, FORMAT_TIMEOUT_MS);
      worker.postMessage({source, language});
    } catch {
      finish(unchanged("Die automatische Einrückung ist hier nicht verfügbar. Der Code bleibt unverändert."));
    }
  });
}
