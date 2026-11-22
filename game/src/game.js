// game.js — Ember Arcana's rules and match state: turns, mana, Resonance,
// rounds (best of 3), and win / loss. Rendering and sound live elsewhere;
// this file only changes state and tells its hooks what happened.

import { buildDeck, resonantEffects, effectLine, RESONANCE_BONUS } from './cards.js';
import { shuffleDeck, drawCards, discardCard } from './deck.js';

export const MAX_HP = 30;
export const MAX_MANA = 10;
export const ROUNDS_TO_WIN = 2;
export const START_HAND = 5;

function freshFighter(name, isAi) {
  return {
    name, isAi,
    hp: MAX_HP, maxHp: MAX_HP, shield: 0,
    mana: 0, maxMana: 0,
    deck: [], discard: [], hand: [],
    lastElement: null, cardsPlayed: 0, damageDealt: 0,
  };
}

export class EmberGame {
  constructor(hooks) {
    this.hooks = hooks; // { log(msg), sound(name), float(side, text, kind), onPhase() }
    this.screen = 'title'; // title | table | win | loss
    this.phase = 'idle'; // idle | player | ai | roundEnd | matchEnd
    this.round = 1;
    this.turnNumber = 0;
    this.roundWins = { player: 0, ai: 0 };
    this.player = freshFighter('Aria, the Emberwright', false);
    this.ai = freshFighter('Vex, the Hollow Sage', true);
    this.turnsPlayed = 0;
    this.matchLog = [];
  }

  log(msg) {
    this.matchLog.push(msg);
    if (this.matchLog.length > 40) this.matchLog.shift();
    this.hooks.log(msg);
  }

  newMatch() {
    this.screen = 'table';
    this.phase = 'player';
    this.round = 1;
    this.turnNumber = 0;
    this.roundWins = { player: 0, ai: 0 };
    this.player = freshFighter('Aria, the Emberwright', false);
    this.ai = freshFighter('Vex, the Hollow Sage', true);
    this.turnsPlayed = 0;
    this.matchLog = [];
    this.startRound();
  }

  startRound() {
    for (const f of [this.player, this.ai]) {
      f.hp = MAX_HP; f.shield = 0; f.mana = 0; f.maxMana = 0;
      f.deck = shuffleDeck(buildDeck());
      f.discard = []; f.hand = []; f.lastElement = null;
      drawCards(f.deck, f.discard, f.hand, START_HAND);
    }
    this.turnNumber = 1;
    this.log(`— Round ${this.round} begins: first to ${ROUNDS_TO_WIN} rounds takes the match —`);
    this.beginTurn(this.player);
  }

  beginTurn(fighter) {
    fighter.maxMana = Math.min(MAX_MANA, this.turnNumber);
    fighter.mana = fighter.maxMana;
    fighter.lastElement = null;
    const drawn = drawCards(fighter.deck, fighter.discard, fighter.hand, 1);
    if (drawn.length > 0) this.hooks.sound('draw');
    this.phase = fighter.isAi ? 'ai' : 'player';
    this.hooks.onPhase();
  }

  endPlayerTurn() {
    if (this.phase !== 'player') return false;
    this.log('Aria ends the turn.');
    this.hooks.sound('turn');
    this.beginTurn(this.ai);
    return true;
  }

  endAiTurn() {
    if (this.phase !== 'ai') return;
    this.turnNumber++;
    this.turnsPlayed++;
    this.beginTurn(this.player);
  }

  canPlay(side, card) {
    return this.phase === (side === 'player' ? 'player' : 'ai') && card.cost <= side.mana;
  }

