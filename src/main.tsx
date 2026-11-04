import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClientHealthApp } from './platform/ClientHealthApp';
import './styles/global.css';
import './styles/platform.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClientHealthApp />
  </StrictMode>,
);
