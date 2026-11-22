// render.js — everything the player sees: the table, the hands, the cards,
// the life and mana bars, the battle log, floating damage numbers, the round
// banner and the win / loss screens. Pure DOM; no canvas, so every card stays
// crisp and readable even at thumbnail size.

import { ELEMENTS } from './cards.js';

const $ = (id) => document.getElementById(id);

function manaCrystals(el, mana, maxMana) {
  el.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement('span');
    dot.className = 'mana-dot' + (i < mana ? ' filled' : '') + (i < maxMana ? '' : ' locked');
    el.appendChild(dot);
  }
}

function hpBar(fillEl, textEl, fighter) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle('low', pct <= 30);
  textEl.textContent = `${fighter.hp} / ${fighter.maxHp}`;
}

function shieldBadge(el, fighter) {
  el.textContent = fighter.shield > 0 ? `🛡 ${fighter.shield}` : '';
  el.classList.toggle('on', fighter.shield > 0);
}

export function createCardEl(card, opts) {
  const el = ELEMENTS[card.element];
  const node = document.createElement('button');
  node.className = `card el-${card.element}`;
  node.dataset.uid = card.uid;
  node.type = 'button';
  node.setAttribute('aria-label', `${card.name}, cost ${card.cost}: ${card.text}`);
  const affordable = opts.playable && card.cost <= opts.mana;
  node.classList.toggle('affordable', !!affordable);
  node.classList.toggle('unaffordable', opts.playable && card.cost > opts.mana);
  if (opts.selected) node.classList.add('selected');
  node.innerHTML =
    `<span class="card-cost" title="Mana cost">${card.cost}</span>` +
    `<span class="card-key">${opts.keyHint ?? ''}</span>` +
    `<span class="card-glyph" style="color:${el.colour}">${el.glyph}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-art">${card.art}</span>` +
    `<span class="card-text">${card.text}</span>` +
    `<span class="card-element" style="background:${el.colour}">${el.glyph} ${el.label}</span>`;
  if (opts.onClick) node.addEventListener('click', () => opts.onClick(card));
  return node;
}

function renderHand(container, hand, game, onCardClick) {
  const sig = hand.map((c) => c.uid).join('|');
  if (container.dataset.sig === sig) {
    // Same cards: just refresh affordability / key hints in place.
    for (const node of container.children) {
      const card = hand.find((c) => c.uid === node.dataset.uid);
      if (!card) continue;
      node.classList.toggle('affordable', game.phase === 'player' && card.cost <= game.player.mana);
      node.classList.toggle('unaffordable', game.phase === 'player' && card.cost > game.player.mana);
    }
    return;
  }
  container.dataset.sig = sig;
  container.innerHTML = '';
  hand.forEach((card, i) => {
    const node = createCardEl(card, {
      playable: game.phase === 'player',
      mana: game.player.mana,
      keyHint: i < 9 ? String(i + 1) : '',
      onClick: onCardClick,
    });
    node.style.animationDelay = `${i * 60}ms`;
    container.appendChild(node);
  });
}

function renderAiHand(container, ai) {
  const sig = `ai-${ai.hand.length}`;
  if (container.dataset.sig === sig) return;
  container.dataset.sig = sig;
  container.innerHTML = '';
  ai.hand.forEach((_, i) => {
    const back = document.createElement('div');
    back.className = 'card-back';
    back.style.animationDelay = `${i * 50}ms`;
    back.textContent = '✦';
    container.appendChild(back);
  });
}

