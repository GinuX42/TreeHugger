import {BACKEND_LIMITS, SOURCE_LIMITS, parseViewerRequest} from "./backend-requests.js";
import {inspectDOM} from "./capture.js";
import {highlightDOM} from "./highlight.js";
import {readPageSources} from "./page-sources.js";

function userError(message) {
  return Object.assign(new Error(message), {userMessage: message});
}

async function getSourceTab(tabId) {
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    throw userError("Der Tab der Ursprungsseite wurde geschlossen. Öffnen Sie die Seite erneut und klicken Sie auf das Erweiterungssymbol.");
  }
  if (!tab.url) {
    throw userError("Chrome erlaubt den Zugriff auf diesen Tab nicht mehr. Gehen Sie zur Ursprungsseite und klicken Sie erneut auf das Erweiterungssymbol.");
  }
  const url = new URL(tab.url);
  const supportedProtocol = ["http:", "https:", "file:"].includes(url.protocol);
  const isStore = url.hostname === "chromewebstore.google.com" ||
    (url.hostname === "chrome.google.com" && url.pathname.startsWith("/webstore"));
  if (!supportedProtocol || isStore) {
    throw userError("Chrome schützt diese Seite vor Erweiterungen. Öffnen Sie eine normale Webseite oder eine lokale HTML-Datei und klicken Sie dort auf das Erweiterungssymbol.");
  }
  if (url.protocol === "file:") {
    const allowed = await new Promise(resolve => chrome.extension.isAllowedFileSchemeAccess(resolve));
    if (!allowed) {
      throw userError("Für lokale HTML-Dateien aktivieren Sie unter chrome://extensions → TreeHugger → Details den „Zugriff auf Datei-URLs“. Öffnen Sie danach die HTML-Datei und klicken Sie erneut auf das Erweiterungssymbol.");
    }
  }
  return tab;
}

function describeFailure(error) {
  if (error?.userMessage) return error.userMessage;
  const message = error?.message || "";
  if (/Cannot access|Missing host permission|not allowed|extensions gallery|Frame with ID|No frame/i.test(message)) {
    return "Chrome erlaubt hier keinen Zugriff. Gehen Sie zur Ursprungsseite und klicken Sie erneut auf das Erweiterungssymbol. Interne Seiten und der Chrome Web Store sind geschützt.";
  }
  return "Die Aktion konnte nicht ausgeführt werden. Laden Sie die Ursprungsseite neu und öffnen Sie die Erweiterung dort erneut.";
}

async function runRequest(request) {
  await getSourceTab(request.tabId);
  const isHighlight = request.type === "highlight";
  const isSourceRequest = request.type === "readSources" || request.type === "readSourceFile";
  const results = await chrome.scripting.executeScript({
    target: {tabId: request.tabId, frameIds: [0]},
    world: "ISOLATED",
    func: isHighlight ? highlightDOM : isSourceRequest ? readPageSources : inspectDOM,
    args: isHighlight ? [request.selector] : [request, isSourceRequest ? SOURCE_LIMITS : BACKEND_LIMITS]
  });
  const result = results.find(entry => entry.frameId === 0)?.result;
  if (!result || typeof result.ok !== "boolean") {
    throw userError("Die Ursprungsseite hat kein gültiges Ergebnis geliefert. Öffnen Sie TreeHugger erneut.");
  }
  if (isHighlight && result.ok) await chrome.tabs.update(request.tabId, {active: true});
  return result;
}

chrome.action.onClicked.addListener(tab => {
  if (!Number.isSafeInteger(tab.id) || tab.id < 0) return;
  chrome.tabs.create({url: chrome.runtime.getURL("viewer.html") + "?tab=" + tab.id});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const parsed = parseViewerRequest(message, sender, chrome.runtime.id, chrome.runtime.getURL("viewer.html"));
  if (!parsed.authorized) return false;
  if (!parsed.ok) {
    sendResponse({ok: false, error: parsed.error});
    return false;
  }
  runRequest(parsed.request)
    .then(sendResponse)
    .catch(error => sendResponse({ok: false, error: describeFailure(error)}));
  return true;
});
