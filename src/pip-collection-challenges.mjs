// New owned material. See LICENSE; prior MIT permissions remain effective.
export function normalizeChapterChallenge(raw){
 if(raw===undefined||raw===null)return {ticks:null,parts:null};if(typeof raw!=='object'||Array.isArray(raw))throw Error('Choose optional chapter bonus goals.');
 const ticks=raw.ticks??null,parts=raw.parts??null;if(ticks!==null&&(!Number.isInteger(ticks)||ticks<1||ticks>240)||parts!==null&&(!Number.isInteger(parts)||parts<0||parts>32))throw Error('Bonus goals allow 1–240 ticks and 0–32 placed parts, or leave either blank.');return {ticks,parts};
}
export const hasChapterChallenge=chapter=>Boolean(chapter?.challenge&&(chapter.challenge.ticks!==null||chapter.challenge.parts!==null));
export function collectionBonusEarned(chapter,clear){return Boolean(hasChapterChallenge(chapter)&&clear?.proof&&(chapter.challenge.ticks===null||clear.proof.ticks<=chapter.challenge.ticks)&&(chapter.challenge.parts===null||clear.parts.length<=chapter.challenge.parts));}
export function collectionChallengeText(chapter){return hasChapterChallenge(chapter)?[chapter.challenge.ticks===null?'':chapter.challenge.ticks+' ticks or fewer',chapter.challenge.parts===null?'':chapter.challenge.parts+' placed parts or fewer'].filter(Boolean).join(' · '):'';}
export function preferCollectionClear(chapter,before,after){
 if(!before||!after||!hasChapterChallenge(chapter))return after||before;const a=collectionBonusEarned(chapter,before),b=collectionBonusEarned(chapter,after);if(a!==b)return b?after:before;
 return after.proof.ticks<before.proof.ticks||after.proof.ticks===before.proof.ticks&&after.parts.length<before.parts.length?after:before;
}
