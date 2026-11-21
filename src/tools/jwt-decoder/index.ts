import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'jwt-decoder',
  name: 'JWT Decoder',
  description: 'Decode JSON Web Tokens, check expiry, and verify HS/RS/ES/PS signatures locally.',
  category: 'auth',
  keywords: ['jwt', 'token', 'jws', 'bearer', 'oauth', 'oidc', 'claims', 'verify', 'signature'],
  component: lazy(() => import('./JwtDecoder')),
  sensitive: true,
};
export default meta;
