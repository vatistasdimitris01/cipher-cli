import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Auth from './Auth';
import './index.css';

function Router() {
  const path = window.location.pathname;
  
  if (path.startsWith('/auth')) {
    return <Auth />;
  }
  
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>
);