import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import FeConfigProvider from './DataProviders/FeConfigProvider';
import './bootstrap.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <FeConfigProvider>
        <App />
      </FeConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
