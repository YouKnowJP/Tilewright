import { storyDriver } from './story-driver.mjs';

export function solveAtlas(id, difficulty = 'trail', branch = 0) {
  const driver = storyDriver(id, difficulty), { go, interact, talk, act } = driver, stage = driver.run.stage;
  const lamps = () => { for (const lamp of stage.lanterns) if (!driver.run.collectedLanterns.includes(lamp.id)) go(lamp); };
  const coins = () => { for (const coin of stage.coins) if (!driver.run.collectedCoins.includes(coin.id)) go(coin); };
  if (id === 'trail-10') {
    talk('ves', branch ? 'binding' : 'echoes'); go(stage.lanterns[0]); interact('ink'); interact('index');
    go({ x: 14, y: 5 }); go(stage.lanterns[1]); go(stage.lanterns[2]); interact('echo'); interact('return'); interact('relic'); go({ x: 12, y: 14 });
  } else if (id === 'trail-11') {
    talk('nib'); interact('quill'); go(stage.coins[0]); go(stage.coins[1]); interact('quiet');
    go(stage.coins[2]); go(stage.coins[3]); go(stage.lanterns[2]); interact('seal'); go(stage.lanterns[1]);
    go(stage.coins[4]); go(stage.coins[5]); go(stage.coins[6]); interact('letter'); go(stage.lanterns[0]); coins();
  } else if (id === 'trail-12') {
    talk('ves'); go(stage.lanterns[0]); interact('orbit'); go(stage.lanterns[1]); go(stage.keys[0]); interact('orbit-drive');
    go({ x: 8, y: 14 }); go(stage.lanterns[2]); interact('dusk'); interact('dawn'); go(stage.lanterns[3]); interact('star');
    talk('tess'); interact('relic'); go({ x: 25, y: 10 });
  } else if (id === 'trail-13') {
    talk('saff', branch ? 'supplies' : 'water'); go({ x: 5, y: 10 }); act('right');
    go(stage.lanterns[0]); if (branch) interact('oasis'); go(stage.lanterns[1]); go({ x: 15, y: 10 }); go(stage.lanterns[2]);
  } else if (id === 'trail-14') {
    talk('saff', branch ? 'echoes' : 'passage'); go(stage.lanterns[0]); go(stage.coins[2]); go(stage.coins[0]); go(stage.coins[1]); interact('moon');
    go({ x: 15, y: 16 }); go(stage.coins[5]); go(stage.lanterns[2]); go(stage.coins[4]); go(stage.lanterns[1]); go(stage.coins[3]);
  } else if (id === 'trail-15') {
    talk('saff'); go(stage.lanterns[0]); interact('ash'); go(stage.keys[0]); go(stage.lanterns[1]); interact('brass'); interact('draft');
    go({ x: 16, y: 6 }); interact('coal'); go(stage.lanterns[2]); interact('cool'); go(stage.lanterns[3]); interact('song'); talk('odo'); talk('rami');
  } else if (id === 'trail-16') {
    talk('elu', branch ? 'ward' : 'echoes'); go(stage.lanterns[0]); interact('post'); go({ x: 14, y: 9 });
    go(stage.lanterns[1]); go(stage.lanterns[2]); interact('relic'); go({ x: 12, y: 9 });
  } else if (id === 'trail-17') {
    talk('elu'); go(stage.coins[0]); interact('snow'); go(stage.coins[1]); interact('blue'); go(stage.lanterns[0]);
    interact('moon'); go(stage.coins[2]); interact('silver'); go({ x: 17, y: 11 });
    go(stage.coins[3]); go(stage.lanterns[1]); interact('sky'); go(stage.coins[4]); go(stage.lanterns[2]); interact('lake'); go(stage.coins[5]);
  } else if (id === 'trail-18') {
    talk('elu', branch ? 'kit' : 'storm');
    if (branch) { go({ x: 6, y: 12 }); act('right'); go({ x: 10, y: 14 }); act('right'); }
    go(stage.lanterns[0]); interact('root'); go(stage.keys[0]); interact('north'); go(stage.lanterns[1]); interact('frost');
    go({ x: 19, y: branch ? 12 : 6 }); if (branch) interact('storm'); interact('star'); go(stage.lanterns[2]);
    interact('home'); interact('dawn'); go(stage.lanterns[3]); talk('rami'); talk('tess'); interact('relic'); go({ x: 15, y: 20 });
  } else throw Error('Choose an atlas mission (10–18).');
  return driver.finish(branch);
}
