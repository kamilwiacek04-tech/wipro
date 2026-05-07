import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App'
import '@/i18n/i18n';
import { Provider } from 'react-redux';
import { store } from '@/store/index';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
