/**
 * Intake modal.
 *
 * Catches clicks on any link to a MyDose book-consultation URL, or to the
 * patient portal sign-in (intake.chopinwellness.com/signin), and opens it in
 * the intake dialog, on the branded intake.chopinwellness.com host. That host
 * only allows framing from chopinwellness.com (CSP frame-ancestors), so on any
 * other domain (myshopify preview, theme editor) the link opens as a page.
 */
(function () {
  const dialog = document.querySelector('[data-chx-intake]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const frame = dialog.querySelector('[data-chx-intake-frame]');
  const title = dialog.querySelector('[data-chx-intake-title]');
  const closeButton = dialog.querySelector('.chx-intake__close');
  const INTAKE_HOST = 'intake.chopinwellness.com';
  const SOURCE_HOSTS = ['app.mydose.ai', INTAKE_HOST];
  const host = window.location.hostname;
  const canFrame = /(^|\.)chopinwellness\.com$/.test(host) || host === '127.0.0.1' || host === 'localhost';

  // Each kind of link sets the dialog's heading, close label and frame title.
  const KINDS = {
    intake: { title: 'Start your intake', close: 'Close intake', frame: 'Patient intake form' },
    signin: { title: 'Patient login', close: 'Close login', frame: 'Patient portal sign in' },
  };

  let opener = null;

  const linkKind = (url) => {
    if (url.pathname.startsWith('/patient/book-consultation/')) return 'intake';
    if (url.hostname === INTAKE_HOST && url.pathname.replace(/\/$/, '') === '/signin') return 'signin';
    return null;
  };

  const intakeUrl = (link) => {
    let url;
    try {
      url = new URL(link.href);
    } catch (e) {
      return null;
    }
    if (!SOURCE_HOSTS.includes(url.hostname)) return null;
    const kind = linkKind(url);
    if (!kind) return null;
    url.hostname = INTAKE_HOST;
    return { src: url.href, kind };
  };

  const open = (link) => {
    const src = link.dataset.chxIntakeSrc;
    const kindKey = KINDS[link.dataset.chxIntakeKind] ? link.dataset.chxIntakeKind : 'intake';
    const kind = KINDS[kindKey];
    opener = link;
    // The patient portal takes the whole viewport on every device.
    dialog.classList.toggle('chx-intake--full', kindKey === 'signin');
    title.textContent = kind.title;
    closeButton.setAttribute('aria-label', kind.close);
    frame.setAttribute('title', kind.frame);
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    dialog.showModal();
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  // Where the modal can run, intake links stop being links: the URL moves to a
  // data attribute and the href goes away, so middle-click, ctrl/cmd-click and
  // the context menu's "open in new tab" have nothing to open. Elsewhere the
  // href is rewritten to the intake host so a new tab at least lands there.
  const SELECTOR = 'a[href*="/patient/book-consultation/"], a[href*="intake.chopinwellness.com/signin"]';

  const prepare = (link) => {
    const target = intakeUrl(link);
    if (!target) return;
    if (!canFrame) {
      // Guarded: the observer below reacts to href writes, including this one.
      if (link.href !== target.src) link.href = target.src;
      return;
    }
    link.dataset.chxIntakeSrc = target.src;
    link.dataset.chxIntakeKind = target.kind;
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.setAttribute('role', 'button');
    link.setAttribute('tabindex', '0');
  };

  const prepareIn = (root) => {
    if (root.matches?.(SELECTOR)) prepare(root);
    root.querySelectorAll?.(SELECTOR).forEach(prepare);
  };

  prepareIn(document);

  // Sections re-rendered by variant changes, quizzes or the theme editor, and
  // links whose href is swapped in place (treatment menu option pills).
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (mutation.target.matches(SELECTOR)) prepare(mutation.target);
        continue;
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) prepareIn(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });

  if (!canFrame) return;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const link = event.target.closest('[data-chx-intake-src]');
    if (!link) return;
    event.preventDefault();
    open(link);
  });

  // role="button" contract: Enter and Space activate.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const link = event.target.closest?.('[data-chx-intake-src]');
    if (!link) return;
    event.preventDefault();
    open(link);
  });

  dialog.querySelectorAll('[data-chx-intake-close]').forEach((button) => button.addEventListener('click', close));

  // Click on the backdrop (outside the panel) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('close', () => {
    // Clearing the frame resets the form, so reopening starts clean and no
    // audio or timers keep running behind the closed dialog.
    frame.removeAttribute('src');
    if (opener) opener.focus();
    opener = null;
  });
})();
