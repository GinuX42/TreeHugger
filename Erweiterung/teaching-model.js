import {getOpeningTag, getNodeLabel} from "./node-presentation.js";
import {shortenText} from "./ui-dom.js";

const MAX_LISTED_ITEMS = 20;
const SINGLE_METHODS = new Set(["querySelector", "getElementById"]);
const COLLECTION_METHODS = new Map([
  ["querySelectorAll", "NodeList"],
  ["getElementsByClassName", "HTMLCollection"],
  ["getElementsByTagName", "HTMLCollection"]
]);

const COURSE_HTML = '<main id="kurse">\n  <p id="frei" class="hinweis">Plätze frei</p>\n  <p id="kontakt" class="hinweis">Kontakt zum Kursbüro</p>\n</main>';

export const EXAMPLE_TASKS = Object.freeze([
  {
    id: "first-match", title: "Auswahl mit querySelector",
    question: "Welche Rückgabe erwarten Sie? Beschreiben Sie den Rückgabetyp und das ausgewählte Element. Begründen Sie Ihre Vorhersage.",
    html: COURSE_HTML, code: 'document.querySelector(".hinweis")',
    answer: {
      heading: "Ein einzelnes Element",
      lines: ['<p id="frei" class="hinweis">', "Rückgabetyp: HTMLParagraphElement → HTMLElement → Element → Node"],
      explanation: "Beide Absätze besitzen die Klasse hinweis. querySelector liefert davon nur das erste Element in Dokumentreihenfolge: den Absatz „Plätze frei“. Die Pfeile zeigen die Typ-Hierarchie dieses einen Objekts: Ein HTMLParagraphElement ist zugleich ein HTMLElement, ein Element und ein Node. Es entstehen keine weiteren Objekte; der zweite Absatz gehört nicht zur Rückgabe."
    }
  },
  {
    id: "all-matches", title: "Auswahl mit querySelectorAll",
    question: "Welche Rückgabe erwarten Sie? Nennen Sie den Typ, die Anzahl der Einträge und ihre Reihenfolge. Mit welchem Index erreichen Sie den Kontakt-Absatz?",
    html: COURSE_HTML, code: 'document.querySelectorAll(".hinweis")',
    answer: {
      heading: "NodeList mit zwei Elementen",
      lines: ["Rückgabetyp: NodeList", "length = 2", '[0]: <p id="frei" class="hinweis">', '[1]: <p id="kontakt" class="hinweis">'],
      explanation: "Beide Absätze besitzen die Klasse hinweis und stehen in der NodeList in Dokumentreihenfolge. Der Kontakt-Absatz ist das zweite Element und wird mit Index [1] erreicht. Statisch bedeutet: Ein später ergänzter passender Absatz wird nicht automatisch in diese bereits gespeicherte Liste aufgenommen. Die NodeList ist eine Sammlung, kein einzelnes Element und kein Array."
    }
  },
  {
    id: "no-match", title: "Zwei Auswahlmethoden vergleichen",
    question: "Was geben die beiden Aufrufe zurück? Beschreiben Sie den Unterschied und begründen Sie ihn anhand des HTML-Beispiels.",
    html: COURSE_HTML,
    code: 'document.querySelector(".ausgebucht")\ndocument.querySelectorAll(".ausgebucht")',
    answer: {
      heading: "null und eine leere Sammlung",
      lines: ['querySelector(".ausgebucht") → null', 'querySelectorAll(".ausgebucht") → NodeList mit length = 0'],
      explanation: "Kein Element besitzt die Klasse ausgebucht. Die Suche nach einem einzelnen Element liefert deshalb null. Die Suche nach allen passenden Elementen liefert eine leere NodeList; auch ohne Einträge bleibt sie eine Sammlung."
    }
  },
  {
    id: "child-nodes", title: "Elemente, Text und Kommentare zählen",
    question: "Welche beiden Längen erwarten Sie? Zählen Sie die direkten Kindknoten des div in ihrer Reihenfolge auf. Beachten Sie die gezeigten Zeilenumbrüche und Einrückungen.",
    html: '<div id="kurs">\n  <p class="hinweis">Hallo</p>\n  <!-- Kursinformation -->\n</div>',
    code: 'const elternElement = document.querySelector("#kurs");\nelternElement.children.length\nelternElement.childNodes.length',
    answer: {
      heading: "Ein Kindelement und fünf Kindknoten",
      lines: ["children.length = 1", "childNodes.length = 5", "childNodes[0]: Leerraum-Textknoten", "childNodes[1]: p-Element", "childNodes[2]: Leerraum-Textknoten", "childNodes[3]: Kommentar", "childNodes[4]: Leerraum-Textknoten"],
      explanation: "children enthält nur das direkte p-Kindelement. childNodes enthält außerdem drei Leerraum-Textknoten und den Kommentar. Der Text „Hallo“ ist ein Kind des p-Elements und kein direktes Kind des div. Mehrere zusammenhängende Leerzeichen und Zeilenumbrüche bilden hier jeweils einen Textknoten."
    }
  },
  {
    id: "position-index", title: "Position und Index vergleichen",
    question: "Welche Elemente liefern die beiden Ausdrücke? Zeigen beide auf dasselbe Element? Erläutern Sie die Bedeutung der Zahlen 2 und 1.",
    html: '<section id="kurs"><h2 id="titel">Kurs</h2><p id="hinweis">Plätze frei</p><p id="kontakt">Kontakt</p></section>',
    code: 'document.querySelector("#kurs > *:nth-child(2)")\ndocument.querySelector("#kurs").children[1]',
    answer: {
      heading: "Beide Ausdrücke liefern denselben Absatz",
      lines: ['<p id="hinweis">', "CSS-Position: 2", "JavaScript-Index in children: 1"],
      explanation: "CSS beschreibt die Position („das zweite Kind“), JavaScript verwendet einen Index ([1]). :nth-child() zählt ab 1, der Indexzugriff auf children ab 0. Das Sternchen steht für jeden Elementtyp; > verlangt ein direktes Kind."
    }
  },
  {
    id: "live-collection", title: "Sammlungen nach einer Änderung",
    question: "Welche Werte haben lebend.length und statisch.length nach dem Anhängen des neuen Absatzes? Erklären Sie, warum sich die gespeicherten Sammlungen so verhalten.",
    html: '<main id="kurse"><p id="frei" class="hinweis">Plätze frei</p></main>',
    code: 'const lebend = document.getElementsByClassName("hinweis");\nconst statisch = document.querySelectorAll(".hinweis");\nconst neu = document.createElement("p");\nneu.className = "hinweis";\nneu.textContent = "Neuer Kurs";\ndocument.querySelector("#kurse").append(neu);\nlebend.length\nstatisch.length',
    answer: {
      heading: "lebend enthält zwei Absätze, statisch weiterhin einen",
      lines: ["lebend.length = 2", "statisch.length = 1"],
      explanation: "Anfangs enthalten beide Sammlungen nur den Absatz #frei. append hängt einen zweiten Absatz mit der Klasse hinweis an. Die lebende HTMLCollection lebend nimmt diesen neuen Treffer automatisch auf und hat danach length = 2. Die zuvor mit querySelectorAll gespeicherte NodeList statisch enthält weiterhin nur #frei und hat length = 1. Statisch betrifft die Liste der enthaltenen Elemente: Würde sich der Text von #frei ändern, wäre der neue Text auch über statisch[0].textContent lesbar. Der Beispielcode wird hier nicht auf Ihrer Webseite ausgeführt."
    }
  }
].map(task => Object.freeze({
  ...task,
  context: "Eingebautes Beispiel. Betrachten Sie ausschließlich das gezeigte HTML mit seiner genauen Formatierung. Denken Sie sich den Code einmal nach diesem HTML ausgeführt; weitere Skripte oder Benutzereingaben gibt es nicht.",
  notes: Object.freeze([]),
  answer: Object.freeze({...task.answer, lines: Object.freeze(task.answer.lines)})
})));

