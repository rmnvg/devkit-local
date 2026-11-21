import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'hash',
  name: 'Hash Generator',
  description: 'MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files, with checksum verification.',
  category: 'auth',
  keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'checksum', 'digest', 'file hash', 'integrity'],
  component: lazy(() => import('./Hash')),
  sensitive: true,
};
export default meta;
