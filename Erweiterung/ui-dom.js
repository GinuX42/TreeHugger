export function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Das Bedienelement „${id}“ fehlt.`);
  return element;
}

export function setText(element, value) {
  element.textContent = value == null ? "" : String(value);
  return element;
}

// Inhalte aus der Quellseite bleiben Text, auch wenn sie HTML oder Skript enthalten.
export function createElement(tagName, content, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (content !== undefined) setText(element, content);
  return element;
}

export function createSvgElement(tagName, attributes = {}, content) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (content !== undefined) setText(element, content);
  return element;
}

export function shortenText(value, maximum = 27) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > maximum ? normalized.slice(0, maximum - 1) + "…" : normalized;
}

export function createBadge(label, color) {
  const badge = createElement("span", label, "tag");
  badge.style.background = color;
  return badge;
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"});
}
