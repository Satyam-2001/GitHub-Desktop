import React from 'react';
import { Box, Button } from '@mui/material';

interface TimelineTabsProps {
  activeTab: 'changes' | 'history';
  onTabChange: (tab: 'changes' | 'history') => void;
}

export const TimelineTabs: React.FC<TimelineTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <Box sx={{
      display: 'flex',
      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
      bgcolor: 'var(--vscode-sideBar-background)'
    }}>
      <Button
        onClick={() => onTabChange('changes')}
        sx={{
          flex: 1,
          py: 1.5,
          fontSize: '13px',
          fontWeight: activeTab === 'changes' ? 600 : 400,
          color: activeTab === 'changes'
            ? 'var(--vscode-foreground)'
            : 'var(--vscode-descriptionForeground)',
          bgcolor: activeTab === 'changes'
            ? 'var(--vscode-tab-activeBackground)'
            : 'transparent',
          borderRadius: 0,
          borderBottom: activeTab === 'changes'
            ? '2px solid var(--vscode-focusBorder)'
            : '2px solid transparent',
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'var(--vscode-list-hoverBackground)'
          }
        }}
      >
        Changes (0)
      </Button>

      <Button
        onClick={() => onTabChange('history')}
        sx={{
          flex: 1,
          py: 1.5,
          fontSize: '13px',
          fontWeight: activeTab === 'history' ? 600 : 400,
          color: activeTab === 'history'
            ? 'var(--vscode-foreground)'
            : 'var(--vscode-descriptionForeground)',
          bgcolor: activeTab === 'history'
            ? 'var(--vscode-tab-activeBackground)'
            : 'transparent',
          borderRadius: 0,
          borderBottom: activeTab === 'history'
            ? '2px solid var(--vscode-focusBorder)'
            : '2px solid transparent',
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'var(--vscode-list-hoverBackground)'
          }
        }}
      >
        History (50)
      </Button>
    </Box>
  );
};