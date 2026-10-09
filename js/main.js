// UI controller: renders screens into #app and wires up clicks via event delegation.
import {
  CAUSES,
  EMPEROR_BY_ID,
  HEADLINES,
  SLOGAN_LINE_1,
  SLOGAN_LINE_2,
  STAT_KEYS,
  STATS,
} from './data.js';
import {
  createReign,
  currentEvent,
  deltaTone,
  drawCandidates,
  isDanger,
  newlyEligible,
  nextEvent,
  rankFor,
  recordReign,
  resolveChoice,
  summarizeSave,
  unlockedEmperors,
} from './engine.js';
import { paintPortrait } from './portrait.js';
import { clearSave, loadSave, saveSave } from './store.js';
import { esc } from './util.js';

const app = document.getElementById('app');

const state = {
  screen: 'title',
  save: loadSave(),
  candidates: [],
  rerolls: 0,
  lastEmperorId: null,
  reign: null,
  pending: null, // outcome of the last choice, shown in a modal until dismissed
  shake: false,
};

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function render(html, { screenClass = '' } = {}) {
  app.className = `screen ${screenClass}`.trim();
  app.innerHTML = html;
  app.querySelectorAll('canvas[data-emperor]').forEach((canvas) => {
    const emperor = EMPEROR_BY_ID[canvas.dataset.emperor];
    if (emperor) paintPortrait(canvas, emperor);
  });
  if (state.shake) {
    state.shake = false;
    app.classList.add('shake');
  }
}

function portrait(emperorId, size = 'md') {
  return `<canvas class="portrait portrait-${size}" data-emperor="${esc(emperorId)}" width="24" height="24" aria-label="Portrait"></canvas>`;
}

function headline() {
  return HEADLINES[Math.floor(Math.random() * HEADLINES.length)];
}

function ticker() {
  const items = [...HEADLINES, ...HEADLINES].map((h) => `<span>${esc(h)}</span>`).join('<span class="dot">◆</span>');
  return `<div class="ticker" aria-hidden="true"><div class="ticker-track">${items}</div></div>`;
}

function fmtDeltas(deltas, { plain = false } = {}) {
  const entries = Object.entries(deltas || {}).filter(([, v]) => v !== 0);
  if (!entries.length) return '<span class="delta neutral">No change. Suspicious.</span>';
  return entries
    .map(([key, value]) => {
      const stat = STATS.find((s) => s.key === key);
      const sign = value > 0 ? '+' : '';
      const tone = plain ? '' : ` ${deltaTone(key, value)}`;
      return `<span class="delta${tone}">${esc(stat ? stat.short : key)} ${sign}${value}</span>`;
    })
    .join('');
}

function statBar(stat, value) {
  const danger = isDanger(stat.key, value) ? ' danger' : '';
  const segments = Array.from({ length: 20 }, (_, i) => {
    const on = value > i * 5 ? ' on' : '';
    return `<i class="seg${on}"></i>`;
  }).join('');
  return `
    <div class="stat${danger}" style="--stat:${stat.color}">
      <div class="stat-head">
        <span class="stat-name">${esc(stat.label)}</span>
        <span class="stat-val">${value}</span>
      </div>
      <div class="bar" title="${esc(stat.blurb)}">${segments}</div>
    </div>`;
}

