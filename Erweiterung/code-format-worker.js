// Die unveränderten Browser-Bundles erwarten window oder global als ihren eigenen Exportbereich.
globalThis.global = globalThis;
importScripts(
  "./vendor/js-beautify/beautify.js",
  "./vendor/js-beautify/beautify-css.js",
  "./vendor/js-beautify/beautify-html.js"
);

const MAX_SOURCE_LENGTH = 500000;
const MAX_RESULT_LENGTH = 2000000;
const formatters = new Map([
  ["javascript", globalThis.js_beautify],
  ["css", globalThis.css_beautify],
  ["html", globalThis.html_beautify]
]);
const options = {
  indent_size: 2,
  indent_char: " ",
  preserve_newlines: true,
  max_preserve_newlines: 2,
  wrap_line_length: 110,
  end_with_newline: false,
  unescape_strings: false
};

globalThis.onmessage = event => {
  const {source, language} = event.data ?? {};
  const formatter = formatters.get(language);
  if (typeof source !== "string" || source.length > MAX_SOURCE_LENGTH || typeof formatter !== "function") {
    globalThis.postMessage({ok: false});
    return;
  }
  try {
    const code = formatter(source, options);
    globalThis.postMessage(typeof code === "string" && code.length <= MAX_RESULT_LENGTH
      ? {ok: true, code} : {ok: false});
  } catch {
    globalThis.postMessage({ok: false});
  }
};
