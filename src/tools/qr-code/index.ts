import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'qr-code',
  name: 'QR Code Generator',
  description: 'Generate QR codes for text, URLs or Wi-Fi networks and download them as SVG or PNG.',
  category: 'misc',
  keywords: ['qr', 'qr code', 'barcode', 'wifi', 'generator', 'svg', 'png'],
  component: lazy(() => import('./QrCode')),
};
export default meta;
