import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createVSCodeBridge, InitialWebviewState, VSCodeApi } from "./app/bridge";

declare global {
  interface Window {
    vscodeApi: VSCodeApi;
    initialData?: InitialWebviewState;
  }
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Failed to locate root element for GitHub Desktop UI");
}

const bridge = createVSCodeBridge(window.vscodeApi);
const fallbackState: InitialWebviewState = {
  changes: [],
  history: [],
  branches: [],
  currentBranch: null,
  repository: null,
  accounts: [],
  activeAccount: null,
};
const initialState: InitialWebviewState = { ...fallbackState, ...(window.initialData ?? {}) };

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App bridge={bridge} initialState={initialState} />
  </React.StrictMode>
);