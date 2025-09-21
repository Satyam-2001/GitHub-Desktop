import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VSCodeBridge, InitialWebviewState } from './bridge';
import { Timeline } from './components/Timeline';

interface AppProps {
  bridge: VSCodeBridge;
  initialState: InitialWebviewState;
}

const queryClient = new QueryClient();

export const App: React.FC<AppProps> = ({ bridge, initialState }) => {
  const [state, setState] = useState(initialState);
  const [branchActivity, setBranchActivity] = useState<Record<string, string>>({});

  useEffect(() => {
    // Send ready message to request initial data
    bridge.sendMessage('ready');

    bridge.onMessage((message) => {
      switch (message.command) {
        case 'updateChanges':
          setState((prev) => ({ ...prev, changes: message.changes }));
          break;
        case 'updateHistory':
          setState((prev) => ({
            ...prev,
            history: message.history,
            hasMoreCommits: message.hasMoreCommits,
            commitsOffset: message.offset
          }));
          break;
        case 'updateBranches':
          setState((prev) => ({
            ...prev,
            branches: message.branches,
            currentBranch: message.currentBranch,
          }));
          if (message.branchActivity) {
            setBranchActivity(message.branchActivity);
          }
          break;
        case 'updateRepository':
          setState((prev) => ({ ...prev, repository: message.repository }));
          break;
        case 'updateAccounts':
          setState((prev) => ({
            ...prev,
            accounts: message.accounts,
            activeAccount: message.activeAccount,
          }));
          break;
      }
    });
  }, [bridge]);

  // Create a minimal theme that respects VS Code CSS variables
  const theme = createTheme({
    palette: {
      mode: 'dark', // We'll use CSS variables instead of theme colors
    },
    typography: {
      fontFamily: 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif)',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            backgroundColor: 'var(--vscode-sideBar-background)',
            color: 'var(--vscode-foreground)',
            fontFamily: 'var(--vscode-font-family)',
            fontSize: 'var(--vscode-font-size, 13px)',
          },
        },
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Timeline
          changes={state.changes || []}
          history={state.history || []}
          branches={state.branches || []}
          branchActivity={branchActivity || {}}
          currentBranch={state.currentBranch}
          repository={state.repository}
          bridge={bridge}
          hasMoreCommits={state.hasMoreCommits}
          commitsOffset={state.commitsOffset}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
};