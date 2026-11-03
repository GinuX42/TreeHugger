const DOCUMENT_CONTEXT = "Das gezeigte HTML ist der vollständige Inhalt von body. Der Code läuft danach in einem HTML-Dokument in Chrome. Andere Skripte verändern das Dokument nicht. Gesucht ist der Wert des letzten Ausdrucks.";
const WHITESPACE_CONTEXT = DOCUMENT_CONTEXT + " Zeilenumbrüche und Leerzeichen innerhalb der gezeigten Elemente bleiben genau wie dargestellt erhalten.";

export const DOM_QUESTIONS = [
  {
    id: "dom-01", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Zwei Beziehungen im Kursportal",
    question: "Welche beiden Längen liefert der letzte Ausdruck? Begründen Sie, welche Absätze die beiden Selektoren erfassen.",
    context: DOCUMENT_CONTEXT,
    html: '<main id="kurse">\n  <section class="karte">\n    <p id="a" class="hinweis">A</p>\n    <div><p id="b" class="hinweis">B</p></div>\n  </section>\n  <p id="c" class="hinweis">C</p>\n</main>',
    code: 'const alle = document.querySelectorAll(".karte .hinweis");\nconst direkt = document.querySelectorAll(".karte > .hinweis");\n[alle.length, direkt.length]',
    choices: ["[2, 1]", "[1, 2]", "[3, 1]", "[2, 2]"], correctIndex: 0,
    choiceExplanations: ["A und B sind Nachfahren der Karte; nur A ist ein direktes Kind.", "Die Reihenfolge ist vertauscht: Die Suche nach Nachfahren ist hier umfassender.", "C liegt außerhalb der Karte und erfüllt deshalb auch den ersten Selektor nicht.", "B liegt im div und ist kein direktes Kind der Karte."],
    answer: {heading: "Nachfahren und direkte Kinder", lines: ["[2, 1]", "alle: a, b · direkt: a"], explanation: "Das Leerzeichen verbindet einen Vorfahren mit passenden Nachfahren auf beliebigen tieferen Ebenen. > verlangt genau eine Eltern-Kind-Verbindung. Der Suchbereich ist bei beiden Selektoren an .karte gebunden."}
  },
  {
    id: "dom-02", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Klassen kombinieren",
    question: "Welche ID und welche ID-Liste ergeben sich? Erläutern Sie die Wirkung des Leerzeichens zwischen den Klassen.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="a" class="karte aktiv"><p id="b" class="aktiv">B</p></section>\n<section id="c" class="karte"><p id="d" class="aktiv">D</p></section>',
    code: 'const gemeinsam = document.querySelector(".karte.aktiv");\nconst darunter = document.querySelectorAll(".karte .aktiv");\n[gemeinsam.id, Array.from(darunter, el => el.id)]',
    choices: ['["a", ["a", "b", "d"]]', '["a", ["b", "d"]]', '["b", ["a", "c"]]', '["c", ["b", "d"]]'], correctIndex: 1,
    choiceExplanations: ["A erfüllt beide Klassen am selben Element, ist aber kein Nachfahre seiner selbst.", "A trägt beide Klassen. B und D tragen aktiv und liegen jeweils innerhalb einer Karte.", "B trägt nicht karte; A und C sind die Karten und nicht die gesuchten aktiv-Nachfahren.", "C trägt nur karte und erfüllt .karte.aktiv nicht."],
    answer: {heading: "Dasselbe Element oder ein Nachfahre", lines: ['["a", ["b", "d"]]'], explanation: "Ohne Leerzeichen müssen beide Klassen am selben Element vorhanden sein. Mit Leerzeichen muss ein Element mit aktiv einen Vorfahren mit karte besitzen. Der Container zählt nicht als eigener Nachfahre."}
  },
  {
    id: "dom-03", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Reihenfolge einer Selektorliste",
    question: "Welche IDs stehen im Ergebnis? Erklären Sie, ob die zuerst geschriebene Auswahlbedingung bevorzugt wird.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="frueh" class="pflicht">Pflichtkurs</p>\n<p id="spaet" class="wahl">Wahlkurs</p>',
    code: 'const kombiniert = document.querySelector(".wahl, .pflicht");\nconst einzeln = document.querySelector(".wahl");\n[kombiniert.id, einzeln.id]',
    choices: ['["spaet", "spaet"]', '["frueh", "frueh"]', '["frueh", "spaet"]', '["spaet", "frueh"]'], correctIndex: 2,
    choiceExplanations: ["Das Komma macht .wahl nicht zur bevorzugten Bedingung; der frühere passende Absatz wird gefunden.", "Die zweite Abfrage sucht ausschließlich .wahl und findet deshalb spaet.", "Die kombinierte Abfrage findet frueh zuerst in Dokumentreihenfolge, die Einzelabfrage findet spaet.", "Die erste Bedingung wird nicht bevorzugt, und frueh besitzt die Klasse wahl nicht."],
    answer: {heading: "Dokumentreihenfolge entscheidet", lines: ['["frueh", "spaet"]'], explanation: "Ein Komma verbindet alternative Selektoren. querySelector liefert das erste Element im Dokument, das mindestens einen davon erfüllt. Die Reihenfolge der Selektoren ist keine Prioritätenliste."}
  },
  {
    id: "dom-04", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Eine Suche am Container beginnen",
    question: "Welche beiden Längen ergeben sich? Ordnen Sie die Absätze dem jeweiligen Suchbereich zu.",
    context: DOCUMENT_CONTEXT,
    html: '<main id="kurse">\n  <p id="a" class="hinweis">A</p>\n  <div><p id="b" class="hinweis">B</p></div>\n</main>\n<p id="c" class="hinweis">C</p>',
    code: 'const kurse = document.querySelector("#kurse");\nconst direkt = kurse.querySelectorAll(":scope > .hinweis");\nconst darunter = kurse.querySelectorAll(".hinweis");\n[direkt.length, darunter.length]',
    choices: ["[1, 3]", "[2, 2]", "[0, 2]", "[1, 2]"], correctIndex: 3,
    choiceExplanations: ["Auch die zweite Abfrage liefert nur Nachfahren von kurse; C liegt außerhalb.", "B ist kein direktes Kind von kurse und gehört nicht zur ersten Rückgabe.", ":scope bezeichnet bei dieser Suche kurse; dessen direktes passendes Kind A wird gefunden.", "Die erste Abfrage findet A, die zweite A und B."],
    answer: {heading: "Der Ausgangspunkt der Suche", lines: ["[1, 2]", "direkt: a · darunter: a, b"], explanation: ":scope bezeichnet das Element, auf dem querySelectorAll aufgerufen wird. :scope > .hinweis sucht hier passende direkte Kinder von main#kurse. Die zweite Abfrage findet passende Nachfahren aller Tiefen innerhalb dieses Containers."}
  },
  {
    id: "dom-05", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Vorhandensein und Wert eines Attributs",
    question: "Welche IDs liefert der letzte Ausdruck? Unterscheiden Sie das Vorhandensein von hidden und dessen geschriebenen Attributwert.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="hinweis" hidden="false">A</p>\n<p id="b" class="hinweis" hidden>B</p>\n<p id="c" class="hinweis">C</p>',
    code: 'const ohne = document.querySelector(".hinweis:not([hidden])");\nconst wert = document.querySelector(".hinweis[hidden=false]");\n[ohne.id, wert.id]',
    choices: ['["c", "a"]', '["a", "a"]', '["c", "b"]', '["b", "c"]'], correctIndex: 0,
    choiceExplanations: ["Nur C besitzt kein hidden-Attribut. Bei A lautet der geschriebene Attributwert false.", "hidden=\"false\" ist trotzdem ein vorhandenes Attribut und wird von :not([hidden]) ausgeschlossen.", "B hat einen leeren Attributwert, nicht die Zeichenfolge false.", "B besitzt hidden; C besitzt keinen Attributwert false."],
    answer: {heading: "Attributtests getrennt betrachten", lines: ['["c", "a"]'], explanation: "[hidden] prüft das Vorhandensein des Attributs, nicht die Bedeutung eines JavaScript-Wahrheitswerts. [hidden=\"false\"] vergleicht dagegen den geschriebenen Wert mit einer Zeichenfolge. Ein Wert false entfernt das Attribut nicht."}
  },
  {
    id: "dom-06", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Geschwister nach einer Überschrift",
    question: "Welche ID-Listen ergeben sich? Begründen Sie die unterschiedliche Reichweite von + und ~.",
    context: DOCUMENT_CONTEXT,
    html: '<section>\n  <h2 id="start">Kurse</h2>\n  <p id="a" class="hinweis">A</p>\n  <span id="pause">Zwischentext</span>\n  <p id="b" class="hinweis">B</p>\n  <p id="c" class="hinweis">C</p>\n</section>',
    code: 'const direkt = document.querySelectorAll("#start + .hinweis");\nconst spaeter = document.querySelectorAll("#start ~ .hinweis");\n[Array.from(direkt, el => el.id), Array.from(spaeter, el => el.id)]',
    choices: ['[["a"], ["b", "c"]]', '[["a"], ["a", "b", "c"]]', '[["a", "b", "c"], ["a"]]', '[[], ["a", "b", "c"]]'], correctIndex: 1,
    choiceExplanations: ["~ schließt den unmittelbar folgenden passenden Geschwisterknoten A nicht aus.", "+ findet das unmittelbar folgende passende Element A; ~ findet alle späteren passenden Geschwister A, B und C.", "Die Reichweiten sind vertauscht: + ist hier enger als ~.", "Zeilenumbrüche verhindern + nicht; dieser Kombinator betrachtet benachbarte Elemente."],
    answer: {heading: "Elementgeschwister statt beliebiger Knoten", lines: ['[["a"], ["a", "b", "c"]]'], explanation: "+ verlangt das unmittelbar folgende Geschwisterelement. ~ erlaubt weitere spätere Geschwisterelemente desselben Elternteils. Beide ignorieren Textknoten zwischen den Elementen; das span zwischen A und B beendet die ~-Suche nicht."}
  },
  {
    id: "dom-07", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Ein Wort oder eine Zeichenfolge suchen",
    question: "Welche Trefferzahlen ergeben sich? Erklären Sie den Unterschied zwischen ~= und *= anhand des zweiten Elements.",
    context: DOCUMENT_CONTEXT,
    html: '<div id="a" data-themen="html dom">A</div>\n<div id="b" data-themen="domino css">B</div>\n<div id="c" data-themen="dom">C</div>',
    code: 'const wort = document.querySelectorAll("[data-themen~=dom]");\nconst teil = document.querySelectorAll("[data-themen*=dom]");\n[wort.length, teil.length]',
    choices: ["[3, 2]", "[1, 3]", "[2, 3]", "[2, 2]"], correctIndex: 2,
    choiceExplanations: ["Wortsuche kann hier nicht mehr Treffer liefern als die Suche nach derselben Zeichenfolge.", "A enthält dom als eigenständiges Wort neben html und zählt bei ~= mit.", "A und C enthalten das Wort dom; B enthält die Zeichenfolge dom innerhalb von domino.", "*= findet dom auch am Anfang von domino, also zusätzlich B."],
    answer: {heading: "Wortgrenze oder Teilzeichenfolge", lines: ["[2, 3]", "wort: a, c · teil: a, b, c"], explanation: "~= vergleicht ein ganzes, durch Leerraum getrenntes Wort innerhalb des Attributwerts. *= prüft lediglich, ob die Zeichenfolge irgendwo im Wert vorkommt. Damit lässt sich eine thematische Wortliste von einer Teiltextsuche unterscheiden."}
  },
  {
    id: "dom-08", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Überlappende Treffer zusammenführen",
    question: "Welche ID-Liste entsteht? Erklären Sie Reihenfolge und mögliche doppelte Einträge.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="hinweis aktiv">A</p>\n<p id="b" class="hinweis">B</p>\n<p id="c" class="aktiv">C</p>',
    code: 'const treffer = document.querySelectorAll(".aktiv, .hinweis");\nArray.from(treffer, el => el.id)',
    choices: ['["a", "c", "a", "b"]', '["a", "c", "b"]', '["a"]', '["a", "b", "c"]'], correctIndex: 3,
    choiceExplanations: ["Ein Element wird nicht doppelt geliefert, nur weil es mehrere Selektoren erfüllt.", "querySelectorAll ordnet nach dem Dokument, nicht zuerst nach .aktiv und danach nach .hinweis.", "Das Komma verlangt nicht beide Klassen; es verbindet alternative Bedingungen.", "Alle drei Elemente passen mindestens einmal; die Rückgabe enthält jedes einmal in Dokumentreihenfolge."],
    answer: {heading: "Eine gemeinsame Trefferliste", lines: ['["a", "b", "c"]'], explanation: "querySelectorAll erzeugt für die Selektorliste eine gemeinsame NodeList. Überlappende Treffer werden nicht verdoppelt. Die Einträge folgen der Dokumentreihenfolge, auch wenn .aktiv im Suchstring zuerst steht."}
  },
  {
    id: "dom-09", level: "Master", topic: "Selektoren und Suchbereich", title: "Ein Vorfahr außerhalb des Suchcontainers",
    question: "Welche beiden Längen ergeben sich? Begründen Sie getrennt, wo Treffer liegen dürfen und welche Vorfahren der Selektor prüfen kann.",
    context: DOCUMENT_CONTEXT,
    html: '<main id="portal">\n  <section id="kurs"><p id="a" class="hinweis">A</p></section>\n  <p id="b" class="hinweis">B</p>\n</main>',
    code: 'const kurs = document.querySelector("#kurs");\nconst mitVorfahre = kurs.querySelectorAll("#portal .hinweis");\nconst unterScope = kurs.querySelectorAll(":scope #portal .hinweis");\n[mitVorfahre.length, unterScope.length]',
    choices: ["[1, 0]", "[2, 0]", "[0, 0]", "[1, 1]"], correctIndex: 0,
    choiceExplanations: ["A ist Nachfahre von kurs und besitzt den Vorfahren portal. Unter kurs gibt es jedoch kein #portal.", "B erfüllt zwar den Selektor, liegt aber außerhalb des Elements, dessen querySelectorAll aufgerufen wird.", "Der Vorfahr portal darf bei der ersten Selektorprüfung außerhalb des Suchcontainers liegen.", ":scope #portal verlangt ein #portal unterhalb von kurs; dieser Vorfahr liegt aber darüber."],
    answer: {heading: "Treffergrenze und Selektorprüfung", lines: ["[1, 0]"], explanation: "Element.querySelectorAll liefert nur passende Nachfahren des Ausgangselements. Ein Selektor kann dennoch Vorfahren außerhalb dieses Elements berücksichtigen. Mit :scope #portal wird eine andere Beziehung verlangt: portal müsste ein Nachfahre von kurs sein. Das ist hier nicht der Fall."}
  },
  {
    id: "dom-10", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "ID und CSS-Selektor auseinanderhalten",
    question: "Welche beiden Wahrheitswerte liefert der Ausdruck? Erklären Sie, wie die beiden Suchmethoden ihre Zeichenketten interpretieren.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="kontakt" class="hinweis">Kursbüro</p>',
    code: 'const mitRaute = document.getElementById("#kontakt");\nconst perSelektor = document.querySelector("#kontakt");\nconst perId = document.getElementById("kontakt");\n[mitRaute === null, perSelektor === perId]',
    choices: ["[false, true]", "[true, true]", "[true, false]", "[false, false]"], correctIndex: 1,
    choiceExplanations: ["getElementById sucht den tatsächlichen ID-Wert; #kontakt ist hier kein vorhandener ID-Wert.", "Die erste Suche findet nichts. Die beiden korrekten Aufrufe liefern dasselbe vorhandene Elementobjekt.", "Die zwei korrekten Suchen erstellen keine Kopien, sondern liefern dasselbe Objekt.", "Die erste Suche findet nichts, während die zwei anderen dasselbe Element finden."],
    answer: {heading: "Suchtext ist nicht immer ein Selektor", lines: ["[true, true]"], explanation: "getElementById erwartet einen ID-Wert ohne das CSS-Zeichen #. querySelector erwartet dagegen einen CSS-Selektor. Verschiedene passende Auswahlmethoden können denselben Verweis auf das vorhandene DOM-Element zurückgeben."}
  },
  {
    id: "dom-11", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Eine erfolglose Suche prüfen",
    question: "Welche drei Werte entstehen? Begründen Sie, warum ein einfacher Wahrheitswerttest bei beiden Rückgaben unterschiedlich ausfällt.",
    context: DOCUMENT_CONTEXT,
    html: '<p class="hinweis">Plätze frei</p>',
    code: 'const einzeln = document.querySelector(".fehlt");\nconst alle = document.querySelectorAll(".fehlt");\n[Boolean(einzeln), Boolean(alle), alle.length]',
    choices: ["[false, false, 0]", "[true, true, 0]", "[false, true, 0]", "[false, true, 1]"], correctIndex: 2,
    choiceExplanations: ["Auch eine leere NodeList ist ein Objekt und wird zu true umgewandelt.", "querySelector liefert null, und Boolean(null) ist false.", "null wird false; die leere NodeList bleibt ein Objekt mit length 0 und wird true.", "Der Wahrheitswert eines Objekts erzeugt keinen Eintrag. Die Trefferzahl bleibt 0."],
    answer: {heading: "Leere Sammlung bleibt ein Objekt", lines: ["[false, true, 0]"], explanation: "querySelector verwendet null für einen fehlenden Treffer. querySelectorAll liefert auch dann eine NodeList. Um festzustellen, ob diese Sammlung Treffer enthält, prüfen Sie ihre length; if (alle) allein genügt dafür nicht."}
  },
  {
    id: "dom-12", level: "Master", topic: "Rückgaben und Sammlungen", title: "Zwei NodeLists nach einer Ergänzung",
    question: "Welche vier Werte liefert der letzte Ausdruck nach dem Anhängen? Erklären Sie, ob der Typname NodeList allein das Aktualisierungsverhalten festlegt.",
    context: DOCUMENT_CONTEXT + " Innerhalb des div stehen vor der Änderung keine Leerraum-Textknoten.",
    html: '<div id="kurs"><p id="a">A</p></div>',
    code: 'const kurs = document.querySelector("#kurs");\nconst kindknoten = kurs.childNodes;\nconst absatzTreffer = kurs.querySelectorAll(":scope > p");\nkurs.append(document.createElement("p"));\n[kindknoten instanceof NodeList, absatzTreffer instanceof NodeList, kindknoten.length, absatzTreffer.length]',
    choices: ["[true, true, 2, 2]", "[true, true, 1, 1]", "[false, true, 2, 1]", "[true, true, 2, 1]"], correctIndex: 3,
    choiceExplanations: ["Die per querySelectorAll gespeicherte NodeList nimmt den neuen Absatz nicht automatisch auf.", "childNodes ist lebend und enthält nach dem Anhängen beide direkten Knoten.", "Auch childNodes liefert eine NodeList; lebend bedeutet nicht HTMLCollection.", "Beide sind NodeLists. childNodes aktualisiert die Mitgliedschaft, querySelectorAll hält sie fest."],
    answer: {heading: "Die Herkunft bestimmt das Verhalten", lines: ["[true, true, 2, 1]"], explanation: "NodeList ist kein Synonym für statisch. childNodes liefert eine lebende NodeList aller direkten Kindknoten; querySelectorAll liefert eine statische NodeList der passenden Elemente. Die beiden ursprünglichen Sammlungen reagieren deshalb unterschiedlich."}
  },
  {
    id: "dom-13", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Objekte und Sammlungen einordnen",
    question: "Welche vier Wahrheitswerte ergeben sich? Ordnen Sie das gefundene Element und seine Sammlung in die Typen ein.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="hinweis">Plätze frei</p>',
    code: 'const element = document.querySelector("p");\nconst sammlung = document.querySelectorAll("p");\n[element instanceof Node, element instanceof Element, sammlung instanceof Node, Array.isArray(sammlung)]',
    choices: ["[true, true, false, false]", "[false, true, false, false]", "[true, true, true, false]", "[true, true, false, true]"], correctIndex: 0,
    choiceExplanations: ["Das p-Objekt ist Element und Node. Seine NodeList ist weder selbst Node noch Array.", "Jedes Element erbt von Node und ist damit auch ein Knoten.", "Die Sammlung verweist auf Knoten, wird dadurch aber nicht selbst zu einem Knoten.", "Indexzugriff und length machen eine NodeList nicht zu einem Array."],
    answer: {heading: "Die Sammlung ist nicht ihr Eintrag", lines: ["[true, true, false, false]"], explanation: "Das einzelne p-Element ist ein DOM-Knoten. querySelectorAll liefert dagegen ein separates Sammlungsobjekt, auch wenn es genau einen Eintrag enthält. Für Array-Methoden ist bei Bedarf eine ausdrückliche Umwandlung möglich."}
  },
  {
    id: "dom-14", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Hinter das Ende einer Sammlung greifen",
    question: "Welche beiden Wahrheitswerte erhalten Sie? Erläutern Sie den Unterschied zwischen Indexzugriff und item bei einem fehlenden Eintrag.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="einzig">Ein Kurs</p>',
    code: 'const liste = document.querySelectorAll("p");\nconst perIndex = liste[1];\nconst perMethode = liste.item(1);\n[perIndex === undefined, perMethode === null]',
    choices: ["[false, false]", "[true, true]", "[true, false]", "[false, true]"], correctIndex: 1,
    choiceExplanations: ["Index 1 liegt hinter dem einzigen Eintrag; die Zugriffe liefern die jeweils abgefragten fehlenden Werte.", "Der einzige Eintrag liegt bei Index 0. Der Indexzugriff liefert undefined, item liefert null.", "item(1) liefert bei einem nicht vorhandenen Eintrag tatsächlich null.", "liste[1] liefert undefined, weil dieser Index nicht vorhanden ist."],
    answer: {heading: "Zwei Wege, einen fehlenden Eintrag zu erkennen", lines: ["[true, true]"], explanation: "Bei einer Sammlung mit length 1 ist nur Index 0 belegt. Ein zu großer Index führt bei der Eigenschaftsschreibweise zu undefined. Die DOM-Methode item gibt für einen außerhalb liegenden Index null zurück. Keiner der Zugriffe liefert das erste Element."}
  },
  {
    id: "dom-15", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Treffer für eine Auswertung umwandeln",
    question: "Welche beiden Werte entstehen? Erklären Sie, welche Objekte und welche Zeichenketten die Schritte jeweils verarbeiten.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a">A</p>\n<p id="b" hidden>B</p>\n<p id="c">C</p>',
    code: 'const treffer = document.querySelectorAll("p");\nconst ids = Array.from(treffer)\n  .filter(el => !el.hasAttribute("hidden"))\n  .map(el => el.id);\n[Array.isArray(ids), ids.join(",")]',
    choices: ['[false, "a,c"]', '[true, "a,b,c"]', '[true, "a,c"]', '[true, "[object HTMLParagraphElement],[object HTMLParagraphElement]"]'], correctIndex: 2,
    choiceExplanations: ["Array.from erzeugt ein Array; filter und map geben ebenfalls Arrays zurück.", "Der Absatz B besitzt hidden und wird durch filter entfernt.", "Das Ergebnis ist ein Array der ID-Zeichenketten a und c; join verbindet sie mit einem Komma.", "map gibt die id-Werte zurück, nicht die Elementobjekte selbst."],
    answer: {heading: "Elemente filtern, Werte gewinnen", lines: ['[true, "a,c"]'], explanation: "Die NodeList wird zunächst in ein Array mit Verweisen auf dieselben Elemente umgewandelt. filter behält Elemente ohne hidden. map liest daraus die ID-Zeichenketten; das Ergebnis enthält daher Strings statt DOM-Elementen."}
  },
  {
    id: "dom-16", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Mehrere Klassen als Suchwert",
    question: "Welche beiden Längen ergeben sich? Erklären Sie, weshalb die Aufrufe trotz derselben Klassennamen unterschiedliche Mengen finden.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="aktiv hinweis">A</p>\n<p id="b" class="aktiv">B</p>\n<p id="c" class="hinweis">C</p>',
    code: 'const zusammen = document.getElementsByClassName("aktiv hinweis");\nconst alternativ = document.querySelectorAll(".aktiv, .hinweis");\n[zusammen.length, alternativ.length]',
    choices: ["[3, 3]", "[0, 3]", "[1, 1]", "[1, 3]"], correctIndex: 3,
    choiceExplanations: ["Mehrere Klassennamen in getElementsByClassName verlangen alle genannten Klassen am selben Element.", "Der Suchwert enthält zwei Klassennamen; er sucht keine einzelne Klasse mit einem Leerzeichen im Namen.", "Das Komma in der CSS-Abfrage verbindet Alternativen und findet deshalb auch B und C.", "Nur A trägt beide Klassen; die CSS-Alternative trifft A, B und C."],
    answer: {heading: "Klassennamenliste und Selektorliste", lines: ["[1, 3]"], explanation: "getElementsByClassName verarbeitet durch Leerraum getrennte Klassennamen als gemeinsame Anforderungen. Eine CSS-Selektorliste mit Komma verlangt dagegen mindestens eine der Alternativen. Der ähnlich aussehende Suchtext hat in den Methoden eine andere Grammatik."}
  },
  {
    id: "dom-17", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Direkte Kinder und tiefe Absätze",
    question: "Welche drei Längen werden geliefert? Benennen Sie, an welcher Stelle jeweils der Elementtyp oder die Tiefe eingeschränkt wird.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="panel">\n  <h2>Kurse</h2>\n  <div><p id="a">A</p></div>\n  <p id="b">B</p>\n</section>',
    code: 'const panel = document.querySelector("#panel");\n[panel.children.length,\n panel.getElementsByTagName("p").length,\n panel.querySelectorAll(":scope > p").length]',
    choices: ["[3, 2, 1]", "[2, 2, 1]", "[3, 1, 1]", "[3, 2, 2]"], correctIndex: 0,
    choiceExplanations: ["Direkte Kindelemente sind h2, div und p. Beide p sind Nachfahren, aber nur B ist ein direktes Kind.", "children beschränkt sich nicht auf p-Elemente; h2 und div zählen ebenfalls.", "getElementsByTagName findet p-Nachfahren auch innerhalb des div.", "A ist ein Kind des div und erfüllt :scope > p am panel nicht."],
    answer: {heading: "Typfilter und Tiefenfilter kombinieren", lines: ["[3, 2, 1]"], explanation: "children umfasst alle direkten Kindelemente unabhängig vom Tag. getElementsByTagName filtert nach p, lässt aber beliebige Nachfahrentiefe zu. :scope > p kombiniert den Tagfilter mit der Beschränkung auf eine direkte Kindebene."}
  },
  {
    id: "dom-18", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Eine HTML-Liste und ihre Einträge",
    question: "Welche beiden Wahrheitswerte ergeben sich? Unterscheiden Sie das ul-Element, seine children-Sammlung und die Rückgabe von querySelectorAll.",
    context: DOCUMENT_CONTEXT,
    html: '<ul id="kurse"><li id="a">HTML</li><li id="b">CSS</li></ul>',
    code: 'const liste = document.querySelector("#kurse");\nconst eintraege = liste.querySelectorAll("li");\n[eintraege[1] === liste.children[1], liste instanceof NodeList]',
    choices: ["[false, true]", "[true, false]", "[true, true]", "[false, false]"], correctIndex: 1,
    choiceExplanations: ["Beide Indexzugriffe liefern dasselbe zweite li; das ul ist selbst keine NodeList.", "Beide Sammlungen verweisen an Index 1 auf li#b. liste bezeichnet dagegen das einzelne ul-Element.", "Eine als HTML-Liste dargestellte Struktur macht das ul-Element nicht zu einer NodeList.", "Verschiedene Sammlungen können Verweise auf dasselbe vorhandene DOM-Element enthalten."],
    answer: {heading: "Listeninhalt und DOM-Sammlung", lines: ["[true, false]"], explanation: "Das Wort Liste beschreibt bei ul die Bedeutung des HTML-Elements. Technisch bleibt es ein einzelnes HTMLUListElement und damit ein Element und Node. children und querySelectorAll liefern separate Sammlungen; deren Einträge können dieselben Elementobjekte sein."}
  },
  {
    id: "dom-19", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Auf mehreren Ebenen zählen",
    question: "Welche drei Längen ergeben sich? Zählen Sie für jede Eigenschaft nur die direkt zugehörigen Kindknoten.",
    context: WHITESPACE_CONTEXT,
    html: '<div id="kurs">\n  <p>Hallo <strong>DOM</strong></p>\n  <!-- intern -->\n</div>',
    code: 'const kurs = document.querySelector("#kurs");\nconst absatz = kurs.querySelector("p");\n[kurs.children.length, kurs.childNodes.length, absatz.childNodes.length]',
    choices: ["[2, 6, 2]", "[1, 3, 2]", "[1, 5, 2]", "[1, 5, 3]"], correctIndex: 2,
    choiceExplanations: ["strong ist ein Kind des p und kein direktes Kind des div; es erhöht dessen direkte Zählwerte nicht.", "Am div gibt es drei getrennte Leerraum-Textknoten, das p-Element und den Kommentar.", "Das div hat ein Kindelement und fünf Kindknoten. Das p enthält den Text Hallo und das strong-Element.", "DOM ist ein Textkind von strong und kein direktes Kind des p."],
    answer: {heading: "Jede Zählung hat ein eigenes Elternelement", lines: ["[1, 5, 2]", "div: Leerraum, p, Leerraum, Kommentar, Leerraum", "p: Text „Hallo “, strong"], explanation: "children und childNodes zählen jeweils nur eine direkte Kindebene. Die Einrückungen rund um p und Kommentar bilden am div drei Textknoten. Das strong-Element und sein Text dürfen beim Zählen der direkten div-Kinder nicht zusätzlich eingerechnet werden."}
  },
  {
    id: "dom-20", level: "Erstie", topic: "Kindknoten und Navigation", title: "Attribute und Kindknoten trennen",
    question: "Welche drei Zahlen ergeben sich? Erklären Sie, zu welcher Struktur id, class und der Text gehören.",
    context: DOCUMENT_CONTEXT + " Innerhalb des p gibt es keine zusätzlichen Zeilenumbrüche oder Einrückungen.",
    html: '<p id="gruss" class="hinweis">Hallo <strong>DOM</strong></p>',
    code: 'const absatz = document.querySelector("#gruss");\n[absatz.attributes.length, absatz.childNodes.length, absatz.children.length]',
    choices: ["[2, 4, 1]", "[2, 3, 1]", "[2, 2, 2]", "[2, 2, 1]"], correctIndex: 3,
    choiceExplanations: ["id und class stehen in attributes, nicht zusätzlich in childNodes.", "Der Text DOM gehört direkt zu strong, nicht direkt zum p.", "Hallo ist ein Textknoten und kein Kindelement.", "Zwei Attribute, zwei direkte Kindknoten (Text und strong), ein direktes Kindelement."],
    answer: {heading: "Attribute liegen nicht in der Kinderliste", lines: ["[2, 2, 1]"], explanation: "Attribute beschreiben das Element und werden über attributes geführt. Die Kinder des p sind hier der Textknoten „Hallo “ und strong. children lässt den Textknoten weg. Der Text im strong liegt eine Ebene tiefer."}
  },
  {
    id: "dom-21", level: "Erstie", topic: "Kindknoten und Navigation", title: "Das erste Kind untersuchen",
    question: "Welche zwei Werte ergibt der Ausdruck? Erläutern Sie, weshalb die beiden Eigenschaften nicht dasselbe Objekt liefern.",
    context: WHITESPACE_CONTEXT + " nodeType 1 steht für Element, 3 für Text und 8 für Kommentar.",
    html: '<div id="kurs">\n  <p id="a">A</p>\n</div>',
    code: 'const kurs = document.querySelector("#kurs");\n[kurs.firstChild.nodeType, kurs.firstElementChild.id]',
    choices: ['[3, "a"]', '[1, "a"]', '[8, "a"]', '[3, "kurs"]'], correctIndex: 0,
    choiceExplanations: ["Vor dem p liegt ein Leerraum-Textknoten. Das erste Kindelement ist trotzdem p#a.", "firstChild überspringt den Zeilenumbruch vor p nicht.", "Einrückungen sind Text; hier steht kein Kommentar vor dem p.", "firstElementChild liefert ein Kind, nicht das Ausgangselement selbst."],
    answer: {heading: "Text wird nur beim Elementzugriff übersprungen", lines: ['[3, "a"]'], explanation: "firstChild betrachtet jede Knotenart und liefert hier die Einrückung vor dem Absatz als Textknoten. firstElementChild sucht das erste direkte Kindelement. Für reine Elementnavigation ist daher häufig die zweite Eigenschaft passend."}
  },
  {
    id: "dom-22", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Position oder Elementtyp zählen",
    question: "Welche beiden Absatz-IDs ergeben sich? Erklären Sie, welche Geschwister bei den beiden Positionsangaben mitgezählt werden.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="kurs"><h2 id="titel">Kurs</h2><p id="a">A</p><p id="b">B</p></section>',
    code: 'const nachPosition = document.querySelector("#kurs > p:nth-child(2)");\nconst nachTyp = document.querySelector("#kurs > p:nth-of-type(2)");\n[nachPosition.id, nachTyp.id]',
    choices: ['["b", "b"]', '["a", "b"]', '["a", "a"]', '["b", "a"]'], correctIndex: 1,
    choiceExplanations: ["Bei nth-child zählt h2 mit. Das zweite Kindelement ist deshalb p#a.", "A ist das zweite Kindelement insgesamt; B ist das zweite p-Kindelement.", "nth-of-type zählt hier nur p-Geschwister und findet das zweite p, also B.", "Die beiden Zählweisen wurden vertauscht."],
    answer: {heading: "Zwei unterschiedliche Positionsreihen", lines: ['["a", "b"]'], explanation: "p:nth-child(2) verlangt ein p, das unter allen Kindelementen an Position 2 steht. p:nth-of-type(2) verlangt das zweite p unter seinen Geschwistern. Die Überschrift zählt nur bei der ersten Positionsreihe mit."}
  },
  {
    id: "dom-23", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Gleicher Index, unterschiedliche Sammlung",
    question: "Welche drei Werte ergeben sich? Zeigen Sie, weshalb Index 1 in den beiden Sammlungen auf unterschiedliche Elemente verweist.",
    context: WHITESPACE_CONTEXT + " Bei HTML-Elementen gibt nodeName den Tag-Namen in Großbuchstaben zurück.",
    html: '<section id="kurs">\n  <h2 id="titel">Kurs</h2>\n  <p id="info">Info</p>\n</section>',
    code: 'const kurs = document.querySelector("#kurs");\n[kurs.children[1].id, kurs.childNodes[1].nodeName, kurs.childNodes.length]',
    choices: ['["titel", "H2", 5]', '["info", "P", 2]', '["info", "H2", 5]', '["info", "P", 5]'], correctIndex: 2,
    choiceExplanations: ["children zählt ab Index 0: h2 liegt bei 0, p bei 1.", "childNodes enthält außerdem drei Leerraum-Textknoten und hat deshalb fünf Einträge.", "children[1] ist p#info. childNodes[0] ist Leerraum und childNodes[1] daher h2.", "Der erste Leerraum-Textknoten verschiebt die Elementpositionen in childNodes; p liegt dort bei Index 3."],
    answer: {heading: "Der Index gehört immer zur konkreten Sammlung", lines: ['["info", "H2", 5]'], explanation: "Beide Sammlungen verwenden Indizes ab 0. children enthält [h2, p], childNodes enthält [Text, h2, Text, p, Text]. Derselbe Zahlenwert ist deshalb keine Garantie dafür, dass beide Zugriffe dasselbe Element finden."}
  },
  {
    id: "dom-24", level: "Erstie", topic: "Kindknoten und Navigation", title: "Zum nächsten Geschwister wechseln",
    question: "Welche zwei Werte liefert der Ausdruck? Erläutern Sie, welches Objekt beim jeweiligen Zugriff übersprungen wird.",
    context: DOCUMENT_CONTEXT + " Zwischen den gezeigten Tags stehen keine Leerzeichen. nodeType 1 bedeutet Element, 3 Text und 8 Kommentar.",
    html: '<div id="kurs"><p id="a">A</p><!-- intern --><p id="b">B</p></div>',
    code: 'const erster = document.querySelector("#a");\n[erster.nextSibling.nodeType, erster.nextElementSibling.id]',
    choices: ['[1, "b"]', '[3, "b"]', '[8, "a"]', '[8, "b"]'], correctIndex: 3,
    choiceExplanations: ["nextSibling liefert zuerst den Kommentar, nicht direkt das folgende Element.", "Ohne Leerraum zwischen den Tags steht hier ein Kommentarknoten als nächstes Geschwister.", "nextElementSibling liefert das nächste Element, nicht das Ausgangselement selbst.", "nextSibling findet den Kommentar; nextElementSibling überspringt ihn und findet p#b."],
    answer: {heading: "Navigation mit und ohne Knotentypfilter", lines: ['[8, "b"]'], explanation: "nextSibling folgt der Reihenfolge aller Kindknoten desselben Elternteils. nextElementSibling berücksichtigt nur die Elementgeschwister. Kommentare können daher ebenso wie Leerraum die beiden Zugriffe auseinanderfallen lassen."}
  },
  {
    id: "dom-25", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Eltern am Rand des Dokuments",
    question: "Welche drei Werte entstehen? Begründen Sie, weshalb ein vorhandener Elternknoten nicht immer ein Elternelement ist.",
    context: DOCUMENT_CONTEXT + " Chrome ergänzt den üblichen html- und body-Rahmen. documentElement bezeichnet das html-Element.",
    html: '<p id="wort">Hallo</p>',
    code: 'const wurzel = document.documentElement;\nconst text = document.querySelector("#wort").firstChild;\n[wurzel.parentNode === document, wurzel.parentElement === null, text.parentElement.id]',
    choices: ['[true, true, "wort"]', '[true, false, "wort"]', '[false, true, "wort"]', '[true, true, "body"]'], correctIndex: 0,
    choiceExplanations: ["Das html-Element hat das Dokument als Elternknoten. Der Text Hallo hat p#wort als Elternelement.", "Das Dokument ist kein Element; deshalb ist parentElement beim html-Element null.", "Das html-Element ist ein direkter Kindknoten des Dokuments.", "Der Text Hallo liegt unmittelbar im p, nicht unmittelbar im body."],
    answer: {heading: "Dokument und Element unterscheiden", lines: ['[true, true, "wort"]'], explanation: "parentNode darf auch einen Dokumentknoten liefern. parentElement liefert dagegen nur ein Element oder null. Ein Textknoten kann selbstverständlich ein Elternelement besitzen; seine eigene Knotenart verhindert das nicht."}
  },
  {
    id: "dom-26", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Vom Element nach oben oder unten suchen",
    question: "Welche beiden Werte liefert der Ausdruck? Erklären Sie, welche Suchrichtung und welcher Startpunkt jeweils verwendet werden.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="aussen" class="karte"><button id="start" class="karte"><span id="symbol">Los</span></button></section>',
    code: 'const taste = document.querySelector("#start");\n[taste.closest(".karte").id, taste.querySelector(".karte")]',
    choices: ['["aussen", null]', '["start", null]', '["start", "aussen"]', '["aussen", "start"]'], correctIndex: 1,
    choiceExplanations: ["closest prüft zuerst das Ausgangselement selbst, das hier bereits karte besitzt.", "closest findet den Button selbst. querySelector durchsucht dessen Nachfahren; dort gibt es keine .karte.", "querySelector sucht keine Vorfahren und liefert bei einem Treffer außerdem ein Elementobjekt, keine ID-Zeichenfolge.", "closest überspringt den passenden Button nicht; querySelector schließt das Ausgangselement nicht als eigenen Nachfahren ein."],
    answer: {heading: "closest beginnt beim Element selbst", lines: ['["start", null]'], explanation: "closest prüft das Ausgangselement und danach dessen Vorfahren bis zum ersten Treffer. querySelector auf einem Element liefert dagegen einen passenden Nachfahren. Die Methoden beantworten verschiedene Strukturfragen und sind nicht austauschbar."}
  },
  {
    id: "dom-27", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Leer bedeutet nicht immer kinderlos",
    question: "Welche drei Werte liefert der Ausdruck? Vergleichen Sie die CSS-Bedingung :empty mit dem Zählen aller Kindknoten.",
    context: DOCUMENT_CONTEXT + " In b steht genau ein Leerzeichen. Es gilt das Verhalten von :empty in Chrome: Kommentare zählen nicht als Inhalt, Textknoten mit Leerraum dagegen schon.",
    html: '<div id="a"><!-- intern --></div>\n<div id="b"> </div>\n<div id="c"><span></span></div>',
    code: 'const ids = Array.from(document.querySelectorAll("div:empty"), el => el.id);\n[ids.join(","), document.querySelector("#a").childNodes.length, document.querySelector("#b").childNodes.length]',
    choices: ['["a,b", 1, 1]', '["", 1, 1]', '["a", 1, 1]', '["a", 0, 0]'], correctIndex: 2,
    choiceExplanations: ["Das Leerzeichen in b ist ein Textknoten und verhindert in Chrome den Treffer auf :empty.", "Der Kommentar in a verhindert :empty nicht; a wird deshalb gefunden.", "Nur a erfüllt :empty, hat aber trotzdem einen Kommentarknoten. Auch b besitzt einen Kindknoten, nämlich Text.", "Die CSS-Bedingung entfernt keine Knoten. Kommentar und Leerraum bleiben in childNodes enthalten."],
    answer: {heading: "Eine CSS-Bedingung ist kein DOM-Zählwert", lines: ['["a", 1, 1]'], explanation: "Die vorgegebene :empty-Bedingung ignoriert Kommentare, während childNodes alle Knotenarten zählt. Ein CSS-Treffer auf :empty beweist daher nicht childNodes.length === 0. Das leere span in c ist trotzdem ein Kindelement und verhindert dort den Treffer."}
  }
];
