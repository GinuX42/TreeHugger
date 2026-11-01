const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const ELEMENT_INTERFACES = new Map([
  ["html", "HTMLHtmlElement"], ["body", "HTMLBodyElement"],
  ["p", "HTMLParagraphElement"], ["ul", "HTMLUListElement"], ["li", "HTMLLIElement"]
]);
const NODE_INTERFACES = new Map([[9, "Document"], [10, "DocumentType"], [3, "Text"], [8, "Comment"]]);

export function createExampleSnapshot() {
  const nodes = [];
  const nodeIndex = new Map();

  function addNode(id, parentId, type, label, value = "", attributes = []) {
    const localName = type === 1 ? label.slice(1, -1) : null;
    const interfaceName = type === 1 ? ELEMENT_INTERFACES.get(localName) ?? "HTMLElement" : NODE_INTERFACES.get(type);
    const node = {
      id, parentId, type, label, value, localName, interfaceName,
      nodeName: type === 1 ? localName.toUpperCase() : type === 3 ? "#text" : type === 8 ? "#comment" : label,
      namespaceURI: type === 1 ? HTML_NAMESPACE : null,
      attributes, attributesCount: attributes.length, childIds: [], childNodesCount: 0, elementChildrenCount: 0,
      selector: type === 1 ? localName : "", isWhitespace: type === 3 && /^\s*$/.test(value)
    };
    nodes.push(node);
    nodeIndex.set(id, node);
    const parent = nodeIndex.get(parentId);
    if (parent) {
      parent.childIds.push(id);
      parent.childNodesCount++;
      if (type === 1) parent.elementChildrenCount++;
    }
  }

  addNode("d", null, 9, "#document");
  addNode("dt", "d", 10, "<!doctype html>");
  addNode("h", "d", 1, "<html>", "", [{name: "lang", value: "de"}]);
  addNode("b", "h", 1, "<body>");
  addNode("m", "b", 1, "<main>", "", [{name: "id", value: "kurse"}]);
  addNode("s", "m", 1, "<section>", "", [{name: "class", value: "karte aktiv"}]);
  addNode("p", "s", 1, "<p>", "", [{name: "class", value: "hinweis"}]);
  addNode("t", "p", 3, "#text", "A: Plätze frei");
  addNode("c", "s", 8, "#comment", "Kursinformationen");
  addNode("w", "s", 3, "#text", "\n  ");
  addNode("u", "m", 1, "<ul>");
  addNode("li", "u", 1, "<li>");
  addNode("t2", "li", 3, "#text", "Kontakt zum Kursbüro");
  return {title: "Kursportal · Beispieldiagramm", url: "Eingebautes Beispiel", capturedAt: new Date().toISOString(), root: "d", nodes, notes: []};
}
