// New owned material. See LICENSE; prior MIT permissions remain effective.
const point = (x, y) => ({x, y});
const row = (y, first, last) => Array.from({length: last - first + 1}, (_, i) => point(first + i, y));
const column = (x, first, last) => Array.from({length: last - first + 1}, (_, i) => point(x, first + i));
const road = (...segments) => [...new Map(segments.flat().map(cell => [`${cell.x},${cell.y}`, cell])).values()];
const part = (kind, x, y, fields = {}) => ({kind, x, y, ...fields});
const well = (x, y, channel) => part('source', x, y, {channel});
const window = (x, y, channel, parcels = 1) => part('receiver', x, y, {channel, parcels});
const toll = (x, y, fare, channel, duration) => part('turnstile', x, y, {fare, channel, duration});
const bridge = (x, y, channel) => part('bridge', x, y, {channel});
const drum = (x, y, input, channel, delay) => part('drum', x, y, {input, channel, delay});
const corner = (x, y) => part('vane', x, y, {operation: 'rotate'});
const east = ['right', 'right', 'use'];
const slowEast = ['right', 'wait', 'use'];
const blank = ['wait', 'wait', 'wait'];

const scenes = [
  {
    id: 'duo-toll-tickets', title: 'A Ticket for Sprout', width: 8, height: 6,
    difficulty: 'Expert', minutes: '10–20 min',
    story: 'Moss: “That first parcel is your ticket. The next one is mail.” Pay the turnstile in Pip’s lane to open Sprout’s bridge. Both couriers still owe the post office a delivery.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Turnstile (4,2): amber fare, blue circuit, 3 turns. Jade well (5,2). Pay on turn 4. Sprout crosses on 7. Deliver on 9 and 12.',
    ending: 'Sprout sticks the ticket stub inside the mailbag. Pip’s fare bought a crossing and both letters made it through.',
    road: road(row(1, 0, 6), row(4, 0, 4)), starts: [point(0, 1), point(0, 4)], solution: [east, slowEast],
    fixed: [well(2, 1, 'amber'), window(6, 1, 'jade'), well(1, 4, 'violet'), bridge(3, 4, 'blue'), window(4, 4, 'violet')],
    solutionParts: [toll(3, 1, 'amber', 'blue', 3), well(4, 1, 'jade')],
  },
  {
    id: 'duo-toll-echo', title: 'The Late Fare', width: 10, height: 6,
    difficulty: 'Master', minutes: '20–40 min',
    story: 'Tavi: “One ticket for the next beat. Save the other beat for later.” Both couriers pay at the same time. Delay one receipt with a Memory Drum so Sprout’s bridge opens three turns after the payment.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Pip turnstile (4,2): amber fare, violet circuit, 1 turn. Sprout turnstile (3,5): jade fare, amber circuit, 1 turn. Drum (10,1): amber → blue, delay 2. Both pay on 4. Pip crosses on 5 and Sprout on 7. Deliver on 12 and 18.',
    ending: 'The delayed beat echoes under the planks as Tavi takes the last parcel. Two tickets, two bridges, two very different waits.',
    road: road(row(1, 0, 8), row(4, 0, 6), point(9, 0)), starts: [point(0, 1), point(0, 4)], solution: [east, slowEast],
    fixed: [well(2, 1, 'amber'), bridge(4, 1, 'violet'), well(6, 1, 'blue'), window(8, 1, 'blue'),
      well(1, 4, 'jade'), bridge(3, 4, 'blue'), well(4, 4, 'violet'), window(6, 4, 'violet')],
    solutionParts: [toll(3, 1, 'amber', 'violet', 1), toll(2, 4, 'jade', 'amber', 1), drum(9, 0, 'amber', 'blue', 2)],
  },
  {
    id: 'duo-toll-handoff', title: 'Pass the Fare', width: 13, height: 5, handoffs: 1,
    difficulty: 'Master', minutes: '25–50 min',
    story: 'Nessa: “Sprout needs empty hands at the post. Pip has the fare for the next bridge.” Spend the first two parcels, meet at the posts, and hand the third parcel over just in time to buy Pip’s crossing.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Turnstiles (4,2) jade → violet and (6,3) jade → amber, each 1 turn. Jade posts (6,2) and (7,3). Meet on 7 and hand off amber on 9. Turnstile (8,3) amber → blue, 1 turn. Sprout pays on 10, Pip crosses on 11. Both deliver on 18.',
    ending: 'Nessa pins two delivery slips beside the handoff ticket. Neither courier could have bought that crossing alone.',
    road: road(row(1, 0, 12), row(2, 3, 9)), starts: [point(0, 1), point(3, 2)], solution: [east, slowEast],
    fixed: [well(2, 1, 'jade'), well(4, 1, 'amber'), part('handoff', 6, 1), bridge(8, 1, 'blue'),
      well(10, 1, 'violet'), window(12, 1, 'violet'), well(4, 2, 'jade'), well(8, 2, 'blue'), window(9, 2, 'blue')],
    solutionParts: [toll(3, 1, 'jade', 'violet', 1), toll(5, 2, 'jade', 'amber', 1),
      part('sync', 5, 1, {channel: 'jade'}), part('sync', 6, 2, {channel: 'jade'}), toll(7, 2, 'amber', 'blue', 1)],
  },
  {
    id: 'duo-toll-rounds', title: 'The Four-Fare Rounds', width: 13, height: 9, quietBells: true,
    difficulty: 'Master', minutes: '35–70 min',
    story: 'Eid: “Pay for each other on the way out and on the way home.” Run two loops. Borrow the other courier’s receipt to cross, remember the beat long enough to fire the kiln, then buy each other’s way back to the flags.',
    hint: 'Both East / East / Use. Fit clockwise vanes on the six remaining corners. Turnstiles (5,2) amber → violet and (11,2) jade → blue, both 5 turns. Wells (6,4) amber and (12,4) jade. Drums (6,1) blue → jade and (12,1) violet → amber, delay 3. Kilns (6,6) jade power, amber → quiet blue / powered violet; (12,6) amber power, jade → quiet violet / powered blue. Return wells (2,6) jade and (8,6) blue. Return turnstiles (2,5) jade → amber and (8,5) blue → jade, one turn. Each return bridge uses the other courier’s pulse. Deliver on 18 and 48. Park on 58.',
    ending: 'The last receipt fades as Pip and Sprout touch their flags. Eid leaves the turnstiles oiled for whoever takes the next round.',
    road: road(row(1, 1, 5), row(7, 1, 5), column(1, 1, 7), column(5, 1, 7),
      row(1, 7, 11), row(7, 7, 11), column(7, 1, 7), column(11, 1, 7), point(5, 0), point(11, 0)),
    starts: [point(1, 1), point(7, 1)], solution: [east, east],
    fixed: [corner(1, 1), corner(7, 1), well(3, 1, 'amber'), well(9, 1, 'jade'),
      bridge(5, 2, 'blue'), bridge(11, 2, 'violet'), window(3, 7, 'violet', 2), window(9, 7, 'blue', 2),
      part('pip-dock', 1, 2), part('sprout-dock', 7, 2), bridge(1, 3, 'jade'), bridge(7, 3, 'amber')],
    solutionParts: [corner(5, 1), corner(5, 7), corner(1, 7), corner(11, 1), corner(11, 7), corner(7, 7),
      toll(4, 1, 'amber', 'violet', 5), toll(10, 1, 'jade', 'blue', 5),
      well(5, 3, 'amber'), well(11, 3, 'jade'), drum(5, 0, 'blue', 'jade', 3), drum(11, 0, 'violet', 'amber', 3),
      part('kiln', 5, 5, {channel: 'jade', input: 'amber', quiet: 'blue', powered: 'violet'}),
      part('kiln', 11, 5, {channel: 'amber', input: 'jade', quiet: 'violet', powered: 'blue'}),
      well(1, 5, 'jade'), well(7, 5, 'blue'), toll(1, 4, 'jade', 'amber', 1), toll(7, 4, 'blue', 'jade', 1)],
  },
];

export const TOLL_HOUSE_MISSIONS = Object.freeze(scenes.map((mission, index) => {
  const inventory = {};
  for (const station of mission.solutionParts) inventory[station.kind] = (inventory[station.kind] || 0) + 1;
  return Object.freeze({
    version: 19, chapter: 97 + index, collection: 'toll-house', handoffs: 0, relays: 0,
    emptyLockers: false, quietSwitches: false, quietBells: false, quietDrums: false,
    programs: [blank, blank], ...mission, budget: mission.solutionParts.length, inventory,
  });
}));
