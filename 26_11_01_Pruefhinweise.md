# TreeHugger – Version 1.3.3

Stand: 01.11.2026. Öffnen Sie zuerst **26_11_01_Installation.html**. Wählen Sie für die Installation den Unterordner **Erweiterung**.

## Neu in dieser Fassung

Version 1.3.3 führt den Projektnamen **TreeHugger** ein. Der Name steht in Chrome, in der Oberfläche und in der Anleitung. „DOM-Baum“ bleibt die Bezeichnung der Baumansicht. Die bisherigen Funktionen bleiben enthalten.

Der Reiter Quellcode zeigt HTML, CSS und JavaScript mit Syntaxfarben, Zeilennummern, Suche, einstellbarer Schriftgröße, Zeilenumbruch und einer großen Code-Ansicht. HTML bezeichnet den aktuellen DOM-Stand. Verknüpfte Dateien werden gezielt nachgeladen und nach Herkunft beschriftet. Der Spezifitätsbereich erklärt Selektoren anhand farbig markierter Bestandteile und dreier Gewichtungsgruppen; zwei Selektoren lassen sich vergleichen. Die Darstellung unterscheidet Spezifität von der vollständigen CSS-Kaskade.

„Nur Baum“, schließbare Hinweise, die farbige Typzuordnung und Auswahlmethoden bleiben enthalten. Die bebilderte Anleitung verwendet den freigegebenen Roboter mit Espresso.

Version 1.3.2 ergänzt das bewusste Öffnen lokaler JavaScript- und CSS-Dateien. Eine Datei neben der HTML-Datei wird über „Lokale Datei öffnen“ ausgewählt, als Text gelesen und nach Herkunft beschriftet. Es sind keine zusätzlichen pauschalen Dateiberechtigungen nötig. Der gewählte Pfad lässt sich durch den Dateinamen allein nicht nachweisen; die Ansicht behauptet deshalb keine gesicherte Identität mit der ursprünglichen HTML-Verknüpfung.

Die Bedeutungsfarben sind kräftiger und stammen aus einer gemeinsamen Palette. Beschriftete Farbleisten unterscheiden Knotentyp und Elementgruppe; aufklappbare Legenden erläutern die Zuordnung. Sammlungen sind in Auswahl und Details einheitlich gefärbt. Die drei getrennten Absätze zu childNodes, children und Anzeige stellen klar: Leerraum-Textknoten zählen bei childNodes mit, bei children nicht. Anzeige-Filter ändern die zugrunde liegenden Zählwerte nicht.

Version 1.3.1 ergänzt die Projektangaben: **Idee, Konzeption und fachliche Projektleitung: Gino Peduto.** Technische Umsetzung mit KI-Unterstützung durch OpenAI Codex. Die Nennung steht im aufklappbaren Bereich „Projekt · Gino Peduto“ am unteren Rand der Erweiterung, im Abschnitt „Zum Projekt“ der Anleitung und in der separaten Datei mit Projektangaben.

## Tatsächliche Prüfung

**103 automatisierte Tests bestanden.** Die Tests prüfen unter anderem Typzuordnung, Auswahlrückgaben, DOM-Erfassung, Nachrichtenprüfung, sichere Textdarstellung, Größenbegrenzungen, Quellenzugriff, Syntaxfarben, Formatierung und Spezifität. DOM und Chrome-Schnittstellen werden dabei nachgebildet; dies ersetzt keinen echten Browser-Praxistest.

Zusätzlich wurden die lokale Dateiauswahl und ihre Fehler-/Wechselfälle sowie die Farbzuordnung und Textkontraste geprüft. Die Beschriftungen bleiben zusätzlich zu den Farben erhalten. Ein rechnerischer Kontrasttest ersetzt keine visuelle Prüfung mit unterschiedlichen Projektoren oder bei Farbfehlsichtigkeit.

