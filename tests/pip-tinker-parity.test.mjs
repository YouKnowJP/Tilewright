import test from 'node:test';
import assert from 'node:assert/strict';
import {TINKER_TRIALS,solvedTinkerProject,editTinkerProject,startTinker,tinkerStep,tinkerParts,compileTinkerAdventure} from '../src/pip-tinker.mjs';
import {CLOCKWORK_COMMANDS} from '../src/clockwork.mjs';
import {editAdventure,adventureStage} from '../src/workshop-model.mjs';
import {createRun,stepRun} from '../src/adventure.mjs';

for(const trial of TINKER_TRIALS.filter(t=>t.starts.length===1)){
 test(`all three-card programs agree between ${trial.id} workshop and main-game simulations`,()=>{
  const solved=solvedTinkerProject(trial.id),world=compileTinkerAdventure(solved);
  const receivers=tinkerParts(solved).filter(p=>p.kind==='receiver');
  for(const firstBank of solved.parts.some(p=>p.kind==='flip')?[false,true]:[null])for(const a of CLOCKWORK_COMMANDS)for(const b of CLOCKWORK_COMMANDS)for(const c of CLOCKWORK_COMMANDS){
   const program=[a,b,c],project=editTinkerProject(solved,{programs:[program],parts:solved.parts.map(p=>p.kind==='flip'?{...p,initial:firstBank}:p)});
   const stage=adventureStage(editAdventure(world,{markers:world.markers.map(m=>m.kind==='clockwork'?{...m,program}:m.kind==='pip-flip'?{...m,initial:firstBank}:m)}));
   let studio=startTinker(project),main=createRun(stage);
   for(let tick=0;tick<24&&studio.status==='playing';tick++){
    studio=tinkerStep(studio);main=stepRun(main,'clockwork-step');
    const bot=studio.bots[0],actual=main.clockwork,where=`${trial.id}: ${program.join('/')} (first bank ${firstBank}) at tick ${tick+1}`;
    assert.deepEqual([bot.x,bot.y,bot.index,bot.program,bot.parcel],[actual.x,actual.y,actual.index,actual.program,actual.parcel??null],where);
    for(const receiver of receivers)assert.equal(studio.received[receiver.id]||0,actual.received?.['part-'+receiver.id]||0,where+' receiver');
   }
  }
 });
}
