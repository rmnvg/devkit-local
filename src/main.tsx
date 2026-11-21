import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

function App() {
  return <h1 className="p-8 text-2xl font-semibold">devkit-local</h1>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
