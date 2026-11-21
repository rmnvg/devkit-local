import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'hmac',
  name: 'HMAC Generator',
  description: 'Compute and verify HMAC-SHA1/256/384/512 signatures, e.g. for webhook payloads.',
  category: 'auth',
  keywords: ['hmac', 'signature', 'webhook', 'sha256', 'verify', 'secret', 'stripe', 'github'],
  component: lazy(() => import('./Hmac')),
  sensitive: true,
};
export default meta;
