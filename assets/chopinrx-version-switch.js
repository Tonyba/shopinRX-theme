/**
 * Protocol cards: a "Choose a version" pill shows the matching actives, form,
 * price and intake link, and hides the others. Markup:
 *   [data-chx-versions]
 *     button[data-chx-version-pill="i"][aria-pressed]
 *     [data-chx-version="i"]   (one or more per version, hidden unless active)
 */
export function initVersionSwitch() {
  if (document.documentElement.dataset.chxVersionsReady === 'true') return;
  document.documentElement.dataset.chxVersionsReady = 'true';

  document.addEventListener('click', (event) => {
    const pill = event.target instanceof Element ? event.target.closest('[data-chx-version-pill]') : null;
    const card = pill?.closest('[data-chx-versions]');
    if (!card) return;

    const index = pill.dataset.chxVersionPill;
    for (const other of card.querySelectorAll('[data-chx-version-pill]')) {
      other.setAttribute('aria-pressed', String(other === pill));
    }
    for (const part of card.querySelectorAll('[data-chx-version]')) {
      part.hidden = part.dataset.chxVersion !== index;
    }
  });
}