Zusätzlich geprüft: JavaScript-Syntax, Modul- und Dateiverweise, unveränderte lokale Formatierungsbibliotheken anhand ihrer dokumentierten Prüfsummen, Lizenz, Manifest-Berechtigungen, Archivintegrität sowie identische Anleitung innerhalb und außerhalb des ZIP. Die Bilder sind eingebettet; der ursprüngliche Profilfoto-Ausschnitt ist darin nicht enthalten.

Der Zugriff auf die Chrome-Erweiterungsverwaltung wurde am 31.10.2026 durch die Browser-Zugriffsregeln blockiert. Die neue Fassung wurde deshalb nicht im persönlichen Chrome-Profil installiert oder visuell geprüft. Praktisch offen bleiben insbesondere Darstellung bei verschiedenen Fenstergrößen, echte Webseiten mit ihren Zugriffsregeln, Worker-Start unter Chrome und der SVG-Download. Keine vollständige Fehlerfreiheit zugesichert.

## Sicherheitsprüfung

- Berechtigungen weiterhin nur activeTab und scripting; keine pauschalen Hostberechtigungen.
- Nur Nachrichten der eigenen Ansichtsseite werden akzeptiert; Quelltab, Methode, Typ und Länge werden geprüft.
- Verknüpfte Dateien werden nur nach einem Klick gelesen. Ihre Adresse muss weiterhin im aktuellen Hauptdokument vorkommen; eine beliebige vom Absender gelieferte Adresse reicht nicht.
- Netzwerkabrufe beachten Browser-Zugriffsregeln, Zeit- und Größenbegrenzungen. Weiterleitungen werden nicht automatisch verfolgt.
- Eingelesener Code wird als Text dargestellt und nicht ausgeführt. Die Einrückung läuft in einem separaten lokalen Worker; bei Fehler oder Zeitüberschreitung bleibt der eingelesene Text erhalten.
- Die Formatierungsbibliothek liegt einschließlich MIT-Lizenz und Herkunftsnachweis unter Erweiterung/vendor/js-beautify. Es werden keine entfernten Bibliotheken nachgeladen.
- Keine Übertragung von Seiteninhalten an einen Analysedienst. Ein bewusst ausgelöster Dateiabruf ist eine normale Anfrage an den Dateiserver.
- Die lokale Dateiauswahl liest ausschließlich die bewusst ausgewählte Datei als begrenzten Textausschnitt und führt ihren Inhalt nicht aus. Sie benötigt keinen zusätzlichen Netzwerkzugriff und keine pauschale Dateiberechtigung.

Die Prüfung ist eine gezielte Code- und Testprüfung, kein externes Sicherheitszertifikat.

## Fachliche Grenzen

Der HTML-Text ist die serialisierte aktuelle Dokumentstruktur. Frames, Shadow DOM und separate template-Fragmente werden nicht vollständig erfasst. Verknüpfte Quellen bilden keine vollständige Liste aller Laufzeit-Abhängigkeiten. Browser-Regeln sind eine CSSOM-Rekonstruktion. Nicht zugängliche oder gekürzte Quellen werden beschriftet.

Der Spezifitätsvergleich setzt für eine Aussage zum Vorrang vergleichbare Kaskadenbedingungen voraus. Er prüft keine tatsächlichen Elementtreffer, Medienbedingungen, vollständigen Ebenen oder berechneten Stile. Verschachtelte Selektoren benötigen ihren Kontext; nicht unterstützte Syntax wird nicht stillschweigend mit einer erfundenen Gewichtung bewertet.

## Aktualisieren

Die neuen Dateien samt Unterordner vendor in den bisherigen Erweiterungsordner übernehmen. Anschließend unter chrome://extensions TreeHugger neu laden. Alte Ansichten schließen und das Tool auf der Quellseite erneut über sein Symbol öffnen. Alternativ die alte lokale Erweiterung entfernen und den neuen Erweiterungsordner laden.

Grundlagen: [Chrome: Netzwerkzugriffe](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests), [W3C: Selektor-Spezifität](https://www.w3.org/TR/selectors-4/#specificity-rules), [W3C: CSS-Kaskade](https://www.w3.org/TR/css-cascade-6/#cascade-sort).
