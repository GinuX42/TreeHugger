import {byId, createElement} from "./ui-dom.js";
import {getNodeKind, NODE_LEGEND_TYPES} from "./node-presentation.js";
import {ELEMENT_GROUPS} from "./semantics.js";

function colorChip(label, color) {
  const chip = createElement("span", label, "legend-chip");
  chip.style.background = color;
  return chip;
}

export function renderNodeLegend(nodes) {
  const presentTypes = new Set(Array.from(nodes.values(), node => node.type));
  const types = NODE_LEGEND_TYPES.filter(type => presentTypes.has(type));
  if (Array.from(presentTypes).some(type => !NODE_LEGEND_TYPES.includes(type))) types.push(-1);
  byId("nodeLegend").replaceChildren(createElement("strong", "Knotentyp:"), ...types.map(type => {
    const kind = getNodeKind({type});
    return colorChip(kind.name, kind.color);
  }));
}

export function renderElementGroupLegend() {
  byId("elementGroupLegend").replaceChildren(...Object.values(ELEMENT_GROUPS)
    .map(group => colorChip(group.name, group.color)));
}
