import { createTwoFilesPatch } from 'diff';
export { diffPrompts as diffText, type Granularity, type Part } from '@/tools/prompt-diff/logic';

export interface DiffOptions {
  ignoreWhitespace: boolean;
  context: number;
}

/** Unified diff (git-style patch) of two texts. */
export function unifiedDiff(a: string, b: string, o: DiffOptions, names = ['original', 'modified']): string {
  const norm = (s: string) => (o.ignoreWhitespace ? s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).join('\n') : s);
  const patch = createTwoFilesPatch(names[0]!, names[1]!, norm(a), norm(b), '', '', { context: o.context });
  return patch.split('\n').slice(1).join('\n').trimEnd(); // drop the "====" separator line
}

export interface LineStats {
  added: number;
  removed: number;
  unchanged: number;
}

export function lineStats(patch: string): LineStats {
  let added = 0, removed = 0, unchanged = 0;
  for (const l of patch.split('\n')) {
    if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@') || l.startsWith('\\')) continue;
    if (l.startsWith('+')) added++;
    else if (l.startsWith('-')) removed++;
    else if (l.startsWith(' ')) unchanged++;
  }
  return { added, removed, unchanged };
}
