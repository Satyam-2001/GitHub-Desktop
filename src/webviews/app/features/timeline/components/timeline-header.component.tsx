import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  CallSplit as BranchIcon,
  KeyboardArrowDown as DropdownIcon,
  ArrowDownward as PullIcon
} from '@mui/icons-material';

export const TimelineHeader: React.FC = () => {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      px: 2,
      py: 1.5,
      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
      bgcolor: 'var(--vscode-sideBar-background)',
      minHeight: '48px'
    }}>
      {/* Branch Section */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'var(--vscode-list-hoverBackground)'
        },
        borderRadius: '3px',
        px: 1,
        py: 0.5
      }}>
        <BranchIcon sx={{
          fontSize: 16,
          color: 'var(--vscode-descriptionForeground)',
          mr: 1
        }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{
            fontSize: '11px',
            color: 'var(--vscode-descriptionForeground)',
            lineHeight: 1.2
          }}>
            Current branch
          </Typography>
          <Typography sx={{
            fontSize: '13px',
            color: 'var(--vscode-foreground)',
            fontWeight: 500,
            lineHeight: 1.2
          }}>
            dev
          </Typography>
        </Box>
        <DropdownIcon sx={{
          fontSize: 16,
          color: 'var(--vscode-descriptionForeground)'
        }} />
      </Box>

      {/* Pull Origin Section */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'var(--vscode-list-hoverBackground)'
        },
        borderRadius: '3px',
        px: 1,
        py: 0.5,
        ml: 1
      }}>
        <PullIcon sx={{
          fontSize: 16,
          color: 'var(--vscode-descriptionForeground)',
          mr: 1
        }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{
            fontSize: '13px',
            color: 'var(--vscode-foreground)',
            fontWeight: 500,
            lineHeight: 1.2
          }}>
            Pull origin
          </Typography>
          <Typography sx={{
            fontSize: '11px',
            color: 'var(--vscode-descriptionForeground)',
            lineHeight: 1.2
          }}>
            Last fetched 3...
          </Typography>
        </Box>

        {/* Sync Counters */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mr: 1
        }}>
          <Typography sx={{
            fontSize: '11px',
            color: 'var(--vscode-foreground)',
            bgcolor: 'var(--vscode-badge-background)',
            px: 0.5,
            borderRadius: '2px',
            minWidth: '16px',
            textAlign: 'center'
          }}>
            6
          </Typography>
          <PullIcon sx={{
            fontSize: 12,
            color: 'var(--vscode-descriptionForeground)'
          }} />
          <Typography sx={{
            fontSize: '11px',
            color: 'var(--vscode-foreground)',
            bgcolor: 'var(--vscode-badge-background)',
            px: 0.5,
            borderRadius: '2px',
            minWidth: '16px',
            textAlign: 'center'
          }}>
            51
          </Typography>
          <PullIcon sx={{
            fontSize: 12,
            color: 'var(--vscode-descriptionForeground)',
            transform: 'rotate(180deg)'
          }} />
        </Box>

        <DropdownIcon sx={{
          fontSize: 16,
          color: 'var(--vscode-descriptionForeground)'
        }} />
      </Box>
    </Box>
  );
};