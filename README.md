# TreeHugger

**Aktueller Code: 1.4.0 (02.11.2026).** Der neue Reiter **Unterricht** enthält offene Vorhersageaufgaben, eine Quizrunde mit sechs Fragen und drei übersichtliche Musterseiten. Für diesen Stand oben **Code → Download ZIP** wählen, das Repository entpacken und dessen Ordner `Erweiterung` verwenden. Das separat veröffentlichte Installationspaket bleibt bei Version 1.3.3 und enthält den Unterrichtsmodus noch nicht.

Eine Chrome-Erweiterung zum Erkunden einer Webseite: als grafischer DOM-Baum, anhand von Auswahlmethoden und in einer lesbaren Quellcode-Ansicht. Die Oberfläche und die Anleitung sind auf Deutsch.

**Version 1.3.3** · [Installationspaket herunterladen](https://github.com/GinuX42/TreeHugger/releases/download/v1.3.3/26_11_01_TreeHugger_1_3_3.zip) · [Versionsseite](https://github.com/GinuX42/TreeHugger/releases/tag/v1.3.3) · [Bebilderte Anleitung](26_11_01_Installation.html)

Die HTML-Anleitung enthält ihre Bilder bereits eingebettet. Laden Sie sie herunter und öffnen Sie sie im Browser, oder öffnen Sie die Anleitung aus dem entpackten Installationspaket.

## Installation in Chrome

1. Laden Sie das Installationspaket herunter und entpacken Sie es vollständig.
2. Öffnen Sie `chrome://extensions` in Chrome.
3. Schalten Sie oben rechts den **Entwicklermodus** ein.
4. Klicken Sie auf **Entpackte Erweiterung laden** und wählen Sie den Unterordner **Erweiterung** aus. Darin liegt die Datei `manifest.json`.
5. Öffnen Sie eine Webseite und starten Sie **TreeHugger** über das Puzzleteil-Symbol in Chrome. Sie können das Symbol dort anheften.

Für lokale HTML-Seiten aktivieren Sie in den Details der Erweiterung zusätzlich **Zugriff auf Datei-URLs zulassen**. Chrome-interne Seiten wie `chrome://settings` können nicht untersucht werden. Bewahren Sie den Erweiterungsordner auf; Chrome verwendet die entpackten Dateien weiterhin.

Wer das Repository herunterlädt oder klont, kann ebenfalls dessen Unterordner **Erweiterung** direkt laden. Es ist kein Build und keine Installation von npm-Abhängigkeiten nötig.

## Funktionen

- **DOM-Baum:** Eltern-Kind-Verbindungen, aufklappbare Äste, Zoom, Knotendetails, beschriftete Farbleisten und SVG-Export. **Nur Baum** vergrößert die Darstellung; **Zurück** oder **Esc** führt zurück. Hinweise lassen sich schließen.
- **Typen und Sammlungen:** Elemente sind zugleich Nodes. Textknoten, Kommentare und Dokumentknoten sind gesondert gekennzeichnet. NodeList und HTMLCollection werden als Sammlungen erklärt; ein HTML-Listenelement bleibt ein einzelnes Element.
- **Auswahl & Rückgabe:** Auswahlmethoden ausprobieren und erkennen, ob ein einzelnes Element, eine Sammlung oder `null` zurückgegeben wird.
- **Quellcode:** HTML, CSS und JavaScript mit Syntaxfarben, Zeilennummern, Suche, Schriftgröße, Zeilenumbruch und großer Code-Ansicht. HTML zeigt den aktuellen DOM-Stand. Die Herkunft jeder Quelle ist beschriftet.
- **CSS-Spezifität:** Selektoren in die Gruppen A (IDs), B (Klassen, Attribute, Pseudoklassen) und C (Elementnamen, Pseudoelemente) zerlegen und miteinander vergleichen. Beispiele und Erklärungen ordnen die Spezifität in die CSS-Kaskade ein.
- **Unterricht:** Rückgaben zuerst vorhersagen und begründen, anschließend Ergebnis und Erklärung aufdecken. Mit eingebauten Beispielen, Kindknoten des gewählten Elements oder eigenen Auswahlabfragen auf der Quellseite.

## Unterricht und Quizrunde

Öffnen Sie **Unterricht → Quizrunde starten**. Die sechs offenen Fragen behandeln `querySelector`, `querySelectorAll`, fehlende Treffer, `children` und `childNodes`, CSS-Positionen gegenüber JavaScript-Indizes sowie lebende und statische Sammlungen. Antworten Sie mündlich oder tragen Sie Ihre Begründung in das freiwillige Textfeld ein. **Ergebnis aufdecken** zeigt die Musterantwort und ihre Erklärung; danach führt **Nächste Aufgabe** weiter. Es gibt keine automatische Bewertung oder Note.

Außerhalb der Quizrunde lassen sich Beispiele einzeln wählen. Für eigene Aufgaben wählen Sie im DOM-Baum ein Element und dann **Kindknoten des gewählten Elements**, oder verwenden Sie **Auswahl auf der aktuellen Webseite** mit einer Auswahlmethode und einem Suchwert. **Aufgabe vorbereiten** hält das Ergebnis als Momentaufnahme fest, zeigt es aber erst nach dem Aufdecken. Eine neue Aufgabe oder ein Ansichtswechsel löscht die freiwillige Notiz. Eingaben werden nicht gespeichert oder übertragen.

Unter **Musterseiten für den Unterricht** stehen drei eigenständige HTML-Dateien zum Herunterladen bereit:

- **Selektoren: Kursportal** – wenige Elemente mit IDs, Klassen, direkten Kindern und tieferen Nachfahren; Baum-Ausschnitt `#kurse`.
- **Kindknoten: Text und Leerraum** – ein Absatz, ein Kommentar und die Leerraum-Textknoten dazwischen; Ausschnitt `#kurs`.
- **DOM-Veränderungen: Kursliste** – Absätze ergänzen und entfernen; die beim Öffnen gespeicherten Sammlungen anschließend vergleichen; Ausschnitt `#kurse`.

Öffnen Sie die heruntergeladene Datei in Chrome und starten Sie dort TreeHugger. Für lokale Dateien muss **Zugriff auf Datei-URLs zulassen** aktiviert sein. Nach einer DOM-Änderung liest **Seite neu einlesen** die neue Struktur ein. Die Musterseiten funktionieren ohne externe Dateien und ohne Internetverbindung.

## Lokale JavaScript- und CSS-Dateien lesen

Wechseln Sie zu **Quellcode → JavaScript** oder **CSS**, wählen Sie links die verknüpfte Datei aus und klicken Sie auf **Lokale Datei öffnen**. Wählen Sie im Dateidialog die passende Datei aus dem Ordner Ihrer HTML-Seite aus.

Die Datei wird als Text angezeigt und nicht ausgeführt. Sie wird nicht automatisch aus dem Nachbarordner gelesen. Der Dateidialog gibt den vollständigen gewählten Pfad nicht frei; die Ansicht kennzeichnet deshalb die manuelle Auswahl und die ursprüngliche HTML-Verknüpfung getrennt. Nach einer Änderung wählen Sie die Datei erneut aus. Bei lokalem CSS kann **Browser-Regeln lesen** alternativ zugängliche CSS-Regeln rekonstruieren.

## Leerraum, childNodes und children

- `childNodes` enthält **alle direkten Kindknoten**, einschließlich Textknoten, die nur aus Leerzeichen, Einrückungen oder Zeilenumbrüchen bestehen.
- `children` enthält **nur direkte Kindelemente**. Textknoten und Kommentare gehören nicht dazu.
- Der Schalter **Leerraum** ändert nur die Anzeige im Diagramm. Die Zählwerte der Momentaufnahme bleiben gleich. Gezählt werden Knoten, nicht einzelne Leerzeichen.

Die obere Farbleiste einer Baumkarte bezeichnet den Knotentyp. Die zweite Leiste bei Elementen bezeichnet die Elementgruppe. So gehört etwa `<p>` zur Elementgruppe „Textinhalt“, bleibt aber ein Element und ist kein Textknoten.

## Aktualisieren

Ersetzen Sie die bisherigen Erweiterungsdateien vollständig durch die neue Fassung, einschließlich des Unterordners `vendor`. Laden Sie TreeHugger anschließend unter `chrome://extensions` neu. Schließen Sie alte Ansichts-Tabs und öffnen Sie das Tool auf der Quellseite erneut über sein Symbol.

## Verarbeitung und Grenzen

Die Auswertung und Formatierung erfolgen lokal. Seiteninhalte werden nicht an einen Analysedienst hochgeladen. Ein Klick auf **Datei laden** für eine verknüpfte Netzwerkquelle erzeugt eine normale Anfrage an deren Dateiserver. Browser-Zugriffsregeln bleiben dabei wirksam. Die Berechtigungen der Erweiterung sind `activeTab` und `scripting`; pauschale Hostberechtigungen werden nicht angefordert.

Die Darstellung ist eine Momentaufnahme. Große Quellen und DOM-Strukturen werden begrenzt und Kürzungen beschriftet. Frames, Shadow DOM sowie nachgeladene Modul- und CSS-Abhängigkeiten werden nicht vollständig erfasst. Rekonstruierte Browser-Regeln können von der ursprünglichen CSS-Datei abweichen. Der Spezifitätsvergleich berechnet keine vollständige Kaskade und beweist allein nicht, welche CSS-Deklaration auf einem Element gewinnt.

## Tests

Die Tests verwenden die eingebauten Testwerkzeuge von **Node.js ab Version 20**. Es sind keine zusätzlichen Pakete nötig:

```sh
npm test
```

Alternativ genügt `node --test` im Projektordner. Die 128 automatisierten Tests prüfen unter anderem DOM-Erfassung, Auswahlrückgaben, Quellenzugriff, sichere Textdarstellung, Attribute in Baumkarten, lokale Dateiauswahl, Farben, Formatierung und Spezifität. Hinzu kommen Aufgabeninhalte, verborgene Antworten, verspätete Abfrageergebnisse, die vollständige Quizrunde und die veränderbare Musterseite. Browser-Schnittstellen werden nachgebildet; dies ersetzt keinen echten Chrome-Praxistest. Die Fassung 1.4.0 wurde im bisherigen Arbeitsumfeld wegen einer Zugriffssperre nicht im persönlichen Chrome-Profil installiert oder visuell geprüft.

Weitere Einzelheiten stehen in den [Prüfhinweisen](26_11_01_Pruefhinweise.md).

## Projektangaben und Fremdkomponenten

**Idee, Konzeption und fachliche Projektleitung: Gino Peduto**

Technische Umsetzung mit KI-Unterstützung durch OpenAI Codex.

Die [Projektangaben](26_11_01_Projektangaben.md) beschreiben die Beiträge. Die lokale Formatierungsbibliothek **js-beautify** wird einschließlich ihrer [MIT-Lizenz](Erweiterung/vendor/js-beautify/LICENSE) und ihres [Herkunftsnachweises](Erweiterung/vendor/js-beautify/provenance.json) mitgeliefert. Diese Bibliothekslizenz ist keine pauschale Lizenzangabe für das gesamte Projekt.
