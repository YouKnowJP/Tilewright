// CI partitions the same ordered release catalogue; unsharded runs keep every case.
export function parseReleaseArgs(args=[]){
 const only=[];let shard=null;
 for(const arg of args){
  if(arg.startsWith('--shard=')){
   const match=/^--shard=([1-9]\d*)\/([1-9]\d*)$/.exec(arg);
   if(shard||!match||Number(match[2])>16||Number(match[1])>Number(match[2]))throw Error('Choose one release shard as INDEX/TOTAL, with 1–16 groups.');
   shard={index:Number(match[1]),total:Number(match[2])};
  }else if(arg.startsWith('--'))throw Error(`Unknown release option: ${arg}`);
  else only.push(arg);
 }
 return {only,shard};
}
export function createReleaseSelector({only=[],shard=null}={}){
 if(!Array.isArray(only)||only.some(name=>typeof name!=='string')||shard&&(!Number.isInteger(shard.index)||!Number.isInteger(shard.total)||shard.index<1||shard.index>shard.total||shard.total>16))throw Error('Use a valid release selection and shard.');
 let ordinal=0;
 return name=>{const position=ordinal++;return (!shard||position%shard.total===shard.index-1)&&(!only.length||only.includes(name));};
}
