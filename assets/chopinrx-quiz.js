/**
 * "Find your program" quiz. Data and copy come from the JSON rendered by
 * sections/chopinrx-quiz.liquid; this module only drives the steps.
 *
 * Highlight rule: timing + familiarity + routine + budget points; 2 or more
 * picks Advanced, -2 or less Essential, otherwise Enhanced. A goal marked
 * strict only shows Advanced for the top timing, familiarity and budget answers.
 */

const QUESTIONS = ['q2', 'q3', 'q4', 'q5', 'q6'];
const SCORED = ['q2', 'q3', 'q5', 'q6'];

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const lines = (value) => String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const points = (value) => String(value || '').split(',').map((n) => parseInt(n, 10) || 0);
const fill = (template, values) => String(template || '').replace(/\[(\w+)\]/g, (match, key) => (key in values ? values[key] : match));
const lowerFirst = (value) => (value ? value.charAt(0).toLowerCase() + value.slice(1) : value);
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four'];

export function createQuiz(root) {
  const dialog = root.querySelector('dialog');
  const body = root.querySelector('[data-chx-quiz-body]');
  const foot = root.querySelector('[data-chx-quiz-foot]');
  const back = root.querySelector('[data-chx-quiz-back]');
  const progress = root.querySelector('[data-chx-quiz-progress]');
  const data = JSON.parse(root.querySelector('[data-chx-quiz-data]').textContent);
  const copy = data.copy;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state;
  let presetGender = '';
  let buildingTimer;

  const reset = () => {
    state = { gender: presetGender, goal: null, stage: null, answers: {}, extras: new Set(), step: '', history: [] };
  };

  const goalsFor = (gender) => data.goals.filter((goal) => goal.gender === gender);
  const pageUrl = (hash) => (data.pages[state.gender] || '/') + hash;

  /* ── Step bookkeeping ───────────────────────── */
  const questionSteps = () => ['goal', ...(state.goal?.stage ? ['stage'] : []), ...QUESTIONS, 'q7'];

  const totalQuestions = () => {
    const hasStage = state.goal ? state.goal.stage : goalsFor(state.gender).some((goal) => goal.stage);
    return QUESTIONS.length + 2 + (hasStage ? 1 : 0);
  };

  const setProgress = (ratio) => {
    const percent = Math.round(Math.max(0.04, Math.min(1, ratio)) * 100);
    progress.style.setProperty('--chx-quiz-progress', `${percent}%`);
    progress.setAttribute('aria-valuenow', String(percent));
  };

  const go = (step, remember = true) => {
    if (remember && state.step) state.history.push(state.step);
    state.step = step;
    clearTimeout(buildingTimer);
    render();
  };

  // Back on the first question closes the quiz, as in the design.
  const goBack = () => {
    const previous = state.history.pop();
    if (!previous) {
      dialog.close();
      return;
    }
    state.step = previous;
    render();
  };

  const nextAfter = (step) => {
    const steps = questionSteps();
    const index = steps.indexOf(step);
    return index >= 0 && index < steps.length - 1 ? steps[index + 1] : 'building';
  };

  /* ── Markup helpers ─────────────────────────── */
  const heading = (text) => `<h2 class="chx-quiz__heading" id="ChxQuizHeading" tabindex="-1">${escapeHtml(text)}</h2>`;
  const eyebrow = (text) => `<p class="chx-quiz__eyebrow">${escapeHtml(text)}</p>`;
  const intro = (text) => (text ? `<p class="chx-quiz__text">${escapeHtml(text)}</p>` : '');

  const optionButton = ({ value, title, sub, letter, pressed = false, toggle = false }) => `
    <li>
      <button type="button" class="chx-quiz__option" data-value="${escapeHtml(value)}"${toggle ? ` aria-pressed="${pressed}"` : ''}>
        ${letter ? `<span class="chx-quiz__letter" aria-hidden="true">${escapeHtml(letter)}</span>` : ''}
        <span class="chx-quiz__option-copy">
          <span class="chx-quiz__option-title">${escapeHtml(title)}</span>
          ${sub ? `<span class="chx-quiz__option-sub">${escapeHtml(sub)}</span>` : ''}
        </span>
        <span class="chx-quiz__chevron" aria-hidden="true">${toggle ? (pressed ? '✓' : '+') : '›'}</span>
      </button>
    </li>`;

  const questionEyebrow = (step) =>
    eyebrow(fill(copy.question_label, { n: questionSteps().indexOf(step) + 1, total: totalQuestions() }));

  const price = (amount) =>
    `<p class="chx-price-from"><span class="chx-price-from__prefix">${escapeHtml(copy.price_prefix)}</span> <span class="chx-price-from__amount">${escapeHtml(amount)}</span><span class="chx-price-from__unit">${escapeHtml(copy.price_unit)}</span></p>`;

  /* ── Steps ──────────────────────────────────── */
  const renderGender = () => {
    setProgress(0);
    const card = (value, letter, title, sub) => `
      <button type="button" class="chx-quiz__option chx-quiz__gender" data-value="${value}">
        <span class="chx-quiz__letter" aria-hidden="true">${letter}</span>
        <span class="chx-quiz__option-copy">
          <span class="chx-quiz__option-title">${escapeHtml(title)}</span>
          <span class="chx-quiz__option-sub">${escapeHtml(sub)}</span>
        </span>
      </button>`;
    body.innerHTML = `
      ${eyebrow(copy.start_eyebrow)}${heading(copy.gender_heading)}${intro(copy.gender_text)}
      <div class="chx-quiz__genders">
        ${card('mens', 'M', copy.mens_label, copy.mens_text)}
        ${card('womens', 'W', copy.womens_label, copy.womens_text)}
      </div>`;
    body.querySelectorAll('[data-value]').forEach((button) =>
      button.addEventListener('click', () => {
        state.gender = button.dataset.value;
        state.goal = null;
        go('goal');
      })
    );
  };

  const renderGoal = () => {
    const options = goalsFor(state.gender)
      .map((goal) => optionButton({ value: goal.id, title: goal.title, sub: goal.subtitle, letter: goal.letter }))
      .join('');
    body.innerHTML = `
      ${questionEyebrow('goal')}${heading(copy.q1_heading)}${intro(copy.q1_text)}
      <ul class="chx-quiz__options" role="list">
        ${options}
        <li>
          <a class="chx-quiz__option chx-quiz__option--dashed" href="${escapeHtml(pageUrl('#shop-by-goal'))}" data-chx-quiz-leave>
            <span class="chx-quiz__letter" aria-hidden="true">?</span>
            <span class="chx-quiz__option-copy">
              <span class="chx-quiz__option-title">${escapeHtml(copy.unsure_title)}</span>
              <span class="chx-quiz__option-sub">${escapeHtml(copy.unsure_text)}</span>
            </span>
          </a>
        </li>
      </ul>`;
    body.querySelectorAll('button[data-value]').forEach((button) =>
      button.addEventListener('click', () => {
        const goal = data.goals.find((item) => item.id === button.dataset.value);
        if (goal !== state.goal) state.extras.clear();
        state.goal = goal;
        go(nextAfter('goal'));
      })
    );
  };

  const renderChoice = (step) => {
    const key = step === 'stage' ? 'stage' : step;
    const answers = lines(copy[`${key}_options`]);
    const chosen = step === 'stage' ? state.stage : state.answers[step];
    body.innerHTML = `
      ${questionEyebrow(step)}${heading(copy[`${key}_heading`])}${intro(copy[`${key}_text`])}
      <ul class="chx-quiz__options" role="list">
        ${answers.map((title, index) => optionButton({ value: index, title, pressed: chosen === index, toggle: false })).join('')}
      </ul>`;
    body.querySelectorAll('[data-value]').forEach((button) =>
      button.addEventListener('click', () => {
        const index = Number(button.dataset.value);
        if (step === 'stage') state.stage = index;
        else state.answers[step] = index;
        go(nextAfter(step));
      })
    );
  };

  const renderExtras = () => {
    const others = goalsFor(state.gender).filter((goal) => goal !== state.goal);
    body.innerHTML = `
      ${questionEyebrow('q7')}${heading(copy.q7_heading)}${intro(copy.q7_text)}
      <ul class="chx-quiz__options" role="list">
        ${others.map((goal) => optionButton({ value: goal.id, title: goal.title, letter: goal.letter, toggle: true, pressed: state.extras.has(goal.id) })).join('')}
      </ul>
      <button type="button" class="chx-btn chx-btn--md chx-btn--accent chx-quiz__continue" data-chx-quiz-continue>${escapeHtml(copy.continue_label)}</button>`;
    body.querySelectorAll('[data-value]').forEach((button) =>
      button.addEventListener('click', () => {
        const id = button.dataset.value;
        if (state.extras.has(id)) state.extras.delete(id);
        else state.extras.add(id);
        const pressed = state.extras.has(id);
        button.setAttribute('aria-pressed', String(pressed));
        button.querySelector('.chx-quiz__chevron').textContent = pressed ? '✓' : '+';
      })
    );
    body.querySelector('[data-chx-quiz-continue]').addEventListener('click', () => go('building'));
  };

  const needleFree = () => state.answers.q4 === 1;
  const formChip = () => lines(copy.q4_chips)[needleFree() ? 1 : 0] || '';

  const renderBuilding = () => {
    setProgress(0.92);
    const goalPhrase = state.goal.phrase;
    const timing = lowerFirst(lines(copy.q2_options)[state.answers.q2] || '');
    const format = needleFree() ? copy.format_needle_free : copy.format_any;
    body.innerHTML = `
      <div class="chx-quiz__building">
        <span class="chx-quiz__spinner" aria-hidden="true"></span>
        ${heading(fill(copy.building_heading, { goal: goalPhrase }))}
        ${intro(fill(copy.building_text, { timing, format }))}
        <ul class="chx-quiz__checks" role="list">
          <li>✓ ${escapeHtml(fill(copy.check_goal, { goal: state.goal.title }))}</li>
          <li>✓ ${escapeHtml(fill(copy.check_format, { format: formChip() }))}</li>
          <li class="is-pending" data-chx-quiz-pending>… ${escapeHtml(copy.check_tier)}</li>
        </ul>
        <button type="button" class="chx-btn chx-btn--sm chx-btn--secondary chx-quiz__show" data-chx-quiz-show>${escapeHtml(copy.show_results)}</button>
      </div>`;
    body.querySelector('[data-chx-quiz-show]').addEventListener('click', () => go('results'));
    buildingTimer = setTimeout(
      () => {
        const pending = body.querySelector('[data-chx-quiz-pending]');
        if (!pending) return;
        pending.classList.remove('is-pending');
        pending.textContent = `✓ ${copy.check_tier}`;
      },
      reduceMotion ? 0 : 900
    );
  };

  const pickTier = (tiers) => {
    const scores = {};
    for (const step of SCORED) scores[step] = points(copy[`${step}_points`])[state.answers[step]] ?? 0;
    const total = SCORED.reduce((sum, step) => sum + scores[step], 0);

    let pick = total >= 2 ? 2 : total <= -2 ? 0 : 1;
    if (pick === 2 && state.goal.strict && !(scores.q2 === 1 && scores.q3 === 1 && scores.q6 === 1)) pick = 1;

    // Fall back to the nearest tier that exists.
    for (let distance = 0; distance < tiers.length; distance += 1) {
      if (tiers[pick - distance]) return pick - distance;
      if (tiers[pick + distance]) return pick + distance;
    }
    return -1;
  };

  const renderResults = () => {
    setProgress(1);
    const goal = state.goal;
    const preferred = needleFree() ? goal.sets.nf : goal.sets.inj;
    const tiers = preferred.some(Boolean) ? preferred : goal.sets.inj;
    const pick = pickTier(tiers);
    const tierNames = lines(copy.tier_names);
    const shown = tiers.filter(Boolean);

    const chips = [
      goal.title,
      goal.stage && state.stage != null ? lines(copy.stage_options)[state.stage] : '',
      lines(copy.q2_options)[state.answers.q2],
      formChip(),
      lines(copy.q6_options)[state.answers.q6],
    ].filter(Boolean);

    const cards = tiers
      .map((tier, index) => {
        if (!tier) return '';
        const picked = index === pick;
        return `
          <article class="chx-quiz-tier${picked ? ' chx-quiz-tier--pick' : ''}">
            ${picked ? `<span class="chx-quiz-tier__pill">${escapeHtml(copy.recommended_label)}</span>` : ''}
            <div class="chx-quiz-tier__top">
              <p class="chx-quiz-tier__tier">${escapeHtml(tierNames[index] || '')}</p>
              <span class="chx-quiz-tier__badge">${escapeHtml(copy.intake_badge)}</span>
            </div>
            <h3 class="chx-quiz-tier__name">${escapeHtml(tier.name)}</h3>
            ${tier.sub ? `<p class="chx-quiz-tier__sub">${escapeHtml(tier.sub)}</p>` : ''}
            ${tier.form ? `<p class="chx-quiz-tier__form">${escapeHtml(copy.form_prefix)} <strong>${escapeHtml(tier.form)}</strong></p>` : ''}
            <div class="chx-quiz-tier__foot">
              ${price(tier.price)}
              <a class="chx-btn chx-btn--sm ${picked ? 'chx-btn--accent' : 'chx-btn--secondary'}" href="${escapeHtml(tier.url)}"
                aria-label="${escapeHtml(`${copy.cta_label}: ${tier.name}`)}">${escapeHtml(copy.cta_label)}</a>
            </div>
          </article>`;
      })
      .join('');

    const next = [...goal.next];
    for (const id of state.extras) {
      const extra = data.goals.find((item) => item.id === id)?.extra;
      if (extra) next.push(extra);
    }
    const unique = next.filter((item, index) => next.findIndex((other) => other.name === item.name) === index);
    const nextBlock = unique.length
      ? `<div class="chx-quiz__next">
          <p class="chx-quiz__next-title">${escapeHtml(copy.next_heading)}</p>
          <ul class="chx-quiz__next-list" role="list">
            ${unique
              .map(
                (item) => `<li><a class="chx-quiz__next-link" href="${escapeHtml(item.url)}">
                  <span><span class="chx-quiz__next-name">${escapeHtml(item.name)}</span>
                  <span class="chx-quiz__next-meta">${escapeHtml([item.form, `${copy.price_prefix.toLowerCase()} ${item.price}${copy.price_unit}`, copy.next_suffix].filter(Boolean).join(' · '))}</span></span>
                  <span class="chx-quiz__chevron" aria-hidden="true">›</span></a></li>`
              )
              .join('')}
          </ul>
        </div>`
      : '';

    const count = NUMBER_WORDS[shown.length] || String(shown.length);
    let title = fill(copy.results_heading, { count, goal: goal.phrase });
    if (shown.length === 1) title = title.replace(/\bways\b/, 'way');
    const footnote = shown.some((tier) => tier.flag) ? ` ${copy.footnote}` : '';

    body.innerHTML = `
      ${eyebrow(copy.results_eyebrow)}${heading(title)}
      <ul class="chx-quiz__chips" role="list">${chips.map((chip) => `<li class="chx-quiz__chip">${escapeHtml(chip)}</li>`).join('')}</ul>
      <div class="chx-quiz__tiers">${cards}</div>
      ${nextBlock}
      <div class="chx-quiz__links">
        <a class="chx-quiz__link" href="${escapeHtml(pageUrl('#shop-by-goal'))}" data-chx-quiz-leave>${escapeHtml(fill(copy.see_all, { goal: goal.phrase }))}</a>
        <a class="chx-quiz__link" href="${escapeHtml(pageUrl('#full-menu'))}" data-chx-quiz-leave>${escapeHtml(copy.browse_menu)}</a>
        <button type="button" class="chx-quiz__link" data-chx-quiz-restart>${escapeHtml(copy.start_over)}</button>
      </div>
      <p class="chx-quiz__fineprint">${escapeHtml(copy.disclaimer + footnote)}</p>`;

    body.querySelector('[data-chx-quiz-restart]').addEventListener('click', () => {
      reset();
      go(state.gender ? 'goal' : 'gender', false);
    });
  };

  /* ── Render ─────────────────────────────────── */
  const render = () => {
    const step = state.step;
    const inFlow = step !== 'building' && step !== 'results';
    foot.hidden = !inFlow || step === 'gender';

    if (step === 'gender') renderGender();
    else if (step === 'goal') renderGoal();
    else if (step === 'q7') renderExtras();
    else if (step === 'building') renderBuilding();
    else if (step === 'results') renderResults();
    else renderChoice(step);

    if (inFlow && step !== 'gender') {
      const steps = questionSteps();
      setProgress((steps.indexOf(step) + 1) / (totalQuestions() + 1));
    }

    body.scrollTop = 0;
    body.querySelector('#ChxQuizHeading')?.focus({ preventScroll: true });
  };

  back.addEventListener('click', goBack);
  root.querySelector('[data-chx-quiz-close]').addEventListener('click', () => dialog.close());

  // Links that leave the quiz close it first, so the page underneath is usable.
  body.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-chx-quiz-leave]')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    clearTimeout(buildingTimer);
    document.documentElement.style.removeProperty('overflow');
  });

  // A click on the backdrop (outside the panel) closes the quiz.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    open(gender = '') {
      presetGender = gender === 'mens' || gender === 'womens' ? gender : '';
      reset();
      state.step = presetGender ? 'goal' : 'gender';
      document.documentElement.style.overflow = 'hidden';
      if (!dialog.open) dialog.showModal();
      render();
    },
  };
}
