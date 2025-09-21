import React from 'react';
import { Box, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { GitChange } from '../../../bridge';
import { FileChangesList } from './FileChangesList';
import { CommitSection } from './CommitSection';

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
    <>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <FileChangesList
          title="Staged Changes"
          changes={stagedChanges}
          selectedFiles={selectedFiles}
          onFileToggle={onFileToggle}
          onActionClick={selectedFiles.size > 0 ? onUnstageFiles : undefined}
          actionLabel="Unstage"
          actionIcon={<RemoveIcon sx={{ fontSize: 14 }} />}
        />

        <FileChangesList
          title="Changes"
          changes={unstagedChanges}
          selectedFiles={selectedFiles}
          onFileToggle={onFileToggle}
          onActionClick={selectedFiles.size > 0 ? onStageFiles : undefined}
          actionLabel="Stage"
          actionIcon={<AddIcon sx={{ fontSize: 14 }} />}
        />

        {changes.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--vscode-descriptionForeground)'
          }}>
            <Typography sx={{ fontSize: '14px', textAlign: 'center' }}>
              No changes
            </Typography>
            <Typography sx={{ fontSize: '12px', textAlign: 'center', mt: 1 }}>
              Your working directory is clean
            </Typography>
          </Box>
        )}
      </Box>

      {/* Commit Section - Only shown when there are staged changes */}
      {stagedChanges.length > 0 && (
        <CommitSection
          commitMessage={commitMessage}
          currentBranch={currentBranch}
          onCommitMessageChange={onCommitMessageChange}
          onCommit={onCommit}
          onPush={onPush}
          onPull={onPull}
        />
      )}
    </>
  );
};