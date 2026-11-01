export function createSourceExample() {
  const html = '<!doctype html>\n<html lang="de">\n<head>\n  <title>Kursportal</title>\n  <style>.hinweis { color: #175e96; }</style>\n</head>\n<body>\n  <main id="kurse">\n    <h1>Kursportal</h1>\n    <p class="hinweis">Plätze frei</p>\n    <button id="start">Information anzeigen</button>\n  </main>\n  <script>document.querySelector("#start").addEventListener("click", () => { document.querySelector(".hinweis").textContent = "Willkommen im Kurs!"; });</script>\n</body>\n</html>';
  return {
    title: "Kursportal · Codebeispiel",
    url: "Eingebautes Beispiel",
    capturedAt: new Date().toISOString(),
    notes: ["Vorschau mit Beispielcode. Starten Sie die Erweiterung auf einer Webseite, um deren Code zu lesen."],
    resources: [
      {id: "html", language: "html", label: "Aktueller HTML-DOM", origin: "dom", url: "", content: html, status: "ready", truncated: false, note: "Momentaufnahme des DOM; sie kann vom ursprünglich ausgelieferten HTML abweichen."},
      {id: "style:0", language: "css", label: "<style> · im Dokument", origin: "inline", url: "", content: ".hinweis { color: #175e96; }\n#kurse > h1 { margin-bottom: 1rem; }", status: "ready", truncated: false, note: "CSS-Regeln für passende Elemente; > wählt direkte Kinder aus."},
      {id: "script:0", language: "javascript", label: "<script> · im Dokument", origin: "inline", url: "", content: 'document.querySelector("#start").addEventListener("click", () => { document.querySelector(".hinweis").textContent = "Willkommen im Kurs!"; });', status: "ready", truncated: false, note: "Der Code wird nur angezeigt und nicht ausgeführt."}
    ]
  };
}
