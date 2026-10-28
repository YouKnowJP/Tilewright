import { createCampaign } from './adventure-levels.mjs';
import { createGuildJobs } from './adventure-guild.mjs';
import { createCustomStage } from './adventure.mjs';
import { validateDocument } from './model.mjs';
import { normalizeAdventure, adventureStage } from './workshop-model.mjs';
import { puzzleLabWorld, cursorPractice } from './workshop-lab.mjs';
import { COMMISSIONS, commissionWorld, festivalWorld } from './trailhouse-content.mjs';
import { chapterChallenges } from './storybook-model.mjs';

// Rebuild definitions from known content or validated portable worlds. Checkpoints
// never deserialize arbitrary executable stage definitions or award progress.
export function resumeDefinition(input,difficulty='trail'){
  if(!input||!['trail','nemesis'].includes(difficulty))throw Error('This saved adventure has invalid rules.');
  let source,stage;
  if(input.kind==='story'){
    stage=createCampaign().find(item=>item.id===input.id);source={kind:'story',id:input.id};
  }else if(input.kind==='guild'){
    if(!['bellrunner','mistweaver','echoist'].includes(input.kit))throw Error('Choose a known saved specialist.');
    stage=createGuildJobs(input.kit).find(item=>item.id===input.id);source={kind:'guild',id:input.id,kit:input.kit};
  }else if(input.kind==='map'){
    const map=validateDocument(input.map);stage=createCustomStage(map);source={kind:'map',map};
  }else if(input.kind==='lab'){
    stage=adventureStage(puzzleLabWorld(input.id));stage.workshop.lab=input.id;source={kind:'lab',id:input.id};
  }else if(input.kind==='house'){
    if(input.id!=='festival'&&!COMMISSIONS.some(item=>item.id===input.id))throw Error('Choose a known saved commission.');
    stage=adventureStage(input.id==='festival'?festivalWorld():commissionWorld(input.id));stage.workshop.trailhouse={id:input.id,festival:input.id==='festival'};source={kind:'house',id:input.id};
  }else if(input.kind==='world'||input.kind==='book'){
    const {proof,...world}=normalizeAdventure(input.world);source={kind:input.kind,world};stage=adventureStage(world);
    if(input.kind==='world'){
      if(!['shelf','build'].includes(input.origin))throw Error('This world has an invalid return destination.');
      source.origin=input.origin;
      if(input.practice){stage=cursorPractice(world,input.practice);source.practice={x:stage.start.x,y:stage.start.y};}
    }else{
      const meta=input.meta;
      if(!meta||!/^book-[0-9a-f]{8}$/.test(meta.key)||typeof meta.title!=='string'||!meta.title.length||meta.title.length>64||!Number.isInteger(meta.length)||meta.length<2||meta.length>6||!Number.isInteger(meta.chapter)||meta.chapter<0||meta.chapter>=meta.length||!chapterChallenges(stage,difficulty).some(item=>item.id===meta.challenge))throw Error('This saved chapter has invalid storybook details.');
      if(meta.page!==undefined&&(!Number.isInteger(meta.page)||meta.page<1||meta.page>meta.length))throw Error('This saved story page is invalid.');
      source.meta={key:meta.key,title:meta.title,chapter:meta.chapter,length:meta.length,challenge:meta.challenge,...(meta.page!==undefined?{page:meta.page}:{})};stage.workshop.storybook=source.meta;
    }
  }
  if(!stage)throw Error('This adventure is unavailable in the current game version.');
  return {source,stage};
}

export function ordinarySource(run){
  if(run.stage.workshop)throw Error('This adventure needs its Workshop context.');
  return run.stage.id.startsWith('custom-')?{kind:'map',map:run.stage.map}:run.guild?{kind:'guild',id:run.stage.id,kit:run.guild.kit}:{kind:'story',id:run.stage.id};
}
