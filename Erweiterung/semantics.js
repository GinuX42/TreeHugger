import {ELEMENT_GROUP_COLORS} from "./palette.js";

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

// These groups describe teaching topics, not DOM interface types.
export const ELEMENT_GROUPS = Object.freeze(Object.fromEntries(
  Object.entries({
  structure: "Struktur",
  text: "Textinhalt",
  list: "HTML-Liste",
  form: "Formular",
  table: "Tabelle",
  media: "Medien",
  meta: "Kopfdaten / Skript",
  other: "Weiteres Element",
  svg: "SVG-Grafik",
  math: "MathML-Formel"
}).map(([key, name]) => [key, Object.freeze({name, ...ELEMENT_GROUP_COLORS[key]})])
));

const elementDescriptions = new Map();

function defineElements(groupKey, meanings) {
  for (const [tagName, meaning] of Object.entries(meanings)) {
    elementDescriptions.set(tagName, Object.freeze({ ...ELEMENT_GROUPS[groupKey], meaning }));
  }
}

defineElements('structure', {
  "html": "HTML-Wurzelelement",
  "body": "Seiteninhalt",
  "main": "Hauptinhalt",
  "section": "Abschnitt",
  "article": "Eigenständiger Inhalt",
  "header": "Kopfbereich",
  "footer": "Fußbereich",
  "nav": "Navigation",
  "aside": "Ergänzender Inhalt",
  "div": "Allgemeiner Container",
  "address": "Kontaktinformationen",
  "search": "Suchbereich",
  "hgroup": "Überschriftengruppe",
  "dialog": "Dialog",
  "details": "Aufklappbarer Bereich",
  "summary": "Titel eines aufklappbaren Bereichs"
});

defineElements('text', {
  "p": "Absatz",
  "span": "Allgemeiner Textbereich",
  "h1": "Überschrift – Ebene 1",
  "h2": "Überschrift – Ebene 2",
  "h3": "Überschrift – Ebene 3",
  "h4": "Überschrift – Ebene 4",
  "h5": "Überschrift – Ebene 5",
  "h6": "Überschrift – Ebene 6",
  "a": "Link / Verweisanker",
  "strong": "Starke Betonung",
  "em": "Betonung",
  "b": "Hervorgehobener Text",
  "i": "Abgesetzter Text",
  "u": "Kennzeichnung im Text",
  "s": "Nicht mehr zutreffender Text",
  "small": "Kleingedruckter Hinweis",
  "mark": "Markierter Text",
  "br": "Zeilenumbruch",
  "wbr": "Mögliche Umbruchstelle",
  "hr": "Thematische Trennung",
  "blockquote": "Längeres Zitat",
  "q": "Kurzes Zitat",
  "cite": "Werktitel",
  "code": "Code",
  "pre": "Vorformatierter Text",
  "kbd": "Tastatureingabe",
  "samp": "Programmausgabe",
  "var": "Variable",
  "abbr": "Abkürzung",
  "dfn": "Begriffsdefinition",
  "time": "Zeit- oder Datumsangabe",
  "data": "Text mit Maschinenwert",
  "sub": "Tiefgestellter Text",
  "sup": "Hochgestellter Text",
  "del": "Gelöschter Inhalt",
  "ins": "Eingefügter Inhalt",
  "bdi": "Isolierte Textrichtung",
  "bdo": "Vorgegebene Textrichtung",
  "ruby": "Ausspracheannotation",
  "rt": "Aussprachehinweis",
  "rp": "Ersatzklammer"
});

defineElements('list', {
  "ul": "Ungeordnete HTML-Liste",
  "ol": "Geordnete HTML-Liste",
  "li": "HTML-Listeneintrag",
  "dl": "Beschreibungsliste",
  "dt": "Begriff in einer Beschreibungsliste",
  "dd": "Beschreibung eines Begriffs",
  "menu": "Liste von Befehlen"
});

defineElements('form', {
  "form": "Formular",
  "input": "Eingabefeld",
  "button": "Schaltfläche",
  "label": "Beschriftung eines Formularelements",
  "select": "Auswahlfeld",
  "option": "Auswahloption",
  "optgroup": "Gruppe von Auswahloptionen",
  "textarea": "Mehrzeiliges Textfeld",
  "fieldset": "Gruppe von Formularfeldern",
  "legend": "Titel einer Formulargruppe",
  "datalist": "Vorschlagsliste für eine Eingabe",
  "output": "Ausgabe eines Ergebnisses",
  "progress": "Fortschrittsanzeige",
  "meter": "Messwertanzeige"
});

defineElements('table', {
  "table": "Tabelle",
  "caption": "Tabellenüberschrift",
  "thead": "Tabellenkopf",
  "tbody": "Tabellenkörper",
  "tfoot": "Tabellenfuß",
  "tr": "Tabellenzeile",
  "td": "Datenzelle",
  "th": "Kopfzelle",
  "col": "Tabellenspalte",
  "colgroup": "Gruppe von Tabellenspalten"
});

