// New owned material. See LICENSE; prior MIT permissions remain effective.
const colours = ['amber', 'jade', 'violet', 'blue'];

export function normalizeTurnstile({fare, channel, duration}) {
  if (!colours.includes(fare) || !colours.includes(channel) || !Number.isInteger(duration) || duration < 1 || duration > 6) {
    throw Error('Choose a parcel fare, numbered circuit and one to six powered turns.');
  }
  return {fare, channel, duration};
}

export function turnstileDescription(part) {
  return `Spends one ${part.fare} parcel on entry. Powers circuit ${colours.indexOf(part.channel) + 1} · ${part.channel} for ${part.duration} following ${part.duration === 1 ? 'turn' : 'turns'}.`;
}

export function turnstilePayment(part, parcel, turn) {
  if (parcel !== part.fare) return null;
  return {first: turn + 1, last: turn + part.duration};
}
