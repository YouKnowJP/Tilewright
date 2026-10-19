// Authoring witnesses: all navigation, dialogue, cargo, and puzzle changes use
// the public reducer through storyDriver. No inventory or position edits.
import { storyDriver } from './story-driver.mjs';
import { stepRun } from '../src/adventure.mjs';

export function solveHorizon(id, difficulty = 'trail', branch = 0) {
  const driver = storyDriver(id, difficulty), { go, interact, talk, act } = driver, stage = driver.run.stage;
  const push = direction => {
    if (stepRun(driver.run, direction).damage > driver.run.damage && driver.run.shields) act('shield');
    act(direction);
  };
  if (id === 'trail-19') {
    talk('tala', branch ? 'ward' : 'echoes'); go(stage.lanterns[0]); go(stage.keys[0]);
    interact('ebb'); go({ x: 10, y: 10 }); go(stage.lanterns[2]); interact('home'); go({ x: 20, y: 7 }); go(stage.lanterns[1]);
  } else if (id === 'trail-20') {
    talk('skiff'); go(stage.lanterns[0]); go(stage.coins[0]); go(stage.coins[1]); interact('shell'); interact('port');
    go({ x: 12, y: 5 }); go(stage.coins[2]); go(stage.lanterns[1]); interact('starboard'); go(stage.coins[3]);
    interact('wake'); go({ x: 22, y: 14 }); go(stage.coins[4]); interact('gale'); go(stage.lanterns[2]); go(stage.coins[5]);
  } else if (id === 'trail-21') {
    talk('tala', branch ? 'flares' : 'shelter'); go(stage.lanterns[0]); go(stage.keys[0]); go(stage.lanterns[1]); interact('fog');
    interact('beam'); go({ x: 7, y: 13 }); go(stage.lanterns[2]); interact('gull'); if (branch) interact('breakwater');
    go(stage.lanterns[3]); interact('dawn'); talk('kelp'); interact('relic'); interact('harbour'); go({ x: 26, y: 10 }); talk('mara');
  } else if (id === 'trail-22') {
    talk('uma', branch ? 'kit' : 'root'); go(stage.lanterns[0]); go({ x: 5, y: 6 }); push('right'); go({ x: 5, y: 14 }); push('right');
    go({ x: 12, y: 14 }); go(stage.lanterns[1]); if (branch) interact('root'); go({ x: 21, y: 10 }); go(stage.lanterns[2]);
  } else if (id === 'trail-23') {
    talk('nox', branch ? 'ward' : 'echoes'); interact('wind'); go(stage.coins[3]); go(stage.lanterns[0]); go(stage.coins[0]);
    go(stage.coins[2]); go(stage.coins[1]); interact('leaf'); go({ x: 8, y: 8 }); interact('minute'); go(stage.lanterns[1]);
    go(stage.coins[4]); go({ x: 23, y: 15 }); go(stage.lanterns[2]); go(stage.coins[5]); go(stage.coins[6]); interact('hour');
    interact('chime'); go(stage.coins[7]);
  } else if (id === 'trail-24') {
    talk('uma', branch ? 'tools' : 'rain'); go(stage.lanterns[0]); interact('seed'); go(stage.lanterns[1]); interact('spring-song'); go(stage.keys[0]);
    if (branch) { go({ x: 5, y: 10 }); go({ x: 6, y: 11 }); push('right'); go({ x: 5, y: 15 }); go({ x: 6, y: 16 }); push('right'); go({ x: 6, y: 15 }); }
    interact('spring'); go({ x: 17, y: branch ? 6 : 13 }); if (branch) interact('rain'); go(stage.lanterns[2]); interact('leaf');
    interact('relic'); go(stage.lanterns[3]); interact('dawn'); talk('orr'); interact('dusk'); go({ x: 15, y: 21 }); talk('nell');
  } else throw Error('Choose a horizon mission (19–24).');
  const result = driver.finish(branch);
  return { ...result, switches: driver.run.switches, spentCoins: driver.run.spentCoins };
}
