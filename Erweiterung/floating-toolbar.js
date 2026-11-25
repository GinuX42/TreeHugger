const MARGIN = 8;

export function clampToolbarPosition(position, size, viewport) {
  return {
    x: Math.max(MARGIN, Math.min(position.x, Math.max(MARGIN, viewport.width - size.width - MARGIN))),
    y: 0
  };
}

// The toolbar keeps its own row above the viewport. Horizontal dragging never covers the tree.
export function createFloatingToolbar({toolbar, handle, toggle, viewport = globalThis}) {
  let active = false;
  let position = null;
  let drag = null;
  let collapsed = true;

  function setCollapsed(next) {
    collapsed = next;
    toolbar.classList.toggle('toolbar-collapsed', collapsed);
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    if (toggle) {
      toggle.title = collapsed ? 'Bedienung öffnen · Esc: zurück zur normalen Ansicht' : 'Bedienung einklappen';
      toggle.setAttribute('aria-label', collapsed ? 'Bedienung öffnen' : 'Bedienung einklappen');
      toggle.textContent = collapsed ? '⋯' : '×';
    }
  }

  toggle?.addEventListener('click', () => {
    const bounds = toolbar.getBoundingClientRect();
    setCollapsed(!collapsed);
    const width = toolbar.getBoundingClientRect().width;
    place({x: bounds.left + bounds.width - width, y: bounds.top});
  });

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
    const moves = {ArrowLeft: [-1, 0], ArrowRight: [1, 0]};
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
      if (active) {
        if (toggle) setCollapsed(true);
        place();
      }
      else {
        toolbar.style.left = '';
        toolbar.style.top = '';
      }
    }
  };
}
