import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import FeConfigProvider from './DataProviders/FeConfigProvider';
import {GoogleReCaptchaProvider} from 'react-google-recaptcha-v3';
import './bootstrap.css';
import './index.css';
import App from './App';
import './i18n.js';
import {recaptcha_key} from './const.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <FeConfigProvider>
        <GoogleReCaptchaProvider reCaptchaKey={recaptcha_key}>
          <App />
        </GoogleReCaptchaProvider>
      </FeConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
