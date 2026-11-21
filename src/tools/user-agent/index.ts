import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'user-agent',
  name: 'User-Agent Parser',
  description: 'Parse user-agent strings into browser, engine, OS and device, and spot bots and AI crawlers.',
  category: 'web',
  keywords: ['user agent', 'ua', 'browser', 'parser', 'bot', 'crawler', 'gptbot', 'claudebot', 'device'],
  component: lazy(() => import('./UserAgent')),
};
export default meta;
