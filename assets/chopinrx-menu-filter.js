/**
 * Full treatment menu: category chips show one group or all of them, and the
 * search box narrows rows by name, subtitle and actives. Groups with no
 * matching rows are hidden. Markup:
 *   [data-chx-menu]
 *     input[data-chx-menu-search]
 *     button[data-chx-menu-chip="all" | "<group id>"][aria-pressed]
 *     [data-chx-menu-group="<group id>"]
 *       [data-chx-menu-row][data-chx-menu-text]
 *     [data-chx-menu-empty]
 */
export function initMenuFilter() {
  for (const root of document.querySelectorAll('[data-chx-menu]')) {
    if (root.dataset.chxMenuReady === 'true') continue;
    root.dataset.chxMenuReady = 'true';

    const search = root.querySelector('[data-chx-menu-search]');
    const chips = [...root.querySelectorAll('[data-chx-menu-chip]')];
    const groups = [...root.querySelectorAll('[data-chx-menu-group]')];
    const empty = root.querySelector('[data-chx-menu-empty]');
    let active = 'all';

    const apply = () => {
      const terms = (search?.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;

      for (const group of groups) {
        const inCategory = active === 'all' || group.dataset.chxMenuGroup === active;
        let visibleRows = 0;
        for (const row of group.querySelectorAll('[data-chx-menu-row]')) {
          const text = row.dataset.chxMenuText;
          const match = inCategory && terms.every((term) => text.includes(term));
          row.hidden = !match;
          if (match) visibleRows += 1;
        }
        group.hidden = visibleRows === 0;
        shown += visibleRows;
      }

      if (empty) empty.hidden = shown > 0;
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => {
        active = chip.dataset.chxMenuChip;
        for (const other of chips) other.setAttribute('aria-pressed', String(other === chip));
        apply();
      });
    }

    search?.addEventListener('input', apply);
    search?.closest('form')?.addEventListener('submit', (event) => event.preventDefault());
  }
}
