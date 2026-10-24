import { welcomeWorld, WELCOME_LEVELS } from './storybook-welcome.mjs';
import { promiseWorld, PROMISE_LEVELS } from './storybook-promise.mjs';
import { LAB_ROOMS, puzzleLabWorld } from './workshop-lab.mjs';
import { adventureKey } from './workshop-model.mjs';
export const BOOKMARKS_KEY='tilewright.workshop.bookmarks.v1';
export function trailboardAdventures(){
  return [...WELCOME_LEVELS.map(id=>({world:welcomeWorld(id),tags:['story','puzzle','peaceful'],note:'The Welcome Lanterns · no enemies or timed hazards'})),...PROMISE_LEVELS.map(id=>({world:promiseWorld(id),tags:['story',...(id==='listening-garden'?['stealth']:['puzzle'])],note:id==='listening-garden'?'Keeper’s pick · meet Vesper':'From The Keeper’s Promise'})),...LAB_ROOMS.filter(room=>room.afterhours).map(room=>({world:puzzleLabWorld(room.id),tags:['puzzle',...(room.id.includes('shadow')?['stealth']:[])],note:'Afterhours · a different answer'}))].map(item=>({...item,key:adventureKey(item.world),length:item.world.proof?.actions.length||item.world.par}));
}
export function loadBookmarks(storage){try{const raw=storage.getItem(BOOKMARKS_KEY);if(!raw||raw.length>6000)return [];const data=JSON.parse(raw);return data.version===1&&Array.isArray(data.keys)?[...new Set(data.keys.filter(key=>/^player-[a-f0-9]{16}$/.test(key)))].slice(-64):[];}catch{return [];}}
export function toggleBookmark(keys,key){if(!/^player-[a-f0-9]{16}$/.test(key))throw Error('Choose a known adventure.');return keys.includes(key)?keys.filter(id=>id!==key):[...keys,key].slice(-64);}
export function saveBookmarks(storage,keys){try{storage.setItem(BOOKMARKS_KEY,JSON.stringify({version:1,keys}));return true;}catch{return false;}}
