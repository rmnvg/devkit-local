import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'timestamp',
  name: 'Timestamp Converter',
  description: 'Convert Unix timestamps (s/ms/µs/ns) and ISO 8601 dates across local, UTC and any time zone.',
  category: 'time',
  keywords: ['unix', 'epoch', 'timestamp', 'iso 8601', 'date', 'time zone', 'utc', 'milliseconds'],
  component: lazy(() => import('./Timestamp')),
};
export default meta;
