// New owned material. See LICENSE; prior MIT material retains its permissions.
import {bookKey,serializeBook,parseBook,restoreSession} from './storybook-model.mjs';
export const BOOKMARKS_KEY='tilewright.bookmarks.v1',MAX_BOOKMARKS=32,MAX_BOOKMARK_BYTES=3_250_000;
export const bookmarkId=session=>`${bookKey(session.book)}-${session.difficulty}`;
export function upsertBookBookmark(entries,session){
  if(!session)return entries;const normalized=restoreSession(session),id=bookmarkId(normalized),other=entries.filter(item=>bookmarkId(item)!==id);
  if(other.length>=MAX_BOOKMARKS)throw Error('Your 32 story bookmarks are full. Remove an older bookmark below before starting another story.');
  return [...other,normalized];
}
export function loadBookBookmarks(storage){
  const result={entries:[],damaged:false,unavailable:false};
  try{const raw=storage.getItem(BOOKMARKS_KEY);if(!raw)return result;if(new TextEncoder().encode(raw).length>MAX_BOOKMARK_BYTES)throw Error('Oversized bookmarks');const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.entries)||data.entries.length>MAX_BOOKMARKS)throw Error('Unsupported bookmarks');
    for(const input of data.entries)try{const session=restoreSession({...input,book:parseBook(JSON.stringify(input.book))});result.entries=upsertBookBookmark(result.entries,session);}catch{result.damaged=true;}
  }catch{result.unavailable=true;}return result;
}
export function saveBookBookmarks(storage,entries){try{if(entries.length>MAX_BOOKMARKS)return false;const raw=JSON.stringify({version:1,entries:entries.map(session=>({...restoreSession(session),book:JSON.parse(serializeBook(session.book))}))});if(new TextEncoder().encode(raw).length>MAX_BOOKMARK_BYTES)return false;storage.setItem(BOOKMARKS_KEY,raw);return true;}catch{return false;}}
