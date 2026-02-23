import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'rgba(24,24,27,0.95)',
          border: '1px solid #27272a',
          color: '#fafafa',
          backdropFilter: 'blur(20px)',
          borderRadius: '14px',
          fontFamily: 'inherit',
        },
      }}
    />
  </React.StrictMode>
);