export function createChildrenTask(node, nodes) {
  if (node?.type !== 1) throw new Error("Wählen Sie im DOM-Baum zuerst ein Element aus.");
  if (!isCount(node.childNodesCount) || !isCount(node.elementChildrenCount) || node.elementChildrenCount > node.childNodesCount) {
    throw new Error("Die ursprünglichen Kindknoten-Zählwerte fehlen. Lesen Sie die Seite erneut ein.");
  }
  const childIds = node.childIds ?? [];
  const children = childIds.map(id => nodes.get(id));
  const complete = children.length === node.childNodesCount && children.every(Boolean);
  const lines = [`children.length = ${node.elementChildrenCount}`, `childNodes.length = ${node.childNodesCount}`];
  if (complete) {
    children.slice(0, MAX_LISTED_ITEMS).forEach((child, index) => {
      lines.push(`childNodes[${index}]: ${describeChild(child)}`);
    });
    if (children.length > MAX_LISTED_ITEMS) lines.push(`Die Einzelliste zeigt die ersten ${MAX_LISTED_ITEMS} Kindknoten; die Zählwerte oben gelten für alle.`);
  } else {
    lines.push("Die Kindknoten wurden nicht vollständig einzeln erfasst. Die Zählwerte stammen vom ursprünglichen Element.");
  }
  return {
    title: "Direkte Kinder vorhersagen",
    question: "Wie viele Einträge erwarten Sie in children und childNodes? Erläutern Sie, welche Knoten jeweils mitgezählt werden.",
    code: "elternElement.children.length\nelternElement.childNodes.length",
    context: `elternElement bezeichnet das im Baum ausgewählte Element ${shortenText(getOpeningTag(node), 320)}. Grundlage ist die bereits eingelesene Momentaufnahme der Quellseite.`,
    notes: [],
    answer: {
      heading: "Zählwerte der Momentaufnahme", lines,
      explanation: "children zählt ausschließlich direkte Kindelemente. childNodes zählt alle direkten Kindknoten, einschließlich Leerraum-Textknoten und Kommentaren. Der Leerraum-Schalter verändert nur die Baumdarstellung, nicht diese Zählwerte. Spätere Änderungen auf der Quellseite sind in dieser Aufgabe nicht enthalten."
    }
  };
}

