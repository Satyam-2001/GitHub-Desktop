import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Refresh as RefreshIcon, CallSplit as NewBranchIcon } from '@mui/icons-material';
import { BranchDropdown } from '../BranchDropdown';
import { SyncButton } from '../SyncButton';
import { VSCodeBridge, RemoteStatus } from '../../../bridge';

interface TimelineHeaderProps {
  currentBranch: string | null;
  branches: string[];
  branchActivity: Record<string, string>;
  remoteStatus?: RemoteStatus | null;
  bridge: VSCodeBridge;
  onCreateNewBranch: () => void;
  onRefresh: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  currentBranch,
  branches,
  branchActivity,
  remoteStatus,
  bridge,
  onCreateNewBranch,
  onRefresh,
}) => {
  return (
    <Box sx={{
      px: 0,
      py: 1,
      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
      bgcolor: 'var(--vscode-sideBar-background)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 2, gap: 1 }}>
        <BranchDropdown
          currentBranch={currentBranch}
          branches={branches}
          branchActivity={branchActivity}
          bridge={bridge}
        />

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          {remoteStatus && (
            <SyncButton
              remoteStatus={remoteStatus}
              bridge={bridge}
            />
          )}

          <IconButton
            onClick={onCreateNewBranch}
            size="small"
            sx={{
              color: 'var(--vscode-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-list-hoverBackground)'
              }
            }}
            title="Create New Branch"
          >
            <NewBranchIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <IconButton
            onClick={onRefresh}
            size="small"
            sx={{
              color: 'var(--vscode-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-list-hoverBackground)'
              }
            }}
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};