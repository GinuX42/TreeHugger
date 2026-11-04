const SPECIFICITY_CONTEXT = "Spezifität wird als (A, B, C) notiert: A zählt ID-Selektoren; B zählt Klassen, Attributselektoren und Pseudoklassen; C zählt Elementnamen und Pseudoelemente. Funktionen wie :not() und :where() haben Sonderregeln für ihre Beiträge.";
const CSS_CONTEXT = "Es gelten nur die gezeigten CSS-Regeln der Webseite, ohne zusätzliche Animationen oder Übergänge. " + SPECIFICITY_CONTEXT;
const DOM_CONTEXT = "Das gezeigte HTML steht vollständig im body. Der Code läuft danach genau einmal; weitere Skripte oder Benutzereingaben gibt es nicht. Gefragt ist der Wert des letzten Ausdrucks.";

export const CSS_MUTATION_QUESTIONS = [
  {
    id: "css-01", level: "Erstie", topic: "CSS-Spezifität", title: "Einen zusammengesetzten Selektor zerlegen",
    question: "Welche Spezifität hat dieser Selektor? Geben Sie die drei Zahlen (A, B, C) an und nennen Sie die Bestandteile, die in jeder Gruppe mitgezählt werden.",
    context: SPECIFICITY_CONTEXT + " Berechnen Sie nur die Spezifität; eine bestimmte Webseite oder konkurrierende Regel ist hierfür nicht erforderlich.",
    css: '#portal .karte[data-status="frei"] > p.hinweis::first-line',
    choices: ["(1, 2, 3)", "(0, 4, 2)", "(1, 3, 2)", "(1, 4, 1)"], correctIndex: 2,
    choiceExplanations: [
      "Der Attributselektor zählt wie die beiden Klassen in B. Er ist kein zusätzlicher Elementname in C.",
      "#portal ist ein ID-Selektor und zählt in A; ein Attribut mit dem Namen id wäre dagegen ein Attributselektor.",
      "#portal zählt in A; .karte, [data-status] und .hinweis in B; p und ::first-line in C.",
      "::first-line ist ein Pseudoelement in C. Der Kombinator > trägt kein Gewicht bei."
    ],
    answer: {
      heading: "Die Spezifität beträgt (1, 3, 2)",
      lines: [
        "A = 1: #portal ist der einzige ID-Selektor.",
        'B = 3: Die Klassen .karte und .hinweis sowie der Attributselektor [data-status="frei"] zählen jeweils einmal.',
        "C = 2: p ist ein Elementname; ::first-line ist ein Pseudoelement. Beide zählen hier jeweils einmal.",
        "Das Leerzeichen und > beschreiben Beziehungen zwischen Elementen und zählen in keiner Gruppe. Zusammengesetzt ergibt das (1, 3, 2)."
      ],
      explanation: "Zählen Sie die geschriebenen Selektorbestandteile. Der Attributwert frei und die Länge eines Namens liefern keine zusätzlichen Punkte."
    }
  },
  {
    id: "css-02", level: "Erstie", topic: "CSS-Spezifität", title: "Spezifität von links nach rechts vergleichen",
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        "Beide Selektoren wählen den Absatz: Er liegt innerhalb von #kurse beziehungsweise .portal und .karte und trägt beide Klassen hinweis und aktiv.",
        "#kurse p enthält einen ID-Selektor und einen Elementnamen: (1, 0, 1).",
        ".portal .karte p.hinweis.aktiv enthält vier Klassen und einen Elementnamen, aber keine ID: (0, 4, 1).",
        "Verglichen wird zuerst A: 1 ist größer als 0. Damit gewinnt color: blue; B und C müssen nicht mehr verglichen werden."
      ],
      explanation: "Bei gleicher Wichtigkeit und Schicht entscheidet die erste unterschiedliche Zahl von links. Vier Klassen werden nicht zu einer ID zusammengerechnet."
    }
  },
  {
    id: "css-03", level: "Erstie", topic: "CSS-Spezifität", title: "Direkte Kinder und Spezifität unterscheiden",
    question: "Welche Textfarbe erhält der Absatz #ziel? Prüfen Sie zuerst, welche Selektoren ihn auswählen, und vergleichen Sie danach deren Spezifität.",
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        ".karte .hinweis wählt das p aus: Es trägt die Klasse hinweis und liegt innerhalb des section-Elements mit der Klasse karte.",
        ".karte > .hinweis wählt dasselbe p aus: Es ist sogar ein direktes Kind dieser section.",
        "Beide Selektoren enthalten nur die zwei Klassen .karte und .hinweis: jeweils (0, 2, 0). Weder das Leerzeichen noch > erhöht eine der Zahlen.",
        "Wichtigkeit, Schicht und Spezifität sind gleich. Deshalb gewinnt die später geschriebene Deklaration color: blue."
      ],
      explanation: "Ein Selektor kann die Auswahl stärker einschränken, ohne eine höhere Spezifität zu besitzen. Die Bedingung „direktes Kind“ liefert keinen zusätzlichen Punkt."
    }
  },
  {
    id: "css-04", level: "Erstie", topic: "CSS-Spezifität", title: "Eine ID auf zwei Arten ansprechen",
    question: "Welche Textfarbe erhält der Absatz #ziel? Erklären Sie, ob beide Selektoren dieselbe Spezifität besitzen.",
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        'Beide Selektoren passen zu <p id="ziel" class="hinweis">. Sie setzen unterschiedliche Farben am selben Element.',
        "#ziel ist ein ID-Selektor. Er zählt einmal in A: (1, 0, 0).",
        'In p[id="ziel"].hinweis zählen [id="ziel"] und .hinweis in B; p zählt in C. Das ergibt (0, 2, 1).',
        "Beim Vergleich entscheidet bereits A: 1 ist größer als 0. Die blaue Regel gewinnt trotz der späteren roten Regel."
      ],
      explanation: "Für die Spezifität zählt die Schreibweise: #ziel ist ein ID-Selektor, [id=\"ziel\"] ein Attributselektor. Dass beide dasselbe Element finden, macht ihre Beiträge nicht gleich."
    }
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
    answer: {
      heading: "Der Absatz #ziel wird rot",
      lines: [
        ":is(#archiv, .karte) bedeutet hier: Ein Vorfahr muss #archiv oder .karte sein. Die section erfüllt .karte; ihr Absatz erfüllt .hinweis. Die rote Regel wählt den Absatz also aus, obwohl #archiv fehlt.",
        "Auch .karte .hinweis wählt den Absatz aus, weil er die Klasse hinweis trägt und innerhalb der Karte liegt.",
        ":is() übernimmt die höchste Spezifität eines Selektors in seiner Klammer: #archiv hat (1, 0, 0), .karte hat (0, 1, 0). Übernommen wird (1, 0, 0); .hinweis außerhalb der Klammer ergänzt (0, 1, 0). Rot hat damit (1, 1, 0).",
        "Blau hat durch .karte und .hinweis die Spezifität (0, 2, 0). In A gewinnt Rot mit 1 gegenüber 0."
      ],
      explanation: "Bei :is() muss mindestens eine Alternative passen. Für seine Spezifität zählt dagegen die stärkste geschriebene Alternative, auch wenn gerade diese kein Element findet. Die Alternativen werden nicht addiert."
    }
  },
  {
    id: "css-06", level: "Bachelor", topic: "CSS-Spezifität", title: "Den Kontext mit :where() eingrenzen",
    question: "Welche Textfarbe erhält der Absatz #ziel? Berechnen Sie die Spezifität beider Selektoren und nennen Sie die Zahl, die den Vergleich entscheidet.",
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        ":where(#portal, .karte) passt zum main mit der ID portal. Das p mit der Klasse hinweis liegt darin. Damit wählt die rote Regel den Absatz aus.",
        "Die blaue Regel wählt denselben Absatz aus, weil er sowohl hinweis als auch aktiv als Klasse trägt.",
        ":where() und alles innerhalb seiner Klammer tragen zusammen (0, 0, 0) bei. Für Rot bleiben nur .hinweis in B und p in C: (0, 1, 1).",
        "Blau enthält zwei Klassen und hat (0, 2, 0). A ist gleich; in B gewinnt Blau mit 2 gegenüber 1. Das p in Gruppe C kann diesen Unterschied nicht ausgleichen."
      ],
      explanation: ":where() schränkt ein, welche Elemente ausgewählt werden, ohne die Spezifität zu erhöhen. „Beitrag null“ bedeutet also nicht „kein Treffer“."
    }
  },
  {
    id: "css-07", level: "Master", topic: "CSS-Spezifität", title: ":not(): Auswahl und Spezifität getrennt prüfen",
    question: "Welche Textfarbe erhält der Absatz #ziel? Begründen Sie, welche Regeln ihn auswählen und warum #sperre bei der Spezifität eine Rolle spielt, obwohl der Absatz nicht diese ID hat.",
    context: CSS_CONTEXT + " Der Absatz hat weder die Klasse ausgebucht noch die ID sperre.",
    html: '<section class="karte"><p id="ziel" class="hinweis">Plätze frei</p></section>',
    css: 'p:not(.ausgebucht, #sperre) { color: red; }\n.karte p.hinweis { color: blue; }',
    choices: ["Rot: :not() übernimmt das höchste Argumentgewicht; p ergänzt die Elementgruppe.", "Blau: Negierte Selektoren werden bei der Spezifität grundsätzlich nicht gezählt.", "Blau: :not() zählt nur eine gewöhnliche Pseudoklasse, unabhängig vom Inhalt.", "Rot: Weil das p passt, addiert :not() beide Argumentgewichte."], correctIndex: 0,
    choiceExplanations: [
      "Das stärkste Argument ist #sperre mit (1, 0, 0). Zusammen mit p ergibt das (1, 0, 1).",
      "Auch bei :not() werden die geschriebenen Selektoren in der Klammer für die Spezifität berücksichtigt. #sperre liefert hier den höheren Beitrag (1, 0, 0).",
      ":not() gehört zu den Ausnahmen: Es hat keinen eigenen B-Punkt, sondern übernimmt ein Argumentgewicht.",
      ":not() summiert seine Alternativen nicht. Für das Gewicht zählt nur die stärkste Alternative."
    ],
    answer: {
      heading: "Der Absatz #ziel wird rot",
      lines: [
        "p:not(.ausgebucht, #sperre) wählt p-Elemente aus, die weder die Klasse ausgebucht noch die ID sperre haben. Unser Absatz hat class=\"hinweis\" und id=\"ziel\", also keines der beiden ausgeschlossenen Merkmale. Die rote Regel wählt ihn deshalb aus.",
        "Auch .karte p.hinweis wählt diesen Absatz aus: Er ist ein p mit der Klasse hinweis innerhalb eines Elements mit der Klasse karte. Der blaue Selektor passt also ebenfalls zum Absatz.",
        "Für :not() zählt der stärkste Selektor in seiner Klammer: .ausgebucht hat (0, 1, 0), #sperre hat (1, 0, 0). Übernommen wird nur (1, 0, 0), ohne zusätzlichen Punkt für :not() und ohne Addition beider Alternativen.",
        "Bei der roten Regel kommt p mit (0, 0, 1) hinzu: insgesamt (1, 0, 1). Bei Blau zählen .karte und .hinweis in B sowie p in C: (0, 2, 1).",
        "Verglichen wird von links nach rechts: In A steht für Rot 1 und für Blau 0. Rot gewinnt bereits hier. Dass die blaue Regel später steht, ändert das bei unterschiedlicher Spezifität nicht."
      ],
      explanation: "Bei :not(...) werden Elemente ausgewählt, die keine der Bedingungen in der Klammer erfüllen. Für die Spezifität zählt trotzdem die stärkste geschriebene Alternative, auch eine ID, die das Element gerade nicht haben darf."
    }
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
    answer: {
      heading: "border-color der section erhält den Wert blue",
      lines: [
        ".karte:has(> p.hinweis, #extra) wählt die section aus: Sie hat die Klasse karte und besitzt ein direktes p-Kind mit der Klasse hinweis. Damit ist bereits eine der beiden :has()-Alternativen erfüllt; #extra muss nicht zusätzlich existieren.",
        "#kurse .karte wählt dieselbe section aus, weil sie innerhalb von main#kurse liegt. Beide Regeln setzen also die Rahmenfarbe der Karte, nicht die des Absatzes.",
        "In :has() stehen > p.hinweis mit (0, 1, 1) und #extra mit (1, 0, 0). Übernommen wird das höhere (1, 0, 0); .karte außerhalb der Klammer ergänzt (0, 1, 0). Rot hat (1, 1, 0).",
        "#kurse .karte enthält eine ID und eine Klasse: ebenfalls (1, 1, 0). Bei gleicher Wichtigkeit, Schicht und Spezifität gewinnt die spätere blaue Regel."
      ],
      explanation: ":has() kann den Container anhand seiner Kinder auswählen. Für seine Spezifität zählt der stärkste Selektor in der Klammer. Ein sichtbarer Rahmen entsteht durch border-color allein noch nicht; hier ist nur der Farbwert gefragt."
    }
  },
  {
    id: "css-09", level: "Master", topic: "CSS-Spezifität", title: "Die of-Liste einer Positionsregel gewichten",
    question: "Welche Spezifität hat dieser Selektor als (A, B, C)? Begründen Sie die Beiträge von li, :nth-child() und der Liste nach of. Zählt die Positionszahl 2 zusätzlich mit?",
    context: SPECIFICITY_CONTEXT + " Berechnen Sie nur die Spezifität; konkrete Treffer auf einer Webseite sind nicht gefragt.",
    css: 'li:nth-child(2 of .hinweis, #ziel)',
    choices: ["(1, 0, 1)", "(1, 1, 1)", "(1, 2, 1)", "(0, 2, 1)"], correctIndex: 1,
    choiceExplanations: [
      "Zusätzlich zum stärksten of-Argument zählt :nth-child() selbst einmal in B.",
      "#ziel liefert A=1, :nth-child() liefert B=1 und li liefert C=1. Die Positionszahl erhöht nichts.",
      "Die 2 ist eine Position, kein zusätzlicher B-Punkt. Außerdem werden die of-Alternativen nicht summiert.",
      "Die stärkste of-Alternative ist #ziel. Ihr Gewicht gehört in A, nicht in B."
    ],
    answer: {
      heading: "Die Spezifität beträgt (1, 1, 1)",
      lines: [
        "li ist ein Elementname und liefert (0, 0, 1).",
        ":nth-child() ist hier eine Pseudoklasse mit einem eigenen Beitrag von (0, 1, 0). Die Zahl 2 benennt eine Position und zählt nicht zusätzlich.",
        "Von der Liste nach of wird die höchste Spezifität übernommen: #ziel mit (1, 0, 0) ist stärker als .hinweis mit (0, 1, 0). Beide Alternativen werden nicht zusammengezählt.",
        "Die drei Beiträge werden gruppenweise addiert: li (0, 0, 1) + :nth-child() (0, 1, 0) + of-Liste (1, 0, 0) = (1, 1, 1)."
      ],
      explanation: "Die Auswahlregel zählt zunächst nur Geschwisterelemente, die .hinweis oder #ziel erfüllen, und sucht darunter das zweite; zusätzlich muss das ausgewählte Element ein li sein. Diese Position ist von der Berechnung der Spezifität zu unterscheiden."
    }
  },
  {
    id: "css-10", level: "Master", topic: "CSS-Spezifität", title: "Eine äußere Selektorliste von :is() unterscheiden",
    question: "Welche Textfarbe erhält der Absatz #ziel? Begründen Sie, welche der durch Kommas getrennten Selektoren ihn auswählen und ob #archiv zur Spezifität der roten Regel für diesen Absatz beiträgt.",
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        "Das Komma trennt zwei eigenständige Selektoren für Rot: #archiv .hinweis und .hinweis. Der erste wählt den Absatz nicht aus, weil kein Vorfahr mit id=\"archiv\" existiert.",
        "Der zweite rote Selektor .hinweis passt zur Klasse des Absatzes. Nur dieser treffende Selektor zählt hier für Rot: (0, 1, 0).",
        "Die blaue Regel .karte .hinweis passt ebenfalls: Der Absatz mit der Klasse hinweis liegt innerhalb der Karte. Zwei Klassen ergeben (0, 2, 0).",
        "A ist gleich; in B gewinnt Blau mit 2 gegenüber 1. Die ID im nicht passenden roten Selektor wird nicht auf den passenden Selektor .hinweis übertragen."
      ],
      explanation: "In einer durch Kommas getrennten Selektorliste außerhalb von Funktionen zählt für ein Element der stärkste tatsächlich passende Selektor. Bei :is() beeinflusst dagegen die stärkste Alternative in seiner Klammer den Beitrag der Funktion."
    }
  },
  {
    id: "css-11", level: "Bachelor", topic: "CSS-Kaskade", title: "Zwei Deklarationen mit unterschiedlicher Wichtigkeit",
    question: "Welche Textfarbe erhält der Absatz #ziel? Begründen Sie, was hier zuerst entscheidet: die Markierung !important oder die Spezifität der Selektoren.",
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
    answer: {
      heading: "Der Absatz #ziel wird rot",
      lines: [
        "Beide Selektoren passen zum Absatz: Er trägt die Klasse hinweis und die ID ziel. Beide Deklarationen setzen seine Eigenschaft color.",
        "color: red ist mit !important als wichtig markiert; color: blue ist eine normale Deklaration. Beide stammen aus den gezeigten Seitenstilen.",
        "Bei dieser gleichen Herkunft gewinnt die wichtige rote Deklaration vor dem Vergleich der Spezifität. Die höhere Spezifität von #ziel ändert daran nichts.",
        "!important verändert keine der drei Zahlen: .hinweis behält (0, 1, 0), #ziel behält (1, 0, 0)."
      ],
      explanation: "Die CSS-Kaskade ist das Verfahren, mit dem der Browser konkurrierende Deklarationen ordnet. Herkunft und Wichtigkeit werden vor der Spezifität verglichen. !important ist kein zusätzlicher ID-Punkt."
    }
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        "style=\"color: red\" setzt direkt am Absatz einen normalen roten Wert. Dieser Stil im HTML-Attribut heißt Inline-Stil.",
        "Der Absatz trägt die Klasse hinweis. Deshalb passt die Stylesheet-Regel und setzt an demselben Absatz color: blue mit !important.",
        "Beide Vorgaben stammen vom Autor der Seite. Die wichtige blaue Deklaration hat Vorrang vor dem normalen roten Inline-Stil.",
        "Ohne !important an color: blue würde in diesem Beispiel der normale rote Inline-Stil gewinnen. Die Klasse allein ist also nicht der Grund für Blau."
      ],
      explanation: "Ein normaler Inline-Stil hat Vorrang vor normalen Regeln aus dem Stylesheet. Eine wichtige Deklaration derselben Herkunft wird jedoch davor eingeordnet."
    }
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
      "#kurse wählt nur das main aus. Die Spezifität dieser Regel wird nicht an den Absatz weitergegeben, wenn er die Farbe erbt.",
      "p bekommt color direkt aus seiner eigenen Regel. Der geerbte Wert kommt hier nicht zum Einsatz.",
      "color ist eine vererbte Eigenschaft. Ohne eigene Deklaration würde der Absatz hier Rot erben."
    ],
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        "#kurse wählt das main aus und setzt dessen color auf red. !important gibt dieser Deklaration Vorrang bei konkurrierenden Farben am main.",
        "p wählt den Absatz #ziel aus und setzt dessen eigene Eigenschaft color auf blue. #kurse wählt diesen Absatz nicht aus.",
        "color kann vom Elternteil geerbt werden. Der Absatz hat hier aber bereits einen eigenen blauen Wert; die rote Farbe des main wird deshalb nicht übernommen.",
        "Entfernte man die Regel p { color: blue; }, würde der Absatz in diesem Beispiel Rot vom main erben."
      ],
      explanation: "Prüfen Sie zuerst, welches Element eine Regel auswählt. Eine wichtige Deklaration am Elternteil konkurriert nicht direkt mit einer Deklaration am Kind; die Wichtigkeit wird nicht mit der Farbe vererbt."
    }
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
    answer: {
      heading: "Der Absatz #ziel wird blau",
      lines: [
        "#ziel und .hinweis wählen beide den Absatz aus. Beide color-Deklarationen sind normal, also ohne !important.",
        "@layer basis, anwendung legt die Reihenfolge der Schichten fest: zuerst basis, danach anwendung. Schichten sind benannte Gruppen von CSS-Regeln.",
        "Bei normalen Deklarationen derselben Herkunft hat die später angelegte Schicht Vorrang. Deshalb gewinnt color: blue aus anwendung gegen color: red aus basis.",
        "Die Spezifitäten bleiben (1, 0, 0) für #ziel und (0, 1, 0) für .hinweis. Sie entscheiden hier aber nicht, weil der Schichtvergleich bereits entschieden ist."
      ],
      explanation: "Bei Regeln in verschiedenen Kaskadenschichten prüfen Sie den Schichtvorrang vor der Spezifität. Innerhalb derselben Schicht kann die Spezifität weiterhin entscheiden."
    }
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
    answer: {
      heading: "Der Absatz #ziel wird rot",
      lines: [
        ".hinweis und #ziel wählen beide den Absatz aus. Beide color-Deklarationen stammen aus den Seitenstilen und sind mit !important markiert.",
        "@layer basis, anwendung legt basis als erste und anwendung als zweite Schicht fest.",
        "Für wichtige Deklarationen ist der Schichtvorrang gegenüber normalen Deklarationen umgekehrt: Die zuerst angelegte Schicht basis gewinnt. Darin steht color: red !important.",
        "Die höhere Spezifität von #ziel in anwendung kommt nicht mehr zum Vergleich. Zwei !important-Markierungen heben sich nicht gegenseitig auf."
      ],
      explanation: "Innerhalb derselben Herkunft gilt zwischen benannten Schichten: normal → die spätere Schicht gewinnt; wichtig → die frühere Schicht gewinnt. Erst innerhalb derselben Schicht kann die Spezifität entscheiden."
    }
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
    answer: {
      heading: 'Ergebnis: ["Weiter", true, 1]',
      lines: [
        "querySelector findet das vorhandene button-Element. Mit zweite = erste wird kein Button kopiert: Beide Variablen geben Zugriff auf dasselbe DOM-Objekt.",
        'zweite.textContent = "Weiter" ändert den Text dieses gemeinsamen Buttons. Daher liefert auch erste.textContent den String "Weiter".',
        "erste === zweite ist true, weil beide Variablen auf dasselbe Objekt verweisen. querySelectorAll(\"button\").length bleibt 1, weil kein weiteres Element angelegt wurde.",
        "const verhindert eine spätere Zuweisung eines anderen Werts an erste oder zweite. Eine Eigenschaft des bereits vorhandenen Objekts wie textContent darf trotzdem geändert werden."
      ],
      explanation: "Ein Verweis auf ein DOM-Objekt ist keine Kopie des Elements. Änderungen über einen solchen Verweis sind auch über andere Variablen sichtbar, die auf dasselbe Objekt verweisen."
    }
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
    answer: {
      heading: "Ergebnis: [0, 1, true]",
      lines: [
        "Anfangs ist p#kurs ein direktes Kind von section#links; section#rechts ist leer.",
        "rechts.appendChild(absatz) hängt genau diesen vorhandenen Absatz bei #rechts an. Dabei wird er automatisch aus #links entfernt; es entsteht keine Kopie.",
        "#links hat danach keine direkten Kindelemente: links.children.length ist 0. #rechts hat genau den Absatz als Kindelement: rechts.children.length ist 1.",
        "appendChild gibt den angehängten Knoten zurück. rueckgabe und absatz bezeichnen deshalb denselben Absatz; rueckgabe === absatz ist true."
      ],
      explanation: "Ein vorhandener Knoten wird beim Anhängen verschoben und behält seine Objektidentität. Für eine zweite unabhängige Ausgabe müsste zunächst ein neues Element oder eine Kopie erzeugt werden."
    }
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
    answer: {
      heading: 'Ergebnis: [1, "Start", false]',
      lines: [
        "cloneNode(true) erzeugt ein neues button-Objekt und kopiert seine Attribute sowie seine Kindknoten. Der Textknoten Start wird mitkopiert. Die anschließende Zuweisung ändert nur die ID der Kopie.",
        "Der mit addEventListener registrierte click-Listener wird nicht kopiert. Ein Listener ist die Funktion, die bei einem passenden Ereignis aufgerufen wird.",
        "original.click() ruft den Listener am Original auf: aufrufe steigt von 0 auf 1. kopie.click() löst zwar einen Klick aus, hat aber keinen solchen Listener; der Zähler bleibt 1.",
        'kopie.textContent ist "Start". original === kopie ist false, weil Original und Kopie zwei verschiedene DOM-Objekte sind.'
      ],
      explanation: "cloneNode(true) kopiert den DOM-Teilbaum. Mit addEventListener hinzugefügte Funktionen gehören nicht zu dieser Kopie und müssten bei Bedarf erneut registriert werden."
    }
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
    answer: {
      heading: 'Ergebnis: [0, 1, false, "Alt"]',
      lines: [
        "gespeichert bezeichnet zunächst das span mit dem Text Alt. Die Variable enthält einen Verweis auf dieses Element, keine automatisch aktualisierte Suche nach dem jeweils ersten Kind.",
        'box.textContent = "Neu" entfernt die bisherigen Kinder span und em aus #box. An ihre Stelle kommt genau ein Textknoten mit Neu.',
        "children zählt nur direkte Kindelemente: box.children.length ist 0. childNodes zählt alle direkten Kindknoten, also auch den neuen Textknoten: box.childNodes.length ist 1.",
        "Das alte span hängt nicht mehr im Dokument: gespeichert.isConnected ist false. Über die Variable ist es aber noch erreichbar. Sein eigener Text wurde nicht geändert, deshalb bleibt gespeichert.textContent gleich \"Alt\"."
      ],
      explanation: "textContent am Container ersetzt dessen Kinder. Ein entferntes Element kann über eine zuvor gespeicherte Variable weiter existieren; es wird dadurch nicht zum neuen Inhalt des Containers."
    }
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
    answer: {
      heading: 'Ergebnis: [0, "<strong>Neu</strong>"]',
      lines: [
        'eingabe ist eine Zeichenkette. Ihre Zeichen sehen wie HTML aus: "<strong>Neu</strong>".',
        "ausgabe.textContent = eingabe erstellt daraus einen Textknoten. Die Zeichen <strong> und </strong> werden als Text behandelt; es wird kein strong-Element erzeugt.",
        "children zählt nur Kindelemente, keine Textknoten. Daher ist ausgabe.children.length gleich 0.",
        'ausgabe.textContent liest die vollständige Zeichenkette einschließlich der spitzen Klammern zurück: "<strong>Neu</strong>".'
      ],
      explanation: "Mit textContent ausgegebene Eingaben bleiben Text. Das verhindert an dieser Ausgabestelle, dass mitgelieferte HTML-Zeichen als neue Elemente oder ausführbarer Inhalt interpretiert werden."
    }
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
    answer: {
      heading: "Ergebnis: [false, false, true, true]",
      lines: [
        "Anfangs enthält class=\"karte aktiv\" die Klasse aktiv. Der erste Aufruf toggle(\"aktiv\", false) entfernt sie. Danach fehlt sie; a ist false.",
        "Der zweite Aufruf hat wieder den zweiten Parameter false. Er verlangt erneut „aktiv soll fehlen“. Die Klasse bleibt entfernt; b ist ebenfalls false.",
        "Der dritte Aufruf toggle(\"aktiv\") hat keinen zweiten Parameter und kehrt den aktuellen Zustand um. Die bisher fehlende Klasse wird hinzugefügt; c ist true.",
        "contains(\"aktiv\") prüft den Zustand nach allen Aufrufen. Die Klasse ist jetzt vorhanden, deshalb ist auch der vierte Arraywert true."
      ],
      explanation: "Mit einem zweiten Parameter legt toggle einen Zielzustand fest; ohne ihn schaltet toggle um. Der Rückgabewert sagt, ob die Klasse danach vorhanden ist, nicht ob gerade eine Änderung nötig war."
    }
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
    answer: {
      heading: 'Ergebnis: ["3", "string", "3"]',
      lines: [
        'dataset.freiePlaetze greift auf data-freie-plaetze zu. Anfangs liefert es den Attributwert als Zeichenkette "2".',
        "Number wandelt \"2\" in die Zahl 2 um. Erst danach wird 1 addiert; neu enthält die Zahl 3 und nicht die Zeichenkette \"21\".",
        'Die Zuweisung an dataset.freiePlaetze speichert die Zahl als Attributtext "3". Beim erneuten Lesen liefert dataset deshalb "3"; typeof ergibt "string".',
        'getAttribute("data-freie-plaetze") liest dasselbe inzwischen geänderte Attribut. Auch der dritte Arraywert lautet "3".'
      ],
      explanation: "dataset verbindet JavaScript-Namen wie freiePlaetze mit data-Attributen wie data-freie-plaetze. Die Attributwerte bleiben Zeichenketten; eine Rechnung benötigt bei solchen Eingaben eine Zahlenumwandlung."
    }
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
    answer: {
      heading: 'Ergebnis: ["Neu", "Start", "Start"]',
      lines: [
        'Das HTML-Attribut value="Start" gibt den ursprünglichen Wert des Textfelds vor. Zu Beginn erscheint Start im Feld.',
        'feld.value = "Neu" ändert den aktuellen Eingabewert. feld.value liefert danach "Neu"; dieser Wert würde im Feld angezeigt.',
        'Die Zuweisung an die Eigenschaft value schreibt hier nicht das HTML-Attribut um. feld.getAttribute("value") liefert weiterhin "Start".',
        'defaultValue spiegelt die Vorgabe im value-Attribut. Deshalb liefert feld.defaultValue ebenfalls "Start".'
      ],
      explanation: "Bei einem Texteingabefeld müssen aktueller Wert und Vorgabewert getrennt betrachtet werden. Die Eigenschaft value hält den aktuellen Wert; das value-Attribut und defaultValue halten hier die Vorgabe."
    }
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
    answer: {
      heading: 'Ergebnis: ["symbol", "bereich"]',
      lines: [
        "dispatchEvent wird an span#symbol aufgerufen. Dieses span ist hier der Ausgangspunkt des Ereignisses; event.target bleibt deshalb #symbol.",
        "bubbles: true erlaubt dem Ereignis, zu den Vorfahren weiterzugehen: vom span über den button zu div#bereich.",
        "Die mit addEventListener registrierte Funktion sitzt an #bereich. Während genau diese Funktion läuft, ist event.currentTarget deshalb #bereich.",
        'Die Funktion liest die IDs beider Elemente: event.target.id ist "symbol", event.currentTarget.id ist "bereich". Genau diese zwei Strings werden in protokoll gespeichert.'
      ],
      explanation: "Ein Listener ist eine Funktion, die bei einem Ereignis aufgerufen wird. Hier benennt target den Ausgangspunkt des Ereignisses; currentTarget benennt das Element, an dem der gerade laufende Listener registriert ist."
    }
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
    answer: {
      heading: 'Ergebnis: ["eins", "zwei"]',
      lines: [
        "taste.click() löst den Klick am Button #taste aus. Seine beiden click-Listener laufen in der Reihenfolge, in der addEventListener sie registriert hat.",
        'Der erste Listener fügt "eins" ein. stopPropagation() verhindert danach die Weitergabe des Ereignisses zum Vorfahren #bereich.',
        'Der zweite Listener sitzt ebenfalls an #taste. Er wird durch stopPropagation() nicht gestoppt und fügt "zwei" ein.',
        'Der Listener an #bereich wartet auf das Aufsteigen des Ereignisses. Er wird nicht erreicht; "eltern" kommt daher nicht ins Array.'
      ],
      explanation: "stopPropagation() stoppt den Weg zu weiteren Elementen. Weitere Listener am gerade bearbeiteten Element laufen weiter. Um auch diese zu stoppen, wäre stopImmediatePropagation() nötig."
    }
  },
  {
    id: "mutation-11", level: "Master", topic: "Ereignisse", title: "Status und Rückgabe eines eigenen Ereignisses",
    question: "Welches Array liefert der letzte Ausdruck? Prüfen Sie getrennt, was preventDefault() an defaultPrevented ändert, ob der Container-Listener läuft und welchen Wert dispatchEvent() zurückgibt.",
    context: DOM_CONTEXT + " kurswahl ist ein selbst erzeugtes Ereignis. Es ist abbrechbar (cancelable: true) und darf aufsteigen (bubbles: true). Die Listener sind nicht passiv; weitere Listener existieren nicht.",
    html: '<div id="bereich"><button id="taste" type="button">Wählen</button></div>',
    code: 'const taste = document.querySelector("#taste");\nlet elternAufgerufen = false;\ntaste.addEventListener("kurswahl", event => event.preventDefault());\ndocument.querySelector("#bereich").addEventListener("kurswahl", () => { elternAufgerufen = true; });\nconst ereignis = new Event("kurswahl", {bubbles: true, cancelable: true});\nconst zugelassen = taste.dispatchEvent(ereignis);\n[ereignis.defaultPrevented, elternAufgerufen, zugelassen]',
    choices: ["[true, false, false]", "[false, true, true]", "[true, true, false]", "[true, true, true]"], correctIndex: 2,
    choiceExplanations: [
      "preventDefault beendet nicht das Aufsteigen des Ereignisses. Der Container-Listener läuft weiterhin.",
      "cancelable: true erlaubt preventDefault(), den Status defaultPrevented auf true zu setzen. Der Listener ist nicht passiv und darf dies deshalb tun.",
      "preventDefault setzt defaultPrevented auf true. Der Container-Listener läuft trotzdem. dispatchEvent gibt wegen dieses gesetzten Status false zurück.",
      "dispatchEvent gibt hier false zurück, weil preventDefault bei einem abbrechbaren Ereignis aufgerufen wurde. false bedeutet nicht, dass die Listener nicht gelaufen wären."
    ],
    answer: {
      heading: "Ergebnis: [true, true, false]",
      lines: [
        "dispatchEvent löst kurswahl an #taste aus und führt die passenden Listener aus, bevor der Aufruf zurückkehrt.",
        "Der Listener am Button ruft preventDefault() auf. Weil das Ereignis cancelable: true hat und der Listener nicht passiv ist, wird ereignis.defaultPrevented zu true.",
        "preventDefault() stoppt nicht die Weitergabe. Wegen bubbles: true erreicht das Ereignis auch #bereich; dessen Listener setzt elternAufgerufen auf true.",
        "dispatchEvent gibt bei einem so markierten abbrechbaren Ereignis false zurück. Deshalb ist zugelassen gleich false, obwohl beide Listener ausgeführt wurden."
      ],
      explanation: "preventDefault() fordert an, eine mit dem Ereignis verbundene Standardaktion zu unterlassen. Es stoppt keine Listener. Für das eigene Ereignis kurswahl existiert keine eingebaute Browseraktion; der Anwendungscode kann den Status beziehungsweise die Rückgabe selbst auswerten."
    }
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
    answer: {
      heading: "Ergebnis: [2, 0, 1]",
      lines: [
        "createDocumentFragment() erzeugt einen vorübergehenden Behälter für Knoten. fragment.append(...) fügt dort zwei neu erzeugte p-Elemente ein; #kurse bleibt bis dahin leer.",
        "ziel.appendChild(fragment) verschiebt die beiden Kinder des Fragments direkt nach #kurse. Das Fragment selbst wird nicht als weiteres Kind eingefügt.",
        "#kurse besitzt danach zwei direkte Kindelemente: ziel.children.length ist 2. Das Fragment hat seine Kinder abgegeben: fragment.childNodes.length ist 0.",
        "Das erste Kind von #kurse ist nun ein p-Element. Sein nodeType ist 1; es ist kein DocumentFragment mit nodeType 11."
      ],
      explanation: "Ein Fragment kann mehrere Knoten für das Einfügen sammeln. Es erzeugt beim Einfügen keine zusätzliche Elternebene; seine Kinder wechseln direkt zum Ziel."
    }
  }
];
