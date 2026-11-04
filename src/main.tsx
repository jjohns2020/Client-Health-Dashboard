import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CommandCenterHost } from './platform/CommandCenterHost';
import './styles/global.css';
import './styles/platform.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CommandCenterHost />
  </StrictMode>,
);
