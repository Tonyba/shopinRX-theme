/**
 * Single-select chip tabs.
 *
 * Wires every `[data-chx-tabs]` group: chips are tabs, panels are tabpanels.
 * Showing a panel dispatches `chx:tabshown` on it so anything inside that has
 * to measure itself — a carousel, for instance — can re-initialise.
 */
export function initTabs() {
  for (const root of document.querySelectorAll('[data-chx-tabs]')) {
    if (root.dataset.chxTabsReady === 'true') continue;
    root.dataset.chxTabsReady = 'true';

    const tabs = [...root.querySelectorAll('[data-chx-tab]')];
    const panels = [...root.querySelectorAll('[data-chx-panel]')];
    if (tabs.length < 2) continue;

    const select = (index, { focus = false } = {}) => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle('chx-chip--active', selected);
      });

      panels.forEach((panel, i) => {
        const selected = i === index;
        panel.hidden = !selected;
        if (selected) panel.dispatchEvent(new CustomEvent('chx:tabshown', { bubbles: true }));
      });

      if (focus) tabs[index]?.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        select(i);
      });

      tab.addEventListener('keydown', (event) => {
        const last = tabs.length - 1;
        let next = null;

        if (event.key === 'ArrowRight') next = i === last ? 0 : i + 1;
        else if (event.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = last;

        if (next === null) return;
        event.preventDefault();
        select(next, { focus: true });
      });
    });

    const initial = Math.max(
      0,
      tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')
    );
    select(initial);
  }
}
