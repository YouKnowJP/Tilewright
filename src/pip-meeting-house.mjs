// New owned material. See LICENSE; prior MIT permissions remain effective.
const point = (x, y) => ({x, y});
const row = (y, first, last) => Array.from({length: last - first + 1}, (_, i) => point(first + i, y));
const column = (x, first, last) => Array.from({length: last - first + 1}, (_, i) => point(x, first + i));
const road = (...segments) => [...new Map(segments.flat().map(cell => [`${cell.x},${cell.y}`, cell])).values()];
const part = (kind, x, y, fields = {}) => ({kind, x, y, ...fields});
const source = (x, y, channel) => part('source', x, y, {channel});
const receiver = (x, y, channel, parcels = 1) => part('receiver', x, y, {channel, parcels});
const post = (x, y, channel) => part('sync', x, y, {channel});
const press = (x, y, channel, output) => part('press', x, y, {channel, output});
const rest = (x, y, duration) => part('rest', x, y, {duration});
const east = ['right', 'right', 'use'];
const slowEast = ['right', 'wait', 'use'];
const blank = ['wait', 'wait', 'wait'];
const corner = (x, y) => part('vane', x, y, {operation: 'rotate'});

const scenes = [
  {
    id: 'duo-meeting-dusk', title: 'Meet at Dusk', width: 7, height: 6,
    difficulty: 'Expert', minutes: '10–20 min',
    story: 'Moss: “The faster route can wait.” Pip and Sprout take different numbers of turns to reach the same appointment. Link the posts, keep both parcels safe and deliver after the meeting.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Amber posts at (4,2) and (4,5). Pip arrives on 4 and Sprout on 7. Both resume on 8. Pip uses the amber → jade press at (5,2) on 9. Both deliver on 12.',
    ending: 'Two small parcels reach the windows together. Moss turns the appointment card over and writes “kept.”',
    road: road(row(1, 0, 6), row(4, 0, 4)), starts: [point(0, 1), point(0, 4)], solution: [east, slowEast],
    fixed: [source(2, 1, 'amber'), receiver(6, 1, 'jade'), source(1, 4, 'blue'), receiver(4, 4, 'blue')],
    solutionParts: [post(3, 1, 'amber'), post(3, 4, 'amber'), press(4, 1, 'amber', 'jade')],
  },
  {
    id: 'duo-meeting-tickets', title: 'Two Meeting Tickets', width: 9, height: 6,
    difficulty: 'Master', minutes: '20–40 min',
    story: 'Tavi: “Amber is the first ticket. Violet is the second.” Link two meetings on uneven routes. Sprout needs a rail to reach the upper press, and each rendezvous must keep the cards in the right place.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Amber posts at (4,2) and (4,6). Violet posts at (7,2) and (6,5). Rail (5,6): North in both states. Pip press (5,2): amber → jade. Sprout press (5,5): blue → violet. Resume on 8 and 15. Deliver on 18 and 19.',
    ending: 'Tavi folds both tickets into a little paper timetable. Each pair of holes marks an appointment the couriers kept.',
    road: road(row(1, 0, 8), row(5, 0, 4), row(4, 4, 6)), starts: [point(0, 1), point(0, 5)], solution: [east, slowEast],
    fixed: [source(2, 1, 'amber'), receiver(8, 1, 'jade'), source(1, 5, 'blue'), receiver(6, 4, 'violet')],
    solutionParts: [post(3, 1, 'amber'), post(3, 5, 'amber'), post(6, 1, 'violet'), post(5, 4, 'violet'),
      part('rail', 4, 5, {channel: 'blue', quietExit: 'up', poweredExit: 'up'}),
      press(4, 1, 'amber', 'jade'), press(4, 4, 'blue', 'violet')],
  },
  {
    id: 'duo-meeting-bridge', title: 'The Bridge Appointment', width: 10, height: 5, handoffs: 1,
    difficulty: 'Master', minutes: '25–50 min',
    story: 'Nessa: “The bridge gets one beat. Be there when it arrives.” Bring Pip’s parcel to the handoff just as Sprout is ready. Send Sprout’s earlier footfall through a drum to open the crossing, then deliver both letters.',
    hint: 'Pip East / East / Use. Sprout East / Wait / Use. Blue posts at (4,2) and (5,3). Counter (4,3): Sprout, amber, every 2, one starting mark, one powered turn. Drum (10,1): amber → violet, delay 5. Press (7,3): amber → jade. Resume on 11, hand off on 12, cross on 13. Pip collects another parcel on 15 and delivers on 18. Sprout delivers on 21.',
    ending: 'Nessa hears the bridge close behind the last parcel. One beat was enough when both couriers kept the appointment.',
    road: road(row(1, 0, 8), row(2, 0, 7), point(9, 0)), starts: [point(0, 1), point(0, 2)], solution: [east, slowEast],
    fixed: [source(2, 1, 'amber'), part('handoff', 4, 1), source(6, 1, 'blue'), receiver(8, 1, 'blue'),
      part('bridge', 5, 2, {channel: 'violet'}), receiver(7, 2, 'jade')],
    solutionParts: [post(3, 1, 'blue'), post(4, 2, 'blue'), press(6, 2, 'amber', 'jade'),
      part('counter', 3, 2, {channel: 'amber', threshold: 2, phase: 1, duration: 1, courier: 'sprout'}),
      part('drum', 9, 0, {input: 'amber', channel: 'violet', delay: 5})],
  },
  {
    id: 'duo-meeting-rounds', title: 'The Lantern Rounds', width: 13, height: 9, quietSwitches: true,
    difficulty: 'Master', minutes: '35–70 min',
    story: 'Eid: “Different stops. The same two meetings, every lap.” Sprout rests before the first meeting, Pip before the second. Make the bridge on its open beat, use each other’s lanterns for the recipes, and return home together with the lights out.',
    hint: 'Both East / East / Use. Amber posts (5,2) and (11,2). Jade posts (5,8) and (11,8). Sprout rests 2 at (9,2). Pip rests 1 at (6,7). Amber tide (7,1): period 3, one open beat, offset 1. Fit clockwise vanes on the remaining corners. Pip kiln (6,4): violet, amber → quiet jade / powered blue. Bowl (6,6): jade + blue → violet. Sprout kiln (12,4): blue, jade → quiet amber / powered violet. Bowl (12,6): amber + violet → blue. Pip uses blue lantern (2,6), Sprout violet lantern (8,6). Deliver on 54 and 120. Both park with lanterns off on 127.',
    ending: 'Eid blows out the last lantern and checks both flags. The mail is in, and nobody had to make the last walk alone.',
    road: road(row(1, 1, 5), row(7, 1, 5), column(1, 1, 7), column(5, 1, 7),
      row(1, 7, 11), row(7, 7, 11), column(7, 1, 7), column(11, 1, 7), point(6, 0)),
    starts: [point(1, 1), point(7, 1)], solution: [east, east],
    fixed: [corner(1, 1), corner(7, 1), source(3, 1, 'amber'), source(9, 1, 'jade'),
      part('bridge', 5, 2, {channel: 'amber'}), receiver(3, 7, 'violet', 2), receiver(9, 7, 'blue', 2),
      part('pip-dock', 1, 4), part('sprout-dock', 7, 4)],
    solutionParts: [post(4, 1, 'amber'), post(10, 1, 'amber'), post(4, 7, 'jade'), post(10, 7, 'jade'),
      rest(8, 1, 2), rest(5, 6, 1), part('tide', 6, 0, {channel: 'amber', period: 3, beats: 1, offset: 1}),
      corner(5, 1), corner(5, 7), corner(1, 7), corner(11, 1), corner(11, 7), corner(7, 7),
      part('kiln', 5, 3, {channel: 'violet', input: 'amber', quiet: 'jade', powered: 'blue'}),
      part('kiln', 11, 3, {channel: 'blue', input: 'jade', quiet: 'amber', powered: 'violet'}),
      part('mixer', 5, 5, {channel: 'jade', second: 'blue', output: 'violet'}),
      part('mixer', 11, 5, {channel: 'amber', second: 'violet', output: 'blue'}),
      part('latch', 1, 5, {channel: 'blue'}), part('latch', 7, 5, {channel: 'violet'})],
  },
];

export const MEETING_HOUSE_MISSIONS = Object.freeze(scenes.map((mission, index) => {
  const inventory = {};
  for (const station of mission.solutionParts) inventory[station.kind] = (inventory[station.kind] || 0) + 1;
  return Object.freeze({
    version: 18, chapter: 93 + index, collection: 'meeting-house', handoffs: 0, relays: 0,
    emptyLockers: false, quietSwitches: false, quietBells: false, quietDrums: false,
    programs: [blank, blank], ...mission, budget: mission.solutionParts.length, inventory,
  });
}));
