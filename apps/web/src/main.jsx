import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App/>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              color: '#0F172A',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
              border: '1px solid rgba(226,232,240,0.8)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