export function floatText(side, text, kind) {
  const layer = $('float-layer');
  const anchor = $(side === 'player' ? 'player-portrait' : 'ai-portrait');
  if (!layer || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const node = document.createElement('div');
  node.className = `float-text ${kind}`;
  node.textContent = text;
  node.style.left = `${rect.left - layerRect.left + rect.width / 2}px`;
  node.style.top = `${rect.top - layerRect.top + rect.height / 2}px`;
  layer.appendChild(node);
  window.setTimeout(() => node.remove(), 1300);
}

export function showBanner(text, sub = '') {
  const banner = $('round-banner');
  banner.innerHTML = `<div class="banner-title">${text}</div>${sub ? `<div class="banner-sub">${sub}</div>` : ''}`;
  banner.classList.add('show');
  window.setTimeout(() => banner.classList.remove('show'), 1800);
}

export function renderAll(game, onCardClick) {
  // Screens
  for (const name of ['title', 'table', 'win', 'loss']) {
    $(`screen-${name}`).classList.toggle('active', game.screen === name);
  }
  if (game.screen !== 'table' && game.screen !== 'win' && game.screen !== 'loss') return;

  // Round pips and turn indicator
  $('round-label').textContent = `Round ${game.round} — first to 2`;
  $('pip-player').textContent = '●'.repeat(game.roundWins.player) + '○'.repeat(2 - game.roundWins.player);
  $('pip-ai').textContent = '●'.repeat(game.roundWins.ai) + '○'.repeat(2 - game.roundWins.ai);
  const turnText = game.phase === 'player' ? 'Your turn — play a card or end your turn'
    : game.phase === 'ai' ? 'Vex is thinking…' : game.phase === 'roundEnd' ? 'Round over'
    : game.phase === 'matchEnd' ? 'Match over' : '';
  $('turn-indicator').textContent = turnText;
  $('turn-indicator').classList.toggle('your-turn', game.phase === 'player');

  // Fighters
  hpBar($('player-hp-fill'), $('player-hp-text'), game.player);
  hpBar($('ai-hp-fill'), $('ai-hp-text'), game.ai);
  shieldBadge($('player-shield'), game.player);
  shieldBadge($('ai-shield'), game.ai);
  manaCrystals($('player-mana'), game.player.mana, game.player.maxMana);
  manaCrystals($('ai-mana'), game.ai.mana, game.ai.maxMana);
  $('player-mana-text').textContent = `${game.player.mana}/${game.player.maxMana} mana`;
  $('ai-mana-text').textContent = `${game.ai.mana}/${game.ai.maxMana} mana`;
  $('player-deck-count').textContent = `Deck ${game.player.deck.length} · Discard ${game.player.discard.length}`;
  $('ai-deck-count').textContent = `Deck ${game.ai.deck.length} · Discard ${game.ai.discard.length}`;

  // Hands
  renderHand($('player-hand'), game.player.hand, game, onCardClick);
  renderAiHand($('ai-hand'), game.ai);

  // End turn button
  const endBtn = $('btn-end-turn');
  endBtn.disabled = game.phase !== 'player';
  endBtn.textContent = game.phase === 'player' ? 'End Turn ⏎' : 'Vex is playing…';

  // Log (last 6)
  const logEl = $('log-list');
  const recent = game.matchLog.slice(-6);
  if (logEl.dataset.sig !== recent.join('\n')) {
    logEl.dataset.sig = recent.join('\n');
    logEl.innerHTML = recent.map((m) => `<div class="log-line">${m}</div>`).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  // End screens: clear any floating numbers left over from the final blow.
  if (game.screen === 'win' || game.screen === 'loss') {
    const layer = $('float-layer');
    if (layer) layer.innerHTML = '';
    const stats = [
      ['Rounds', `${game.roundWins.player} – ${game.roundWins.ai}`],
      ['Turns played', String(game.turnsPlayed)],
      ['Cards you played', String(game.player.cardsPlayed)],
      ['Damage you dealt', String(game.player.damageDealt)],
      ['Damage Vex dealt', String(game.ai.damageDealt)],
    ];
    const html = stats.map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join('');
    $(game.screen === 'win' ? 'win-stats' : 'loss-stats').innerHTML = html;
  }
}

export function setThinking(text) {
  const el = $('ai-thinking');
  if (el) el.textContent = text ?? '';
}
