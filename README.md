# TreeHugger

**Version 1.5.0 · 23.11.2026**

TreeHugger ist eine deutschsprachige Chrome-Erweiterung für den Web-Unterricht. Sie macht den DOM-Baum einer Webseite sichtbar, erklärt Auswahlmethoden und CSS-Spezifität und zeigt HTML, CSS und JavaScript. Version 1.5.0 ergänzt die 54 Quizfragen um einen Klausursatz mit zwölf offenen Aufgaben, Musterlösungen und insgesamt 60 Punkten.

[Windows-Setup herunterladen](https://github.com/GinuX42/TreeHugger/releases/download/v1.5.0/TreeHugger-1.5.0-Setup.exe) · [Release und SHA-256-Prüfsumme](https://github.com/GinuX42/TreeHugger/releases/tag/v1.5.0)

## Installation unter Windows

1. Öffnen Sie **TreeHugger-1.5.0-Setup.exe** und klicken Sie auf **Installieren**. Das Setup speichert die vollständige Erweiterung für das aktuelle Windows-Benutzerkonto. Mit **Pfad kopieren** übernehmen Sie den Installationspfad.
2. Öffnen Sie in Google Chrome `chrome://extensions` und aktivieren Sie oben rechts den **Entwicklermodus**.
3. Klicken Sie auf **Entpackte Erweiterung laden** und wählen Sie den vom Setup angezeigten Ordner. Die Vorgabe lautet `%LOCALAPPDATA%\TreeHugger\Erweiterung`.
4. Öffnen Sie eine Webseite. Klicken Sie oben auf das Puzzleteil und dann auf **TreeHugger**. Für lokale HTML-Dateien aktivieren Sie zusätzlich **Zugriff auf Datei-URLs zulassen** in den Erweiterungsdetails.

Das Setup enthält die Anleitung, Musterseiten und alle Laufzeitdateien. Für die Nutzung benötigen Sie Google Chrome und unter Windows das .NET Framework 4.5 oder neuer. Zum manuellen Laden aus dem Quellcode wählen Sie in Schritt 3 direkt den Repository-Ordner **Erweiterung**. Im Setup öffnet **Anleitung öffnen** die mitgelieferte Hilfe.

## Klausurfragen

Öffnen Sie im TreeHugger-Fenster **Klausurfragen → Klausursatz auswählen → Bearbeitung starten**. Jede der zwölf neuen Aufgaben bringt fünf Punkte. Die Aufgaben behandeln unter anderem Live-Sammlungen, Ereignisdelegation, DOM-Veränderungen, das Boxmodell und `defer`. Die Musterlösung weist für jeden Antwortteil Punkte aus. Nach der Abgabe bewerten Lernende offene Antworten selbst. Eigene Auswahlfragen werden automatisch ausgewertet.

Sie können die Fragen zusammenstellen, filtern und bearbeiten sowie eigene Aufgaben anlegen. Aufgaben und Lösungsschlüssel lassen sich getrennt als JSON exportieren. Eine Gesamtsicherung enthält die Fragen und Bearbeitungen und lässt sich wieder importieren. Antworten bleiben im lokalen Browserprofil. Die Erweiterung dient der Vorbereitung und Selbstkontrolle. Lehrkräfte und Lernende mit Zugriff auf die Fragenverwaltung können die Lösungen einsehen.

## Funktionen

- **DOM-Baum:** Eltern-Kind-Verbindungen, aufklappbare Äste, Zoom, Knotendetails, beschriftete Farbleisten und SVG-Export. **Nur Baum** vergrößert die Darstellung; **Zurück** oder **Esc** führt zurück. Hinweise lassen sich schließen.
- **Typen und Sammlungen:** Elemente sind zugleich Nodes. Textknoten, Kommentare und Dokumentknoten sind gesondert gekennzeichnet. NodeList und HTMLCollection werden als Sammlungen erklärt; ein HTML-Listenelement bleibt ein einzelnes Element.
- **Auswahl & Rückgabe:** Auswahlmethoden ausprobieren und erkennen, ob ein einzelnes Element, eine Sammlung oder `null` zurückgegeben wird.
- **Quellcode:** HTML, CSS und JavaScript mit Syntaxfarben, Zeilennummern, Suche, Schriftgröße, Zeilenumbruch und großer Code-Ansicht. HTML zeigt den aktuellen DOM-Stand. Die Herkunft jeder Quelle ist beschriftet.
- **CSS-Spezifität:** Selektoren in die Gruppen A (IDs), B (Klassen, Attribute, Pseudoklassen) und C (Elementnamen, Pseudoelemente) zerlegen und miteinander vergleichen. Beispiele und Erklärungen ordnen die Spezifität in die CSS-Kaskade ein.
- **Unterricht:** Rückgaben zuerst vorhersagen und begründen, anschließend Ergebnis und Erklärung aufdecken. Mit eingebauten Beispielen, Kindknoten des gewählten Elements oder eigenen Auswahlabfragen auf der Quellseite.

## Unterricht und Quizrunde

Wählen Sie im Reiter **Unterricht** die Antwortform, ein Level, ein Thema, den Umfang und die Reihenfolge der Fragen. Anschließend starten Sie die **Quizrunde**. Der Katalog enthält 54 Aufgaben zu Selektoren, Rückgabetypen, Kindknoten, CSS-Spezifität und Kaskade sowie DOM-Veränderungen und Ereignissen. Enthält die gewählte Kombination weniger Fragen als der gewünschte Umfang, werden alle verfügbaren Fragen dieser Kombination verwendet.

- **Erstie:** Code nachvollziehen und grundlegende Beziehungen anwenden.
- **Bachelor:** mehrere Regeln kombinieren und Ergebnisse begründen.
- **Master:** Wechselwirkungen und Sonderfälle analysieren.

Diese Namen bezeichnen Lernstufen im Tool, keine Gleichsetzung mit akademischen Abschlüssen. **Alle Level** ermöglicht eine gemischte Runde; die Stufe steht jeweils bei der Frage.

Bei **offenen Vorhersagen** antworten Sie mündlich oder im freiwilligen Textfeld. **Ergebnis aufdecken** zeigt die Musterantwort und ihre Erklärung. Bei **Multiple Choice** stehen genau vier Antworten zur Auswahl, davon ist genau eine richtig. **Antwort prüfen** erklärt die gewählte Antwort. Unter **Alle vier Antworten vergleichen** werden anschließend alle Optionen begründet. Die Antwortpositionen werden bei jeder Runde gemischt, auch wenn die Fragen nach Themen geordnet sind.

**Nächste Aufgabe** führt weiter. Am Ende einer Multiple-Choice-Runde sehen Sie die Anzahl richtiger erster Antworten und die Themen zum Vertiefen. Wiederholen Sie eine Frage innerhalb derselben Runde, bleibt ihre erste abgegebene Auswahl für diese Auswertung maßgeblich. Es wird keine Note vergeben. Offene Antworten werden nicht automatisch bewertet.

Außerhalb der Quizrunde lassen sich Beispiele einzeln wählen. Für eigene Aufgaben wählen Sie im DOM-Baum ein Element und dann **Kindknoten des gewählten Elements**, oder verwenden Sie **Auswahl auf der aktuellen Webseite** mit einer Auswahlmethode und einem Suchwert. **Aufgabe vorbereiten** hält das Ergebnis als Momentaufnahme fest, zeigt es aber erst nach dem Aufdecken. Eine neue Aufgabe oder ein Ansichtswechsel löscht die freiwillige Notiz. Eingaben werden nicht gespeichert oder übertragen.

Unter **Musterseiten für den Unterricht** stehen drei neu gestaltete, eigenständige HTML-Dateien zum Herunterladen bereit. Sie enthalten einen klar abgegrenzten Untersuchungsbereich, Erkundungsimpulse und aufklappbare Codeansichten:

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

## Aktualisieren und entfernen

Bei einer vorhandenen Setup-Installation führen Sie das neue Setup aus und klicken anschließend in Chrome auf **Neu laden**. Bei einer früher manuell entpackten Version laden Sie den neuen Setup-Ordner einmal über **Entpackte Erweiterung laden**. Entfernen Sie nach der Kontrolle den alten Eintrag. Exportieren Sie benötigte Klausurdaten vor einem Ordner- oder Profilwechsel.

Zur Deinstallation sichern Sie bei Bedarf Ihre Daten, entfernen den Eintrag in Chrome und wählen im Setup **Entfernen**.

## Verarbeitung und Grenzen

Die Auswertung und Formatierung erfolgen lokal. Seiteninhalte werden nicht an einen Analysedienst hochgeladen. Ein Klick auf **Datei laden** für eine verknüpfte Netzwerkquelle erzeugt eine normale Anfrage an deren Dateiserver. Browser-Zugriffsregeln bleiben dabei wirksam. Die Berechtigungen der Erweiterung sind `activeTab` und `scripting`; pauschale Hostberechtigungen werden nicht angefordert.

Die Darstellung ist eine Momentaufnahme. Große Quellen und DOM-Strukturen werden begrenzt und Kürzungen beschriftet. Frames, Shadow DOM sowie nachgeladene Modul- und CSS-Abhängigkeiten werden nicht vollständig erfasst. Rekonstruierte Browser-Regeln können von der ursprünglichen CSS-Datei abweichen. Der Spezifitätsvergleich berechnet keine vollständige Kaskade und beweist allein nicht, welche CSS-Deklaration auf einem Element gewinnt.

## Tests

Die Tests verwenden die eingebauten Testwerkzeuge von **Node.js ab Version 20**. Es sind keine zusätzlichen Pakete nötig:

```sh
npm test
```

Version 1.5.0 bestand unter Windows alle 147 automatisierten Node-Tests. Die Tests prüfen unter anderem den DOM-Baum, Auswahlmethoden, Quellcode, CSS-Spezifität, Quiz, Klausurauswahl, Einreichung, Teilpunkte, Datenwiederherstellung und getrennte Exporte. Die Browser-Schnittstellen werden im Test nachgebildet.

Das Setup wurde in einem eigenen Testordner installiert, erneut ausgeführt und deinstalliert. Alle 62 installierten Programmdateien stimmten nach beiden Installationen byteweise mit dem Quellstand überein. Ein zusätzlicher Test prüft, dass das Setup fremde Dateien bei einer Aktualisierung oder Deinstallation schützt.

Unter Windows lässt sich das Paket mit `windows/build.ps1` erzeugen und mit `windows/test-setup.ps1 -SetupPath dist/TreeHugger-1.5.0-Setup.exe` prüfen.

## Projektangaben und Fremdkomponenten

**Idee, Konzeption und fachliche Projektleitung: Gino Peduto**

Technische Umsetzung mit KI-Unterstützung durch OpenAI Codex.

Die [Projektangaben](26_11_03_Projektangaben.md) beschreiben die Beiträge. Die lokale Formatierungsbibliothek **js-beautify** wird einschließlich ihrer [MIT-Lizenz](Erweiterung/vendor/js-beautify/LICENSE) und ihres [Herkunftsnachweises](Erweiterung/vendor/js-beautify/provenance.json) mitgeliefert. Diese Bibliothekslizenz ist keine pauschale Lizenzangabe für das gesamte Projekt.