  /** Play a card from a fighter's hand. Returns true when the card resolved. */
  playCard(side, uid) {
    const foe = side === this.player ? this.ai : this.player;
    const card = side.hand.find((c) => c.uid === uid);
    if (!card || this.phase !== (side.isAi ? 'ai' : 'player')) return false;
    if (card.cost > side.mana) {
      this.hooks.sound('denied');
      if (!side.isAi) this.log(`Not enough mana for ${card.name} (needs ${card.cost}).`);
      return false;
    }
    const resonates = side.lastElement === card.element;
    side.mana -= card.cost;
    discardCard(side.hand, side.discard, uid);
    side.cardsPlayed++;
    side.lastElement = card.element;
    this.hooks.sound('playCard');
    if (resonates) {
      this.hooks.sound('resonance');
      this.log(`✦ RESONANCE! ${card.name} burns brighter (+${RESONANCE_BONUS}) — two ${card.element} cards in a row.`);
    } else {
      this.log(`${side.name} plays ${card.name} (${card.cost} mana).`);
    }
    for (const effect of resonantEffects(card, resonates)) {
      this.applyEffect(side, foe, effect);
    }
    this.hooks.onPhase();
    this.checkRoundEnd();
    return true;
  }

  applyEffect(actor, target, effect) {
    if (effect.kind === 'damage') {
      let remaining = effect.amount;
      if (target.shield > 0) {
        const absorbed = Math.min(target.shield, remaining);
        target.shield -= absorbed;
        remaining -= absorbed;
        this.log(`${target.name}'s shield absorbs ${absorbed}.`);
      }
      if (remaining > 0) {
        target.hp = Math.max(0, target.hp - remaining);
        actor.damageDealt += remaining;
        this.hooks.float(target.isAi ? 'ai' : 'player', `-${remaining}`, 'damage');
        this.hooks.sound('damage');
        this.log(effectLine(effect, actor.name, target.name) + '.');
      }
    } else if (effect.kind === 'heal') {
      const healed = Math.min(effect.amount, actor.maxHp - actor.hp);
      actor.hp += healed;
      if (healed > 0) {
        this.hooks.float(actor.isAi ? 'ai' : 'player', `+${healed}`, 'heal');
        this.hooks.sound('heal');
      }
      this.log(effectLine(effect, actor.name, target.name) + '.');
    } else if (effect.kind === 'shield') {
      actor.shield += effect.amount;
      this.hooks.float(actor.isAi ? 'ai' : 'player', `+${effect.amount} 🛡`, 'shield');
      this.hooks.sound('shield');
      this.log(effectLine(effect, actor.name, target.name) + '.');
    } else if (effect.kind === 'draw') {
      const drawn = drawCards(actor.deck, actor.discard, actor.hand, effect.amount);
      this.log(effectLine(effect, actor.name, target.name) + (drawn.length ? '.' : ' — the deck is empty.'));
    }
  }

  checkRoundEnd() {
    if (this.player.hp > 0 && this.ai.hp > 0) return;
    const winner = this.player.hp > 0 ? this.player : this.ai;
    const loser = winner === this.player ? this.ai : this.player;
    this.roundWins[winner.isAi ? 'ai' : 'player']++;
    this.phase = 'roundEnd';
    this.log(`— ${winner.name} takes Round ${this.round}! (${this.roundWins.player}–${this.roundWins.ai}) —`);
    this.hooks.sound(winner.isAi ? 'loseDescent' : 'winFanfare');
    if (this.roundWins.player >= ROUNDS_TO_WIN || this.roundWins.ai >= ROUNDS_TO_WIN) {
      this.screen = winner.isAi ? 'loss' : 'win';
      this.phase = 'matchEnd';
      this.log(winner.isAi
        ? 'The Hollow Sage prevails. The embers dim… for now.'
        : 'Aria claims the match! The Three Embers bow to her.');
    } else {
      this.hooks.onRoundEnd(winner, loser);
    }
    this.hooks.onPhase();
  }

  nextRound() {
    this.round++;
    this.startRound();
  }

  toTitle() {
    this.screen = 'title';
    this.phase = 'idle';
    this.hooks.onPhase();
  }
}
