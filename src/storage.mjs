import { parseDocument, serializeDocument } from './model.mjs';

export const STORAGE_KEY = 'tilewright.document.v1';

export function loadDocument(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return { document: text === null ? null : parseDocument(text), error: null };
  } catch {
    return { document: null, error: 'Could not restore the local map. The sample is open; the old save is untouched until your next edit.' };
  }
}

export function saveDocument(storage, document) {
  try { storage.setItem(STORAGE_KEY, serializeDocument(document)); return true; }
  catch { return false; }
}
