import React from 'react';
import { Box, Button } from '@mui/material';
import { TabType } from '../types/timeline.types';
import { GitChange, GitCommit } from '../../../bridge';

interface TimelineTabsProps {
  activeTab: TabType;
  changes: GitChange[];
  history: GitCommit[];
  onTabChange: (tab: TabType) => void;
}

export const TimelineTabs: React.FC<TimelineTabsProps> = ({
  activeTab,
  changes,
  history,
  onTabChange,
}) => {
  const getTabButtonStyles = (isActive: boolean) => ({
    flex: 1,
    py: 1.5,
    px: 0,
    color: isActive ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
    borderBottom: isActive ? '2px solid var(--vscode-focusBorder)' : 'none',
    borderRadius: 0,
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'none' as const,
    '&:hover': {
      bgcolor: 'var(--vscode-list-hoverBackground)'
    }
  });

  return (
    <Box sx={{
      display: 'flex',
      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)'
    }}>
      <Button
        onClick={() => onTabChange('changes')}
        sx={getTabButtonStyles(activeTab === 'changes')}
      >
        Changes ({changes.length})
      </Button>
      <Button
        onClick={() => onTabChange('history')}
        sx={getTabButtonStyles(activeTab === 'history')}
      >
        History ({history.length})
      </Button>
    </Box>
  );
};