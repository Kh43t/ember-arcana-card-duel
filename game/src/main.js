// main.js — Ember Arcana's boot and input: wires the game to the page, drives
// Vex's turns with visible pauses, handles keyboard and mouse, and offers
// ?shot=title|table|win|loss presets so screenshots can be taken of every
// screen from the game's own code.

import { EmberGame } from './game.js';
import { SoundBank } from './audio.js';
import { renderAll, floatText, showBanner, setThinking } from './render.js';
import { chooseAiCard } from './ai.js';
import { CARD_BY_ID } from './cards.js';
import { buildDeck } from './cards.js';
import { shuffleDeck } from './deck.js';

const sound = new SoundBank();
// ?fast=1 shortens the AI's thinking pauses (used by automated play-tests).
const FAST = new URLSearchParams(window.location.search).has('fast');
const sleep = (ms) => new Promise((r) => window.setTimeout(r, FAST ? Math.max(30, ms / 6) : ms));

let aiToken = 0; // a new match invalidates any AI loop still running

const game = new EmberGame({
  log() { renderAll(game, onCardClick); },
  sound(name) { if (sound[name]) sound[name](); },
  float(side, text, kind) { floatText(side, text, kind); },
  onPhase() {
    renderAll(game, onCardClick);
    if (game.phase === 'ai') void runAiTurn();
    if (game.phase === 'player') setThinking('');
  },
  onRoundEnd(winner) {
    showBanner(`${winner.name} takes the round!`, `Round ${game.round + 1} begins — first to 2 rounds`);
    const token = aiToken;
    void sleep(2000).then(() => {
      if (token !== aiToken) return;
      game.nextRound();
      showBanner(`Round ${game.round}`, 'Fresh decks, fresh hands');
    });
  },
});

function onCardClick(card) {
  if (game.phase !== 'player') return;
  sound.ensure();
  if (!game.playCard(game.player, card.uid)) {
    renderAll(game, onCardClick);
  }
}

async function runAiTurn() {
  const token = ++aiToken;
  await sleep(750);
  while (game.phase === 'ai') {
    if (token !== aiToken) return;
    const pick = chooseAiCard(game.ai, game.player);
    if (!pick) break;
    setThinking(pick.thought);
    game.log(pick.thought);
    await sleep(650);
    if (token !== aiToken) return;
    game.playCard(game.ai, pick.card.uid);
    renderAll(game, onCardClick);
    await sleep(750);
  }
  if (token !== aiToken || game.phase !== 'ai') return;
  setThinking('');
  await sleep(450);
  if (token !== aiToken) return;
  game.endAiTurn();
  renderAll(game, onCardClick);
}

function startMatch() {
  sound.ensure();
  sound.startMusic();
  aiToken++;
  game.newMatch();
  showBanner('Round 1', 'Aria vs Vex — first to 2 rounds');
  renderAll(game, onCardClick);
}

function bindButtons() {
  document.getElementById('btn-start').addEventListener('click', () => { sound.click(); startMatch(); });
  document.getElementById('btn-howto').addEventListener('click', () => {
    sound.click();
    document.getElementById('howto').classList.toggle('open');
  });
  document.getElementById('btn-close-howto').addEventListener('click', () => {
    document.getElementById('howto').classList.remove('open');
  });
  document.getElementById('btn-end-turn').addEventListener('click', () => {
    if (game.endPlayerTurn()) renderAll(game, onCardClick);
  });
  for (const id of ['btn-again-win', 'btn-again-loss']) {
    document.getElementById(id).addEventListener('click', () => { sound.click(); startMatch(); });
  }
  for (const id of ['btn-title-win', 'btn-title-loss']) {
    document.getElementById(id).addEventListener('click', () => { sound.click(); game.toTitle(); });
  }
  document.getElementById('btn-mute').addEventListener('click', (e) => {
    sound.ensure();
    sound.setMuted(!sound.muted);
    e.currentTarget.textContent = sound.muted ? '🔇 Muted' : '🔊 Sound on';
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (game.screen === 'table') {
      if (e.key >= '1' && e.key <= '7') {
        const card = game.player.hand[Number(e.key) - 1];
        if (card) onCardClick(card);
        return;
      }
      if (e.key === 'Enter' || e.key.toLowerCase() === 'e') {
        if (game.endPlayerTurn()) renderAll(game, onCardClick);
        return;
      }
    }
    if ((game.screen === 'win' || game.screen === 'loss') && e.key.toLowerCase() === 'r') startMatch();
    if (e.key.toLowerCase() === 'm') {
      sound.setMuted(!sound.muted);
      document.getElementById('btn-mute').textContent = sound.muted ? '🔇 Muted' : '🔊 Sound on';
    }
    if (e.key.toLowerCase() === 'h') document.getElementById('howto').classList.toggle('open');
    if (e.key === 'Escape') document.getElementById('howto').classList.remove('open');
  });
}

// --- Screenshot presets: ?shot=table|win|loss stages a real game state ----

function stageTableShot() {
  game.newMatch();
  game.round = 2;
  game.turnNumber = 4;
  game.roundWins = { player: 1, ai: 0 };
  game.player.hp = 18; game.player.shield = 4; game.player.mana = 6; game.player.maxMana = 6;
  game.ai.hp = 24; game.ai.shield = 2; game.ai.mana = 5; game.ai.maxMana = 5;
  const hand = (ids) => ids.map((id, i) => ({ ...CARD_BY_ID.get(id), uid: `${id}-shot-${i}` }));
  game.player.hand = hand(['flame-lash', 'soothing-rain', 'thorn-whip', 'inferno', 'deep-current', 'vine-snare']);
  game.ai.hand = hand(['cinder-strike', 'tidewall', 'flame-lash', 'bramble-guard', 'ember-spark']);
  game.player.deck = shuffleDeck(buildDeck()).slice(0, 18);
  game.ai.deck = shuffleDeck(buildDeck()).slice(0, 21);
  game.phase = 'player';
  game.log('Aria plays Thorn Whip (1 mana).');
  game.log('Vex answers with Flame Lash (2 mana).');
  game.log('✦ RESONANCE! Ember Spark burns brighter (+2).');
  game.log('Aria restores 4 life with Soothing Rain.');
  game.log('Vex raises Tidewall — 6 shield.');
  game.log('Round 2 — Aria leads 1–0. Your move.');
  renderAll(game, onCardClick);
}

function stageEndShot(win) {
  game.newMatch();
  game.roundWins = win ? { player: 2, ai: 1 } : { player: 1, ai: 2 };
  game.turnsPlayed = 14;
  game.player.cardsPlayed = 23;
  game.ai.cardsPlayed = 21;
  game.player.damageDealt = 61;
  game.ai.damageDealt = 54;
  game.player.hp = win ? 11 : 0;
  game.ai.hp = win ? 0 : 9;
  game.screen = win ? 'win' : 'loss';
  game.phase = 'matchEnd';
  game.log(win ? 'Aria claims the match! The Three Embers bow to her.' : 'The Hollow Sage prevails. The embers dim… for now.');
  renderAll(game, onCardClick);
}

function applyShotPreset() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (shot === 'table') stageTableShot();
  else if (shot === 'win') stageEndShot(true);
  else if (shot === 'loss') stageEndShot(false);
}

bindButtons();
bindKeyboard();
applyShotPreset();
renderAll(game, onCardClick);
