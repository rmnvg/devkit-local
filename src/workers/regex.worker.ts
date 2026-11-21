import { run } from '@/tools/regex-tester/logic';

self.onmessage = (e: MessageEvent<{ id: number; pattern: string; flags: string; text: string; replacement: string | null }>) => {
  const { id, pattern, flags, text, replacement } = e.data;
  self.postMessage({ id, result: run(pattern, flags, text, replacement) });
};
