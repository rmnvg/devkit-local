import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'url-encode',
  name: 'URL Encode / Decode',
  description: 'Percent-encode and decode URL components, full URIs and form data, including double-encoded strings.',
  category: 'web',
  keywords: ['url', 'encode', 'decode', 'percent', 'encodeURIComponent', 'uri', 'escape', 'form'],
  component: lazy(() => import('./UrlEncode')),
};
export default meta;
