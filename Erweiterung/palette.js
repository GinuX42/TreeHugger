function freezeSwatches(swatches) {
  return Object.freeze(Object.fromEntries(Object.entries(swatches)
    .map(([key, value]) => [key, Object.freeze(value)])));
}

export const NODE_COLORS = freezeSwatches({
  9: {color: "#6625B5", fill: "#E8D8FC"},
  1: {color: "#005BBB", fill: "#D6E8FF"},
  3: {color: "#087F23", fill: "#D3F0D9"},
  8: {color: "#B04700", fill: "#FFE0BE"},
  10: {color: "#414B5A", fill: "#DCE2EB"},
  11: {color: "#B00078", fill: "#FAD6EF"},
  4: {color: "#007B72", fill: "#CEF0EB"},
  7: {color: "#7A4A00", fill: "#F2E0BD"}
});

export const COLLECTION_COLORS = Object.freeze({
  NodeList: "#AD005D",
  HTMLCollection: "#006D77",
  NamedNodeMap: "#5B3B9F",
  null: "#30343B"
});

export const ELEMENT_GROUP_COLORS = freezeSwatches({
  structure: {color: "#1D3B83", fill: "#D9E3FF"},
  text: {color: "#B00036", fill: "#FFD9E3"},
  list: {color: "#A64B00", fill: "#FFE1BC"},
  form: {color: "#006D62", fill: "#CDEDE6"},
  table: {color: "#7030A0", fill: "#EBD8FA"},
  media: {color: "#A40088", fill: "#F9D5F1"},
  meta: {color: "#5A2F1B", fill: "#F3D8C8"},
  other: {color: "#4C4C4C", fill: "#E3E3E3"},
  svg: {color: "#006B9E", fill: "#CFEDFF"},
  math: {color: "#716000", fill: "#F3EBAE"}
});
