import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { ToastProvider } from '@/components/Toast';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  );
}
