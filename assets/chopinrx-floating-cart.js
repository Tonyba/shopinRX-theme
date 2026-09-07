/**
 * Floating cart button.
 *
 * Opens the cart drawer, keeps its count in step with the cart, hides itself
 * when the cart is empty and steps aside while the drawer is open.
 */
(function () {
  const button = document.querySelector('[data-chx-fab]');
  if (!button) return;

  const counts = button.querySelectorAll('[data-chx-fab-count]');
  let drawerOpen = false;
  let itemCount = Number(counts[0]?.textContent) || 0;

  const render = () => {
    for (const count of counts) count.textContent = String(itemCount);
    button.hidden = itemCount === 0 || drawerOpen;
  };

  const setCount = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    itemCount = value;
    render();
  };

  const refreshFromCart = () =>
    fetch(`${window.Theme?.routes?.cart_url || '/cart'}.js`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((cart) => cart && setCount(cart.item_count))
      .catch(() => {});

  button.addEventListener('click', () => {
    const drawer = document.getElementById('cart-drawer');
    if (drawer && typeof drawer.open === 'function') {
      drawer.open();
    } else {
      window.location.href = window.Theme?.routes?.cart_url || '/cart';
    }
  });

  // Horizon announces every cart change; the event's promise settles once the
  // request is done and carries the new total when the response includes it.
  document.addEventListener('shopify:cart:lines-update', (event) => {
    const promise = event.promise;
    if (!promise) {
      refreshFromCart();
      return;
    }
    promise
      .then((result) => {
        const total = result?.cart?.totalQuantity;
        if (typeof total === 'number') setCount(total);
        else refreshFromCart();
      })
      .catch(() => refreshFromCart());
  });

  const onDrawerState = (event, open) => {
    if (event.target?.id !== 'cart-drawer') return;
    drawerOpen = open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    render();
  };
  document.addEventListener('theme-drawer:open', (event) => onDrawerState(event, true));
  document.addEventListener('theme-drawer:close', (event) => onDrawerState(event, false));

  // A page restored from the back/forward cache can carry a stale count.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshFromCart();
  });
})();
