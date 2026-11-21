import { expose } from 'comlink';
import { formatJson, type Indent } from '@/tools/json-formatter/logic';

const api = {
  format(text: string, indent: Indent, sortKeys: boolean) {
    return formatJson(text, indent, sortKeys);
  },
};
export type JsonWorkerApi = typeof api;
expose(api);
