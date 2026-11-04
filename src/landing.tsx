import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Site } from './landing/Site';
import './styles/global.css';
import './landing/landing.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
