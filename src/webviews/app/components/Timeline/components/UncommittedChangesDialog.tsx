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

interface UncommittedChangesDialogProps {
  open: boolean;
  branchName: string;
  onClose: () => void;
  onBranchNameChange: (name: string) => void;
  onLeaveChanges: () => void;
  onBringChanges: () => void;
}

export const UncommittedChangesDialog: React.FC<UncommittedChangesDialogProps> = ({
  open,
  branchName,
  onClose,
  onBranchNameChange,
  onLeaveChanges,
  onBringChanges,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Uncommitted Changes</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          You have uncommitted changes. What would you like to do with them?
        </DialogContentText>
        <TextField
          fullWidth
          value={branchName}
          onChange={(e) => onBranchNameChange(e.target.value)}
          placeholder="feature/new-feature"
          label="New branch name"
          sx={{ mb: 2 }}
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
          onClick={onLeaveChanges}
          disabled={!branchName.trim()}
          sx={{ color: 'var(--vscode-button-secondaryForeground)' }}
        >
          Leave Changes
        </Button>
        <Button
          onClick={onBringChanges}
          disabled={!branchName.trim()}
          sx={{
            bgcolor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)'
            }
          }}
        >
          Bring Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};