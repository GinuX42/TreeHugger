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
    answer: {heading: "Ergebnis: [2, 1]", lines: [".karte .hinweis findet passende Elemente innerhalb der Karte auf jeder tieferen Ebene: p#a liegt direkt darin, p#b innerhalb des div. alle.length ist deshalb 2.", ".karte > .hinweis verlangt ein direktes Kind der Karte. Nur p#a erfüllt das; p#b hat das div als direktes Elternelement. direkt.length ist deshalb 1.", "p#c liegt außerhalb der Karte. Es wird von keiner der beiden Abfragen erfasst.", "Der letzte Ausdruck setzt die Zahlen in der Reihenfolge alle, direkt zusammen: [2, 1]."], explanation: "Nachfahren sind Kinder, Enkel und weitere Elemente unterhalb eines Elements. Das Leerzeichen im Selektor erlaubt alle diese Ebenen; > erlaubt nur direkte Kinder."}
  },
  {
    id: "dom-02", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Klassen kombinieren",
    question: "Welche ID und welche ID-Liste ergeben sich? Erläutern Sie die Wirkung des Leerzeichens zwischen den Klassen.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="a" class="karte aktiv"><p id="b" class="aktiv">B</p></section>\n<section id="c" class="karte"><p id="d" class="aktiv">D</p></section>',
    code: 'const gemeinsam = document.querySelector(".karte.aktiv");\nconst darunter = document.querySelectorAll(".karte .aktiv");\n[gemeinsam.id, Array.from(darunter, el => el.id)]',
    choices: ['["a", ["a", "b", "d"]]', '["a", ["b", "d"]]', '["b", ["a", "c"]]', '["c", ["b", "d"]]'], correctIndex: 1,
    choiceExplanations: ["A erfüllt beide Klassen am selben Element, ist aber kein Nachfahre seiner selbst.", "A trägt beide Klassen. B und D tragen aktiv und liegen jeweils innerhalb einer Karte.", "B trägt nicht karte; A und C sind die Karten und nicht die gesuchten aktiv-Nachfahren.", "C trägt nur karte und erfüllt .karte.aktiv nicht."],
    answer: {heading: 'Ergebnis: ["a", ["b", "d"]]', lines: [".karte.aktiv verlangt beide Klassen am selben Element. section#a trägt karte und aktiv; gemeinsam.id ist daher die Zeichenkette a.", ".karte .aktiv verlangt ein aktiv-Element innerhalb eines anderen Elements mit karte. Das trifft auf p#b und p#d zu.", "section#a gehört nicht zur zweiten Rückgabe: Es hat zwar selbst beide Klassen, liegt aber nicht innerhalb einer anderen Karte. Ein Element ist kein Nachfahre seiner selbst.", "Array.from(darunter, el => el.id) bildet aus den beiden gefundenen Elementen ein Array ihrer ID-Zeichenketten: [\"b\", \"d\"]."], explanation: "Ohne Leerzeichen werden Bedingungen am selben Element kombiniert. Mit Leerzeichen wird eine Beziehung zwischen zwei Elementen verlangt: ein passender Vorfahr und ein passender Nachfahre."}
  },
  {
    id: "dom-03", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Reihenfolge einer Selektorliste",
    question: "Welche IDs stehen im Ergebnis? Erklären Sie, ob die zuerst geschriebene Auswahlbedingung bevorzugt wird.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="frueh" class="pflicht">Pflichtkurs</p>\n<p id="spaet" class="wahl">Wahlkurs</p>',
    code: 'const kombiniert = document.querySelector(".wahl, .pflicht");\nconst einzeln = document.querySelector(".wahl");\n[kombiniert.id, einzeln.id]',
    choices: ['["spaet", "spaet"]', '["frueh", "frueh"]', '["frueh", "spaet"]', '["spaet", "frueh"]'], correctIndex: 2,
    choiceExplanations: ["Das Komma macht .wahl nicht zur bevorzugten Bedingung; der frühere passende Absatz wird gefunden.", "Die zweite Abfrage sucht ausschließlich .wahl und findet deshalb spaet.", "Die kombinierte Abfrage findet frueh zuerst in Dokumentreihenfolge, die Einzelabfrage findet spaet.", "Die erste Bedingung wird nicht bevorzugt, und frueh besitzt die Klasse wahl nicht."],
    answer: {heading: 'Ergebnis: ["frueh", "spaet"]', lines: ["Das Komma in .wahl, .pflicht bedeutet: Das Element darf wahl oder pflicht besitzen. Beide Absätze erfüllen somit mindestens eine Bedingung.", "querySelector liefert nur den ersten passenden Treffer in der Reihenfolge des Dokuments. p#frueh steht vor p#spaet; kombiniert.id ist daher frueh.", "Die zweite Abfrage enthält nur .wahl. p#frueh trägt diese Klasse nicht, p#spaet schon; einzeln.id ist spaet.", "Die Reihenfolge im Ergebnis folgt den beiden Ausdrücken: zuerst kombiniert.id, dann einzeln.id."], explanation: "Die Selektoren vor und nach dem Komma sind gleichberechtigte Alternativen. Ihre Schreibreihenfolge legt keine bevorzugte Suche fest; bei querySelector entscheidet der erste passende Ort im Dokument."}
  },
  {
    id: "dom-04", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Eine Suche am Container beginnen",
    question: "Welche beiden Längen ergeben sich? Ordnen Sie die Absätze dem jeweiligen Suchbereich zu.",
    context: DOCUMENT_CONTEXT,
    html: '<main id="kurse">\n  <p id="a" class="hinweis">A</p>\n  <div><p id="b" class="hinweis">B</p></div>\n</main>\n<p id="c" class="hinweis">C</p>',
    code: 'const kurse = document.querySelector("#kurse");\nconst direkt = kurse.querySelectorAll(":scope > .hinweis");\nconst darunter = kurse.querySelectorAll(".hinweis");\n[direkt.length, darunter.length]',
    choices: ["[1, 3]", "[2, 2]", "[0, 2]", "[1, 2]"], correctIndex: 3,
    choiceExplanations: ["Auch die zweite Abfrage liefert nur Nachfahren von kurse; C liegt außerhalb.", "B ist kein direktes Kind von kurse und gehört nicht zur ersten Rückgabe.", ":scope bezeichnet bei dieser Suche kurse; dessen direktes passendes Kind A wird gefunden.", "Die erste Abfrage findet A, die zweite A und B."],
    answer: {heading: "Ergebnis: [1, 2]", lines: ["kurse bezeichnet main#kurse. Weil die beiden Abfragen auf diesem Element aufgerufen werden, können ihre Rückgaben nur Elemente innerhalb dieses main enthalten.", ":scope bezeichnet hier main#kurse selbst. :scope > .hinweis findet dessen direktes Kind p#a; p#b liegt eine Ebene tiefer im div. direkt.length ist 1.", "Die Abfrage nach .hinweis ohne > erlaubt jede tiefere Ebene. Sie findet p#a und p#b; darunter.length ist 2.", "p#c liegt außerhalb von main#kurse. Es wird in keiner der beiden Rückgaben mitgezählt."], explanation: "Der Aufruf auf einem Element begrenzt die zurückgegebenen Treffer auf dessen Nachfahren. :scope benennt dieses Ausgangselement ausdrücklich im Selektor, zum Beispiel um mit > nur seine direkten Kinder auszuwählen."}
  },
  {
    id: "dom-05", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Vorhandensein und Wert eines Attributs",
    question: "Welche IDs liefert der letzte Ausdruck? Unterscheiden Sie das Vorhandensein von hidden und dessen geschriebenen Attributwert.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="hinweis" hidden="false">A</p>\n<p id="b" class="hinweis" hidden>B</p>\n<p id="c" class="hinweis">C</p>',
    code: 'const ohne = document.querySelector(".hinweis:not([hidden])");\nconst wert = document.querySelector(".hinweis[hidden=false]");\n[ohne.id, wert.id]',
    choices: ['["c", "a"]', '["a", "a"]', '["c", "b"]', '["b", "c"]'], correctIndex: 0,
    choiceExplanations: ["Nur C besitzt kein hidden-Attribut. Bei A lautet der geschriebene Attributwert false.", "hidden=\"false\" ist trotzdem ein vorhandenes Attribut und wird von :not([hidden]) ausgeschlossen.", "B hat einen leeren Attributwert, nicht die Zeichenfolge false.", "B besitzt hidden; C besitzt keinen Attributwert false."],
    answer: {heading: 'Ergebnis: ["c", "a"]', lines: ["[hidden] prüft nur, ob das Attribut vorhanden ist. Sowohl p#a mit hidden=\"false\" als auch p#b mit hidden besitzen dieses Attribut.", ":not([hidden]) bedeutet: Das Element darf kein hidden-Attribut besitzen. Von den drei hinweis-Absätzen erfüllt das nur p#c; ohne.id ist c.", "[hidden=false] prüft dagegen den geschriebenen Attributwert. Nur bei p#a lautet dieser Wert false; bei p#b ist der Wert leer, bei p#c fehlt das Attribut. wert.id ist a."], explanation: "Das Wort false ist hier eine Zeichenkette im HTML und kein JavaScript-Wahrheitswert. hidden=\"false\" bedeutet nicht, dass hidden fehlt oder deaktiviert ist. Für eine Auswahl sichtbarer Elemente reicht dieser Attributwertvergleich deshalb nicht aus."}
  },
  {
    id: "dom-06", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Geschwister nach einer Überschrift",
    question: "Welche ID-Listen ergeben sich? Begründen Sie die unterschiedliche Reichweite von + und ~.",
    context: DOCUMENT_CONTEXT,
    html: '<section>\n  <h2 id="start">Kurse</h2>\n  <p id="a" class="hinweis">A</p>\n  <span id="pause">Zwischentext</span>\n  <p id="b" class="hinweis">B</p>\n  <p id="c" class="hinweis">C</p>\n</section>',
    code: 'const direkt = document.querySelectorAll("#start + .hinweis");\nconst spaeter = document.querySelectorAll("#start ~ .hinweis");\n[Array.from(direkt, el => el.id), Array.from(spaeter, el => el.id)]',
    choices: ['[["a"], ["b", "c"]]', '[["a"], ["a", "b", "c"]]', '[["a", "b", "c"], ["a"]]', '[[], ["a", "b", "c"]]'], correctIndex: 1,
    choiceExplanations: ["~ schließt den unmittelbar folgenden passenden Geschwisterknoten A nicht aus.", "+ findet das unmittelbar folgende passende Element A; ~ findet alle späteren passenden Geschwister A, B und C.", "Die Reichweiten sind vertauscht: + ist hier enger als ~.", "Zeilenumbrüche verhindern + nicht; dieser Kombinator betrachtet benachbarte Elemente."],
    answer: {heading: 'Ergebnis: [["a"], ["a", "b", "c"]]', lines: ["Geschwisterelemente haben dasselbe direkte Elternelement. Hier sind h2, p#a, span, p#b und p#c Kinder desselben section-Elements.", "#start + .hinweis prüft nur das unmittelbar auf h2#start folgende Geschwisterelement. Das ist p#a, und es trägt hinweis. Die erste ID-Liste enthält daher nur a.", "#start ~ .hinweis prüft alle späteren Geschwisterelemente. p#a, p#b und p#c passen; das span passt nicht, beendet diese Suche aber auch nicht.", "Die Zeilenumbrüche zwischen den Tags sind Textknoten. + und ~ vergleichen Elementgeschwister und überspringen solche Textknoten."], explanation: "+ überspringt kein dazwischenliegendes Element auf der Suche nach einem späteren Treffer. ~ erlaubt dagegen weitere passende Elemente nach dem Ausgangselement, sofern sie dasselbe direkte Elternelement haben."}
  },
  {
    id: "dom-07", level: "Erstie", topic: "Selektoren und Suchbereich", title: "Ein Wort oder eine Zeichenfolge suchen",
    question: "Welche Trefferzahlen ergeben sich? Erklären Sie den Unterschied zwischen ~= und *= anhand des zweiten Elements.",
    context: DOCUMENT_CONTEXT,
    html: '<div id="a" data-themen="html dom">A</div>\n<div id="b" data-themen="domino css">B</div>\n<div id="c" data-themen="dom">C</div>',
    code: 'const wort = document.querySelectorAll("[data-themen~=dom]");\nconst teil = document.querySelectorAll("[data-themen*=dom]");\n[wort.length, teil.length]',
    choices: ["[3, 2]", "[1, 3]", "[2, 3]", "[2, 2]"], correctIndex: 2,
    choiceExplanations: ["Wortsuche kann hier nicht mehr Treffer liefern als die Suche nach derselben Zeichenfolge.", "A enthält dom als eigenständiges Wort neben html und zählt bei ~= mit.", "A und C enthalten das Wort dom; B enthält die Zeichenfolge dom innerhalb von domino.", "*= findet dom auch am Anfang von domino, also zusätzlich B."],
    answer: {heading: "Ergebnis: [2, 3]", lines: ["~=dom sucht das vollständige Wort dom in einer durch Leerraum getrennten Wortliste. Bei div#a steht dom neben html; bei div#c ist dom das einzige Wort. Beide passen.", "Bei div#b lautet das erste Wort domino. Es enthält zwar die Buchstaben dom, ist aber nicht das vollständige Wort dom. wort.length ist daher 2.", "*=dom sucht nur die zusammenhängende Zeichenfolge dom, auch innerhalb eines längeren Wortes. Das trifft auf html dom, domino css und dom zu; teil.length ist 3."], explanation: "Verwenden Sie ~= für einzelne Einträge einer Wortliste und *= für Teiltext. Der Unterschied betrifft die Bedingung am Attributwert, nicht den Elementtyp oder die Tiefe im DOM."}
  },
  {
    id: "dom-08", level: "Bachelor", topic: "Selektoren und Suchbereich", title: "Überlappende Treffer zusammenführen",
    question: "Welche ID-Liste entsteht? Erklären Sie Reihenfolge und mögliche doppelte Einträge.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="hinweis aktiv">A</p>\n<p id="b" class="hinweis">B</p>\n<p id="c" class="aktiv">C</p>',
    code: 'const treffer = document.querySelectorAll(".aktiv, .hinweis");\nArray.from(treffer, el => el.id)',
    choices: ['["a", "c", "a", "b"]', '["a", "c", "b"]', '["a"]', '["a", "b", "c"]'], correctIndex: 3,
    choiceExplanations: ["Ein Element wird nicht doppelt geliefert, nur weil es mehrere Selektoren erfüllt.", "querySelectorAll ordnet nach dem Dokument, nicht zuerst nach .aktiv und danach nach .hinweis.", "Das Komma verlangt nicht beide Klassen; es verbindet alternative Bedingungen.", "Alle drei Elemente passen mindestens einmal; die Rückgabe enthält jedes einmal in Dokumentreihenfolge."],
    answer: {heading: 'Ergebnis: ["a", "b", "c"]', lines: ["Das Komma in .aktiv, .hinweis bedeutet: Mindestens eine der beiden Klassen muss vorhanden sein. p#a erfüllt beide Bedingungen, p#b nur hinweis, p#c nur aktiv.", "querySelectorAll gibt jedes passende Element genau einmal zurück. p#a erscheint daher trotz zweier passender Bedingungen nur einmal.", "Die gemeinsame NodeList folgt der Reihenfolge im Dokument: p#a, p#b, p#c. Die zuerst geschriebene Klasse aktiv wird nicht zuerst als eigene Gruppe ausgegeben.", "Array.from(treffer, el => el.id) liest aus jedem Element seine ID und erzeugt daraus das Array [\"a\", \"b\", \"c\"]."], explanation: "Eine Selektorliste mit Komma führt ihre Treffer zu einer gemeinsamen Auswahl zusammen. Sie ist keine Verkettung mehrerer einzelner Ergebnislisten."}
  },
  {
    id: "dom-09", level: "Master", topic: "Selektoren und Suchbereich", title: "Ein Vorfahr außerhalb des Suchcontainers",
    question: "Welche beiden Längen ergeben sich? Begründen Sie getrennt, wo Treffer liegen dürfen und welche Vorfahren der Selektor prüfen kann.",
    context: DOCUMENT_CONTEXT,
    html: '<main id="portal">\n  <section id="kurs"><p id="a" class="hinweis">A</p></section>\n  <p id="b" class="hinweis">B</p>\n</main>',
    code: 'const kurs = document.querySelector("#kurs");\nconst mitVorfahre = kurs.querySelectorAll("#portal .hinweis");\nconst unterScope = kurs.querySelectorAll(":scope #portal .hinweis");\n[mitVorfahre.length, unterScope.length]',
    choices: ["[1, 0]", "[2, 0]", "[0, 0]", "[1, 1]"], correctIndex: 0,
    choiceExplanations: ["A ist Nachfahre von kurs und besitzt den Vorfahren portal. Unter kurs gibt es jedoch kein #portal.", "B erfüllt zwar den Selektor, liegt aber außerhalb des Elements, dessen querySelectorAll aufgerufen wird.", "Der Vorfahr portal darf bei der ersten Selektorprüfung außerhalb des Suchcontainers liegen.", ":scope #portal verlangt ein #portal unterhalb von kurs; dieser Vorfahr liegt aber darüber."],
    answer: {heading: "Ergebnis: [1, 0]", lines: ["Beide Aufrufe erfolgen auf section#kurs. Deshalb können sie nur Elemente unterhalb von #kurs zurückgeben: p#a kommt infrage, p#b liegt außerhalb.", "Beim ersten Selektor erfüllt p#a die Klasse hinweis und hat main#portal als Vorfahren. Dieser Vorfahr darf außerhalb von section#kurs liegen. mitVorfahre enthält deshalb p#a und hat die Länge 1.", "Beim zweiten Selektor steht :scope für section#kurs. :scope #portal .hinweis verlangt die Reihenfolge: #kurs enthält #portal, und #portal enthält den passenden Hinweis.", "Im HTML ist die Beziehung umgekehrt: #portal enthält #kurs. Unter #kurs existiert kein #portal. Die zweite Abfrage bleibt daher leer und hat die Länge 0."], explanation: "Zwei Fragen sind getrennt zu prüfen: Liegt der zurückgegebene Treffer innerhalb des Ausgangselements? Erfüllt er den vollständigen Selektor? Die Prüfung eines Vorfahren kann über die Grenze des Ausgangselements hinausgehen; die Rückgabe selbst nicht."}
  },
  {
    id: "dom-10", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "ID und CSS-Selektor auseinanderhalten",
    question: "Welche beiden Wahrheitswerte liefert der Ausdruck? Erklären Sie, wie die beiden Suchmethoden ihre Zeichenketten interpretieren.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="kontakt" class="hinweis">Kursbüro</p>',
    code: 'const mitRaute = document.getElementById("#kontakt");\nconst perSelektor = document.querySelector("#kontakt");\nconst perId = document.getElementById("kontakt");\n[mitRaute === null, perSelektor === perId]',
    choices: ["[false, true]", "[true, true]", "[true, false]", "[false, false]"], correctIndex: 1,
    choiceExplanations: ["getElementById sucht den tatsächlichen ID-Wert; #kontakt ist hier kein vorhandener ID-Wert.", "Die erste Suche findet nichts. Die beiden korrekten Aufrufe liefern dasselbe vorhandene Elementobjekt.", "Die zwei korrekten Suchen erstellen keine Kopien, sondern liefern dasselbe Objekt.", "Die erste Suche findet nichts, während die zwei anderen dasselbe Element finden."],
    answer: {heading: "Ergebnis: [true, true]", lines: ["getElementById(\"#kontakt\") sucht den wörtlichen ID-Wert #kontakt einschließlich der Raute. Im HTML steht aber id=\"kontakt\". Die Suche liefert null; mitRaute === null ist true.", "querySelector(\"#kontakt\") interpretiert # als CSS-Zeichen für eine ID-Auswahl und findet p#kontakt.", "getElementById(\"kontakt\") sucht direkt den tatsächlichen ID-Wert und findet denselben Absatz.", "Die beiden erfolgreichen Abfragen erzeugen keine Elementkopien. perSelektor und perId bezeichnen dasselbe vorhandene DOM-Objekt; ihr Vergleich mit === ergibt true."], explanation: "getElementById erwartet den wörtlichen ID-Wert, querySelector einen CSS-Selektor. Ein gefundenes Element wird als Objekt zurückgegeben; seine ID ist nur eine Zeichenketten-Eigenschaft dieses Objekts."}
  },
  {
    id: "dom-11", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Eine erfolglose Suche prüfen",
    question: "Welche drei Werte entstehen? Begründen Sie, warum ein einfacher Wahrheitswerttest bei beiden Rückgaben unterschiedlich ausfällt.",
    context: DOCUMENT_CONTEXT,
    html: '<p class="hinweis">Plätze frei</p>',
    code: 'const einzeln = document.querySelector(".fehlt");\nconst alle = document.querySelectorAll(".fehlt");\n[Boolean(einzeln), Boolean(alle), alle.length]',
    choices: ["[false, false, 0]", "[true, true, 0]", "[false, true, 0]", "[false, true, 1]"], correctIndex: 2,
    choiceExplanations: ["Auch eine leere NodeList ist ein Objekt und wird zu true umgewandelt.", "querySelector liefert null, und Boolean(null) ist false.", "null wird false; die leere NodeList bleibt ein Objekt mit length 0 und wird true.", "Der Wahrheitswert eines Objekts erzeugt keinen Eintrag. Die Trefferzahl bleibt 0."],
    answer: {heading: "Ergebnis: [false, true, 0]", lines: ["Kein Element besitzt die Klasse fehlt. querySelector kann daher kein einzelnes Element liefern und gibt null zurück. Boolean(null) ist false.", "querySelectorAll gibt auch ohne Treffer eine NodeList zurück. Diese Sammlung ist ein Objekt; Boolean wandelt ein Objekt in true um, selbst wenn die Sammlung leer ist.", "Da kein Element gefunden wurde, enthält die NodeList keine Einträge. alle.length ist 0.", "Der letzte Ausdruck fragt nacheinander nach diesen beiden Wahrheitswerten und der Trefferzahl: [false, true, 0]."], explanation: "Bei querySelector können Sie auf null prüfen. Bei querySelectorAll prüfen Sie alle.length > 0, wenn Sie wissen möchten, ob Treffer vorhanden sind. Boolean(alle) oder if (alle) prüft diese Trefferzahl nicht."}
  },
  {
    id: "dom-12", level: "Master", topic: "Rückgaben und Sammlungen", title: "Zwei NodeLists nach einer Ergänzung",
    question: "Welche vier Werte liefert der letzte Ausdruck nach dem Anhängen? Erklären Sie, ob der Typname NodeList allein das Aktualisierungsverhalten festlegt.",
    context: DOCUMENT_CONTEXT + " Innerhalb des div stehen vor der Änderung keine Leerraum-Textknoten.",
    html: '<div id="kurs"><p id="a">A</p></div>',
    code: 'const kurs = document.querySelector("#kurs");\nconst kindknoten = kurs.childNodes;\nconst absatzTreffer = kurs.querySelectorAll(":scope > p");\nkurs.append(document.createElement("p"));\n[kindknoten instanceof NodeList, absatzTreffer instanceof NodeList, kindknoten.length, absatzTreffer.length]',
    choices: ["[true, true, 2, 2]", "[true, true, 1, 1]", "[false, true, 2, 1]", "[true, true, 2, 1]"], correctIndex: 3,
    choiceExplanations: ["Die per querySelectorAll gespeicherte NodeList nimmt den neuen Absatz nicht automatisch auf.", "childNodes ist lebend und enthält nach dem Anhängen beide direkten Knoten.", "Auch childNodes liefert eine NodeList; lebend bedeutet nicht HTMLCollection.", "Beide sind NodeLists. childNodes aktualisiert die Mitgliedschaft, querySelectorAll hält sie fest."],
    answer: {heading: "Ergebnis: [true, true, 2, 1]", lines: ["Vor dem Anhängen enthält das div nur p#a. kindknoten und absatzTreffer enthalten zunächst jeweils diesen einen Eintrag. Beide Sammlungen sind NodeLists; die beiden instanceof-Prüfungen ergeben true.", "document.createElement(\"p\") erzeugt ein neues p-Element, und append fügt es als zweites direktes Kind des div ein.", "Die über childNodes erhaltene NodeList aktualisiert ihre Einträge automatisch. kindknoten enthält nun das ursprüngliche und das neue p; kindknoten.length ist 2.", "Die bereits gespeicherte Rückgabe von querySelectorAll behält die bei der Abfrage ermittelten Einträge. absatzTreffer enthält weiterhin nur p#a; absatzTreffer.length ist 1."], explanation: "Lebend bedeutet: Die Mitgliedschaft der Sammlung folgt DOM-Änderungen automatisch. Statisch bedeutet: Die gespeicherte Sammlung behält ihre Einträge. Eine neue Abfrage liefert eine neue Sammlung mit den dann passenden Elementen. Statische Sammlungen enthalten trotzdem die vorhandenen Elementobjekte, keine eingefrorenen Kopien. Der Typname NodeList allein sagt daher nicht, ob die Sammlung lebend oder statisch ist."}
  },
  {
    id: "dom-13", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Objekte und Sammlungen einordnen",
    question: "Welche vier Wahrheitswerte ergeben sich? Ordnen Sie das gefundene Element und seine Sammlung in die Typen ein.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="hinweis">Plätze frei</p>',
    code: 'const element = document.querySelector("p");\nconst sammlung = document.querySelectorAll("p");\n[element instanceof Node, element instanceof Element, sammlung instanceof Node, Array.isArray(sammlung)]',
    choices: ["[true, true, false, false]", "[false, true, false, false]", "[true, true, true, false]", "[true, true, false, true]"], correctIndex: 0,
    choiceExplanations: ["Das p-Objekt ist Element und Node. Seine NodeList ist weder selbst Node noch Array.", "Jedes Element erbt von Node und ist damit auch ein Knoten.", "Die Sammlung verweist auf Knoten, wird dadurch aber nicht selbst zu einem Knoten.", "Indexzugriff und length machen eine NodeList nicht zu einem Array."],
    answer: {heading: "Ergebnis: [true, true, false, false]", lines: ["querySelector(\"p\") liefert das einzelne p-Element. Jedes Element ist zugleich ein Node, also ein DOM-Knoten. Die ersten beiden instanceof-Prüfungen ergeben deshalb true.", "querySelectorAll(\"p\") liefert eine NodeList mit einem Eintrag. Diese Sammlung enthält einen Verweis auf das p-Element, ist aber selbst kein Knoten im DOM. sammlung instanceof Node ist false.", "Eine NodeList erlaubt zum Beispiel length und den Zugriff mit [0]. Sie ist dennoch kein JavaScript-Array. Array.isArray(sammlung) ergibt deshalb false."], explanation: "Unterscheiden Sie das Elementobjekt von einem Sammlungsobjekt, das auf dieses Element verweist. Auch bei genau einem Treffer bleibt die Rückgabe von querySelectorAll eine Sammlung; sammlung[0] liefert daraus das einzelne Element."}
  },
  {
    id: "dom-14", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Hinter das Ende einer Sammlung greifen",
    question: "Welche beiden Wahrheitswerte erhalten Sie? Erläutern Sie den Unterschied zwischen Indexzugriff und item bei einem fehlenden Eintrag.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="einzig">Ein Kurs</p>',
    code: 'const liste = document.querySelectorAll("p");\nconst perIndex = liste[1];\nconst perMethode = liste.item(1);\n[perIndex === undefined, perMethode === null]',
    choices: ["[false, false]", "[true, true]", "[true, false]", "[false, true]"], correctIndex: 1,
    choiceExplanations: ["Index 1 liegt hinter dem einzigen Eintrag; die Zugriffe liefern die jeweils abgefragten fehlenden Werte.", "Der einzige Eintrag liegt bei Index 0. Der Indexzugriff liefert undefined, item liefert null.", "item(1) liefert bei einem nicht vorhandenen Eintrag tatsächlich null.", "liste[1] liefert undefined, weil dieser Index nicht vorhanden ist."],
    answer: {heading: "Ergebnis: [true, true]", lines: ["Die Abfrage findet genau p#einzig. Die NodeList hat deshalb length 1, und ihr einziger Eintrag steht bei Index 0.", "liste[1] fragt nach einem zweiten Eintrag. Diesen Eintrag gibt es nicht; die Schreibweise mit eckigen Klammern liefert undefined. perIndex === undefined ist daher true.", "liste.item(1) fragt ebenfalls nach dem nicht vorhandenen zweiten Eintrag. Diese DOM-Methode verwendet für diesen Fall null. perMethode === null ist daher ebenfalls true."], explanation: "Die Zahl 1 bezeichnet bei diesen JavaScript-Zugriffen den zweiten Eintrag, nicht den ersten. Fehlende Einträge werden je nach Zugriff verschieden angezeigt: [1] liefert undefined, item(1) liefert null."}
  },
  {
    id: "dom-15", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Treffer für eine Auswertung umwandeln",
    question: "Welche beiden Werte entstehen? Erklären Sie, welche Objekte und welche Zeichenketten die Schritte jeweils verarbeiten.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a">A</p>\n<p id="b" hidden>B</p>\n<p id="c">C</p>',
    code: 'const treffer = document.querySelectorAll("p");\nconst ids = Array.from(treffer)\n  .filter(el => !el.hasAttribute("hidden"))\n  .map(el => el.id);\n[Array.isArray(ids), ids.join(",")]',
    choices: ['[false, "a,c"]', '[true, "a,b,c"]', '[true, "a,c"]', '[true, "[object HTMLParagraphElement],[object HTMLParagraphElement]"]'], correctIndex: 2,
    choiceExplanations: ["Array.from erzeugt ein Array; filter und map geben ebenfalls Arrays zurück.", "Der Absatz B besitzt hidden und wird durch filter entfernt.", "Das Ergebnis ist ein Array der ID-Zeichenketten a und c; join verbindet sie mit einem Komma.", "map gibt die id-Werte zurück, nicht die Elementobjekte selbst."],
    answer: {heading: 'Ergebnis: [true, "a,c"]', lines: ["querySelectorAll findet alle drei p-Elemente, auch das mit hidden. Array.from erzeugt aus der NodeList ein JavaScript-Array mit denselben drei Elementobjekten.", "filter behält nur Elemente, für die !el.hasAttribute(\"hidden\") wahr ist. p#b hat hidden und wird aus der Auswahl entfernt; p#a und p#c bleiben.", "map liest von den verbleibenden Elementen jeweils el.id. ids enthält danach die Zeichenketten a und c, keine DOM-Elemente.", "ids ist ein Array, daher ergibt Array.isArray(ids) true. join(\",\") verbindet seine Zeichenketten mit einem Komma zu a,c."], explanation: "Die Verarbeitung hat drei verschiedene Ergebnisse: Array.from liefert ein Array mit Elementen, filter eine kleinere Auswahl dieser Elemente, map ein Array ihrer ID-Werte. Das DOM selbst wird dabei nicht verändert."}
  },
  {
    id: "dom-16", level: "Bachelor", topic: "Rückgaben und Sammlungen", title: "Mehrere Klassen als Suchwert",
    question: "Welche beiden Längen ergeben sich? Erklären Sie, weshalb die Aufrufe trotz derselben Klassennamen unterschiedliche Mengen finden.",
    context: DOCUMENT_CONTEXT,
    html: '<p id="a" class="aktiv hinweis">A</p>\n<p id="b" class="aktiv">B</p>\n<p id="c" class="hinweis">C</p>',
    code: 'const zusammen = document.getElementsByClassName("aktiv hinweis");\nconst alternativ = document.querySelectorAll(".aktiv, .hinweis");\n[zusammen.length, alternativ.length]',
    choices: ["[3, 3]", "[0, 3]", "[1, 1]", "[1, 3]"], correctIndex: 3,
    choiceExplanations: ["Mehrere Klassennamen in getElementsByClassName verlangen alle genannten Klassen am selben Element.", "Der Suchwert enthält zwei Klassennamen; er sucht keine einzelne Klasse mit einem Leerzeichen im Namen.", "Das Komma in der CSS-Abfrage verbindet Alternativen und findet deshalb auch B und C.", "Nur A trägt beide Klassen; die CSS-Alternative trifft A, B und C."],
    answer: {heading: "Ergebnis: [1, 3]", lines: ["getElementsByClassName(\"aktiv hinweis\") erwartet zwei Klassennamen. Beide müssen am selben Element vorkommen. Das erfüllt nur p#a; zusammen.length ist 1.", "querySelectorAll(\".aktiv, .hinweis\") erwartet eine CSS-Selektorliste. Das Komma bedeutet: aktiv oder hinweis reicht aus.", "p#a trägt beide Klassen, p#b trägt aktiv, p#c trägt hinweis. Alle drei passen zur zweiten Abfrage, und p#a wird nur einmal gezählt. alternativ.length ist 3."], explanation: "Entscheidend ist, welche Eingabe die jeweilige Methode erwartet. Eine mit Leerzeichen getrennte Klassennamenliste verlangt alle Klassen am selben Element. Ein Komma in einer CSS-Selektorliste verbindet dagegen Alternativen."}
  },
  {
    id: "dom-17", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Direkte Kinder und tiefe Absätze",
    question: "Welche drei Längen werden geliefert? Benennen Sie, an welcher Stelle jeweils der Elementtyp oder die Tiefe eingeschränkt wird.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="panel">\n  <h2>Kurse</h2>\n  <div><p id="a">A</p></div>\n  <p id="b">B</p>\n</section>',
    code: 'const panel = document.querySelector("#panel");\n[panel.children.length,\n panel.getElementsByTagName("p").length,\n panel.querySelectorAll(":scope > p").length]',
    choices: ["[3, 2, 1]", "[2, 2, 1]", "[3, 1, 1]", "[3, 2, 2]"], correctIndex: 0,
    choiceExplanations: ["Direkte Kindelemente sind h2, div und p. Beide p sind Nachfahren, aber nur B ist ein direktes Kind.", "children beschränkt sich nicht auf p-Elemente; h2 und div zählen ebenfalls.", "getElementsByTagName findet p-Nachfahren auch innerhalb des div.", "A ist ein Kind des div und erfüllt :scope > p am panel nicht."],
    answer: {heading: "Ergebnis: [3, 2, 1]", lines: ["panel.children enthält alle direkten Kindelemente des section: h2, div und p#b. Das sind 3 Elemente; Einrückungen sind Textknoten und zählen bei children nicht mit.", "panel.getElementsByTagName(\"p\") findet p-Nachfahren auf jeder tieferen Ebene: p#a im div und p#b direkt im section. Das sind 2 Absätze.", ":scope steht hier für section#panel. :scope > p verlangt ein p direkt darunter. Das erfüllt nur p#b; die dritte Länge ist 1.", "p#a wird bei children des panel nicht zusätzlich gezählt, weil sein direktes Elternelement das div ist."], explanation: "Prüfen Sie zwei Bedingungen getrennt: Welche Elementtypen dürfen vorkommen, und wie weit nach unten wird gesucht? children begrenzt nur die Tiefe; getElementsByTagName begrenzt den Tag-Namen; :scope > p begrenzt beides."}
  },
  {
    id: "dom-18", level: "Erstie", topic: "Rückgaben und Sammlungen", title: "Eine HTML-Liste und ihre Einträge",
    question: "Welche beiden Wahrheitswerte ergeben sich? Unterscheiden Sie das ul-Element, seine children-Sammlung und die Rückgabe von querySelectorAll.",
    context: DOCUMENT_CONTEXT,
    html: '<ul id="kurse"><li id="a">HTML</li><li id="b">CSS</li></ul>',
    code: 'const liste = document.querySelector("#kurse");\nconst eintraege = liste.querySelectorAll("li");\n[eintraege[1] === liste.children[1], liste instanceof NodeList]',
    choices: ["[false, true]", "[true, false]", "[true, true]", "[false, false]"], correctIndex: 1,
    choiceExplanations: ["Beide Indexzugriffe liefern dasselbe zweite li; das ul ist selbst keine NodeList.", "Beide Sammlungen verweisen an Index 1 auf li#b. liste bezeichnet dagegen das einzelne ul-Element.", "Eine als HTML-Liste dargestellte Struktur macht das ul-Element nicht zu einer NodeList.", "Verschiedene Sammlungen können Verweise auf dasselbe vorhandene DOM-Element enthalten."],
    answer: {heading: "Ergebnis: [true, false]", lines: ["liste bezeichnet das einzelne ul#kurse. eintraege ist dagegen eine NodeList mit den beiden li-Elementen in der Reihenfolge a, b.", "liste.children ist eine HTMLCollection der direkten Kindelemente. Da beide li direkt im ul liegen, hat sie ebenfalls die Reihenfolge a, b.", "JavaScript zählt Indizes ab 0. Deshalb liefern eintraege[1] und liste.children[1] beide das zweite li, also li#b. Es ist dasselbe DOM-Objekt; === ergibt true.", "Das ul stellt in HTML eine Liste dar, ist technisch aber ein einzelnes Element und keine NodeList. liste instanceof NodeList ist daher false."], explanation: "Eine HTML-Liste wie ul ist ein Element im DOM. NodeList und HTMLCollection sind Sammlungen mit Verweisen auf Elemente oder Knoten. Verschiedene Sammlungen können auf dasselbe einzelne Element verweisen."}
  },
  {
    id: "dom-19", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Auf mehreren Ebenen zählen",
    question: "Welche drei Längen ergeben sich? Zählen Sie für jede Eigenschaft nur die direkt zugehörigen Kindknoten.",
    context: WHITESPACE_CONTEXT,
    html: '<div id="kurs">\n  <p>Hallo <strong>DOM</strong></p>\n  <!-- intern -->\n</div>',
    code: 'const kurs = document.querySelector("#kurs");\nconst absatz = kurs.querySelector("p");\n[kurs.children.length, kurs.childNodes.length, absatz.childNodes.length]',
    choices: ["[2, 6, 2]", "[1, 3, 2]", "[1, 5, 2]", "[1, 5, 3]"], correctIndex: 2,
    choiceExplanations: ["strong ist ein Kind des p und kein direktes Kind des div; es erhöht dessen direkte Zählwerte nicht.", "Am div gibt es drei getrennte Leerraum-Textknoten, das p-Element und den Kommentar.", "Das div hat ein Kindelement und fünf Kindknoten. Das p enthält den Text Hallo und das strong-Element.", "DOM ist ein Textkind von strong und kein direktes Kind des p."],
    answer: {heading: "Ergebnis: [1, 5, 2]", lines: ["Am div ist p das einzige direkte Kindelement. kurs.children.length ist daher 1. strong liegt im p und ist kein direktes Kind des div.", "Die direkten Kindknoten des div stehen in dieser Reihenfolge: Leerraum-Text vor p, p-Element, Leerraum-Text vor dem Kommentar, Kommentar, Leerraum-Text vor </div>. kurs.childNodes.length ist deshalb 5.", "Das p hat genau zwei direkte Kindknoten: den Text „Hallo “ und das strong-Element. absatz.childNodes.length ist daher 2.", "Der Text „DOM“ liegt innerhalb von strong. Er ist ein Kind von strong und wird beim Zählen der direkten p-Kinder nicht nochmals mitgezählt."], explanation: "childNodes zählt auch Leerraum-Text und Kommentare; children zählt ausschließlich Elemente. Beide Eigenschaften betrachten nur direkte Kinder des jeweiligen Ausgangselements, keine Enkel."}
  },
  {
    id: "dom-20", level: "Erstie", topic: "Kindknoten und Navigation", title: "Attribute und Kindknoten trennen",
    question: "Welche drei Zahlen ergeben sich? Erklären Sie, zu welcher Struktur id, class und der Text gehören.",
    context: DOCUMENT_CONTEXT + " Innerhalb des p gibt es keine zusätzlichen Zeilenumbrüche oder Einrückungen.",
    html: '<p id="gruss" class="hinweis">Hallo <strong>DOM</strong></p>',
    code: 'const absatz = document.querySelector("#gruss");\n[absatz.attributes.length, absatz.childNodes.length, absatz.children.length]',
    choices: ["[2, 4, 1]", "[2, 3, 1]", "[2, 2, 2]", "[2, 2, 1]"], correctIndex: 3,
    choiceExplanations: ["id und class stehen in attributes, nicht zusätzlich in childNodes.", "Der Text DOM gehört direkt zu strong, nicht direkt zum p.", "Hallo ist ein Textknoten und kein Kindelement.", "Zwei Attribute, zwei direkte Kindknoten (Text und strong), ein direktes Kindelement."],
    answer: {heading: "Ergebnis: [2, 2, 1]", lines: ["Das p besitzt die Attribute id und class. absatz.attributes.length ist deshalb 2. Attribute werden nicht zusätzlich als Kindknoten des p geführt.", "Im p liegen direkt der Text „Hallo “ und das strong-Element. absatz.childNodes.length ist daher 2.", "children berücksichtigt nur Elemente. Der Text „Hallo “ zählt hier nicht mit, strong schon; absatz.children.length ist 1.", "Der Text „DOM“ ist ein Kind von strong und kein direktes Kind des p. Er erhöht daher keinen der beiden direkten Kinderzählwerte des p."], explanation: "attributes beschreibt Attribute am Element. childNodes enthält alle direkten Kindknoten, children nur die direkten Kindelemente. Diese drei Sammlungen beantworten unterschiedliche Fragen."}
  },
  {
    id: "dom-21", level: "Erstie", topic: "Kindknoten und Navigation", title: "Das erste Kind untersuchen",
    question: "Welche zwei Werte ergibt der Ausdruck? Erläutern Sie, weshalb die beiden Eigenschaften nicht dasselbe Objekt liefern.",
    context: WHITESPACE_CONTEXT + " nodeType 1 steht für Element, 3 für Text und 8 für Kommentar.",
    html: '<div id="kurs">\n  <p id="a">A</p>\n</div>',
    code: 'const kurs = document.querySelector("#kurs");\n[kurs.firstChild.nodeType, kurs.firstElementChild.id]',
    choices: ['[3, "a"]', '[1, "a"]', '[8, "a"]', '[3, "kurs"]'], correctIndex: 0,
    choiceExplanations: ["Vor dem p liegt ein Leerraum-Textknoten. Das erste Kindelement ist trotzdem p#a.", "firstChild überspringt den Zeilenumbruch vor p nicht.", "Einrückungen sind Text; hier steht kein Kommentar vor dem p.", "firstElementChild liefert ein Kind, nicht das Ausgangselement selbst."],
    answer: {heading: 'Ergebnis: [3, "a"]', lines: ["Direkt nach <div id=\"kurs\"> stehen ein Zeilenumbruch und Leerzeichen. Diese Zeichen bilden vor dem p einen eigenen Textknoten.", "firstChild liefert den ersten direkten Kindknoten unabhängig von seiner Art. Hier ist das dieser Leerraum-Textknoten; sein nodeType ist 3.", "firstElementChild überspringt Textknoten und sucht das erste direkte Kindelement. Das ist p#a; dessen id ist die Zeichenkette a."], explanation: "Unsichtbarer Leerraum kann ein eigener DOM-Knoten sein. firstChild berücksichtigt ihn, firstElementChild nicht. Die zusätzliche Bezeichnung Element ändert also, welche Knotenarten die Navigation beachtet."}
  },
  {
    id: "dom-22", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Position oder Elementtyp zählen",
    question: "Welche beiden Absatz-IDs ergeben sich? Erklären Sie, welche Geschwister bei den beiden Positionsangaben mitgezählt werden.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="kurs"><h2 id="titel">Kurs</h2><p id="a">A</p><p id="b">B</p></section>',
    code: 'const nachPosition = document.querySelector("#kurs > p:nth-child(2)");\nconst nachTyp = document.querySelector("#kurs > p:nth-of-type(2)");\n[nachPosition.id, nachTyp.id]',
    choices: ['["b", "b"]', '["a", "b"]', '["a", "a"]', '["b", "a"]'], correctIndex: 1,
    choiceExplanations: ["Bei nth-child zählt h2 mit. Das zweite Kindelement ist deshalb p#a.", "A ist das zweite Kindelement insgesamt; B ist das zweite p-Kindelement.", "nth-of-type zählt hier nur p-Geschwister und findet das zweite p, also B.", "Die beiden Zählweisen wurden vertauscht."],
    answer: {heading: 'Ergebnis: ["a", "b"]', lines: ["Alle direkten Kindelemente von #kurs haben diese CSS-Positionen: h2 ist das erste Kind, p#a das zweite, p#b das dritte. Textknoten werden bei dieser CSS-Zählung nicht berücksichtigt.", "p:nth-child(2) verlangt zwei Dinge am selben Element: Es muss ein p sein und unter allen Kindelementen an Position 2 stehen. Das trifft auf p#a zu.", "p:nth-of-type(2) zählt dagegen nur die p-Geschwister: p#a ist das erste p, p#b das zweite. Die Überschrift h2 wird in dieser Reihe nicht mitgezählt.", "Die beiden .id-Zugriffe ergeben deshalb zuerst a und dann b."], explanation: "CSS beschreibt die Position („das zweite Kind“), JavaScript verwendet einen Index ([1]). CSS-Positionen beginnen bei 1. Bei nth-child zählen alle Geschwisterelemente mit; bei nth-of-type nur Geschwister desselben Elementtyps."}
  },
  {
    id: "dom-23", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Gleicher Index, unterschiedliche Sammlung",
    question: "Welche drei Werte ergeben sich? Zeigen Sie, weshalb Index 1 in den beiden Sammlungen auf unterschiedliche Elemente verweist.",
    context: WHITESPACE_CONTEXT + " Bei HTML-Elementen gibt nodeName den Tag-Namen in Großbuchstaben zurück.",
    html: '<section id="kurs">\n  <h2 id="titel">Kurs</h2>\n  <p id="info">Info</p>\n</section>',
    code: 'const kurs = document.querySelector("#kurs");\n[kurs.children[1].id, kurs.childNodes[1].nodeName, kurs.childNodes.length]',
    choices: ['["titel", "H2", 5]', '["info", "P", 2]', '["info", "H2", 5]', '["info", "P", 5]'], correctIndex: 2,
    choiceExplanations: ["children zählt ab Index 0: h2 liegt bei 0, p bei 1.", "childNodes enthält außerdem drei Leerraum-Textknoten und hat deshalb fünf Einträge.", "children[1] ist p#info. childNodes[0] ist Leerraum und childNodes[1] daher h2.", "Der erste Leerraum-Textknoten verschiebt die Elementpositionen in childNodes; p liegt dort bei Index 3."],
    answer: {heading: 'Ergebnis: ["info", "H2", 5]', lines: ["children enthält nur die direkten Kindelemente: Index 0 ist h2#titel, Index 1 ist p#info. kurs.children[1].id ergibt deshalb info.", "childNodes enthält auch die Einrückungen: Index 0 ist Leerraum-Text, Index 1 h2, Index 2 Leerraum-Text, Index 3 p, Index 4 Leerraum-Text.", "kurs.childNodes[1] ist folglich das h2-Element. Bei einem HTML-Element gibt nodeName den Tag-Namen in Großbuchstaben zurück; der zweite Wert ist H2.", "Die fünf Einträge von Index 0 bis Index 4 ergeben kurs.childNodes.length === 5."], explanation: "Beide Sammlungen zählen ihre Indizes ab 0. Der Unterschied entsteht durch ihren Inhalt: childNodes zählt Leerraum-Textknoten mit, children nicht. Derselbe Index kann deshalb auf unterschiedliche Elemente verweisen."}
  },
  {
    id: "dom-24", level: "Erstie", topic: "Kindknoten und Navigation", title: "Zum nächsten Geschwister wechseln",
    question: "Welche zwei Werte liefert der Ausdruck? Erläutern Sie, welches Objekt beim jeweiligen Zugriff übersprungen wird.",
    context: DOCUMENT_CONTEXT + " Zwischen den gezeigten Tags stehen keine Leerzeichen. nodeType 1 bedeutet Element, 3 Text und 8 Kommentar.",
    html: '<div id="kurs"><p id="a">A</p><!-- intern --><p id="b">B</p></div>',
    code: 'const erster = document.querySelector("#a");\n[erster.nextSibling.nodeType, erster.nextElementSibling.id]',
    choices: ['[1, "b"]', '[3, "b"]', '[8, "a"]', '[8, "b"]'], correctIndex: 3,
    choiceExplanations: ["nextSibling liefert zuerst den Kommentar, nicht direkt das folgende Element.", "Ohne Leerraum zwischen den Tags steht hier ein Kommentarknoten als nächstes Geschwister.", "nextElementSibling liefert das nächste Element, nicht das Ausgangselement selbst.", "nextSibling findet den Kommentar; nextElementSibling überspringt ihn und findet p#b."],
    answer: {heading: 'Ergebnis: [8, "b"]', lines: ["Im div stehen unmittelbar nacheinander p#a, der Kommentar <!-- intern --> und p#b. Dazwischen gibt es keine zusätzlichen Leerraum-Textknoten.", "erster bezeichnet p#a. Dessen nextSibling ist der direkt folgende Kommentarknoten. Ein Kommentar hat nodeType 8, daher ist der erste Ergebniswert 8.", "nextElementSibling sucht nur das nächste Geschwisterelement. Es überspringt den Kommentar und findet p#b; dessen id ist b."], explanation: "Geschwister teilen sich dasselbe direkte Elternelement. nextSibling beachtet alle Knotenarten; nextElementSibling beachtet ausschließlich Elemente. Beide gehen vom Ausgangselement aus vorwärts, nicht in dessen Kinder hinein."}
  },
  {
    id: "dom-25", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Eltern am Rand des Dokuments",
    question: "Welche drei Werte entstehen? Begründen Sie, weshalb ein vorhandener Elternknoten nicht immer ein Elternelement ist.",
    context: DOCUMENT_CONTEXT + " Chrome ergänzt den üblichen html- und body-Rahmen. documentElement bezeichnet das html-Element.",
    html: '<p id="wort">Hallo</p>',
    code: 'const wurzel = document.documentElement;\nconst text = document.querySelector("#wort").firstChild;\n[wurzel.parentNode === document, wurzel.parentElement === null, text.parentElement.id]',
    choices: ['[true, true, "wort"]', '[true, false, "wort"]', '[false, true, "wort"]', '[true, true, "body"]'], correctIndex: 0,
    choiceExplanations: ["Das html-Element hat das Dokument als Elternknoten. Der Text Hallo hat p#wort als Elternelement.", "Das Dokument ist kein Element; deshalb ist parentElement beim html-Element null.", "Das html-Element ist ein direkter Kindknoten des Dokuments.", "Der Text Hallo liegt unmittelbar im p, nicht unmittelbar im body."],
    answer: {heading: 'Ergebnis: [true, true, "wort"]', lines: ["wurzel bezeichnet das html-Element. Sein direkter Elternknoten ist das Dokumentobjekt document; wurzel.parentNode === document ergibt true.", "document ist ein Dokumentknoten und kein Element. parentElement liefert nur ein direktes Elternelement oder null. Deshalb ist wurzel.parentElement null, und der zweite Vergleich ergibt true.", "text bezeichnet den Textknoten „Hallo“ innerhalb von p#wort. Dessen direktes Elternelement ist das p, nicht body. text.parentElement.id ergibt wort."], explanation: "parentNode kann einen Dokumentknoten oder ein Element liefern. parentElement liefert nur dann ein Element, wenn der unmittelbare Elternknoten tatsächlich ein Element ist; andernfalls liefert es null und sucht nicht weiter oben."}
  },
  {
    id: "dom-26", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Vom Element nach oben oder unten suchen",
    question: "Welche beiden Werte liefert der Ausdruck? Erklären Sie, welche Suchrichtung und welcher Startpunkt jeweils verwendet werden.",
    context: DOCUMENT_CONTEXT,
    html: '<section id="aussen" class="karte"><button id="start" class="karte"><span id="symbol">Los</span></button></section>',
    code: 'const taste = document.querySelector("#start");\n[taste.closest(".karte").id, taste.querySelector(".karte")]',
    choices: ['["aussen", null]', '["start", null]', '["start", "aussen"]', '["aussen", "start"]'], correctIndex: 1,
    choiceExplanations: ["closest prüft zuerst das Ausgangselement selbst, das hier bereits karte besitzt.", "closest findet den Button selbst. querySelector durchsucht dessen Nachfahren; dort gibt es keine .karte.", "querySelector sucht keine Vorfahren und liefert bei einem Treffer außerdem ein Elementobjekt, keine ID-Zeichenfolge.", "closest überspringt den passenden Button nicht; querySelector schließt das Ausgangselement nicht als eigenen Nachfahren ein."],
    answer: {heading: 'Ergebnis: ["start", null]', lines: ["taste bezeichnet button#start. closest(\".karte\") prüft zuerst diesen Button selbst. Er trägt bereits die Klasse karte; die Suche endet dort und .id liefert start.", "Das ebenfalls passende section#aussen wird nicht mehr untersucht, weil closest schon am Ausgangselement einen Treffer gefunden hat.", "taste.querySelector(\".karte\") durchsucht dagegen nur Nachfahren des Buttons. Dort gibt es lediglich span#symbol ohne die Klasse karte. Die Abfrage liefert null.", "Der Button zählt nicht als eigener Nachfahre. Das section ist ein Vorfahr und liegt ebenfalls nicht im Suchbereich dieser zweiten Abfrage."], explanation: "closest prüft das Ausgangselement und geht bei Bedarf nach oben zu seinen Vorfahren. querySelector auf einem Element sucht nach unten unter dessen Nachfahren. Die Rückgabe eines Treffers wäre in beiden Fällen ein Elementobjekt; erst .id liest daraus eine Zeichenkette."}
  },
  {
    id: "dom-27", level: "Bachelor", topic: "Kindknoten und Navigation", title: "Leer bedeutet nicht immer kinderlos",
    question: "Welche drei Werte liefert der Ausdruck? Vergleichen Sie die CSS-Bedingung :empty mit dem Zählen aller Kindknoten.",
    context: DOCUMENT_CONTEXT + " In b steht genau ein Leerzeichen. Es gilt das Verhalten von :empty in Chrome: Kommentare zählen nicht als Inhalt, Textknoten mit Leerraum dagegen schon.",
    html: '<div id="a"><!-- intern --></div>\n<div id="b"> </div>\n<div id="c"><span></span></div>',
    code: 'const ids = Array.from(document.querySelectorAll("div:empty"), el => el.id);\n[ids.join(","), document.querySelector("#a").childNodes.length, document.querySelector("#b").childNodes.length]',
    choices: ['["a,b", 1, 1]', '["", 1, 1]', '["a", 1, 1]', '["a", 0, 0]'], correctIndex: 2,
    choiceExplanations: ["Das Leerzeichen in b ist ein Textknoten und verhindert in Chrome den Treffer auf :empty.", "Der Kommentar in a verhindert :empty nicht; a wird deshalb gefunden.", "Nur a erfüllt :empty, hat aber trotzdem einen Kommentarknoten. Auch b besitzt einen Kindknoten, nämlich Text.", "Die CSS-Bedingung entfernt keine Knoten. Kommentar und Leerraum bleiben in childNodes enthalten."],
    answer: {heading: 'Ergebnis: ["a", 1, 1]', lines: ["div#a enthält nur einen Kommentar. Beim in der Aufgabe vorgegebenen Chrome-Verhalten berücksichtigt :empty Kommentare nicht; div#a passt daher zur CSS-Bedingung.", "div#b enthält ein Leerzeichen als Textknoten. Dieser Text verhindert in Chrome den Treffer auf :empty. div#c enthält ein span-Element; auch ein in sich leeres span verhindert den Treffer beim umgebenden div.", "Die Abfrage findet somit nur div#a. Array.from liest dessen ID, und join(\",\") liefert bei diesem einen Eintrag die Zeichenkette a.", "childNodes zählt alle direkten Kindknoten: bei div#a den Kommentar, bei div#b den Leerraum-Text. Beide Sammlungen haben deshalb die Länge 1."], explanation: ":empty prüft eine CSS-Bedingung und verändert keine DOM-Knoten. Deshalb kann ein Element :empty erfüllen und trotzdem einen Kindknoten besitzen: Ein vorhandener Kommentar zählt bei childNodes mit, bei dieser CSS-Bedingung nicht."}
  }
];
