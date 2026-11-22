// cards.js — Ember Arcana's card catalogue: every card's identity, cost and effect.
// Three elements, told apart by colour AND shape: Ember (flame, red), Tide (drop, blue),
// Thorn (leaf, green). Resonance: playing two cards of the same element in one turn
// strengthens the second one by +2. All names, art and effects are original.

export const ELEMENTS = {
  ember: { label: 'Ember', glyph: '▲', colour: '#ff5a3c', soft: '#ff8a5c', dark: '#7a1e08' },
  tide: { label: 'Tide', glyph: '●', colour: '#38b6ff', soft: '#7dd3fc', dark: '#0b3d66' },
  thorn: { label: 'Thorn', glyph: '◆', colour: '#4ade80', soft: '#86efac', dark: '#14532d' },
};

export const ELEMENT_ORDER = ['ember', 'tide', 'thorn'];

// One effect entry: kind damage | heal | shield | draw | discard, amount.
// A card may carry several effects, applied in order.
export const CARD_DEFS = [
  { id: 'cinder-strike', name: 'Cinder Strike', element: 'ember', cost: 1, art: '🔥', text: 'Deal 4 damage.', effects: [{ kind: 'damage', amount: 4 }] },
  { id: 'ember-spark', name: 'Ember Spark', element: 'ember', cost: 1, art: '✦', text: 'Deal 3 damage. Draw a card.', effects: [{ kind: 'damage', amount: 3 }, { kind: 'draw', amount: 1 }] },
  { id: 'flame-lash', name: 'Flame Lash', element: 'ember', cost: 2, art: '🔥', text: 'Deal 6 damage.', effects: [{ kind: 'damage', amount: 6 }] },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 3, art: '☀', text: 'Deal 8 damage.', effects: [{ kind: 'damage', amount: 8 }] },
  { id: 'inferno', name: 'Inferno', element: 'ember', cost: 4, art: '🌋', text: 'Deal 10 damage.', effects: [{ kind: 'damage', amount: 10 }] },
  { id: 'soothing-rain', name: 'Soothing Rain', element: 'tide', cost: 1, art: '💧', text: 'Restore 3 life.', effects: [{ kind: 'heal', amount: 3 }] },
  { id: 'tidewall', name: 'Tidewall', element: 'tide', cost: 2, art: '🌊', text: 'Gain 5 shield.', effects: [{ kind: 'shield', amount: 5 }] },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 2, art: '🌀', text: 'Restore 2 life. Draw a card.', effects: [{ kind: 'heal', amount: 2 }, { kind: 'draw', amount: 1 }] },
  { id: 'flood', name: 'Flood', element: 'tide', cost: 3, art: '🌊', text: 'Deal 6 damage. Restore 2 life.', effects: [{ kind: 'damage', amount: 6 }, { kind: 'heal', amount: 2 }] },
  { id: 'moon-tide', name: 'Moon Tide', element: 'tide', cost: 4, art: '🌙', text: 'Restore 6 life. Gain 3 shield.', effects: [{ kind: 'heal', amount: 6 }, { kind: 'shield', amount: 3 }] },
  { id: 'thorn-whip', name: 'Thorn Whip', element: 'thorn', cost: 1, art: '🌿', text: 'Deal 3 damage. Gain 2 shield.', effects: [{ kind: 'damage', amount: 3 }, { kind: 'shield', amount: 2 }] },
  { id: 'bramble-guard', name: 'Bramble Guard', element: 'thorn', cost: 2, art: '🛡', text: 'Gain 6 shield.', effects: [{ kind: 'shield', amount: 6 }] },
  { id: 'vine-snare', name: 'Vine Snare', element: 'thorn', cost: 2, art: '🌿', text: 'Deal 5 damage. Restore 2 life.', effects: [{ kind: 'damage', amount: 5 }, { kind: 'heal', amount: 2 }] },
  { id: 'root-grasp', name: 'Root Grasp', element: 'thorn', cost: 3, art: '🌳', text: 'Deal 7 damage. Gain 3 shield.', effects: [{ kind: 'damage', amount: 7 }, { kind: 'shield', amount: 3 }] },
  { id: 'thorn-storm', name: 'Thorn Storm', element: 'thorn', cost: 4, art: '🍃', text: 'Deal 9 damage. Gain 2 shield.', effects: [{ kind: 'damage', amount: 9 }, { kind: 'shield', amount: 2 }] },
];

export const CARD_BY_ID = new Map(CARD_DEFS.map((c) => [c.id, c]));

/** A fresh 30-card deck: two copies of each of the 15 cards, shuffled by the caller. */
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push({ ...def, uid: `${def.id}-a` });
    deck.push({ ...def, uid: `${def.id}-b` });
  }
  return deck;
}

/** Resonance bonus: +2 to every damage / heal / shield amount of a card that
 *  shares its element with the card played just before it this turn. */
export const RESONANCE_BONUS = 2;

export function resonantEffects(card, resonates) {
  if (!resonates) return card.effects;
  return card.effects.map((e) =>
    e.kind === 'damage' || e.kind === 'heal' || e.kind === 'shield'
      ? { ...e, amount: e.amount + RESONANCE_BONUS }
      : e,
  );
}

/** Short human-readable line for one resolved effect, for the battle log. */
export function effectLine(effect, actorName, targetName) {
  switch (effect.kind) {
    case 'damage': return `${actorName} deals ${effect.amount} damage to ${targetName}`;
    case 'heal': return `${actorName} restores ${effect.amount} life`;
    case 'shield': return `${actorName} gains ${effect.amount} shield`;
    case 'draw': return `${actorName} draws ${effect.amount} card${effect.amount > 1 ? 's' : ''}`;
    default: return `${actorName} plays a card`;
  }
}
