export const MEMORIES_KEY='tilewright.village.memories.v1';
const allowed=new Set(['ferry','workshop','nessa','moss','ori','ilex','eid','sable']);
const sessionOnly=new WeakMap();
export function readMemories(storage){
  if(sessionOnly.has(storage))return structuredClone(sessionOnly.get(storage));
  try{const raw=storage.getItem(MEMORIES_KEY);if(!raw||raw.length>12000)return {events:[],decoration:'lanterns'};const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.events))throw Error('Invalid memories');return {events:[...new Set(data.events.filter(id=>allowed.has(id)))].slice(-8),decoration:['lanterns','ferry','stars'].includes(data.decoration)?data.decoration:'lanterns'};}catch{return {events:[],decoration:'lanterns'};}
}
export function rememberTrail(storage,ids){const state=readMemories(storage),events=[...new Set([...state.events,...ids.filter(id=>allowed.has(id))])].slice(-8);if(JSON.stringify(events)===JSON.stringify(state.events))return !sessionOnly.has(storage);state.events=events;try{storage.setItem(MEMORIES_KEY,JSON.stringify({version:1,...state}));sessionOnly.delete(storage);return true;}catch{sessionOnly.set(storage,structuredClone(state));return false;}}
export function decorateVillage(storage,id){const state=readMemories(storage);if(!['lanterns',...(state.events.includes('ferry')?['ferry']:[]),...(state.events.includes('workshop')?['stars']:[])].includes(id))throw Error('Complete the matching story route to earn this decoration.');state.decoration=id;try{storage.setItem(MEMORIES_KEY,JSON.stringify({version:1,...state}));sessionOnly.delete(storage);return true;}catch{sessionOnly.set(storage,structuredClone(state));return false;}}
export function villageScene(state){
  const ferry=state.events.includes('ferry'),stars=state.events.includes('workshop');
  return {title:ferry&&stars?'Two roads, one home':ferry?'The ferry’s first evening':stars?'A garden learning to listen':'A letter waiting for you',text:ferry&&stars?'Moss brings a river map to Ilex’s workbench. Nessa hangs a paper ferry beside a turning star. Two different promises have found the same small village.':ferry?'Moss names the repaired crossing after its next traveler. Nessa hangs a copper ferry above the postbox. A road you kept open is already bringing new stories home.':stars?'Ilex brings Vesper’s first song home in a paper star. Nessa makes room above the postbox. A workshop you lit has given the village a new voice.':'Nessa is sorting two unusual envelopes. Read The Keeper’s Promise in Storybooks, then bring the memory of your chosen road home.'};
}
export function keeperMemory(keeper,state){
  if(keeper==='Moss'&&state.events.includes('ferry'))return 'I still watch that repaired ferry carry the first traveler each morning. You chose a crossing that outlasted your own journey. I have drawn it in blue in the river ledger.';
  if(keeper==='Ilex'&&state.events.includes('workshop'))return 'Vesper listens for the garden bells now. I kept the paper star from the workshop you restored. Every new invention has room for a different answer.';
  if(keeper==='Nessa'&&state.events.includes('ferry'))return 'The copper ferry above my postbox came from your river letter. People stop to ask about it, and leave with a story about someone keeping a promise.';
  if(keeper==='Nessa'&&state.events.includes('workshop'))return 'Your workshop letter arrived as a paper star. It turns above the postbox whenever someone tells a new story. Ilex says that is how we know the invention works.';
  if(state.events.includes(keeper.toLowerCase()))return `I remember the walk home after you found me. A village is different when you have seen the road someone took to bring you back. Thank you for leaving a light along it.`;
  return 'We have more stories ahead of us. Bring someone home, or follow a different promise in Storybooks, and tell me about the road you chose.';
}
