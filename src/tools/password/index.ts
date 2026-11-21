import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'password',
  name: 'Password & Secret Generator',
  description: 'Generate strong passwords and random API-key style secrets with the browser’s secure RNG.',
  category: 'auth',
  keywords: ['password', 'generator', 'random', 'secret', 'token', 'api key', 'entropy', 'passphrase'],
  component: lazy(() => import('./Password')),
  sensitive: true,
};
export default meta;
