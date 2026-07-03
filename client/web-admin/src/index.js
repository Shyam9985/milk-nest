import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';
import { AuthContextProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<ThemeContextProvider>
    <AuthContextProvider>
        <App />
    </AuthContextProvider>
</ThemeContextProvider>);
