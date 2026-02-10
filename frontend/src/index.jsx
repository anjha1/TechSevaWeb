/**
 * React Frontend Entry Point
 * Main application with routing setup
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './components/MessageBox';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <MessageProvider>
                    <App />
                </MessageProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
