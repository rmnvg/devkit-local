export interface TextCounts {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  readingMinutes: number;
  speakingMinutes: number;
  topWords: [string, number][];
}

const STOP = new Set('a an and are as at be but by for from has have he her his i in is it its of on or she that the their they this to was we were will with you your'.split(' '));

export function countText(text: string, wpmRead = 238, wpmSpeak = 140): TextCounts {
  const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  let wordList: string[];
  if (segmenter) wordList = [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment);
  else wordList = text.split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const w of wordList) {
    const k = w.toLowerCase();
    if (k.length < 2 || STOP.has(k) || /^\d+$/.test(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const trimmed = text.trim();
  return {
    characters: Array.from(text).length,
    charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length,
    words: wordList.length,
    sentences: trimmed ? (trimmed.match(/[^.!?。！？]+([.!?。！？]+|$)/g) ?? []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: text ? text.split('\n').length : 0,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: wordList.length / wpmRead,
    speakingMinutes: wordList.length / wpmSpeak,
    topWords: [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10),
  };
}

export function formatMinutes(m: number): string {
  if (m === 0) return '0 sec';
  if (m < 1) return `${Math.max(1, Math.round(m * 60))} sec`;
  const whole = Math.floor(m);
  const sec = Math.round((m - whole) * 60);
  return sec ? `${whole} min ${sec} sec` : `${whole} min`;
}
