import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import Home from '@/pages/Home';
import ToolPage from '@/pages/ToolPage';
import NotFound from '@/pages/NotFound';

const Privacy = lazy(() => import('@/pages/Privacy'));
const About = lazy(() => import('@/pages/About'));

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/tools/:slug', element: <ToolPage /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
