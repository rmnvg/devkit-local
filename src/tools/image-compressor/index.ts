import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'image-compressor',
  name: 'Image Compressor',
  description: 'Resize and compress images to JPEG, WebP or PNG in your browser — nothing is uploaded.',
  category: 'misc',
  keywords: ['image', 'compress', 'resize', 'optimize', 'jpeg', 'webp', 'png', 'shrink', 'photo'],
  component: lazy(() => import('./ImageCompressor')),
};
export default meta;
