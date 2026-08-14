import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MykBrainPage } from './components/MykBrainPage.tsx';
import './index.css';

const path = window.location.pathname;
const RootComponent = path === '/account' || path === '/account/' ? MykBrainPage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