defineElements('media', {
  "img": "Bild",
  "picture": "Bild mit Quellenwahl",
  "source": "Medienquelle",
  "audio": "Audio",
  "video": "Video",
  "track": "Textspur für Medien",
  "canvas": "Zeichenfläche",
  "iframe": "Eingebettete Seite",
  "embed": "Eingebetteter Inhalt",
  "object": "Eingebettete Ressource",
  "map": "Klickbereiche eines Bildes",
  "area": "Klickbarer Bildbereich",
  "figure": "Eigenständige Abbildung / Inhalt",
  "figcaption": "Beschriftung einer Abbildung"
});

defineElements('meta', {
  "head": "Kopfdaten",
  "title": "Seitentitel",
  "meta": "Metadaten",
  "link": "Verknüpfte Ressource",
  "base": "Basisadresse",
  "style": "CSS-Regeln",
  "script": "Skript",
  "noscript": "Ersatzinhalt ohne Skript",
  "template": "Vorlage mit separatem Inhalt",
  "slot": "Platzhalter in einem Shadow Tree"
});

const HTML_LIST_TAGS = new Set(['ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu']);

const NODE_TYPE_HIERARCHIES = new Map([
  [2, ['Attr', 'Node']],
  [3, ['Text', 'CharacterData', 'Node']],
  [4, ['CDATASection', 'Text', 'CharacterData', 'Node']],
  [7, ['ProcessingInstruction', 'CharacterData', 'Node']],
  [8, ['Comment', 'CharacterData', 'Node']],
  [9, ['Document', 'Node']],
  [10, ['DocumentType', 'Node']],
  [11, ['DocumentFragment', 'Node']],
]);

function getNodeType(node) {
  return Number.isInteger(node?.nodeType) ? node.nodeType : node?.type;
}

function getTagName(node) {
  const name = node.localName || node.nodeName || node.label || '';
  return String(name).replace(/[<>]/g, '');
}

function isHtmlElement(node) {
  return getNodeType(node) === 1 && node.namespaceURI === HTML_NAMESPACE;
}

function describeOtherElement(meaning) {
  return { ...ELEMENT_GROUPS.other, meaning };
}

export function describeElement(node) {
  if (getNodeType(node) !== 1) return null;

  const tagName = getTagName(node);
  if (node.namespaceURI === SVG_NAMESPACE) {
    return { ...ELEMENT_GROUPS.svg, meaning: 'SVG-Element <' + tagName + '>' };
  }
  if (node.namespaceURI === MATHML_NAMESPACE) {
    return { ...ELEMENT_GROUPS.math, meaning: 'MathML-Element <' + tagName + '>' };
  }
  if (!node.namespaceURI) {
    return describeOtherElement('Element <' + tagName + '> ohne Namensraum');
  }
  if (!isHtmlElement(node)) {
    return describeOtherElement('Element <' + tagName + '> im angegebenen Namensraum');
  }

  const htmlTagName = tagName.toLowerCase();
  const knownDescription = elementDescriptions.get(htmlTagName);
  if (knownDescription) return knownDescription;
  if (node.interfaceName === 'HTMLUnknownElement') {
    return describeOtherElement('Unbekanntes HTML-Element');
  }
  if (htmlTagName.includes('-')) {
    return describeOtherElement('HTML-Element mit eigenem Tag-Namen');
  }
  return describeOtherElement('HTML-Element <' + htmlTagName + '>');
}

function getElementBaseInterface(node) {
  switch (node.namespaceURI) {
    case HTML_NAMESPACE:
      return 'HTMLElement';
    case SVG_NAMESPACE:
      return 'SVGElement';
    case MATHML_NAMESPACE:
      return 'MathMLElement';
    default:
      return 'Element';
  }
}

export function getTypeHierarchy(node) {
  const nodeType = getNodeType(node);
  if (nodeType === 1) {
    const baseInterface = getElementBaseInterface(node);
    const specificInterface = node.interfaceName || baseInterface;
    return [...new Set([specificInterface, baseInterface, 'Element', 'Node'])];
  }

  const hierarchy = NODE_TYPE_HIERARCHIES.get(nodeType);
  if (!hierarchy) return [];
  if (nodeType === 9 && node.interfaceName === 'XMLDocument') {
    return ['XMLDocument', ...hierarchy];
  }
  if (nodeType === 11 && node.interfaceName === 'ShadowRoot') {
    return ['ShadowRoot', ...hierarchy];
  }
  // HTMLDocument is the historical alias of Document, not another inheritance level.
  return [...hierarchy];
}

export function isHtmlList(node) {
  return isHtmlElement(node) && HTML_LIST_TAGS.has(getTagName(node).toLowerCase());
}
