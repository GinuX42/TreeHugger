const MAX_FILE_BYTES = 500000;
const READ_TIMEOUT_MS = 8000;

export function isLocalSource(resource) {
  if (!resource || !["javascript", "css"].includes(resource.language)) return false;
  try {
    return new URL(resource.url).protocol === "file:";
  } catch {
    return false;
  }
}

function linkedFileName(resource) {
  try {
    return decodeURIComponent(new URL(resource.url).pathname.split("/").at(-1));
  } catch {
    return "";
  }
}

function decodeFile(bytes, truncated) {
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le"
    : bytes[0] === 0xfe && bytes[1] === 0xff ? "utf-16be" : "utf-8";
  try {
    return {content: new TextDecoder(encoding, {fatal: true}).decode(bytes, {stream: truncated}), encoding, invalid: false};
  } catch {
    return {content: new TextDecoder(encoding).decode(bytes, {stream: truncated}), encoding, invalid: true};
  }
}

export async function readLocalSource(file, resource, timeoutMs = READ_TIMEOUT_MS) {
  if (!isLocalSource(resource)) throw new Error("Wählen Sie zuerst eine lokal verknüpfte CSS- oder JavaScript-Datei.");
  if (!file || typeof file.slice !== "function" || typeof file.name !== "string" ||
      !Number.isSafeInteger(file.size) || file.size < 0) {
    throw new Error("Die ausgewählte Datei kann nicht als Text gelesen werden.");
  }
  let timer;
  let buffer;
  try {
    buffer = await Promise.race([
      file.slice(0, MAX_FILE_BYTES).arrayBuffer(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Das Lesen dauert zu lange. Wählen Sie die lokale Datei erneut aus.")), timeoutMs);
      })
    ]);
  } catch (error) {
    if (error?.message === "Das Lesen dauert zu lange. Wählen Sie die lokale Datei erneut aus.") throw error;
    throw new Error("Die lokale Datei konnte nicht gelesen werden. Wählen Sie sie erneut aus, insbesondere nach Änderungen an der Datei.");
  } finally {
    clearTimeout(timer);
  }
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength > MAX_FILE_BYTES) {
    throw new Error("Die ausgewählte Datei konnte nicht innerhalb der Lesegrenze übernommen werden.");
  }
  const truncated = file.size > MAX_FILE_BYTES;
  const decoded = decodeFile(new Uint8Array(buffer), truncated);
  const name = file.name.slice(0, 240);
  const expected = linkedFileName(resource);
  const notes = [
    `Manuell ausgewählte lokale Datei: „${name}“. Die Dateiauswahl gibt den vollständigen Pfad nicht frei; die Übereinstimmung mit der Verknüpfung im HTML ist nicht geprüft.`,
    expected && expected !== file.name ? `Der gewählte Dateiname weicht vom verknüpften Dateinamen „${expected}“ ab.` : "",
    `Gelesen als ${decoded.encoding.toUpperCase()}. Der Inhalt wird nur angezeigt, nicht ausgeführt.`,
    decoded.invalid ? "Die Datei enthält nicht passende Zeichenfolgen für diese Zeichencodierung; einige Zeichen werden ersetzt angezeigt. Speichern Sie den Quelltext bei Bedarf als UTF-8 und öffnen Sie ihn erneut." : "",
    truncated ? "Die Datei wurde auf 500 kB begrenzt." : ""
  ];
  return {...resource, origin: "local", label: name || "Ausgewählte lokale Datei", content: decoded.content,
    status: "ready", truncated, note: notes.filter(Boolean).join(" ")};
}
