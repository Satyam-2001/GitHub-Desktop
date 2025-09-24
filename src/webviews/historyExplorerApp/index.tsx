import React from "react";
import { createRoot } from "react-dom/client";
import { createVSCodeBridge } from "../app/bridge";
import { HistoryExplorerApp } from "./HistoryExplorerApp";
import { HistoryExplorerInitialState } from "@webview/historyExplorer/types/history-explorer.types";

declare global {
  interface Window {
    vscodeApi: any;
    historyExplorerInitialState?: HistoryExplorerInitialState;
  }
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("History explorer root element was not found");
}

const bridge = createVSCodeBridge(window.vscodeApi);
const initialState =
  window.historyExplorerInitialState ?? {
    graphLines: [],
    commits: [],
    filters: {},
    branches: [],
    authors: [],
    hasMore: false,
    offset: 0,
    repository: null,
  };

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <HistoryExplorerApp bridge={bridge} initialState={initialState} />
  </React.StrictMode>,
);