export function createSelectionTask(result) {
  const single = SINGLE_METHODS.has(result?.method);
  const collectionType = COLLECTION_METHODS.get(result?.method);
  const expectedType = single ? (result.total ? "Element" : "null") : collectionType;
  if ((!single && !collectionType) || !isCount(result.total) || (single && result.total > 1) ||
      result.resultType !== expectedType || typeof result.query !== "string" ||
      !Array.isArray(result.items) || result.items.length > result.total) {
    throw new Error("Die Abfrage hat keine gültige Rückgabe geliefert. Bereiten Sie die Aufgabe erneut vor.");
  }
  const lines = [`Rückgabetyp: ${result.resultType}`];
  if (collectionType) lines.push(`length = ${result.total}`);
  for (const [index, item] of result.items.slice(0, MAX_LISTED_ITEMS).entries()) {
    const label = shortenText(item.label || `<${item.localName ?? "Element"}>`, 160);
    const selector = item.selector ? ` · ${shortenText(item.selector, 200)}` : "";
    lines.push(`${single ? "Element" : `[${index}]`}: ${label}${selector}`);
  }
  const shown = Math.min(result.items.length, MAX_LISTED_ITEMS);
  if (shown < result.total) lines.push(`${shown} von ${result.total} Treffern einzeln aufgeführt. Die Gesamtzahl stammt von der ursprünglichen Abfrage.`);
  const explanations = {
    Element: "Die Methode liefert ein einzelnes Elementobjekt. Dieses Element ist zugleich ein Node und keine Sammlung.",
    null: "Es wurde kein passendes einzelnes Element gefunden. null ist weder ein Element noch eine leere Sammlung.",
    NodeList: "querySelectorAll liefert eine statische NodeList mit passenden Elementen in Dokumentreihenfolge. Auch bei length = 0 oder length = 1 bleibt die Rückgabe eine Sammlung. Die Indizes beginnen bei 0.",
    HTMLCollection: "Die Methode liefert im Quelldokument eine lebende HTMLCollection. Auch bei length = 0 oder length = 1 bleibt die Rückgabe eine Sammlung. Die Indizes beginnen bei 0."
  };
  return {
    title: "Eine DOM-Auswahl vorhersagen",
    question: "Welche Rückgabe erwarten Sie? Beschreiben Sie den Typ und die ausgewählten Elemente. Bei einer Sammlung: Wie viele Einträge erwarten Sie und in welcher Reihenfolge? Begründen Sie Ihre Vorhersage.",
    code: `document.${result.method}(${JSON.stringify(result.query)})`,
    context: "Die Abfrage bezieht sich auf das gesamte Quelldokument. Ihre Rückgabe wurde beim Vorbereiten der Aufgabe als Momentaufnahme festgehalten.",
    notes: (result.notes ?? []).slice(0, MAX_LISTED_ITEMS).map(note => shortenText(note, 400)),
    answer: {
      heading: result.resultType === "null" ? "Kein einzelnes Element gefunden" : collectionType ? "Eine Sammlung" : "Ein einzelnes Element",
      lines,
      explanation: explanations[result.resultType] + " Die Anzeige hier ist eine festgehaltene Momentaufnahme und wird nach dem Vorbereiten nicht automatisch aktualisiert."
    }
  };
}

function isCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function describeChild(node) {
  if (node.type === 1) return shortenText(getOpeningTag(node), 160);
  if (node.type === 3) return node.isWhitespace ?? /^\s*$/.test(node.value ?? "")
    ? "Leerraum-Textknoten" : `Textknoten: ${shortenText(node.value, 100)}`;
  if (node.type === 8) return `Kommentar: ${shortenText(node.value, 100)}`;
  return shortenText(getNodeLabel(node), 160);
}
