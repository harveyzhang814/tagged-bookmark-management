import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import '../../styles/global.css';
import i18n from '../../i18n/config';
import { OptionsApp } from './OptionsApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <OptionsApp />
    </I18nextProvider>
  </React.StrictMode>
);


