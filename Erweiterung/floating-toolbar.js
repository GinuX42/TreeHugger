const MARGIN = 8;

export function clampToolbarPosition(position, size, viewport) {
  return {
    x: Math.max(MARGIN, Math.min(position.x, Math.max(MARGIN, viewport.width - size.width - MARGIN))),
    y: Math.max(MARGIN, Math.min(position.y, Math.max(MARGIN, viewport.height - size.height - MARGIN)))
  };
}

// The toolbar is a sibling of the drawing. Only the tree is scaled.
export function createFloatingToolbar({toolbar, handle, viewport = globalThis}) {
  let active = false;
  let position = null;
  let drag = null;

  function place(next = position) {
    if (!active) return;
    const bounds = toolbar.getBoundingClientRect();
    const screen = {width: viewport.innerWidth, height: viewport.innerHeight};
    position = clampToolbarPosition(next ?? {x: screen.width - bounds.width - MARGIN, y: MARGIN}, bounds, screen);
    toolbar.style.left = position.x + 'px';
    toolbar.style.top = position.y + 'px';
  }

  function stopDrag(event) {
    if (event && drag && event.pointerId !== drag.id) return;
    drag = null;
    handle.classList.remove('dragging');
  }

  handle.addEventListener('pointerdown', event => {
    if (!active || event.button !== 0 || drag) return;
    event.preventDefault();
    handle.focus({preventScroll: true});
    const bounds = toolbar.getBoundingClientRect();
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top};
    handle.setPointerCapture(event.pointerId);
    handle.classList.add('dragging');
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    place({x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y});
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(name, stopDrag);
  handle.addEventListener('keydown', event => {
    if (!active) return;
    const moves = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
    if (event.key === 'Home') {
      event.preventDefault();
      place(null);
    } else if (moves[event.key]) {
      event.preventDefault();
      const [x, y] = moves[event.key];
      const step = event.shiftKey ? 32 : 8;
      place({x: position.x + x * step, y: position.y + y * step});
    }
  });
  viewport.addEventListener?.('resize', () => place());
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => place()) : null;
  observer?.observe(toolbar);

  return {
    setActive(next) {
      active = next;
      stopDrag();
      if (active) place();
      else {
        toolbar.style.left = '';
        toolbar.style.top = '';
      }
    }
  };
}
