// ai.js — Vex, the Hollow Sage: the rival's visible decision-making.
// Every turn the AI scores each playable card in its hand and plays the best
// one, then re-scores, until nothing worth playing remains. Its reasoning is
// written to the battle log ("Vex weighs the Tidewall…") so its choices can be
// read and countered, never hidden.

import { resonantEffects } from './cards.js';

const MAX_HP = 30;

/** Score one card for the AI in the current position. Higher is better. */
export function scoreCardForAi(card, ai, player, lastElement) {
  const effects = resonantEffects(card, lastElement === card.element);
  let score = 0;
  for (const e of effects) {
    if (e.kind === 'damage') {
      score += e.amount * 1.15;
      if (e.amount >= player.hp + player.shield) score += 50; // lethal
      if (player.hp <= 8) score += e.amount * 0.4; // press a wounded foe
    }
    if (e.kind === 'heal') {
      const missing = MAX_HP - ai.hp;
      const useful = Math.min(e.amount, missing);
      score += useful * (ai.hp <= 12 ? 1.6 : 0.5);
    }
    if (e.kind === 'shield') {
      const threat = Math.min(12, player.hand.reduce((s, c) => s + (c.effects.find((x) => x.kind === 'damage')?.amount ?? 0), 0));
      score += e.amount * (threat >= ai.hp + ai.shield ? 1.3 : 0.55);
    }
    if (e.kind === 'draw') score += 2.5;
  }
  if (lastElement === card.element) score += 2; // chase Resonance chains
  score -= card.cost * 0.6; // prefer efficient plays
  return score;
}

/** Pick the AI's next card, or null when it should end its turn.
 *  Returns { card, score, thought } — thought is shown in the log. */
export function chooseAiCard(ai, player) {
  const playable = ai.hand.filter((c) => c.cost <= ai.mana);
  if (playable.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const card of playable) {
    const score = scoreCardForAi(card, ai, player, ai.lastElement);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  if (!best || bestScore < 0.8) return null; // hold weak cards for a better turn
  const thoughts = {
    damage: ['Vex raises a burning hand…', 'Vex answers with force…', 'Vex strikes without mercy…'],
    heal: ['Vex steadies its breath…', 'Vex mends its wounds…', 'Vex draws on quiet waters…'],
    shield: ['Vex raises a wall of thorns…', 'Vex braces behind brambles…', 'Vex hardens its guard…'],
    draw: ['Vex seeks deeper knowledge…', 'Vex consults the deck…'],
  };
  const mainKind = best.effects[0]?.kind ?? 'damage';
  const pool = thoughts[mainKind] ?? thoughts.damage;
  return { card: best, score: bestScore, thought: pool[Math.floor(Math.random() * pool.length)] };
}
