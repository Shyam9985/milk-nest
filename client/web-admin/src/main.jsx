import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AuthContextProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/MessageContext';

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<ThemeContextProvider>
    <ToastProvider>
        <BrowserRouter>
            <AuthContextProvider>
                <App />
            </AuthContextProvider>
        </BrowserRouter>
    </ToastProvider>
</ThemeContextProvider>);
