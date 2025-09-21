import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
} from '@mui/material';

interface NewBranchDialogProps {
  open: boolean;
  branchName: string;
  onClose: () => void;
  onBranchNameChange: (name: string) => void;
  onConfirm: () => void;
}

export const NewBranchDialog: React.FC<NewBranchDialogProps> = ({
  open,
  branchName,
  onClose,
  onBranchNameChange,
  onConfirm,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create New Branch</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Enter a name for the new branch:
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          value={branchName}
          onChange={(e) => onBranchNameChange(e.target.value)}
          placeholder="feature/new-feature"
          onKeyPress={handleKeyPress}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ color: 'var(--vscode-button-secondaryForeground)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!branchName.trim()}
          sx={{
            bgcolor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)'
            }
          }}
        >
          Create Branch
        </Button>
      </DialogActions>
    </Dialog>
  );
};