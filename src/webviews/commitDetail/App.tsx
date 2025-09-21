import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { VSCodeBridge } from '../app/bridge';
import { CommitDetailPanel } from '../app/components/CommitDetailPanel/CommitDetailPanel';

interface CommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  files: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
    iconUri?: string;
    iconClass?: string;
  }>;
  totalAdditions: number;
  totalDeletions: number;
}

interface AppProps {
  bridge: VSCodeBridge;
}

export const App: React.FC<AppProps> = ({ bridge }) => {
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);

  useEffect(() => {
    bridge.onMessage((message) => {
      if (message.command === 'commitDetails') {
        setCommitDetail(message.commitDetail);
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
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-editor-foreground)',
            fontFamily: 'var(--vscode-font-family)',
            fontSize: 'var(--vscode-font-size, 13px)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {commitDetail ? (
        <CommitDetailPanel
          commit={commitDetail}
          onClose={() => {
            // Close the webview panel
            bridge.sendMessage('close');
          }}
          bridge={bridge}
        />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--vscode-foreground)'
        }}>
          Loading commit details...
        </div>
      )}
    </ThemeProvider>
  );
};
