import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'cron',
  name: 'Cron Explainer',
  description: 'Explain cron expressions in plain English and list the next scheduled runs in any time zone.',
  category: 'time',
  keywords: ['cron', 'crontab', 'schedule', 'next run', 'quartz', 'job', 'expression', 'every'],
  component: lazy(() => import('./Cron')),
};
export default meta;