function rerollNote() {
  const n = state.rerolls;
  if (n === 0) return 'Re-rolls are free. Re-rolls are unlimited.';
  if (n < 5) return `Re-roll #${n}. The lottery is fair. Probably.`;
  if (n < 10) return `Re-roll #${n}. The Senate has noticed. The Senate is also re-rolling.`;
  return `Re-roll #${n}. Nobody remembers the original candidates. The original candidates are fine.`;
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

function renderTitle() {
  state.screen = 'title';
  state.reign = null;
  state.pending = null;
  const summary = summarizeSave(state.save);
  render(
    `
    <section class="title-screen">
      <div class="title-plate panel">
        <p class="kicker">A Dark Cozy Pixel Art Praetorian Guard Simulator</p>
        <h1 class="logo">PRAETORIANS</h1>
        <p class="slogan"><span>${esc(SLOGAN_LINE_1)}</span><br /><span class="slogan-2">${esc(SLOGAN_LINE_2)}</span></p>
      </div>
      <div class="menu">
        <button class="btn big" data-action="start">Serve the Empire</button>
        <button class="btn" data-action="hall">Hall of Emperors (${summary.served})</button>
        <button class="btn ghost" data-action="reset">Shred the Ledger</button>
      </div>
      <p class="rank">Current rank: <b>${esc(summary.rank)}</b> &middot; Emperors served: <b>${summary.served}</b></p>
      ${ticker()}
    </section>`,
    { screenClass: 'screen-title' },
  );
}

function renderSelect() {
  state.screen = 'select';
  const banner = newlyEligible(state.save.reigns.length);
  const bannerHtml = banner.length
    ? `<p class="banner">A new candidate has entered the lottery: <b>${esc(banner.map((e) => e.name).join(', '))}</b>. Nobody asked for this.</p>`
    : '';
  const cards = state.candidates
    .map((emp) => {
      const mods = Object.entries(emp.mods || {})
        .map(([key, value]) => {
          const stat = STATS.find((s) => s.key === key);
          const tone = deltaTone(key, value);
          return `<span class="delta ${tone}">${esc(stat ? stat.label : key)} ${value > 0 ? '+' : ''}${value}</span>`;
        })
        .join('');
      const traits = (emp.traits || []).map((t) => `<li>${esc(t)}</li>`).join('');
      return `
        <article class="card panel">
          ${portrait(emp.id, 'lg')}
          <h3>${esc(emp.name)}</h3>
          <p class="etitle">${esc(emp.title)}</p>
          <p class="blurb">${esc(emp.blurb)}</p>
          <ul class="traits">${traits}</ul>
          <p class="mods">${mods}</p>
          <button class="btn" data-action="choose" data-id="${esc(emp.id)}">Choose This Emperor</button>
        </article>`;
    })
    .join('');

  render(
    `
    <header class="topbar">
      <button class="btn small ghost" data-action="title">&larr; Title</button>
      <span class="topbar-note">Imperial Lottery &middot; ${unlockedEmperors(state.save.reigns.length).length} eligible candidates</span>
    </header>
    <h2 class="section-title">${esc(SLOGAN_LINE_1)}</h2>
    <p class="section-sub">${esc(SLOGAN_LINE_2)}</p>
    ${bannerHtml}
    <div class="cards">${cards}</div>
    <div class="reroll-row">
      <button class="btn" data-action="reroll">Re-roll the Lottery</button>
      <span class="fine">${esc(rerollNote())}</span>
    </div>
    `,
    { screenClass: 'screen-select' },
  );
}

function renderReign() {
  state.screen = 'reign';
  const reign = state.reign;
  const ev = currentEvent(reign);
  const emp = reign.emperor;
  const rank = rankFor(state.save.reigns.length);
  const reignNo = state.save.reigns.length + 1;

  const stats = STATS.map((stat) => statBar(stat, reign.stats[stat.key])).join('');

  const ledger = reign.log
    .slice(-6)
    .reverse()
    .map(
      (entry) => `
        <li>
          <span class="ledger-day">Day ${entry.day}</span>
          <span class="ledger-title">${esc(entry.eventTitle)}</span>
          <span class="ledger-choice">&ldquo;${esc(entry.choiceLabel)}&rdquo;</span>
          <span class="ledger-deltas">${fmtDeltas(entry.deltas)}</span>
        </li>`,
    )
    .join('');

  const choices = ev
    ? ev.choices
        .map((choice, i) => {
          let hint;
          if (choice.gamble) {
            hint = `<span class="hint gamble">A gamble. ${Math.round(choice.gamble.chance * 100)}% odds of something.</span>`;
          } else {
            hint = `<span class="hint">${fmtDeltas(choice.effects, { plain: false })}</span>`;
          }
          return `
            <button class="choice" data-action="pick" data-index="${i}">
              <span class="choice-label">${esc(choice.label)}</span>
              ${hint}
            </button>`;
        })
        .join('')
    : '<p>The table is empty. Something has gone wrong, which, in fairness, is normal.</p>';

  const overlay = state.pending ? renderOutcome(state.pending) : '';

  render(
    `
    <header class="topbar">
      <button class="btn small ghost" data-action="abandon">&larr; Abdicate (Forfeit)</button>
      <span class="topbar-note">Reign No. ${reignNo} &middot; ${esc(rank)}</span>
    </header>

    <div class="reign-grid">
      <aside class="panel dossier">
        <div class="dossier-portrait">${portrait(emp.id, 'xl')}</div>
        <h2 class="dossier-name">${esc(emp.name)}</h2>
        <p class="etitle">${esc(emp.title)}</p>
        <div class="day-track">
          <span>Day ${Math.min(reign.day + (state.pending ? 0 : 1), reign.length)} of ${reign.length}</span>
          <span class="day-pips">${Array.from({ length: reign.length }, (_, i) => `<i class="${i < reign.day ? 'done' : ''}"></i>`).join('')}</span>
        </div>
        <div class="stats">${stats}</div>
      </aside>

      <section class="panel event">
        <p class="kicker">Dispatch from the Palatine &middot; ${esc(headline())}</p>
        <h3 class="event-title">${esc(ev ? ev.title : 'Nothing Happens')}</h3>
        <p class="event-text">${esc(ev ? ev.text : '')}</p>
        <div class="choices">${choices}</div>
      </section>

      <aside class="panel ledger">
        <h4>Ledger of Regrets</h4>
        ${reign.log.length ? `<ol>${ledger}</ol>` : '<p class="fine">No decisions yet. The ledger is pristine. This will not last.</p>'}
      </aside>
    </div>
    ${overlay}
    `,
    { screenClass: 'screen-reign' },
  );
}

function renderOutcome(pending) {
  const { event, choice, result, deltas, upkeep, gamble, over } = pending;
  const continueLabel = over ? 'See How It Ended' : 'Next Day';
  return `
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="panel modal">
        <p class="kicker">${gamble ? 'The dice have spoken' : 'Consequences, naturally'}</p>
        <h3>${esc(event.title)}</h3>
        <p class="chosen">You chose: &ldquo;${esc(choice.label)}&rdquo;</p>
        <p class="outcome">${esc(result)}</p>
        <div class="deltas">${fmtDeltas(deltas)}</div>
        <p class="upkeep">Daily upkeep, applied regardless: ${fmtDeltas(upkeep)}</p>
        <button class="btn" data-action="continue">${esc(continueLabel)}</button>
      </div>
    </div>`;
}

function renderEnd() {
  state.screen = 'end';
  const reign = state.reign;
  const emp = reign.emperor;
  if (!reign.recorded) {
    recordReign(state.save, reign);
    saveSave(state.save);
  }
  const over = reign.over;
  const finalStats = STAT_KEYS.map((key) => {
    const stat = STATS.find((s) => s.key === key);
    return `<li><span>${esc(stat.label)}</span><b>${reign.stats[key]}</b></li>`;
  }).join('');
  const reignNo = state.save.reigns.length;

  render(
    `
    <section class="end-screen">
      <p class="kicker">Reign No. ${reignNo} Concluded &middot; ${reign.day} of ${reign.length} days served</p>
      <h1 class="end-title">${esc(over.title)}</h1>
      <div class="panel epitaph">
        <div class="epitaph-portrait">${portrait(emp.id, 'lg')}</div>
        <div class="epitaph-body">
          <h3>${esc(emp.name)}</h3>
          <p class="etitle">${esc(emp.title)}</p>
          <p class="cause">${esc(over.text)}</p>
          <p class="epi">Here lies ${esc(emp.name.replace(/"[^"]*"/g, '').trim())}. ${esc(over.epitaph)}</p>
          <ul class="final-stats">${finalStats}</ul>
        </div>
      </div>
      <p class="fine end-rank">Your rank: <b>${esc(rankFor(state.save.reigns.length))}</b>. Your loyalty: unchanged. Your next emperor: to be determined by lottery.</p>
      <div class="menu">
        <button class="btn big" data-action="again">${esc(SLOGAN_LINE_1)} ${esc(SLOGAN_LINE_2)}</button>
        <button class="btn" data-action="hall">Hall of Emperors</button>
        <button class="btn ghost" data-action="title">Title Screen</button>
      </div>
    </section>`,
    { screenClass: 'screen-end' },
  );
}

function renderHall() {
  state.screen = 'hall';
  const reigns = [...state.save.reigns].reverse();
  const summary = summarizeSave(state.save);
  const rows = reigns.length
    ? reigns
        .map(
          (r) => `
          <li class="hall-row panel">
            ${portrait(r.emperorId, 'sm')}
            <div>
              <h4>${esc(r.name)}</h4>
              <p class="etitle">${esc(r.title)}</p>
              <p class="fine">${r.days} day${r.days === 1 ? '' : 's'} &middot; ${esc(r.causeTitle)}</p>
              <p class="fine">${esc(r.causeText)}</p>
            </div>
          </li>`,
        )
        .join('')
    : '<p class="fine">The Hall is empty. Like most halls in Rome, it is mostly echoes and an unpaid caretaker.</p>';

  render(
    `
    <header class="topbar">
      <button class="btn small ghost" data-action="title">&larr; Title</button>
      <span class="topbar-note">Hall of Emperors</span>
    </header>
    <h2 class="section-title">Former Emperors</h2>
    <p class="section-sub">Served: ${summary.served} &middot; Longest reign: ${summary.longest} day${summary.longest === 1 ? '' : 's'} &middot; Most common ending: ${esc(summary.mostCommonCause ? CAUSES[summary.mostCommonCause].title : 'n/a')}</p>
    <ul class="hall">${rows}</ul>
    <div class="menu">
      <button class="btn big" data-action="start">${esc(SLOGAN_LINE_1)} ${esc(SLOGAN_LINE_2)}</button>
    </div>
    `,
    { screenClass: 'screen-hall' },
  );
}

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

function goSelect() {
  state.candidates = drawCandidates({
    reignsServed: state.save.reigns.length,
    count: 3,
    avoid: state.lastEmperorId ? [state.lastEmperorId] : [],
  });
  renderSelect();
}

function reroll() {
  state.rerolls += 1;
  state.candidates = drawCandidates({
    reignsServed: state.save.reigns.length,
    count: 3,
    avoid: state.candidates.map((e) => e.id),
  });
  renderSelect();
}

function chooseEmperor(id) {
  const emperor = EMPEROR_BY_ID[id];
  if (!emperor) return;
  state.lastEmperorId = id;
  state.rerolls = 0;
  state.reign = createReign(emperor);
  nextEvent(state.reign);
  state.pending = null;
  renderReign();
}

function pickChoice(index) {
  if (state.pending || !state.reign) return;
  const result = resolveChoice(state.reign, index);
  state.pending = result;
  // Shake the screen on a violent ending or a big paranoia spike.
  const violent = Boolean(result.over && result.over.key !== 'natural');
  state.shake = violent || (result.deltas.paranoia || 0) >= 10;
  renderReign();
}

function continueAfterOutcome() {
  if (!state.pending) return;
  const over = state.pending.over;
  state.pending = null;
  if (over) {
    renderEnd();
    return;
  }
  nextEvent(state.reign);
  renderReign();
}

function abandon() {
  if (!state.reign) return renderTitle();
  if (!window.confirm('Abdicate? The Guard will consider this a forfeit, and so will history.')) return;
  const cause = CAUSES.abdicated;
  state.reign.over = { key: 'abdicated', title: cause.title, text: cause.text, epitaph: cause.epitaph };
  state.pending = null;
  recordReign(state.save, state.reign);
  saveSave(state.save);
  renderEnd();
}

function reset() {
  if (!window.confirm('Shred the entire ledger? Every emperor you ever served will be forgotten. The lottery will carry on.')) return;
  state.save = clearSave();
  renderTitle();
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

app.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'start':
      goSelect();
      break;
    case 'hall':
      renderHall();
      break;
    case 'title':
      renderTitle();
      break;
    case 'reset':
      reset();
      break;
    case 'reroll':
      reroll();
      break;
    case 'choose':
      chooseEmperor(el.dataset.id);
      break;
    case 'pick':
      pickChoice(Number(el.dataset.index));
      break;
    case 'continue':
      continueAfterOutcome();
      break;
    case 'again':
      state.lastEmperorId = state.reign ? state.reign.emperor.id : state.lastEmperorId;
      goSelect();
      break;
    case 'abandon':
      abandon();
      break;
    default:
      break;
  }
});

renderTitle();
