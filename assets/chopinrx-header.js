/**
 * ChopinRX header.
 *
 * Two responsibilities, both deliberately small:
 *   1. Toggle the offcanvas navigation drawer (tablet and below).
 *   2. Keep `--header-height` / `--header-group-height` in sync so the rest of
 *      the theme can position content against the header.
 */
(function () {
  const header = document.getElementById('header-component');
  if (!header) return;

  /* ----------------------------------------------------------------
   * Offcanvas drawer
   * ---------------------------------------------------------------- */
  const drawer = header.querySelector('[data-chx-drawer]');
  const toggle = header.querySelector('[data-chx-drawer-toggle]');
  const desktop = window.matchMedia('(min-width: 1025px)');

  if (drawer && toggle) {
    const initialFocus = drawer.querySelector('[data-chx-drawer-initial-focus]');

    const setOpen = (open, { restoreFocus = true } = {}) => {
      drawer.dataset.open = open ? 'true' : 'false';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.toggleAttribute('inert', !open);
      document.documentElement.toggleAttribute('scroll-lock', open);

      if (open) {
        (initialFocus || drawer).focus();
      } else if (restoreFocus) {
        toggle.focus();
      }
    };

    toggle.addEventListener('click', () => {
      setOpen(drawer.dataset.open !== 'true');
    });

    for (const element of drawer.querySelectorAll('[data-chx-drawer-close]')) {
      element.addEventListener('click', () => setOpen(false));
    }

    // Close on link activation so in-page anchors don't leave the drawer open.
    for (const link of drawer.querySelectorAll('a[href]')) {
      link.addEventListener('click', () => setOpen(false, { restoreFocus: false }));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.dataset.open === 'true') setOpen(false);
    });

    // The drawer is desktop-hidden; make sure it never stays open across a resize.
    desktop.addEventListener('change', (event) => {
      if (event.matches && drawer.dataset.open === 'true') setOpen(false, { restoreFocus: false });
    });
  }

  /* ----------------------------------------------------------------
   * Header height custom properties
   * ---------------------------------------------------------------- */
  const headerGroup = document.getElementById('header-group');

  const updateHeights = () => {
    document.body.style.setProperty('--header-height', `${Math.round(header.offsetHeight)}px`);

    if (!headerGroup) return;

    let groupHeight = 0;
    for (const element of headerGroup.children) {
      if (element instanceof HTMLElement) groupHeight += element.offsetHeight;
    }
    document.body.style.setProperty('--header-group-height', `${Math.round(groupHeight)}px`);
  };

  updateHeights();

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(updateHeights);
    observer.observe(header);
    if (headerGroup) {
      for (const element of headerGroup.children) {
        if (element instanceof HTMLElement) observer.observe(element);
      }
    }
  } else {
    window.addEventListener('resize', updateHeights);
  }
})();
