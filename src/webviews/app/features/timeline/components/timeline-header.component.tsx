import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Refresh as RefreshIcon, CallSplit as NewBranchIcon } from '@mui/icons-material';
import { BranchDropdown } from '../../branches/components/branch-dropdown.component';
import { useBranches } from '../../branches/hooks/use-branches.hook';
import { CreateBranchDialog } from '../../branches/components/create-branch-dialog.component';

export const TimelineHeader: React.FC = () => {
  const { branches, currentBranch, refresh, switchToBranch } = useBranches();
  const [createBranchOpen, setCreateBranchOpen] = React.useState(false);

  const handleRefresh = () => {
    refresh();
  };

  const handleCreateBranch = () => {
    setCreateBranchOpen(true);
  };

  return (
    <>
      <Box sx={{
        px: 0,
        py: 1,
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
        bgcolor: 'var(--vscode-sideBar-background)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 2 }}>
          <BranchDropdown
            currentBranch={currentBranch}
            branches={branches}
            onBranchSelect={switchToBranch}
          />

          <IconButton
            onClick={handleCreateBranch}
            size="small"
            sx={{
              ml: 'auto',
              mr: 1,
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
            onClick={handleRefresh}
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

      <CreateBranchDialog
        open={createBranchOpen}
        onClose={() => setCreateBranchOpen(false)}
      />
    </>
  );
};