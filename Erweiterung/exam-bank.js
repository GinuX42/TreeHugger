import {QUIZ_QUESTIONS} from './quiz-model.js';

// The scoring criteria are the single source of truth for each task's maximum.
const tasks = [
  {
    title: 'Der zweite freie Platz',
    code: '<ul id="kurs"><li>Rot</li><li class="frei">Blau</li><li class="frei">Grün</li></ul>\n\nconst frei = document.querySelectorAll("#kurs > li.frei");',
    prompt: 'Das Skript läuft nach dem HTML. Wie viele Treffer gibt es? Was liefert frei[1].textContent? Welchen Wert liefert frei.item(2)? Begründen Sie die beiden letzten Ergebnisse.',
    rubric: [[1, 'Zwei Treffer.'], [2, '„Grün“: Index 1 bezeichnet das zweite passende li.'], [2, 'null: Für Index 2 gibt es keinen dritten Treffer. Die Methode item() liefert dafür null.']]
  },
  {
    title: 'Leerraum im Protokoll',
    code: '<p id="log">A<!--Pause--><b>B</b> C</p>\n\nconst log = document.querySelector("#log");',
    prompt: 'Geben Sie für genau dieses HTML die direkten Kindknoten von log in Reihenfolge an. Welche Werte haben log.children.length und log.textContent?',
    rubric: [[2, 'Text „A“, Kommentar „Pause“, Element b, Text „ C“ in dieser Reihenfolge.'], [1, 'children.length ist 1.'], [2, 'textContent ist „AB C“. Es enthält den Text des b-Elements und das Leerzeichen vor C. Der Kommentar wird ausgelassen.']]
  },
  {
    title: 'Warum bleibt ein Eintrag übrig?',
    code: '<ul id="plan"><li>A</li><li>B</li><li>C</li></ul>\n\nconst liste = document.querySelector("#plan").children;\nfor (let i = 0; i < liste.length; i++) {\n  liste[i].remove();\n}',
    prompt: 'Der Code soll alle Einträge entfernen. Welcher Buchstabe bleibt sichtbar? Verfolgen Sie die zwei Schleifendurchläufe und schreiben Sie eine Korrektur.',
    rubric: [[1, 'B bleibt stehen.'], [2, 'i = 0 entfernt A. B rückt auf Index 0, C auf Index 1. i = 1 entfernt C. Danach ist die Länge 1 und die Schleife endet.'], [2, 'Beispielsweise: while (liste.length > 0) liste[0].remove(); Auch eine rückwärts durchlaufene Schleife oder eine vorab erstellte Kopie ist richtig.']]
  },
  {
    title: 'Zwei Regeln für denselben Preis',
    code: '<section id="laden"><p class="preis">12 €</p></section>\n\n#laden :where(.preis) { color: teal; }\nsection .preis { color: maroon; }',
    prompt: 'Es gelten nur diese beiden normalen Autorenregeln in derselben Kaskadenebene. Welche Textfarbe erscheint? Bestimmen Sie die Spezifität beider Selektoren als (ID, Klasse, Element) und erklären Sie die Entscheidung.',
    rubric: [[1, 'teal.'], [2, '#laden :where(.preis) hat (1, 0, 0). Das Argument von :where() und :where() selbst tragen nichts bei.'], [1, 'section .preis hat (0, 1, 1).'], [1, 'Die erste Gruppe entscheidet bereits zugunsten der ID. Die spätere Position der zweiten Regel führt hier zu keinem Gleichstand.']]
  },
  {
    title: 'Ein Klick auf das Symbol',
    code: '<ul id="liste"><li><button><span>×</span> Entfernen</button></li><li>Reserve</li></ul>\n\nconst liste = document.querySelector("#liste");\nliste.addEventListener("click", event => {\n  const button = event.target.closest("button");\n  if (button) button.closest("li").remove();\n});',
    prompt: 'Der Benutzer klickt auf das span. Benennen Sie event.target und event.currentTarget im Listener. Erklären Sie, wie der Klick zur Löschung führt und welcher Listeneintrag bleibt.',
    rubric: [[1, 'target ist das span.'], [1, 'currentTarget ist ul#liste, an dem der Listener registriert wurde.'], [2, 'Das click-Ereignis steigt bis zur Liste auf. closest("button") findet den umgebenden Button. Vom Button aus findet closest("li") sein nächstes li.'], [1, 'Entfernt wird der erste Eintrag. „Reserve“ bleibt.']]
  },
  {
    title: 'Das Skript im head',
    code: '<head><script src="status.js"></script></head>\n<body><p id="status">Wartet</p></body>\n\n// Inhalt von status.js\ndocument.querySelector("#status").textContent = "Bereit";',
    prompt: 'Ein klassisches externes Skript läuft beim ersten Laden dieser Seite. Warum scheitert die Zuweisung? Ändern Sie nur das öffnende script-Tag und erläutern Sie, wann das Skript dann ausgeführt wird.',
    rubric: [[2, 'Der Parser steht im head. Das p wurde noch nicht erzeugt. querySelector liefert null, die Zuweisung löst einen TypeError aus.'], [1, '<script defer src="status.js">'], [2, 'Der Browser lädt das Skript parallel zum Parsen. Er führt es nach Abschluss des Parsens und vor DOMContentLoaded aus.']]
  },
  {
    title: 'Dieselbe Karte an zwei Orten?',
    code: '<div id="a"><p id="karte">Nord</p></div><div id="b"></div>\n\nconst karte = document.querySelector("#karte");\ndocument.querySelector("#b").append(karte);\nkarte.textContent = "Süd";',
    prompt: 'Wie viele direkte Kindelemente enthalten a und b danach? Welcher Text ist in b sichtbar? Wie ändern Sie den append-Aufruf, wenn das Original in a bleiben und b eine Kopie mit dem Text „Nord“ erhalten soll? Berücksichtigen Sie die ID.',
    rubric: [[1, 'a hat 0 und b hat 1 Kindelement.'], [1, 'In b steht „Süd“.'], [1, 'append verschiebt den vorhandenen Knoten. karte verweist weiterhin auf ihn.'], [2, 'Vor der Textänderung z. B.: const kopie = karte.cloneNode(true); kopie.removeAttribute("id"); document.querySelector("#b").append(kopie); Eine neue eindeutige ID ist ebenfalls möglich.']]
  },
  {
    title: 'Zwei Werte im Warenkorb',
    code: '<button id="kauf" data-preis="12" data-anzahl="3">Kaufen</button>\n\nconst daten = document.querySelector("#kauf").dataset;\nconst a = daten.preis + daten.anzahl;\nconst b = Number(daten.preis) * Number(daten.anzahl);',
    prompt: 'Nennen Sie Wert und Datentyp von a und b. Begründen Sie den Unterschied und geben Sie einen Ausdruck an, der die beiden Zahlen addiert.',
    rubric: [[1, 'a ist die Zeichenkette „123“.'], [1, 'b ist die Zahl 36.'], [2, 'dataset liefert Zeichenketten. + verkettet die beiden Strings. Number wandelt sie für die zweite Rechnung in Zahlen um.'], [1, 'Number(daten.preis) + Number(daten.anzahl) ergibt 15.']]
  },
  {
    title: 'Karte zu breit',
    code: '.karte {\n  width: 240px; padding: 12px; border: 2px solid black;\n  box-sizing: content-box; margin: 0;\n}',
    prompt: 'Ein gewöhnliches div mit dieser Klasse steht im normalen Blocklayout und hat keine weiteren Größenregeln. Wie breit ist sein Rahmenkasten? Welche einzelne CSS-Deklaration hält den Rahmenkasten bei 240 px? Berechnen Sie die neue Inhaltsbreite.',
    rubric: [[2, '268 px = 240 + 2 × 12 + 2 × 2.'], [1, 'box-sizing: border-box;'], [2, '212 px = 240 − 24 − 4. Das Padding und die Ränder liegen innerhalb der angegebenen Breite.']]
  },
  {
    title: 'Das umbenannte Feld',
    code: '<label for="ort">Ort</label><input id="stadt" name="ort" value="Bonn">\n\nconst feld = document.getElementById("ort");',
    prompt: 'Was enthält feld? Warum setzt ein Klick auf die Beschriftung hier den Fokus nicht ins Feld? Korrigieren Sie genau ein HTML-Attribut, damit sowohl der Klick als auch die vorhandene JavaScript-Zeile funktionieren.',
    rubric: [[1, 'feld ist null.'], [1, 'getElementById sucht nach einer ID; name="ort" zählt dabei nicht.'], [1, 'for="ort" verweist auf die fehlende ID ort.'], [2, 'Im input id="stadt" zu id="ort" ändern. Dann zeigen Label und Skript auf dasselbe Feld.']]
  },
  {
    title: 'Auswahl nach dem Umbau',
    code: '<section id="team"><p class="aktiv">Ada</p><p>Lin</p></section>\n\nconst team = document.querySelector("#team");\nconst vorher = team.querySelectorAll(".aktiv");\nconst jetzt = team.getElementsByClassName("aktiv");\nteam.firstElementChild.classList.remove("aktiv");\nteam.lastElementChild.classList.add("aktiv");',
    prompt: 'Geben Sie nach beiden Änderungen die Länge und den Text des ersten Treffers für vorher und jetzt an. Weshalb reicht ein Vergleich der Längen allein hier nicht?',
    rubric: [[2, 'vorher hat Länge 1 und enthält weiterhin den Absatz „Ada“. querySelectorAll speichert die damalige Auswahl.'], [2, 'jetzt hat Länge 1 und enthält nun „Lin“. Die HTMLCollection folgt den Klassenänderungen.'], [1, 'Die Anzahl ist gleich geblieben, aber der enthaltene Knoten hat bei der Live-Sammlung gewechselt.']]
  },
  {
    title: 'Ein zweiter Listener?',
    code: '<button id="plus">+1</button>\n\nconst plus = document.querySelector("#plus");\nlet stand = 0;\nfunction zaehlen() { stand++; }\nplus.addEventListener("click", zaehlen);\nplus.addEventListener("click", zaehlen);\nplus.addEventListener("click", () => zaehlen());\nplus.removeEventListener("click", zaehlen);',
    prompt: 'Alle Aufrufe verwenden die Standardoptionen. Das Skript läuft einmal, dann wird zweimal geklickt. Welchen Wert hat stand? Begründen Sie, welche Registrierungen vor und nach removeEventListener wirksam sind.',
    rubric: [[1, 'stand ist 2.'], [2, 'Die ersten beiden Registrierungen verwenden denselben Ereignistyp, dieselbe Funktionsreferenz und denselben capture-Wert. Es entsteht nur ein Listener für zaehlen.'], [1, 'Die Pfeilfunktion ist ein eigenes Funktionsobjekt und daher ein zweiter Listener.'], [1, 'removeEventListener entfernt nur die direkte Registrierung. Die Pfeilfunktion ruft zaehlen bei jedem Klick einmal auf.']]
  }
];

export const EXAM_QUESTIONS = tasks.map(({title, code, prompt, rubric}, index) => ({
  id: 'klausur-' + String(index + 1).padStart(2, '0'),
  title, question: code + '\n\n' + prompt, type: 'open', choices: [], correctIndex: null,
  points: rubric.reduce((sum, [points]) => sum + points, 0),
  solution: rubric.map(([points, answer]) => points + ' P. – ' + answer).join('\n')
}));

export function initialQuestions() {
  return [...EXAM_QUESTIONS, ...QUIZ_QUESTIONS.map(q => ({
    id: q.id, title: q.title, type: 'open', points: 1, choices: [], correctIndex: null,
    question: [q.question, q.context, q.html && 'HTML:\n' + q.html, q.css && 'CSS:\n' + q.css, q.code && 'JavaScript:\n' + q.code].filter(Boolean).join('\n\n'),
    solution: [q.answer.heading, ...q.answer.lines, q.answer.explanation].join('\n')
  }))];
}
