import React from 'react';
import { Box, Typography, TextField, Button, Divider } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Check as CheckIcon,
  Sync as SyncIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { GitChange } from '../../../bridge';
import { FileChangesList } from './FileChangesList';

interface ChangesViewProps {
  changes: GitChange[];
  selectedFiles: Set<string>;
  commitMessage: string;
  currentBranch: string | null;
  onFileToggle: (filePath: string) => void;
  onStageFiles: () => void;
  onUnstageFiles: () => void;
  onCommitMessageChange: (message: string) => void;
  onCommit: () => void;
  onPush: () => void;
  onPull: () => void;
}

export const ChangesView: React.FC<ChangesViewProps> = ({
  changes,
  selectedFiles,
  commitMessage,
  currentBranch,
  onFileToggle,
  onStageFiles,
  onUnstageFiles,
  onCommitMessageChange,
  onCommit,
  onPush,
  onPull,
}) => {
  const stagedChanges = (changes || []).filter(c => c.staged);
  const unstagedChanges = (changes || []).filter(c => !c.staged);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Commit Message Section */}
      <Box sx={{
        p: 1,
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)'
      }}>
        <TextField
          multiline
          fullWidth
          placeholder="Message (press Ctrl+Enter to commit)"
          value={commitMessage}
          onChange={(e) => onCommitMessageChange(e.target.value)}
          variant="outlined"
          size="small"
          minRows={2}
          maxRows={4}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '13px',
              bgcolor: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              '& fieldset': {
                borderColor: 'var(--vscode-input-border)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--vscode-input-border)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--vscode-focusBorder)',
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--vscode-input-placeholderForeground)',
              opacity: 1,
            }
          }}
        />

        {/* Commit Actions */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          mt: 1,
          alignItems: 'center'
        }}>
          <Button
            variant="contained"
            onClick={onCommit}
            disabled={!commitMessage.trim() || stagedChanges.length === 0}
            startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '12px',
              textTransform: 'none',
              bgcolor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-button-hoverBackground)',
              },
              '&:disabled': {
                bgcolor: 'var(--vscode-button-secondaryBackground)',
                color: 'var(--vscode-button-secondaryForeground)',
              }
            }}
          >
            Commit
          </Button>

          <Button
            variant="outlined"
            onClick={onPush}
            startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: '12px',
              textTransform: 'none',
              borderColor: 'var(--vscode-button-border)',
              color: 'var(--vscode-button-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-button-hoverBackground)',
                borderColor: 'var(--vscode-button-border)',
              }
            }}
          >
            Sync Changes
          </Button>

          <Button
            size="small"
            sx={{
              minWidth: 'auto',
              p: 0.5,
              color: 'var(--vscode-button-foreground)'
            }}
          >
            <MoreIcon sx={{ fontSize: 16 }} />
          </Button>
        </Box>
      </Box>

      {/* Changes List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {stagedChanges.length > 0 && (
          <FileChangesList
            title="Staged Changes"
            changes={stagedChanges}
            selectedFiles={selectedFiles}
            onFileToggle={onFileToggle}
            onActionClick={onUnstageFiles}
            actionLabel="Unstage All"
            actionIcon={<RemoveIcon sx={{ fontSize: 14 }} />}
          />
        )}

        {unstagedChanges.length > 0 && (
          <FileChangesList
            title="Changes"
            changes={unstagedChanges}
            selectedFiles={selectedFiles}
            onFileToggle={onFileToggle}
            onActionClick={onStageFiles}
            actionLabel="Stage All"
            actionIcon={<AddIcon sx={{ fontSize: 14 }} />}
          />
        )}

        {changes.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            p: 2,
            textAlign: 'center'
          }}>
            <CheckIcon sx={{
              fontSize: 48,
              color: 'var(--vscode-descriptionForeground)',
              mb: 2
            }} />
            <Typography sx={{
              fontSize: '14px',
              color: 'var(--vscode-foreground)',
              mb: 1
            }}>
              No changes
            </Typography>
            <Typography sx={{
              fontSize: '12px',
              color: 'var(--vscode-descriptionForeground)'
            }}>
              The working tree is clean. There are no changes to commit.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};