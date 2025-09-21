import React from 'react';
import ReactDOM from 'react-dom/client';
import { createVSCodeBridge } from '../app/bridge';
import { App } from './App';

// Initialize the VS Code API bridge
const vscode = (window as any).vscodeApi;
const bridge = createVSCodeBridge(vscode);

// Render the React app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App bridge={bridge} />
    </React.StrictMode>
  );
}