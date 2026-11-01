import {byId, setText} from "./ui-dom.js";

export function createFocusView({onChange}) {
  const button = byId("focusToggle");
  const viewport = byId("viewport");
  let active = false;
  let previousScroll = null;

  function setActive(nextActive) {
    if (active === nextActive) return;
    if (nextActive) previousScroll = {left: viewport.scrollLeft, top: viewport.scrollTop};
    active = nextActive;
    document.body.classList.toggle("tree-focus", active);
    button.setAttribute("aria-pressed", String(active));
    button.title = active ? "Normale Ansicht wiederherstellen (Esc)" : "Den ganzen Inhaltsbereich für den Baum nutzen";
    setText(button, active ? "← Zurück" : "Nur Baum");
    onChange();
    if (!active && previousScroll) viewport.scrollTo(previousScroll);
    button.focus({preventScroll: true});
  }

  button.addEventListener("click", () => setActive(!active));
  document.body.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !active) return;
    event.preventDefault();
    setActive(false);
  });

  return {exit: () => setActive(false)};
}
