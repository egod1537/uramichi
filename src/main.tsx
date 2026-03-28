import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { bindPlannerEvents } from './services/PlannerBindings';
import { bindPlannerUrlSync } from './services/PlannerUrlSync';
import './shared/constants/tokens.css';
import './styles.css';
import './workspace.css';

bindPlannerEvents();
bindPlannerUrlSync();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
