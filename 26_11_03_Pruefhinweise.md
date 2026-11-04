# TreeHugger 1.4.2 – Prüfhinweise

Stand: 03.11.2026.

## Enthalten

Die Anleitung beginnt mit den sechs bebilderten Installationsschritten. Der Unterrichts- und Quizabschnitt folgt nach der Einführung in die Funktionen. Die Anleitungsdatei heißt jetzt ausdrücklich Installationsanleitung.

Das Installationspaket enthält den Unterrichtsmodus, 54 Quizfragen mit offenen Antworten oder Multiple Choice, je vier Optionen mit genau einer richtigen Antwort, Erklärungen zu allen Optionen und drei überarbeitete Musterseiten. Die Quizrunde lässt sich nach Level, Thema, Umfang und Reihenfolge einstellen. Die Level Erstie, Bachelor und Master stehen für Code nachvollziehen, mehrere Regeln kombinieren sowie Wechselwirkungen und Sonderfälle analysieren. Es sind Lernstufen innerhalb des Tools, keine Gleichsetzung mit akademischen Abschlüssen. Die Antwortpositionen werden bei jeder Runde gemischt, auch bei nach Themen geordneten Fragen. Die erste abgegebene Auswahl je Frage zählt; es wird keine Note vergeben.

Die bebilderte Anleitung liegt als 26_11_03_Installationsanleitung.html bei und ist über „Hilfe“ auch in der Erweiterung erreichbar. Das Roboterbild mit Espresso bleibt erhalten. Die Musterseiten lassen sich aus dem Unterrichtsreiter herunterladen oder direkt aus dem Erweiterungsordner als lokale Dateien öffnen.

## Tatsächliche Prüfung

Der unveränderte Funktionsstand wurde mit 140 erfolgreichen automatisierten Tests geprüft. Für Version 1.4.2 wurden ausschließlich Anleitung, Dateinamen, Paketverweise und Versionsangaben überarbeitet; die Funktionstests wurden deshalb nicht erneut ausgeführt. Geprüft sind bestehende DOM-, Code- und Spezifitätsfunktionen, Aufgabenstruktur, Level- und Themenfilter, Quizrunden, Antwortzuordnung, Rückmeldungen, erste Antwortwertung, Verbergen und Löschen von Antworten, Modulverweise und die Musterseiten. Browser- und DOM-Schnittstellen werden in den Verhaltenstests nachgebildet.

Zusätzlich geprüft: JavaScript-Syntax, Manifest und Berechtigungen, unveränderte Fremdbibliothek, lokale Dateiverweise, Archivintegrität sowie bytegleiche Anleitung innerhalb und außerhalb des ZIP. Keine zusätzlichen Erweiterungsberechtigungen. Texte der Aufgaben werden angezeigt und nicht als JavaScript ausgeführt. Notizen und Rundenergebnisse werden nicht gespeichert oder übertragen.

Die Fragen wurden einzeln hinsichtlich Voraussetzungen, fachlicher Richtigkeit, eindeutiger richtiger Option und plausibler falscher Optionen geprüft. Die genaue Prüfspur ist in der lokalen Projektablage dokumentiert. Das Quiz ist ein Übungswerkzeug, kein Verfahren für eine abgesicherte Prüfung oder Benotung.

Ein visueller Praxistest in Chrome war wegen der bestehenden Browser-Zugriffssperre nicht möglich. Insbesondere Darstellung bei verschiedenen Fenstergrößen, Download und Öffnen der Musterseiten sowie Installation im persönlichen Chrome-Profil bleiben praktisch zu prüfen.

## Installation und Aktualisierung

ZIP vollständig entpacken. Unter chrome://extensions den Entwicklermodus einschalten und „Entpackte Erweiterung laden“ wählen. Den Ordner Erweiterung mit manifest.json auswählen.

Bei einer bestehenden Installation den vollständigen bisherigen Erweiterungsordner durch diese Fassung ersetzen und die Erweiterung in Chrome neu laden. Alte TreeHugger-Tabs schließen und das Tool auf der Quellseite erneut öffnen. Für lokale HTML-Dateien muss „Zugriff auf Datei-URLs zulassen“ aktiviert sein.
