import { lazy } from 'react';
import type { ToolMeta } from '@/lib/types';

const meta: ToolMeta = {
  slug: 'csv-viewer',
  name: 'CSV Viewer',
  description: 'View CSV/TSV as a sortable, filterable table with column stats. Files never leave your browser.',
  category: 'json',
  keywords: ['csv', 'tsv', 'table', 'viewer', 'spreadsheet', 'sort', 'filter', 'excel'],
  component: lazy(() => import('./CsvViewer')),
};
export default meta;
