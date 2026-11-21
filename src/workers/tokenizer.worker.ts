import { expose } from 'comlink';
import { Tiktoken } from 'js-tiktoken/lite';
import { tokenize, type TokenizeResult } from '@/tools/token-counter/logic';

export type EncodingName = 'o200k_base' | 'cl100k_base';

const encoders = new Map<EncodingName, Tiktoken>();

async function getEncoder(name: EncodingName): Promise<Tiktoken> {
  let enc = encoders.get(name);
  if (!enc) {
    const ranks =
      name === 'o200k_base'
        ? (await import('js-tiktoken/ranks/o200k_base')).default
        : (await import('js-tiktoken/ranks/cl100k_base')).default;
    enc = new Tiktoken(ranks);
    encoders.set(name, enc);
  }
  return enc;
}

const api = {
  async tokenize(text: string, encoding: EncodingName, maxPieces: number): Promise<TokenizeResult> {
    return tokenize(await getEncoder(encoding), text, maxPieces);
  },
};

export type TokenizerApi = typeof api;
expose(api);
