import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'base64',
  name: 'Base64 Encode / Decode',
  description: 'Encode and decode Base64 (standard and URL-safe) for text and files, with data URI support.',
  category: 'auth',
  keywords: ['base64', 'encode', 'decode', 'base64url', 'data uri', 'atob', 'btoa', 'file'],
  component: lazy(() => import('./Base64')),
};
export default meta;
