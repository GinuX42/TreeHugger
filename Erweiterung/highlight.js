// Chrome kopiert diese Funktion in die isolierte Umgebung der Ursprungsseite.
// Alle benötigten Hilfsfunktionen bleiben deshalb innerhalb dieser Grenze.
export function highlightDOM(selector) {
  const overlayKey = Symbol.for("dom-baum-unterricht-overlay");
  let element;
  try {
    element = document.querySelector(selector);
  } catch {
    return {ok: false, error: "Der Selektor des Elements ist nicht mehr gültig. Lesen Sie den Baum erneut ein."};
  }
  if (!element) return {ok: false, error: "Dieses Element ist nicht mehr vorhanden. Lesen Sie den Baum erneut ein."};
  globalThis[overlayKey]?.cleanup();
  element.scrollIntoView({behavior: "instant", block: "center", inline: "nearest"});
  if (!visibleBounds()) {
    return {ok: false, error: "Dieses Element hat keine sichtbare Fläche. Seine Position im DOM ist trotzdem gültig."};
  }
  const host = document.createElement("div");
  host.setAttribute("data-dom-baum-overlay", "");
  host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;";
  const shadow = host.attachShadow({mode: "closed"});
  const frame = document.createElement("div");
  frame.style.cssText = "position:fixed;box-sizing:border-box;border:4px solid #b540df;background:rgba(181,64,223,.12);border-radius:4px;";
  const badge = document.createElement("div");
  badge.textContent = "DOM-Element: <" + element.localName.slice(0, 120) + ">";
  badge.style.cssText = "position:fixed;left:12px;top:12px;max-width:calc(100vw - 48px);padding:10px 16px;background:#692380;color:white;border-radius:8px;font:700 18px/1.4 system-ui,sans-serif;box-shadow:0 3px 15px #0004;";
  shadow.append(frame, badge);
  document.documentElement.append(host);
  let cleaned = false;
  let timer;

  function visibleBounds() {
    if (!element.isConnected) return null;
    const bounds = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    if ((bounds.width === 0 && bounds.height === 0) || style.display === "none" ||
        style.visibility === "hidden" || style.visibility === "collapse") return null;
    return bounds;
  }

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    host.remove();
    window.removeEventListener("scroll", updateBounds, true);
    window.removeEventListener("resize", updateBounds);
    if (timer !== undefined) clearTimeout(timer);
    if (globalThis[overlayKey]?.host === host) delete globalThis[overlayKey];
  }

  function updateBounds() {
    if (cleaned) return;
    const bounds = visibleBounds();
    if (!bounds) { cleanup(); return; }
    frame.style.left = bounds.left + "px";
    frame.style.top = bounds.top + "px";
    frame.style.width = bounds.width + "px";
    frame.style.height = bounds.height + "px";
  }

  globalThis[overlayKey] = {host, cleanup};
  updateBounds();
  window.addEventListener("scroll", updateBounds, {capture: true, passive: true});
  window.addEventListener("resize", updateBounds);
  timer = setTimeout(cleanup, 2500);
  return {ok: true};
}
