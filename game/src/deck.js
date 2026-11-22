// deck.js — shuffling, drawing and discarding. A deck is a plain array; the top
// card is the array's end, so draw() pops. When a deck runs out it reshuffles the
// discard pile (minus nothing) so a long duel never stalls.

/** Fisher–Yates shuffle, in place, using the supplied random source. */
export function shuffleDeck(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Draw up to `count` cards from deck into hand, reshuffling the discard pile
 *  when the deck runs dry. Returns the cards actually drawn. */
export function drawCards(deck, discard, hand, count, maxHand = 7) {
  const drawn = [];
  for (let n = 0; n < count; n++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...discard.splice(0));
      shuffleDeck(deck);
    }
    if (hand.length >= maxHand) break;
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** Move a card out of a hand into the discard pile. */
export function discardCard(hand, discard, uid) {
  const at = hand.findIndex((c) => c.uid === uid);
  if (at < 0) return null;
  const [card] = hand.splice(at, 1);
  discard.push(card);
  return card;
}
