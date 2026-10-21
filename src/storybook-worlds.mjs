import { puzzleLabWorld } from './workshop-lab.mjs';
import { normalizeBook } from './storybook-model.mjs';

export function featuredBooks() {
  // These pars leave the recorded clean route attainable on both rule sets.
  const pars = { counterweight:24, brassloop:31, bellgarden:53, footstep:11, tidekeeper:30, emberclock:43 };
  const chapter = (id, passage) => ({ world: { ...puzzleLabWorld(id), par:pars[id] }, passage });
  return [
    normalizeBook({ title: 'The Copperlight Caravan', author: 'Lantern Trails', synopsis: 'Three stops along a forgotten postal road. Repair a crossing, borrow a footstep, and deliver a song to the sea.', ending: 'At last the parcel sings. Along the coast, lamps answer one by one. The road remembers its keepers again.', chapters: [
      chapter('counterweight', 'Vale’s last letter arrived without a stamp, carried by a moth made of copper. “The coast has gone quiet,” it said. “Bring the road back to life. Start with the old counterweight.”'),
      chapter('footstep', 'Beyond the creek, two sets of footprints meet the river. One belongs to you. The other is waiting to be imagined. A ferryman’s note reads: “Sometimes help is the shadow you leave behind.”'),
      chapter('tidekeeper', 'Salt brightens the air. Vale is waiting at the last crossing, a singing parcel under one arm. Across the water, Kelp has kept a lamp burning for a letter that never came.'),
    ] }),
    normalizeBook({ title: 'The Midnight Mechanists', author: 'Lantern Trails', synopsis: 'Keys, bells, and wheels: rebuild a clockwork garden before its last brass fruit loses its glow.', ending: 'The orchard hums in time with the bells. Tomorrow, the mechanists will find their garden awake. Tonight, its light belongs to you.', chapters: [
      chapter('brassloop', 'A tiny key turns up in your breakfast. Attached is an invitation: “The Midnight Mechanists request a keeper with a talent for finding the long way around.” The vault keeps their first secret.'),
      chapter('bellgarden', 'Inside the vault is a score for three bells: Dew, Dusk, Moon. The garden gates will hear no other song. Take its scattered tokens; each is a tooth from a sleeping clock.'),
      chapter('emberclock', 'The clock’s heart lies inside a glowing orchard. Its wheels move more than doors. Watch the channels, cool the embers, and bring every brass fruit home.'),
    ] }),
    normalizeBook({ title: 'Six Lights Before Dawn', author: 'Lantern Trails', synopsis: 'The long route: all six Puzzle Lab worlds in one story, with a fresh optional challenge at every camp.', ending: 'Six lights meet the sunrise. Every crossing, conversation, and small invention has become a chapter in a road that someone else can follow.', chapters: [
      chapter('counterweight', 'The atlas has lost six lights. You have one night, a notebook, and a promise: leave every place a little brighter than you found it.'),
      chapter('brassloop', 'Your notebook gains its first sketch: a crate that became a bridge. The next page holds two keyholes, and a path that doubles back on itself.'),
      chapter('bellgarden', 'A bell rings somewhere beyond the trees. Two more answer. Write down their order; this garden remembers melodies better than footsteps.'),
      chapter('footstep', 'Halfway home, the river asks for something you cannot carry: another version of yourself. Or perhaps the answer is already sitting on the bank.'),
      chapter('tidekeeper', 'A keeper’s story joins yours. Listen before you choose your route. There is room in this notebook for more than one voice.'),
      chapter('emberclock', 'Only the orchard remains. Its brass fruit glows like the coming sunrise. Follow the channels, turn the wheels, and write the final line.'),
    ] }),
  ];
}
