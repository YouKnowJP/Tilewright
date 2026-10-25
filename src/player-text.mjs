const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity:'grapheme' }) : null;

export function playerName(value, fallback='Rowan', { characters=24, units=192 }={}) {
  if(typeof value!=='string')return fallback;
  const printable=Array.from(value.normalize('NFC')).filter(char=>char.length!==1||char.charCodeAt(0)<0xd800||char.charCodeAt(0)>0xdfff).join('');
  const text=printable.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();
  const parts=segmenter?Array.from(segmenter.segment(text),item=>item.segment):Array.from(text);
  let result='',count=0;
  for(const part of parts){if(count===characters||result.length+part.length>units)break;result+=part;count++;}
  return result.trim()||fallback;
}
