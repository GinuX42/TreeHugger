import {shortenText} from "./ui-dom.js";
import {NODE_COLORS} from "./palette.js";

export const NODE_LEGEND_TYPES = Object.freeze([9, 1, 3, 8, 10, 11, 4, 7]);

const NODE_KINDS = new Map([
  [9, {...NODE_COLORS[9], name: "Dokumentknoten", explanation: "Das document-Objekt steht für das gesamte Dokument. Es ist die Wurzel des DOM-Baums."}],
  [1, {...NODE_COLORS[1], name: "Element · auch Node", explanation: "Dieses Objekt ist ein einzelnes Element und zugleich ein Node (Knoten). Es ist keine Sammlung. Es kann Attribute und untergeordnete Knoten besitzen."}],
  [3, {...NODE_COLORS[3], name: "Textknoten", explanation: "Dieser Knoten enthält Text. Er ist ein Kindknoten seines Elternelements und selbst kein Element."}],
  [8, {...NODE_COLORS[8], name: "Kommentarknoten", explanation: "Ein HTML-Kommentar ist ein eigener Knoten. Er wird auf der Webseite normalerweise nicht sichtbar dargestellt."}],
  [10, {...NODE_COLORS[10], name: "Dokumenttyp", explanation: "Die Dokumenttyp-Deklaration <!doctype html> ist ein eigener Knoten. Sie ist kein HTML-Element."}],
  [11, {...NODE_COLORS[11], name: "Dokumentfragment", explanation: "Ein Dokumentfragment ist ein Node mit eigenen Kindknoten, aber kein Element."}],
  [4, {...NODE_COLORS[4], name: "CDATA-Knoten", explanation: "Dieser Node enthält einen CDATA-Textabschnitt. Er ist kein Element."}],
  [7, {...NODE_COLORS[7], name: "Verarbeitungsanweisung", explanation: "Diese Verarbeitungsanweisung ist ein Node, aber kein Element."}]
]);

const UNKNOWN_NODE = {name: "Knoten", color: "#242424", fill: "#E0E0E0", explanation: "Ein Knoten des Dokuments."};

export function getNodeKind(node) {
  return NODE_KINDS.get(node.type) ?? UNKNOWN_NODE;
}

export function isWhitespaceNode(node) {
  return node.type === 3 && (node.isWhitespace ?? /^\s*$/.test(node.value ?? ""));
}

export function getNodeLabel(node) {
  if (node.type === 3) return isWhitespaceNode(node) ? "Leerraum" : `„${shortenText(node.value, 24)}“`;
  if (node.type === 8) return `<!-- ${shortenText(node.value, 21)} -->`;
  return node.label || node.nodeName;
}

export function getAttribute(node, name) {
  return node.attributes?.find(attribute => attribute.name === name)?.value;
}

export function getOpeningTag(node) {
  const name = node.localName ?? node.nodeName;
  const attributes = (node.attributes ?? []).map(attribute =>
    ` ${attribute.name}="${escapeAttributeValue(attribute.value)}"`).join("");
  return `<${name}${attributes}>`;
}

function escapeAttributeValue(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\r/g, "&#13;").replace(/\n/g, "&#10;").replace(/\t/g, "&#9;");
}

export function getTagPreview(node) {
  const fullTag = getOpeningTag(node);
  const lines = [];
  const lineLength = 32;
  let remaining = fullTag;
  while (remaining && lines.length < 3) {
    if (remaining.length <= lineLength) {
      lines.push(remaining);
      remaining = "";
    } else if (lines.length === 2) {
      lines.push(remaining.slice(0, lineLength - 1) + "…");
      break;
    } else {
      const wordBreak = remaining.lastIndexOf(" ", lineLength);
      const end = wordBreak > 0 ? wordBreak : lineLength;
      lines.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }
  }
  return {fullTag, lines, truncated: Boolean(remaining)};
}

export function getVisibleChildren(node, nodes, filters) {
  return (node.childIds ?? []).map(id => nodes.get(id)).filter(child => {
    if (!child) return false;
    if (child.type === 3) return filters.text && (filters.whitespace || !isWhitespaceNode(child));
    return child.type !== 8 || filters.comments;
  });
}
