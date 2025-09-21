import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, AccountTree as BranchIcon } from '@mui/icons-material';
import { Branch } from '../../../domain/entities/branch.entity';

interface BranchDropdownProps {
  currentBranch: Branch | null;
  branches: Branch[];
  onBranchSelect: (branch: Branch) => void;
}

export const BranchDropdown: React.FC<BranchDropdownProps> = ({
  currentBranch,
  branches,
  onBranchSelect
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBranchSelect = (branch: Branch) => {
    onBranchSelect(branch);
    handleClose();
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'var(--vscode-list-hoverBackground)'
          }
        }}
      >
        <BranchIcon sx={{ fontSize: 16, color: 'var(--vscode-foreground)' }} />
        <Typography sx={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--vscode-foreground)',
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {currentBranch?.displayName || 'No branch'}
        </Typography>
        <ExpandMoreIcon sx={{ fontSize: 16, color: 'var(--vscode-foreground)' }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'var(--vscode-menu-background)',
            border: '1px solid var(--vscode-menu-border)',
            maxHeight: 300,
            minWidth: 200
          }
        }}
      >
        {branches.map((branch) => (
          <MenuItem
            key={branch.name.value}
            onClick={() => handleBranchSelect(branch)}
            selected={branch.name.equals(currentBranch?.name || new (require('../../../domain/value-objects/branch-name.vo').BranchName)(''))}
            sx={{
              fontSize: '13px',
              py: 1,
              color: 'var(--vscode-menu-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-menu-selectionBackground)',
                color: 'var(--vscode-menu-selectionForeground)'
              },
              '&.Mui-selected': {
                bgcolor: 'var(--vscode-menu-selectionBackground)',
                color: 'var(--vscode-menu-selectionForeground)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                {branch.displayName}
              </Typography>
              <Typography sx={{
                fontSize: '11px',
                color: 'var(--vscode-descriptionForeground)',
                mt: 0.25
              }}>
                {branch.activityText}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};