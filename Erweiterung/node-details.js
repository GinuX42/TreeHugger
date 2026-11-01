import {byId, createBadge, createElement} from "./ui-dom.js";
import {getAttribute, getNodeKind, getNodeLabel, getVisibleChildren, isWhitespaceNode} from "./node-presentation.js";
import {describeElement, getTypeHierarchy, isHtmlList} from "./semantics.js";
import {COLLECTION_COLORS} from "./palette.js";

const MAX_COLLECTION_ENTRIES = 30;

export function createDetailsView({onSelect, onHighlight, onScope, onRestore, canHighlight}) {
  const panel = byId("details");

  function createRelationButton(node) {
    const kind = getNodeKind(node);
    const button = createElement("button", kind.name + " · " + getNodeLabel(node), "relation");
    button.style.borderLeft = "4px solid " + kind.color;
    button.addEventListener("click", () => onSelect(node.id));
    return button;
  }

  function createCollection(propertyName, typeName, items, total) {
    const collection = createElement("details", undefined, "collection-box");
    collection.style.borderColor = COLLECTION_COLORS[typeName];
    const summary = createElement("summary");
    summary.style.background = COLLECTION_COLORS[typeName];
    summary.style.color = "#fff";
    summary.append(createElement("strong", typeName + " · Sammlung"), createElement("span", `${propertyName} · ${total} Einträge`));
    collection.append(summary,
      createElement("p", "Die Sammlung ist kein Node und kein Element. Sie enthält Verweise auf " +
        (typeName === "HTMLCollection" ? "direkte Kindelemente. Textknoten, Leerraum-Textknoten und Kommentare gehören nicht dazu."
          : "alle direkten Kindknoten. Dazu gehören Elemente, Textknoten (auch solche nur aus Leerraum) und Kommentare."), "muted"),
      createElement("p", "Im Quelldokument lebend: Die Mitgliedschaft passt sich DOM-Änderungen an. Hier sehen Sie den Stand der Momentaufnahme.", "muted")
    );
    for (const item of items.slice(0, MAX_COLLECTION_ENTRIES)) collection.append(createRelationButton(item));
    if (total > items.length) collection.append(createElement("p", "Einige Einträge wurden beim Einlesen ausgelassen. Die Gesamtzahl stammt aus der Quellseite.", "muted"));
    if (items.length > MAX_COLLECTION_ENTRIES) collection.append(createElement("p", "Die ersten 30 eingelesenen Einträge werden hier aufgeführt.", "muted"));
    if (total === 0) collection.append(createElement("p", "Leere Sammlung · length = 0. Das ist nicht null.", "muted"));
    return collection;
  }

  function appendIdentity(node) {
    const kind = getNodeKind(node);
    panel.append(createBadge(kind.name, kind.color), createElement("h2", node.label || node.nodeName));
    const category = describeElement(node);
    if (category) {
      const description = createElement("p", category.name + " · " + category.meaning, "category-detail");
      description.style.background = category.color;
      description.style.color = "#fff";
      panel.append(description);
    } else {
      panel.append(createElement("p", "Einzelner Node · kein Element · keine Sammlung", "muted"));
    }
    panel.append(createElement("p", kind.explanation, "explanation"),
      createElement("h3", "Typ-Einordnung (Auswahl)"), createElement("pre", getTypeHierarchy(node).join(" → ")));
    if (isHtmlList(node)) panel.append(createElement("p", "HTML-Liste ≠ NodeList: Dieses Listenelement ist ein einzelnes Element und Node. Eine NodeList ist dagegen ein Sammlungsobjekt.", "explanation"));
    if (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === "input") {
      panel.append(createElement("p", "Eingabetyp laut Attribut: " + (getAttribute(node, "type") || "text"), "muted"));
    }
    if (node.type === 1 && node.namespaceURI) panel.append(createElement("p", "Namensraum: " + node.namespaceURI, "muted"));
  }

  function appendRelationships(node, state) {
    const allChildren = (node.childIds ?? []).map(id => state.nodes.get(id)).filter(Boolean);
    const elementChildren = allChildren.filter(child => child.type === 1);
    const childCount = node.childNodesCount ?? allChildren.length;
    const elementCount = node.elementChildrenCount ?? elementChildren.length;
    const statistics = createElement("div", undefined, "detail-grid");
    const values = [["nodeType", node.type], ["Direkte Kindknoten", childCount]];
    if ([1, 9, 11].includes(node.type)) values.push(["Direkte Kindelemente", elementCount]);
    for (const [label, value] of values) statistics.append(createElement("span", label), createElement("b", value));
    panel.append(statistics, createCollection("childNodes", "NodeList", allChildren, childCount));
    if ([1, 9, 11].includes(node.type)) {
      panel.append(createCollection("children", "HTMLCollection", elementChildren, elementCount));
      const explanation = createElement("div", undefined, "count-explanation");
      for (const [label, text] of [
        ["childNodes: ", "Alle direkten Kindknoten zählen mit, auch Textknoten nur aus Leerzeichen, Einrückungen oder Zeilenumbrüchen."],
        ["children: ", "Nur direkte Kindelemente zählen mit. Textknoten (auch Leerraum) und Kommentare zählen nicht mit."],
        ["Anzeige und Zählung: ", "Der Schalter „Leerraum“ ändert nur die Anzeige im Diagramm. Er verändert weder childNodes.length noch children.length. Gezählt werden Knoten, nicht einzelne Leerzeichen."]
      ]) {
        const paragraph = createElement("p");
        paragraph.append(createElement("strong", label), createElement("span", text));
        explanation.append(paragraph);
      }
      panel.append(explanation);
    }
    const parent = state.nodes.get(node.parentId);
    if (parent) panel.append(createElement("h3", "Elternknoten"), createRelationButton(parent));
    const visibleChildren = getVisibleChildren(node, state.nodes, state.filters);
    if (!visibleChildren.length) return;
    panel.append(createElement("h3", "Direkte Kinder im Diagramm"));
    for (const child of visibleChildren.slice(0, 12)) panel.append(createRelationButton(child));
    if (visibleChildren.length > 12) panel.append(createElement("p", `${visibleChildren.length - 12} weitere direkte Kinder. Öffnen Sie den Ast.`, "muted"));
  }

  function appendAttributes(node) {
    panel.append(createElement("h3", "Attribute des Elements"), createElement("p",
      "attributes ist eine NamedNodeMap: eine lebende Sammlung von Attr-Objekten. Ein Attr ist ein Node, aber kein Element und kein Kindknoten des Elements. Die Tabelle zeigt eine Momentaufnahme.", "muted"));
    if (!node.attributes?.length) {
      panel.append(createElement("p", node.attributesCount ? "Die Attribute wurden durch die Erfassungsgrenze ausgelassen." : "Dieses Element hat keine Attribute.", "muted"));
      return;
    }
    const table = createElement("table", undefined, "attributes");
    const caption = createElement("caption", "NamedNodeMap · Sammlung; jede Zeile: Attr · Node");
    caption.style.background = COLLECTION_COLORS.NamedNodeMap;
    caption.style.borderColor = COLLECTION_COLORS.NamedNodeMap;
    caption.style.color = "#fff";
    table.append(caption);
    for (const attribute of node.attributes) {
      const row = createElement("tr");
      const heading = createElement("th", attribute.name);
      heading.scope = "row";
      row.append(heading, createElement("td", attribute.value));
      table.append(row);
    }
    panel.append(table);
    if (node.attributesCount > node.attributes.length) panel.append(createElement("p", `${node.attributes.length} von ${node.attributesCount} Attributen angezeigt.`, "muted"));
  }

  function appendActions(node, state) {
    if (node.type === 1 && node.selector) {
      panel.append(createElement("h3", "CSS-Selektor"), createElement("pre", node.selector));
      const actions = createElement("div", undefined, "aside-actions");
      const highlight = createElement("button", "Auf Webseite zeigen");
      highlight.disabled = !canHighlight;
      highlight.addEventListener("click", () => onHighlight(node));
      const scope = createElement("button", "Als Ausschnitt");
      scope.addEventListener("click", () => onScope(node));
      actions.append(highlight, scope);
      panel.append(actions);
    }
    if (state.rootId !== state.snapshot.root) {
      const restore = createElement("button", "Zum eingelesenen Baum");
      restore.addEventListener("click", onRestore);
      panel.append(restore);
    }
  }

  function render(state) {
    const node = state.nodes.get(state.selectedId);
    panel.replaceChildren(createElement("div", "Knoten untersuchen", "aside-heading"));
    if (!node) return;
    appendIdentity(node);
    appendRelationships(node, state);
    if (node.value) {
      const content = isWhitespaceNode(node)
        ? node.value.replace(/ /g, "·").replace(/\t/g, "⇥").replace(/\n/g, "↵\n") : node.value;
      panel.append(createElement("h3", node.type === 8 ? "Kommentarinhalt" : "Textinhalt"), createElement("pre", content));
    }
    if (node.type === 1) appendAttributes(node);
    appendActions(node, state);
    if (node.omitted) panel.append(createElement("p", "Dieser Bereich wurde begrenzt eingelesen. Nicht eingelesene Kinder fehlen im Diagramm.", "explanation"));
    panel.scrollTop = 0;
  }

  return {render};
}
