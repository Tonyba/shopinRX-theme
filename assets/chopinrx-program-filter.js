/**
 * Client-side filtering for the program collection grid.
 *
 * Shopify's storefront filtering has no collection facet, so combining
 * collections cannot be expressed in a URL. The grid therefore renders every
 * product once, each card carrying the handles of the collections it belongs
 * to, and the toolbar toggles visibility here.
 *
 * Chips are multi-select and combine as a union; the segmented control is a
 * single mutually exclusive choice. A card shows when it matches at least one
 * selected chip (or none is selected) and also matches the segment.
 */

const COMPACT = '(max-width: 767px)';

export function initProgramFilter(root = document) {
  root.querySelectorAll('[data-chx-progcol]').forEach(setup);
}

function setup(section) {
  if (section.dataset.chxReady === 'true') return;
  section.dataset.chxReady = 'true';

  const cards = Array.from(section.querySelectorAll('[data-chx-card]'));
  if (cards.length === 0) return;

  const chips = Array.from(section.querySelectorAll('[data-chx-chip]'));
  const segments = Array.from(section.querySelectorAll('[data-chx-segment]'));
  const moreButton = section.querySelector('[data-chx-more]');
  const empty = section.querySelector('[data-chx-empty]');
  const status = section.querySelector('[data-chx-status]');

  const step = Number.parseInt(section.dataset.chxStep, 10) || cards.length;
  const countLabel = section.dataset.chxCountLabel || '';
  const compact = window.matchMedia(COMPACT);

  const handlesOf = new Map(
    cards.map((card) => [card, (card.dataset.chxCollections || '').split(' ').filter(Boolean)])
  );

  /** Selected chip handles. Empty means "All". */
  const selected = new Set();
  /** Selected segment handle. Empty means "All". */
  let segment = '';
  /** How many matching cards are revealed. The mobile design carries no
      Load More, so the whole list is shown there instead. */
  let revealed = step;

  function matches(card) {
    const handles = handlesOf.get(card);
    const byChip = selected.size === 0 || handles.some((handle) => selected.has(handle));
    const bySegment = segment === '' || handles.includes(segment);
    return byChip && bySegment;
  }

  function render() {
    const limit = compact.matches ? Infinity : revealed;
    let matched = 0;

    cards.forEach((card) => {
      const hit = matches(card);
      card.hidden = !(hit && matched < limit);
      if (hit) matched += 1;
    });

    if (moreButton) moreButton.hidden = compact.matches || matched <= revealed;
    if (empty) empty.hidden = matched !== 0;
    if (status && countLabel) status.textContent = countLabel.replace('[count]', String(matched));
  }

  function syncChips() {
    chips.forEach((chip) => {
      const handle = chip.dataset.chxChip;
      const on = handle === '' ? selected.size === 0 : selected.has(handle);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const handle = chip.dataset.chxChip;
      if (handle === '') {
        selected.clear();
      } else if (selected.has(handle)) {
        selected.delete(handle);
      } else {
        selected.add(handle);
      }
      revealed = step;
      syncChips();
      render();
    });
  });

  function selectSegment(target, moveFocus) {
    segment = target.dataset.chxSegment;
    segments.forEach((button) => {
      const on = button === target;
      button.setAttribute('aria-checked', on ? 'true' : 'false');
      button.tabIndex = on ? 0 : -1;
    });
    if (moveFocus) target.focus();
    revealed = step;
    render();
  }

  segments.forEach((button, index) => {
    button.addEventListener('click', () => selectSegment(button, false));

    button.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        next = segments[(index + 1) % segments.length];
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = segments[(index - 1 + segments.length) % segments.length];
      }
      if (next === null) return;
      event.preventDefault();
      selectSegment(next, true);
    });
  });

  if (moreButton) {
    moreButton.addEventListener('click', () => {
      revealed += step;
      render();
      // Move focus to the first newly revealed card so keyboard users are not
      // dropped back at the top of the grid.
      const shown = cards.filter((card) => card.hidden === false);
      const first = shown[revealed - step];
      if (first) {
        const link = first.querySelector('a');
        if (link) link.focus();
      }
    });
  }

  compact.addEventListener('change', () => {
    revealed = step;
    render();
  });

  syncChips();
  render();
}
