const CSS_CONTEXT = "Es gelten nur die gezeigten Autorenstile, ohne zusätzliche Regeln, Animationen, Übergänge oder @scope. Nicht ausdrücklich geschichtete Regeln stehen außerhalb von @layer. Vergleichen Sie jeweils dieselbe CSS-Eigenschaft am genannten Ziel.";
const DOM_CONTEXT = "Das gezeigte HTML steht vollständig im body. Der Code läuft danach genau einmal; weitere Skripte oder Benutzereingaben gibt es nicht. Gefragt ist der Wert des letzten Ausdrucks.";

export const CSS_MUTATION_QUESTIONS = [
  {
    id: "css-01", level: "Erstie", topic: "CSS-Spezifität", title: "Einen zusammengesetzten Selektor zerlegen",
    question: "Welche Spezifität hat dieser Selektor? Geben Sie das Tripel (A, B, C) an und ordnen Sie seine Bestandteile den drei Gruppen zu.",
    context: "A zählt ID-Selektoren, B zählt Klassen, Attributselektoren und gewöhnliche Pseudoklassen, C zählt Elementnamen und Pseudoelemente. Es geht um das Gewicht des Selektors, nicht um einen Regelgewinner.",
    css: '#portal .karte[data-status="frei"] > p.hinweis::first-line',
    choices: ["(1, 2, 3)", "(0, 4, 2)", "(1, 3, 2)", "(1, 4, 1)"], correctIndex: 2,
    choiceExplanations: [
      "Der Attributselektor zählt wie die beiden Klassen in B. Er ist kein zusätzlicher Elementname in C.",
      "#portal ist ein ID-Selektor und zählt in A; ein Attribut mit dem Namen id wäre dagegen ein Attributselektor.",
      "#portal zählt in A; .karte, [data-status] und .hinweis in B; p und ::first-line in C.",
      "::first-line ist ein Pseudoelement in C. Der Kombinator > trägt kein Gewicht bei."
    ],
    answer: {heading: "Spezifität (1, 3, 2)", lines: ["A: #portal", 'B: .karte, [data-status="frei"], .hinweis', "C: p, ::first-line"], explanation: "Die Schreibweise entscheidet über die Gruppe. Der Attributwert frei erhöht das Gewicht nicht. Leerraum und > beschreiben Beziehungen zwischen Elementen, erhöhen aber keine der drei Zahlen."}
  },
  {
    id: "css-02", level: "Erstie", topic: "CSS-Spezifität", title: "Gewichte von links nach rechts vergleichen",
    question: "Welche Textfarbe erhält der Absatz #ziel? Begründen Sie, welcher Vergleichsschritt entscheidet.",
    context: CSS_CONTEXT,
    html: '<main id="kurse" class="portal"><section class="karte"><p id="ziel" class="hinweis aktiv">Plätze frei</p></section></main>',
    css: '#kurse p { color: blue; }\n.portal .karte p.hinweis.aktiv { color: red; }',
    choices: ["Blau: Die erste Regel gewinnt bereits beim Vergleich der ID-Gruppe.", "Rot: Vier Klassen wiegen zusammen mehr als ein ID-Selektor.", "Rot: Die spätere Regel gewinnt unabhängig von ihren Gewichten.", "Blau: Die frühere Regel hat bei unterschiedlich langen Selektoren Vorrang."], correctIndex: 0,
    choiceExplanations: [
      "(1, 0, 1) gewinnt gegen (0, 4, 1), weil die erste unterschiedliche Gruppe A ist.",
      "Klassen werden nicht zu ID-Punkten addiert. Die Gruppen werden von links nach rechts verglichen.",
      "Die Reihenfolge entscheidet hier nicht, weil die Spezifitäten verschieden sind.",
      "Die frühere Position und die Zeichenlänge sind kein Vorrangkriterium. Entscheidend ist der ID-Selektor."
    ],
    answer: {heading: "Der Absatz wird blau", lines: ["#kurse p: (1, 0, 1)", ".portal .karte p.hinweis.aktiv: (0, 4, 1)"], explanation: "Spezifität ist ein geordnetes Tripel, keine gewöhnliche Dezimalzahl und keine Summe aller Bestandteile. Sobald A verschieden ist, entscheiden die Klassen und Elementnamen den Vergleich nicht mehr."}
  },
  {
    id: "css-03", level: "Erstie", topic: "CSS-Spezifität", title: "Direkte Kinder und Gewicht auseinanderhalten",
    question: "Welche Farbe erhält #ziel, und weshalb? Beachten Sie sowohl die Treffer als auch die Gewichte der Regeln.",
    context: CSS_CONTEXT,
    html: '<section class="karte"><p id="ziel" class="hinweis">Plätze frei</p></section>',
    css: '.karte .hinweis { color: red; }\n.karte > .hinweis { color: blue; }',
    choices: ["Blau: > erhöht das Gewicht gegenüber dem Nachfahren-Kombinator.", "Rot: Ein Nachfahren-Selektor zählt alle durchlaufenen Ebenen mit.", "Rot: Bei gleicher Spezifität gewinnt immer die zuerst notierte Regel.", "Blau: Beide Gewichte sind gleich; deshalb entscheidet hier die spätere Regel."], correctIndex: 3,
    choiceExplanations: [
      "> schränkt die Treffer auf direkte Kinder ein, erhöht aber die Spezifität nicht.",
      "DOM-Tiefe und Zahl durchlaufener Ebenen werden nicht als zusätzliche Gewichte gezählt.",
      "Bei sonst gleichem Vorrang gewinnt die später notierte Deklaration.",
      "Beide Selektoren treffen den Absatz und haben (0, 2, 0). Die blaue Regel steht später."
    ],
    answer: {heading: "Blau durch die Reihenfolge", lines: ["Beide Selektoren: (0, 2, 0)", "Beide treffen das direkte p-Kind der Karte."], explanation: "Eine engere Treffermenge bedeutet nicht automatisch eine höhere Spezifität. Der Unterschied zwischen Leerzeichen und > verändert hier die Auswahlbedingung, nicht das Gewicht."}
  },
  {
    id: "css-04", level: "Erstie", topic: "CSS-Spezifität", title: "Eine ID auf zwei Arten ansprechen",
    question: "Welche Farbe erhält #ziel? Erklären Sie, ob beide Schreibweisen dasselbe Gewicht besitzen.",
    context: CSS_CONTEXT,
    html: '<p id="ziel" class="hinweis">Plätze frei</p>',
    css: '#ziel { color: blue; }\np[id="ziel"].hinweis { color: red; }',
    choices: ["Rot: Beide Regeln zählen eine ID; die zweite zählt zusätzlich p und .hinweis.", "Blau: #ziel zählt in A, [id=\"ziel\"] dagegen in B.", "Rot: Ein Attributselektor zählt sowohl seinen Namen als auch seinen Wert.", "Blau: Attributselektoren dürfen ein id-Attribut nicht auswählen."], correctIndex: 1,
    choiceExplanations: [
      "Der Attributname id macht [id=\"ziel\"] nicht zu einem ID-Selektor. Seine Syntax zählt in B.",
      "(1, 0, 0) gewinnt gegen (0, 2, 1). Beide Regeln treffen, aber ihre Gewichte unterscheiden sich.",
      "Ein Attributselektor zählt einmal in B, unabhängig von der Länge seines Namens oder Werts.",
      "Attributselektoren können das id-Attribut auswählen. Sie haben dabei ein anderes Gewicht als #ziel."
    ],
    answer: {heading: "Blau durch den ID-Selektor", lines: ["#ziel: (1, 0, 0)", 'p[id="ziel"].hinweis: (0, 2, 1)'], explanation: "Dass zwei Selektoren dasselbe Element finden, macht ihre Spezifität nicht gleich. Für die Berechnung zählt die Form des Selektors, nicht die Bedeutung des ausgewählten Attributs."}
  },
  {
    id: "css-05", level: "Master", topic: "CSS-Spezifität", title: "Eine Alternative in :is() berücksichtigen",
    question: "Welche Farbe erhält #ziel? Erläutern Sie die Rolle des nicht vorhandenen Elements #archiv.",
    context: CSS_CONTEXT + " Im Dokument existiert kein Element mit id=archiv.",
    html: '<section class="karte"><p id="ziel" class="hinweis">Plätze frei</p></section>',
    css: ':is(#archiv, .karte) .hinweis { color: red; }\n.karte .hinweis { color: blue; }',
    choices: ["Blau: :is() übernimmt nur das Gewicht des tatsächlich treffenden Zweigs.", "Blau: Ein fehlendes #archiv macht die gesamte :is()-Auswahl ungültig.", "Rot: :is() übernimmt das höchste Argumentgewicht, auch wenn .karte den Treffer ermöglicht.", "Rot: :is() addiert die Gewichte aller seiner Argumente zusammen."], correctIndex: 2,
    choiceExplanations: [
      "Bei :is() bestimmt der stärkste Selektor in der Argumentliste das Gewicht, nicht nur der treffende Zweig.",
      "Eine gültige Alternative ohne Treffer macht :is() nicht ungültig. .karte reicht zum Treffen aus.",
      "#archiv liefert das höchste Argumentgewicht (1, 0, 0); .hinweis ergänzt (0, 1, 0).",
      "Die Argumentgewichte werden nicht summiert. :is() übernimmt das Maximum."
    ],
    answer: {heading: "Rot mit Spezifität (1, 1, 0)", lines: [":is(#archiv, .karte) .hinweis: (1, 1, 0)", ".karte .hinweis: (0, 2, 0)"], explanation: "Trefferprüfung und Gewichtung erfüllen unterschiedliche Aufgaben. Der Zweig .karte sorgt für den Treffer. Der stärkere ID-Zweig bestimmt trotzdem das Gewicht von :is()."}
  },
  {
    id: "css-06", level: "Bachelor", topic: "CSS-Spezifität", title: "Den Kontext mit :where() eingrenzen",
    question: "Welche Farbe erhält #ziel? Berechnen Sie beide Gewichte, bevor Sie vergleichen.",
    context: CSS_CONTEXT,
    html: '<main id="portal"><p id="ziel" class="hinweis aktiv">Plätze frei</p></main>',
    css: ':where(#portal, .karte) p.hinweis { color: red; }\n.hinweis.aktiv { color: blue; }',
    choices: ["Rot: Die ID in :where() zählt höher als zwei Klassen.", "Blau: :where() samt Argumenten zählt null; die zweite Regel gewinnt in B.", "Rot: p plus .hinweis und :where() ergeben drei Einheiten in B.", "Blau: :where() verhindert grundsätzlich, dass eine Regel ein Element trifft."], correctIndex: 1,
    choiceExplanations: [
      ":where() hebt das Gewicht seiner gesamten Argumentliste auf, einschließlich der ID.",
      "Die erste Regel hat (0, 1, 1), die zweite (0, 2, 0). Der Vergleich ist in B entschieden.",
      "p zählt in C, .hinweis in B und :where() in keiner Gruppe.",
      ":where() trifft passende Elemente durchaus. Nullgewicht ist nicht mit fehlenden Treffern gleichzusetzen."
    ],
    answer: {heading: "Blau mit (0, 2, 0)", lines: [":where(#portal, .karte) p.hinweis: (0, 1, 1)", ".hinweis.aktiv: (0, 2, 0)"], explanation: ":where() erlaubt, den Wirkungsbereich einer Regel genau zu beschreiben, ohne das Gewicht dieses Kontextes mitzunehmen. Das kann spätere gezielte Anpassungen erleichtern."}
  },
  {
    id: "css-07", level: "Master", topic: "CSS-Spezifität", title: "Eine Negation gewichten",
    question: "Welche Farbe erhält #ziel? Welche Bedeutung hat das Argument #sperre für die Spezifität?",
    context: CSS_CONTEXT + " Der Absatz hat weder die Klasse ausgebucht noch die ID sperre.",
    html: '<section class="karte"><p id="ziel" class="hinweis">Plätze frei</p></section>',
    css: 'p:not(.ausgebucht, #sperre) { color: red; }\n.karte p.hinweis { color: blue; }',
    choices: ["Rot: :not() übernimmt das höchste Argumentgewicht; p ergänzt die Elementgruppe.", "Blau: Negierte Selektoren werden bei der Spezifität grundsätzlich nicht gezählt.", "Blau: :not() zählt nur eine gewöhnliche Pseudoklasse, unabhängig vom Inhalt.", "Rot: Weil das p passt, addiert :not() beide Argumentgewichte."], correctIndex: 0,
    choiceExplanations: [
      "Das stärkste Argument ist #sperre mit (1, 0, 0). Zusammen mit p ergibt das (1, 0, 1).",
      "Das Negieren einer Bedingung entfernt nicht ihr Gewicht. :not() übernimmt das Maximum seiner Argumente.",
      ":not() gehört zu den Ausnahmen: Es hat keinen eigenen B-Punkt, sondern übernimmt ein Argumentgewicht.",
      ":not() summiert seine Alternativen nicht. Für das Gewicht zählt nur die stärkste Alternative."
    ],
    answer: {heading: "Rot durch (1, 0, 1)", lines: ["p:not(.ausgebucht, #sperre): (1, 0, 1)", ".karte p.hinweis: (0, 2, 1)"], explanation: "Die Negation trifft, weil der Absatz keine ihrer Ausschlussbedingungen erfüllt. Das bedeutet nicht, dass diese Bedingungen beim Berechnen des Gewichts verschwinden."}
  },
  {
    id: "css-08", level: "Master", topic: "CSS-Spezifität", title: "Eine Karte mit :has() gestalten",
    question: "Welchen Wert erhält border-color an der section.karte? Begründen Sie sowohl den Treffer von :has() als auch den Regelvergleich.",
    context: CSS_CONTEXT + " Im Dokument gibt es kein Element mit id=extra. Gefragt ist die section, nicht ihr Absatz.",
    html: '<main id="kurse"><section class="karte"><p class="hinweis">Plätze frei</p></section></main>',
    css: '.karte:has(> p.hinweis, #extra) { border-color: red; }\n#kurse .karte { border-color: blue; }',
    choices: ["Rot: :has() addiert beide Argumentgewichte und übertrifft dadurch die zweite Regel.", "Blau: Der fehlende #extra-Zweig verhindert jeden Treffer der ersten Regel.", "Rot: Die unmittelbare Beziehung > ist stärker als die Nachfahren-Beziehung.", "Blau: Beide Gewichte sind (1, 1, 0); die spätere Regel entscheidet."], correctIndex: 3,
    choiceExplanations: [
      ":has() übernimmt das stärkste Argumentgewicht, nicht die Summe der Alternativen.",
      "Das direkte p.hinweis-Kind erfüllt bereits eine Alternative von :has().",
      "Kombinatoren erhöhen die Spezifität nicht. Die Art der Beziehung entscheidet hier keinen Gewichtsvorsprung.",
      ".karte liefert (0, 1, 0), :has() übernimmt von #extra (1, 0, 0). Die Gewichte sind damit gleich."
    ],
    answer: {heading: "Die Rahmenfarbe der Karte ist blau", lines: [".karte:has(> p.hinweis, #extra): (1, 1, 0)", "#kurse .karte: (1, 1, 0)"], explanation: ":has() prüft eine Beziehung vom ausgewählten Element aus. Hier wird die Karte gestaltet, weil sie ein passendes direktes Kind besitzt. Das höchste Argumentgewicht bleibt auch bei :has() unabhängig vom tatsächlich treffenden Zweig."}
  },
  {
    id: "css-09", level: "Master", topic: "CSS-Spezifität", title: "Die of-Liste einer Positionsregel gewichten",
    question: "Welche Spezifität hat dieser Selektor als Tripel (A, B, C)? Erklären Sie insbesondere, ob die Zahl 2 einen Gewichtungsbeitrag liefert.",
    context: "A steht für ID-Selektoren, B für Klassen, Attributselektoren und gewöhnliche Pseudoklassen, C für Elementnamen und Pseudoelemente. Nur das Selektorgewicht ist gefragt.",
    css: 'li:nth-child(2 of .hinweis, #ziel)',
    choices: ["(1, 0, 1)", "(1, 1, 1)", "(1, 2, 1)", "(0, 2, 1)"], correctIndex: 1,
    choiceExplanations: [
      "Zusätzlich zum stärksten of-Argument zählt :nth-child() selbst einmal in B.",
      "#ziel liefert A=1, :nth-child() liefert B=1 und li liefert C=1. Die Positionszahl erhöht nichts.",
      "Die 2 ist eine Position, kein zusätzlicher B-Punkt. Außerdem werden die of-Alternativen nicht summiert.",
      "Die stärkste of-Alternative ist #ziel. Ihr Gewicht gehört in A, nicht in B."
    ],
    answer: {heading: "Spezifität (1, 1, 1)", lines: ["li: (0, 0, 1)", ":nth-child(): (0, 1, 0)", "Stärkstes of-Argument #ziel: (1, 0, 0)"], explanation: "Bei :nth-child(... of ...) werden das Gewicht der Positions-Pseudoklasse und das höchste Gewicht der of-Liste addiert. Die Positionsformel ist keine Liste zusätzlicher Selektoren."}
  },
  {
    id: "css-10", level: "Master", topic: "CSS-Spezifität", title: "Eine äußere Selektorliste von :is() unterscheiden",
    question: "Welche Farbe erhält #ziel? Erläutern Sie, ob der nicht treffende ID-Zweig das Gewicht des treffenden Zweigs erhöht.",
    context: CSS_CONTEXT + " Im Dokument gibt es kein Element mit id=archiv.",
    html: '<section class="karte"><p id="ziel" class="hinweis">Plätze frei</p></section>',
    css: '#archiv .hinweis, .hinweis { color: red; }\n.karte .hinweis { color: blue; }',
    choices: ["Rot: Jede äußere Selektorliste übernimmt das Gewicht ihres stärksten Zweigs.", "Rot: Beide Gewichte werden unabhängig vom Treffen der Zweige addiert.", "Blau: Hier trifft von der ersten Liste nur .hinweis mit (0, 1, 0).", "Blau: Ein nicht treffender Zweig macht alle Zweige der Liste wirkungslos."], correctIndex: 2,
    choiceExplanations: [
      "Die Maximum-Regel für :is() wird nicht pauschal auf eine äußere, durch Kommas getrennte Selektorliste übertragen.",
      "Unabhängige Selektoren einer äußeren Liste werden nicht zu einem Gesamtgewicht addiert.",
      "Für #ziel zählt hier der treffende .hinweis-Zweig. Die zweite Regel hat (0, 2, 0) und gewinnt.",
      "Ein gültiger Zweig ohne Treffer nimmt den anderen Zweigen ihre Wirkung nicht."
    ],
    answer: {heading: "Blau durch den stärkeren treffenden Selektor", lines: ["Treffender roter Zweig .hinweis: (0, 1, 0)", "Blauer Selektor .karte .hinweis: (0, 2, 0)"], explanation: "Bei einer äußeren Selektorliste bleiben die Selektoren eigenständige Alternativen. Das ist ein wesentlicher Unterschied zu :is(), dessen Argumentliste das Gewicht der ganzen Funktion beeinflusst."}
  },
  {
    id: "css-11", level: "Bachelor", topic: "CSS-Kaskade", title: "Zwei Deklarationen mit unterschiedlicher Wichtigkeit",
    question: "Welche Farbe erhält #ziel? Ordnen Sie die Entscheidung dem richtigen Schritt der CSS-Kaskade zu.",
    context: CSS_CONTEXT,
    html: '<p id="ziel" class="hinweis">Plätze frei</p>',
    css: '.hinweis { color: red !important; }\n#ziel { color: blue; }',
    choices: ["Rot: Die wichtige Deklaration hat hier Vorrang vor der normalen Deklaration.", "Blau: Ein ID-Selektor übertrifft jedes !important an einem Klassenselektor.", "Rot: !important erhöht den Zahlenwert der ID-Gruppe um eins.", "Blau: !important wirkt nur, wenn die wichtige Regel zuletzt notiert wurde."], correctIndex: 0,
    choiceExplanations: [
      "Bei gleicher Herkunft gewinnt hier die wichtige Deklaration bereits vor dem Spezifitätsvergleich.",
      "Der ID-Vorsprung einer normalen Deklaration überwindet hier nicht die Wichtigkeit der anderen Deklaration.",
      "!important ist kein zusätzlicher Selektorbestandteil und verändert das Spezifitätstripel nicht.",
      "Die Reihenfolge ist nicht die Voraussetzung für !important. Die Wichtigkeit wird vorher ausgewertet."
    ],
    answer: {heading: "Rot wegen !important", lines: [".hinweis behält die Spezifität (0, 1, 0).", "Die markierte Deklaration gewinnt gegenüber der normalen blauen Deklaration."], explanation: "Die Kaskade entscheidet nicht ausschließlich anhand der Selektorgewichte. !important kennzeichnet die Deklaration als wichtig; es ist kein Trick, um eine weitere ID in den Selektor hineinzurechnen."}
  },
  {
    id: "css-12", level: "Bachelor", topic: "CSS-Kaskade", title: "Eine Deklaration im style-Attribut vergleichen",
    question: "Welche Farbe erhält #ziel? Erklären Sie, wie die normale Deklaration im style-Attribut und die wichtige Stylesheet-Deklaration hier eingeordnet werden.",
    context: CSS_CONTEXT + " Die Deklaration im style-Attribut ist nicht mit !important markiert.",
    html: '<p id="ziel" class="hinweis" style="color: red">Plätze frei</p>',
    css: '.hinweis { color: blue !important; }',
    choices: ["Rot: Ein style-Attribut gewinnt unter allen Umständen gegen Autoren-Stylesheets.", "Rot: !important ist in einem Stylesheet gegenüber style-Attributen unwirksam.", "Blau: Ein Klassenselektor hat grundsätzlich mehr Gewicht als ein style-Attribut.", "Blau: Die wichtige Autoren-Deklaration schlägt die normale Deklaration im style-Attribut."], correctIndex: 3,
    choiceExplanations: [
      "Ein normaler Inline-Stil ist nicht stärker als jede wichtige Autoren-Deklaration.",
      "Auch eine Stylesheet-Deklaration kann mit !important einen normalen Inline-Stil überstimmen.",
      "Ohne !important würde der normale Inline-Stil gewinnen. Die Klasse allein erklärt den Vorrang nicht.",
      "Zuerst wirkt der Wichtigkeitsunterschied. Deshalb gewinnt hier die blaue Deklaration trotz des Inline-Stils."
    ],
    answer: {heading: "Blau durch die wichtige Deklaration", lines: ["Inline: color: red — normal", "Stylesheet: color: blue !important — wichtig"], explanation: "Eine normale Deklaration im style-Attribut hat Vorrang vor normalen Autorenregeln. Diese Aussage gilt nicht unverändert, wenn die konkurrierende Deklaration wichtig ist. Herkunft und Wichtigkeit gehören vor den reinen Selektorvergleich."}
  },
  {
    id: "css-13", level: "Bachelor", topic: "CSS-Kaskade", title: "Geerbte Farbe und direkte Deklaration trennen",
    question: "Welche Farbe erhält der Absatz #ziel? Erläutern Sie, ob das !important des Containers dessen Farbe gegen eine direkte Deklaration am Absatz durchsetzt.",
    context: CSS_CONTEXT,
    html: '<main id="kurse"><p id="ziel">Plätze frei</p></main>',
    css: '#kurse { color: red !important; }\np { color: blue; }',
    choices: ["Rot: Eine wichtige Deklaration am Vorfahren gewinnt gegen jede normale Deklaration am Kind.", "Rot: Die ID des Vorfahren wird bei der Spezifität der geerbten Farbe mitgezählt.", "Blau: Der Absatz hat einen eigenen color-Wert und benötigt die geerbte Farbe nicht.", "Blau: color wird grundsätzlich nie von einem Container an seine Kinder vererbt."], correctIndex: 2,
    choiceExplanations: [
      "Die wichtige Deklaration setzt color am main. Sie ist keine direkt konkurrierende Deklaration am p.",
      "Die Spezifität einer Elternregel wird nicht als Schutzschild mit einem geerbten Wert weitergegeben.",
      "p bekommt color direkt aus seiner eigenen Regel. Der geerbte Wert kommt hier nicht zum Einsatz.",
      "color ist eine vererbte Eigenschaft. Ohne eigene Deklaration würde der Absatz hier Rot erben."
    ],
    answer: {heading: "Der Absatz wird blau", lines: ["main#kurse: color ist Rot.", "p#ziel: color wird direkt auf Blau gesetzt."], explanation: "Die Kaskade wird für das jeweilige Element und die jeweilige Eigenschaft betrachtet. Vererbung füllt hier erst den Wert, wenn am Kind kein eigener Wert festgelegt ist. Die Wichtigkeit der Elternregel wird nicht auf eine fiktive Kindregel übertragen."}
  },
  {
    id: "css-14", level: "Master", topic: "CSS-Kaskade", title: "Normale Regeln in Kaskadenschichten vergleichen",
    question: "Welche Farbe erhält #ziel? Begründen Sie, ob zuerst die Schichtreihenfolge oder die Selektorspezifität entscheidet.",
    context: CSS_CONTEXT + " @layer legt Kaskadenschichten an. Beide gezeigten Deklarationen sind normal, ohne !important.",
    html: '<p id="ziel" class="hinweis">Plätze frei</p>',
    css: '@layer basis, anwendung;\n@layer basis {\n  #ziel { color: red; }\n}\n@layer anwendung {\n  .hinweis { color: blue; }\n}',
    choices: ["Blau: Bei normalen Deklarationen hat die später angelegte Schicht anwendung Vorrang.", "Rot: Die ID gewinnt, bevor die Kaskadenschichten verglichen werden.", "Rot: Die zuerst angelegte Schicht basis hat bei normalen Deklarationen Vorrang.", "Blau: @layer setzt jedes Selektorgewicht automatisch auf (0, 0, 0)."], correctIndex: 0,
    choiceExplanations: [
      "Die Schichtreihenfolge entscheidet vor der Spezifität. anwendung steht nach basis.",
      "Die höhere Spezifität in der unterlegenen Schicht kann den Schichtvorrang hier nicht überwinden.",
      "Für normale Deklarationen ist die spätere Schicht stärker. Die umgekehrte Reihenfolge gilt bei wichtigen Deklarationen.",
      "Die Gewichte werden nicht gelöscht. Innerhalb derselben Schicht können sie weiterhin entscheidend sein."
    ],
    answer: {heading: "Blau durch die Schicht anwendung", lines: ["Schichtreihenfolge: basis, dann anwendung", "Normale Deklaration in anwendung gewinnt vor dem Spezifitätsvergleich."], explanation: "Kaskadenschichten können den Vorrang von Regelgruppen festlegen, ohne immer stärkere Selektoren zu erfinden. Ein ID-Selektor gewinnt daher nicht pauschal gegen jede Klasse in einer anderen Schicht."}
  },
  {
    id: "css-15", level: "Master", topic: "CSS-Kaskade", title: "Wichtige Regeln in Kaskadenschichten vergleichen",
    question: "Welche Farbe erhält #ziel, wenn beide Deklarationen wichtig sind? Begründen Sie den Unterschied zur Reihenfolge normaler Schichtdeklarationen.",
    context: CSS_CONTEXT + " @layer legt Kaskadenschichten an. Beide Deklarationen stammen vom Autor und tragen !important.",
    html: '<p id="ziel" class="hinweis">Plätze frei</p>',
    css: '@layer basis, anwendung;\n@layer basis {\n  .hinweis { color: red !important; }\n}\n@layer anwendung {\n  #ziel { color: blue !important; }\n}',
    choices: ["Blau: Die spätere Schicht anwendung gewinnt bei normalen und wichtigen Regeln gleich.", "Rot: Für wichtige Deklarationen ist die Schichtreihenfolge umgekehrt; basis hat Vorrang.", "Blau: Zwei !important-Markierungen heben sich auf, sodass nur die ID entscheidet.", "Rot: Bei wichtigen Regeln gewinnen Klassen grundsätzlich gegen ID-Selektoren."], correctIndex: 1,
    choiceExplanations: [
      "Die Schichtreihenfolge wird bei wichtigen Deklarationen umgekehrt; die spätere Schicht gewinnt hier nicht.",
      "basis wurde zuerst angelegt und hat bei wichtigen Deklarationen Vorrang vor anwendung.",
      "Die Wichtigkeit verschwindet nicht, wenn beide Deklarationen wichtig sind. Der Schichtvergleich bleibt maßgeblich.",
      "Die Klasse ist nicht stärker als die ID. Der Vorrang ist bereits durch die Schicht entschieden."
    ],
    answer: {heading: "Rot durch den Vorrang der ersten Schicht", lines: ["Wichtige Deklaration in basis gewinnt.", "Der Spezifitätsvorsprung von #ziel in anwendung ändert das Ergebnis nicht."], explanation: "Bei wichtigen Deklarationen wird die Priorität der Kaskadenschichten umgekehrt. Deshalb müssen zuerst Herkunft, Wichtigkeit und Schicht geklärt werden, bevor ein Spezifitätsvergleich eine sinnvolle Aussage erlaubt."}
  },
  {
    id: "mutation-01", level: "Erstie", topic: "DOM-Veränderungen", title: "Zwei Variablen und ein Button",
    question: "Welches Array liefert der letzte Ausdruck? Erklären Sie, ob eine zweite Variable auch einen zweiten Button erzeugt und was const hier verhindert.",
    context: DOM_CONTEXT,
    html: '<button id="start" type="button">Start</button>',
    code: 'const erste = document.querySelector("#start");\nconst zweite = erste;\nzweite.textContent = "Weiter";\n[erste.textContent, erste === zweite, document.querySelectorAll("button").length]',
    choices: ['["Start", false, 2]', '["Weiter", false, 1]', 'Der Code wirft beim Setzen von textContent einen TypeError wegen const.', '["Weiter", true, 1]'], correctIndex: 3,
    choiceExplanations: [
      "Die Zuweisung kopiert keine DOM-Elemente. Beide Variablen verweisen weiterhin auf denselben Button.",
      "Der Text ändert sich am gemeinsamen Objekt. Gerade deshalb ist der Identitätsvergleich hier true.",
      "const verhindert eine neue Zuweisung an die Variable, nicht die Änderung einer Eigenschaft des referenzierten Objekts.",
      "Beide Variablen verweisen auf dasselbe Element. Seine Textänderung ist über beide Zugriffe sichtbar; es bleibt ein Button."
    ],
    answer: {heading: 'Ergebnis: ["Weiter", true, 1]', lines: ["erste und zweite verweisen auf dasselbe HTMLButtonElement.", "Es wurde kein neues Element angelegt."], explanation: "Eine DOM-Referenz ist ein Verweis auf ein vorhandenes Objekt, keine Kopie seines HTML-Texts. const schützt die Variablenbindung vor Neuzuweisung, friert das referenzierte Objekt jedoch nicht ein."}
  },
  {
    id: "mutation-02", level: "Bachelor", topic: "DOM-Veränderungen", title: "Einen vorhandenen Absatz anhängen",
    question: "Welches Array liefert der letzte Ausdruck? Beschreiben Sie, wo der Absatz danach liegt und ob er kopiert wurde.",
    context: DOM_CONTEXT,
    html: '<section id="links"><p id="kurs">HTML</p></section><section id="rechts"></section>',
    code: 'const links = document.querySelector("#links");\nconst rechts = document.querySelector("#rechts");\nconst absatz = document.querySelector("#kurs");\nconst rueckgabe = rechts.appendChild(absatz);\n[links.children.length, rechts.children.length, rueckgabe === absatz]',
    choices: ["[1, 1, false]", "[0, 1, true]", "[1, 1, true]", "[0, 1, false]"], correctIndex: 1,
    choiceExplanations: [
      "appendChild erzeugt keine Kopie eines vorhandenen Knotens. Der Absatz verschwindet aus seinem bisherigen Elternteil.",
      "Der vorhandene Absatz wird von links nach rechts verschoben. appendChild gibt genau dieses Knotenobjekt zurück.",
      "Ein Knoten kann hier nicht zugleich direktes Kind beider sections bleiben. links verliert den Absatz.",
      "Die Position ändert sich, die Identität des Absatzes nicht. Die Rückgabe ist derselbe Knoten."
    ],
    answer: {heading: "Ergebnis: [0, 1, true]", lines: ["Der Absatz ist jetzt direktes Kind von #rechts.", "#links enthält danach kein Kindelement."], explanation: "appendChild verschiebt einen bereits existierenden Knoten. Für eine unabhängige Kopie wäre ein eigener Klonschritt erforderlich. Der Rückgabewert bezeichnet den angehängten Knoten."}
  },
  {
    id: "mutation-03", level: "Master", topic: "DOM-Veränderungen", title: "Einen Button mit Inhalt klonen",
    question: "Welches Array liefert der letzte Ausdruck nach beiden click()-Aufrufen? Begründen Sie, welche Teile des Buttons beim Klonen übernommen werden.",
    context: DOM_CONTEXT + " Es gibt keine weiteren Ereignisbehandler. Der neue Button erhält vor dem Einfügen eine andere ID.",
    html: '<div id="bereich"><button id="start" type="button">Start</button></div>',
    code: 'const original = document.querySelector("#start");\nlet aufrufe = 0;\noriginal.addEventListener("click", () => aufrufe++);\nconst kopie = original.cloneNode(true);\nkopie.id = "kopie";\noriginal.parentElement.append(kopie);\noriginal.click();\nkopie.click();\n[aufrufe, kopie.textContent, original === kopie]',
    choices: ['[2, "Start", false]', '[1, "", false]', '[1, "Start", false]', '[2, "Start", true]'], correctIndex: 2,
    choiceExplanations: [
      "Der mit addEventListener registrierte Behandler wird von cloneNode nicht übernommen. Nur der Klick auf das Original erhöht den Zähler.",
      "true verlangt einen tiefen Klon: Der untergeordnete Textknoten wird mitkopiert.",
      "Der Text wird kopiert, der mit addEventListener registrierte Behandler nicht. Die Kopie ist ein anderes Objekt.",
      "Ein Klon ist nicht identisch mit dem Original. Außerdem wird der registrierte Behandler nicht geklont."
    ],
    answer: {heading: 'Ergebnis: [1, "Start", false]', lines: ["cloneNode(true) kopiert Attribute und untergeordnete Knoten.", "addEventListener-Behandler werden nicht mitkopiert."], explanation: "Eine visuell gleich aussehende Kopie besitzt nicht automatisch dasselbe Ereignisverhalten. Der Parameter true betrifft den Teilbaum, nicht sämtliche intern gespeicherten Eigenschaften des Originals."}
  },
  {
    id: "mutation-04", level: "Master", topic: "DOM-Veränderungen", title: "Den Text eines Containers ersetzen",
    question: "Welches Array liefert der letzte Ausdruck? Unterscheiden Sie den neuen Inhalt des Containers und das zuvor gespeicherte span-Objekt.",
    context: DOM_CONTEXT + " Das div steht im Dokument; innerhalb seiner Tags gibt es nur die exakt gezeigten Inhalte.",
    html: '<div id="box"><span>Alt</span><em>Hinweis</em></div>',
    code: 'const box = document.querySelector("#box");\nconst gespeichert = box.firstElementChild;\nbox.textContent = "Neu";\n[box.children.length, box.childNodes.length, gespeichert.isConnected, gespeichert.textContent]',
    choices: ['[0, 1, false, "Alt"]', '[2, 2, true, "Neu"]', '[0, 1, false, "Neu"]', '[1, 1, true, "Alt"]'], correctIndex: 0,
    choiceExplanations: [
      "Der Container bekommt einen Textknoten und verliert seine bisherigen Kinder. Das gespeicherte span bleibt als abgetrenntes Objekt mit seinem alten Text erhalten.",
      "textContent verändert nicht nur den sichtbaren Text der bisherigen Kinder, sondern ersetzt die Kinder des Containers.",
      "Die Zuweisung schreibt keinen neuen Text in das abgetrennte span. Gesetzt wurde textContent am div.",
      "Der neue Inhalt Neu ist ein Textknoten, kein Kindelement. Das alte span ist nicht mehr mit dem Dokument verbunden."
    ],
    answer: {heading: 'Ergebnis: [0, 1, false, "Alt"]', lines: ["#box enthält danach genau einen Textknoten mit Neu.", "Das gespeicherte span ist abgetrennt, aber über die Variable weiter erreichbar."], explanation: "Ein Objekt aus dem DOM zu entfernen löscht nicht automatisch jede Referenz auf dieses Objekt. Gleichzeitig ist das Setzen von textContent am Container ein struktureller Eingriff: Untergeordnete Elemente werden ersetzt."}
  },
  {
    id: "mutation-05", level: "Erstie", topic: "DOM-Veränderungen", title: "Eine Zeichenkette als Text ausgeben",
    question: "Welches Array liefert der letzte Ausdruck? Beschreiben Sie, ob im Ziel ein strong-Element oder ein Textknoten entsteht.",
    context: DOM_CONTEXT + " Die Zeichenkette eingabe soll unverändert als Text angezeigt werden; sie soll kein HTML erzeugen.",
    html: '<p id="ausgabe"></p>',
    code: 'const eingabe = "<strong>Neu</strong>";\nconst ausgabe = document.querySelector("#ausgabe");\nausgabe.textContent = eingabe;\n[ausgabe.children.length, ausgabe.textContent]',
    choices: ['[1, "Neu"]', '[0, "<strong>Neu</strong>"]', '[0, "Neu"]', '[1, "<strong>Neu</strong>"]'], correctIndex: 1,
    choiceExplanations: [
      "textContent interpretiert die spitzen Klammern nicht als HTML-Tags. Es entsteht kein strong-Element.",
      "Die vollständige Zeichenkette wird Inhalt eines Textknotens. Deshalb gibt es kein Kindelement, und textContent enthält auch die Tagzeichen.",
      "Die Zeichenfolge <strong> wird nicht automatisch entfernt. Bei textContent gehört sie zum Text.",
      "Der Text wird zwar vollständig erhalten, aber es wird kein Element daraus erzeugt. children.length ist deshalb 0."
    ],
    answer: {heading: 'Ergebnis: [0, "<strong>Neu</strong>"]', lines: ["Es entsteht ein Textknoten, kein strong-Element.", "Die Tagzeichen werden als Text ausgegeben."], explanation: "Wenn Eingaben als reiner Text erscheinen sollen, trennt textContent Daten von HTML-Struktur. Das ist auch sicherer als ungeprüfte Eingaben als HTML interpretieren zu lassen. Der dargestellte Inhalt wird hier nicht ausgeführt."}
  },
  {
    id: "mutation-06", level: "Bachelor", topic: "DOM-Veränderungen", title: "Eine Klasse mit und ohne Zielzustand umschalten",
    question: "Welches Array liefert der letzte Ausdruck? Erläutern Sie, was der zweite Parameter false von toggle() bewirkt.",
    context: DOM_CONTEXT,
    html: '<section id="kurs" class="karte aktiv">HTML</section>',
    code: 'const karte = document.querySelector("#kurs");\nconst a = karte.classList.toggle("aktiv", false);\nconst b = karte.classList.toggle("aktiv", false);\nconst c = karte.classList.toggle("aktiv");\n[a, b, c, karte.classList.contains("aktiv")]',
    choices: ["[false, true, false, false]", "[true, false, true, true]", "[false, false, false, false]", "[false, false, true, true]"], correctIndex: 3,
    choiceExplanations: [
      "Mit dem zweiten Parameter false wird der Zustand nicht abwechselnd gewechselt, sondern die Abwesenheit der Klasse festgelegt.",
      "Der Rückgabewert ist der Zustand nach dem Aufruf, nicht die Information, ob eine Änderung stattgefunden hat.",
      "Der dritte Aufruf enthält keinen Zielzustand. Er fügt die inzwischen fehlende Klasse wieder hinzu.",
      "Die ersten beiden Aufrufe sorgen für keine Klasse aktiv und liefern false. Der dritte schaltet auf vorhanden um und liefert true."
    ],
    answer: {heading: "Ergebnis: [false, false, true, true]", lines: ["toggle(\"aktiv\", false) erzwingt das Entfernen.", "toggle(\"aktiv\") wechselt den aktuellen Zustand."], explanation: "Der optionale zweite Parameter von toggle ist ein gewünschter Zustand. Der Rückgabewert beschreibt, ob die Klasse nach dem Aufruf vorhanden ist. Das unterscheidet sich von einer Rückmeldung darüber, ob überhaupt etwas geändert wurde."}
  },
  {
    id: "mutation-07", level: "Bachelor", topic: "DOM-Veränderungen", title: "Eine Zahl in einem data-Attribut bearbeiten",
    question: "Welches Array liefert der letzte Ausdruck? Verfolgen Sie die Umwandlung vom Attributwert zur Rechnung und zurück.",
    context: DOM_CONTEXT,
    html: '<article id="kurs" data-freie-plaetze="2">HTML</article>',
    code: 'const kurs = document.querySelector("#kurs");\nconst neu = Number(kurs.dataset.freiePlaetze) + 1;\nkurs.dataset.freiePlaetze = neu;\n[kurs.dataset.freiePlaetze, typeof kurs.dataset.freiePlaetze, kurs.getAttribute("data-freie-plaetze")]',
    choices: ['["3", "string", "3"]', '[3, "number", "3"]', '["21", "string", "21"]', '["3", "string", "2"]'], correctIndex: 0,
    choiceExplanations: [
      "Number macht aus dem Ausgangswert eine Zahl. Beim Schreiben über dataset wird das Ergebnis wieder als Attribut-Zeichenkette gespeichert.",
      "dataset liefert Attributwerte als Strings, auch wenn zuvor eine Zahl zugewiesen wurde.",
      "Die explizite Number-Umwandlung verhindert hier die Zeichenkettenverkettung 2 plus 1 zu 21.",
      "dataset und getAttribute greifen hier auf dasselbe data-freie-plaetze-Attribut zu. Die Zuweisung aktualisiert dessen Wert."
    ],
    answer: {heading: 'Ergebnis: ["3", "string", "3"]', lines: ["data-freie-plaetze wird in dataset als freiePlaetze angesprochen.", "Die Rechnung ergibt die Zahl 3; das Attribut speichert den String \"3\"."], explanation: "HTML-Attributwerte sind Zeichenketten. Eine richtige Rechnung benötigt gegebenenfalls eine bewusste Zahlenumwandlung. Das anschließende Speichern im DOM macht daraus keine dauerhaft numerische dataset-Eigenschaft."}
  },
  {
    id: "mutation-08", level: "Bachelor", topic: "DOM-Veränderungen", title: "Aktuellen Eingabewert und HTML-Vorgabe trennen",
    question: "Welches Array liefert der letzte Ausdruck? Unterscheiden Sie den aktuellen Eingabewert von der im Attribut gespeicherten Vorgabe.",
    context: DOM_CONTEXT + " Das Eingabefeld ist ein gewöhnliches input vom Typ text; es wird nicht zurückgesetzt.",
    html: '<input id="titel" type="text" value="Start">',
    code: 'const feld = document.querySelector("#titel");\nfeld.value = "Neu";\n[feld.value, feld.getAttribute("value"), feld.defaultValue]',
    choices: ['["Neu", "Neu", "Neu"]', '["Start", "Neu", "Start"]', '["Neu", "Start", "Start"]', '["Neu", "Start", "Neu"]'], correctIndex: 2,
    choiceExplanations: [
      "Das Setzen von value ändert den aktuellen Eingabewert, aber hier nicht das value-Attribut oder defaultValue.",
      "Die Zuweisung erfolgt an die value-Eigenschaft. Ihr neuer Wert ist Neu; das Attribut bleibt Start.",
      "value enthält Neu. getAttribute und defaultValue beziehen sich weiterhin auf die HTML-Vorgabe Start.",
      "defaultValue spiegelt hier die Attributvorgabe, nicht den inzwischen geänderten aktuellen Eingabewert."
    ],
    answer: {heading: 'Ergebnis: ["Neu", "Start", "Start"]', lines: ["Aktueller Wert: Neu", "value-Attribut und defaultValue: Start"], explanation: "DOM-Eigenschaft und HTML-Attribut sind nicht immer derselbe veränderliche Wert. Bei einem Texteingabefeld trennt der Browser den aktuellen Wert von der Vorgabe, auf die etwa ein Formular-Reset zurückgreifen kann."}
  },
  {
    id: "mutation-09", level: "Bachelor", topic: "Ereignisse", title: "Ursprung und Empfänger eines Ereignisses erkennen",
    question: "Welches Array enthält protokoll nach dem ausgelösten Ereignis? Ordnen Sie target und currentTarget den Elementen zu.",
    context: DOM_CONTEXT + " Das Ereignis darf zu Vorfahren aufsteigen (bubbles: true). Es gibt keinen Shadow DOM und keine weiteren Ereignisbehandler.",
    html: '<div id="bereich"><button id="taste" type="button"><span id="symbol">+</span></button></div>',
    code: 'const bereich = document.querySelector("#bereich");\nlet protokoll;\nbereich.addEventListener("click", event => {\n  protokoll = [event.target.id, event.currentTarget.id];\n});\ndocument.querySelector("#symbol").dispatchEvent(new MouseEvent("click", {bubbles: true}));\nprotokoll',
    choices: ['["bereich", "bereich"]', '["taste", "bereich"]', '["symbol", "taste"]', '["symbol", "bereich"]'], correctIndex: 3,
    choiceExplanations: [
      "target bezeichnet hier das Element, an dem dispatchEvent aufgerufen wurde; es wird durch das Aufsteigen nicht zum Vorfahren geändert.",
      "Ausgelöst wurde das Ereignis am span#symbol, nicht am umgebenden Button.",
      "Der ausgeführte Listener ist an #bereich registriert. Deshalb ist currentTarget während dieses Aufrufs #bereich.",
      "target ist span#symbol, currentTarget ist im Listener der registrierte Empfänger div#bereich."
    ],
    answer: {heading: 'Ergebnis: ["symbol", "bereich"]', lines: ["target: Ursprung des hier ausgelösten Ereignisses", "currentTarget: Element des gerade ausgeführten Listeners"], explanation: "Ein Listener an einem Container kann Ereignisse seiner Nachfahren verarbeiten. Für diese Ereignisdelegation muss man unterscheiden, wo das Ereignis entstanden ist und an welchem Element der eigene Listener registriert wurde."}
  },
  {
    id: "mutation-10", level: "Master", topic: "Ereignisse", title: "Weitergabe stoppen und weitere Listener unterscheiden",
    question: "Welche Einträge enthält protokoll am Ende und in welcher Reihenfolge? Beachten Sie, welche Listener am selben Element liegen.",
    context: DOM_CONTEXT + " Alle Listener sind ohne capture: true registriert; es gibt keine anderen Listener. Der Button ist nicht deaktiviert.",
    html: '<div id="bereich"><button id="taste" type="button">Start</button></div>',
    code: 'const taste = document.querySelector("#taste");\nconst protokoll = [];\ntaste.addEventListener("click", event => {\n  protokoll.push("eins");\n  event.stopPropagation();\n});\ntaste.addEventListener("click", () => protokoll.push("zwei"));\ndocument.querySelector("#bereich").addEventListener("click", () => protokoll.push("eltern"));\ntaste.click();\nprotokoll',
    choices: ['["eins"]', '["eins", "zwei"]', '["eins", "zwei", "eltern"]', '["eltern", "eins", "zwei"]'], correctIndex: 1,
    choiceExplanations: [
      "stopPropagation unterbindet nicht die weiteren Listener am selben Element. Dafür gäbe es stopImmediatePropagation.",
      "Beide Listener am Button laufen in Registrierungsreihenfolge. Die Weitergabe zum Container wird gestoppt.",
      "Der Container-Listener in der Blasenphase wird wegen stopPropagation nicht erreicht.",
      "Es wurde kein Listener für die Erfassungsphase registriert. Der Eltern-Listener läuft hier weder zuerst noch später."
    ],
    answer: {heading: 'Ergebnis: ["eins", "zwei"]', lines: ["Beide Listener an #taste werden aufgerufen.", "Der Blasenphasen-Listener an #bereich wird nicht aufgerufen."], explanation: "Die Weitergabe eines Ereignisses an weitere Elemente und die Bearbeitung durch weitere Listener am selben Element sind unterschiedliche Dinge. stopPropagation beendet nicht automatisch jeden noch ausstehenden Listener."}
  },
  {
    id: "mutation-11", level: "Master", topic: "Ereignisse", title: "Status und Rückgabe eines eigenen Ereignisses",
    question: "Welches Array liefert der letzte Ausdruck? Unterscheiden Sie Abbruchstatus, Weitergabe zum Container und den Rückgabewert von dispatchEvent().",
    context: DOM_CONTEXT + " kurswahl ist ein selbst erzeugtes Ereignis. Es ist abbrechbar (cancelable: true) und darf aufsteigen (bubbles: true). Die Listener sind nicht passiv; weitere Listener existieren nicht.",
    html: '<div id="bereich"><button id="taste" type="button">Wählen</button></div>',
    code: 'const taste = document.querySelector("#taste");\nlet elternAufgerufen = false;\ntaste.addEventListener("kurswahl", event => event.preventDefault());\ndocument.querySelector("#bereich").addEventListener("kurswahl", () => { elternAufgerufen = true; });\nconst ereignis = new Event("kurswahl", {bubbles: true, cancelable: true});\nconst zugelassen = taste.dispatchEvent(ereignis);\n[ereignis.defaultPrevented, elternAufgerufen, zugelassen]',
    choices: ["[true, false, false]", "[false, true, true]", "[true, true, false]", "[true, true, true]"], correctIndex: 2,
    choiceExplanations: [
      "preventDefault beendet nicht das Aufsteigen des Ereignisses. Der Container-Listener läuft weiterhin.",
      "Das Ereignis ist ausdrücklich abbrechbar und der Listener nicht passiv. preventDefault setzt deshalb den Abbruchstatus.",
      "Der Abbruchstatus wird true, das Ereignis steigt weiter auf, und dispatchEvent meldet den Abbruch mit false.",
      "dispatchEvent liefert bei einem durch preventDefault abgebrochenen, abbrechbaren Ereignis false."
    ],
    answer: {heading: "Ergebnis: [true, true, false]", lines: ["defaultPrevented ist true.", "Der Container-Listener wird ausgeführt.", "dispatchEvent gibt false zurück."], explanation: "preventDefault markiert ein abbrechbares Ereignis als abgebrochen. Es stoppt nicht dessen Weg durch den DOM-Baum. Bei einem eigenen Ereignis wie kurswahl kann die aufrufende Anwendung den Rückgabewert auswerten; damit wird nicht automatisch eine eigene Anwendungsaktion ausgeführt oder verhindert."}
  },
  {
    id: "mutation-12", level: "Master", topic: "DOM-Veränderungen", title: "Mehrere Knoten mit einem Fragment einfügen",
    question: "Welches Array liefert der letzte Ausdruck? Erklären Sie, ob das DocumentFragment selbst als zusätzlicher Knoten im Ziel bleibt.",
    context: DOM_CONTEXT + " Das Ziel-div ist anfangs wirklich leer; zwischen seinen Tags steht auch kein Leerraum. nodeType 1 bezeichnet ein Element, nodeType 11 ein DocumentFragment.",
    html: '<div id="kurse"></div>',
    code: 'const ziel = document.querySelector("#kurse");\nconst fragment = document.createDocumentFragment();\nfragment.append(document.createElement("p"), document.createElement("p"));\nziel.appendChild(fragment);\n[ziel.children.length, fragment.childNodes.length, ziel.firstChild.nodeType]',
    choices: ["[2, 0, 1]", "[1, 2, 11]", "[2, 2, 1]", "[0, 2, 11]"], correctIndex: 0,
    choiceExplanations: [
      "Die beiden p-Knoten werden aus dem Fragment ins Ziel verschoben. Das Fragment ist danach leer; erstes Zielkind ist ein p-Element.",
      "Das Fragment wird nicht als zusätzlicher Container eingefügt. Seine Kinder werden direkt zu Kindern des Ziels.",
      "Die Kinder werden verschoben, nicht kopiert. Deshalb bleiben sie nicht zusätzlich im Fragment.",
      "Die p-Elemente werden direkte Kinder des Ziels und zählen in children mit. Ein Fragmentknoten bleibt dort nicht stehen."
    ],
    answer: {heading: "Ergebnis: [2, 0, 1]", lines: ["#kurse bekommt zwei direkte p-Kinder.", "Das DocumentFragment enthält danach keine Kindknoten mehr."], explanation: "Ein DocumentFragment kann mehrere Knoten vorübergehend aufnehmen. Beim Einfügen werden seine Kinder übernommen; es erzeugt dabei keine zusätzliche sichtbare oder unsichtbare Elternebene im Zielbaum."}
  }
];
