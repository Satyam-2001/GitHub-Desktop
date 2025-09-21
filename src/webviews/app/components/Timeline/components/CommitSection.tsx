import React from 'react';
import { Box, Button, TextField, IconButton } from '@mui/material';
import { CloudUpload as PushIcon, CloudDownload as PullIcon } from '@mui/icons-material';

interface CommitSectionProps {
  commitMessage: string;
  currentBranch: string | null;
  onCommitMessageChange: (message: string) => void;
  onCommit: () => void;
  onPush: () => void;
  onPull: () => void;
}

export const CommitSection: React.FC<CommitSectionProps> = ({
  commitMessage,
  currentBranch,
  onCommitMessageChange,
  onCommit,
  onPush,
  onPull,
}) => {
  return (
    <Box sx={{
      px: 2,
      py: 2,
      borderTop: '1px solid var(--vscode-sideBarSectionHeader-border)',
      bgcolor: 'var(--vscode-sideBar-background)'
    }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder="Summary (required)"
        value={commitMessage}
        onChange={(e) => onCommitMessageChange(e.target.value)}
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            fontSize: '13px',
            '& fieldset': {
              borderColor: 'var(--vscode-input-border)'
            },
            '&:hover fieldset': {
              borderColor: 'var(--vscode-inputOption-hoverBackground)'
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--vscode-focusBorder)'
            }
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'var(--vscode-input-placeholderForeground)',
            opacity: 1
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={onCommit}
          disabled={!commitMessage.trim()}
          sx={{
            flex: 1,
            bgcolor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            fontSize: '13px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)'
            },
            '&:disabled': {
              bgcolor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)'
            }
          }}
        >
          Commit to {currentBranch}
        </Button>
        <IconButton
          onClick={onPush}
          sx={{
            color: 'var(--vscode-foreground)',
            '&:hover': {
              bgcolor: 'var(--vscode-list-hoverBackground)'
            }
          }}
        >
          <PushIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          onClick={onPull}
          sx={{
            color: 'var(--vscode-foreground)',
            '&:hover': {
              bgcolor: 'var(--vscode-list-hoverBackground)'
            }
          }}
        >
          <PullIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
};