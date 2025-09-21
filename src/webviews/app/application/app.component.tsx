import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceProvider } from '../shared/infrastructure/di/service-context';
import { configureServices } from '../shared/infrastructure/config/service-registration';
import { TimelineView } from '../features/timeline/components/timeline-view.component';

const queryClient = new QueryClient();
const serviceContainer = configureServices();

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: 'var(--vscode-font-family, "Segoe UI", system-ui, -apple-system, sans-serif)',
    fontSize: 13,
  },
});

interface AppProps {
  initialState?: any;
}

export const App: React.FC<AppProps> = ({ initialState }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <ServiceProvider container={serviceContainer}>
          <TimelineView initialState={initialState} />
        </ServiceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};