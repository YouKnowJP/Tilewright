// New owned material. See LICENSE; prior MIT permissions remain effective.
export const CARD_DIAL_LABELS = Object.freeze({skip: 'Skip ahead', rewind: 'Rewind one'});

export function normalizeCardDial({shift}) {
  if (typeof shift !== 'string' || !Object.hasOwn(CARD_DIAL_LABELS, shift)) throw Error('Choose Skip ahead or Rewind one for the Card Dial.');
  return {shift};
}

export function dialNextCard(index, shift) {
  return (index + (shift === 'skip' ? 1 : 2)) % 3;
}

export function cardDialDescription(part) {
  return `${CARD_DIAL_LABELS[part.shift]}. On entry, shift the next card one slot ${part.shift === 'skip' ? 'forward' : 'back'}, wrapping around the three cards. The route and parcel stay intact.`;
}
