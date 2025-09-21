import React from 'react';
import { Box, Typography, List } from '@mui/material';
import { GitCommit } from '../../../bridge';
import { CommitListItem } from './CommitListItem';
import { LoadMoreSection } from './LoadMoreSection';

interface HistoryViewProps {
  allCommits: GitCommit[];
  selectedCommitHash: string | null;
  hasMoreCommits: boolean;
  isLoadingMore: boolean;
  onCommitSelect: (commit: GitCommit) => void;
  onCommitContextMenu: (event: React.MouseEvent, commit: GitCommit) => void;
  onLoadMoreCommits: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  allCommits,
  selectedCommitHash,
  hasMoreCommits,
  isLoadingMore,
  onCommitSelect,
  onCommitContextMenu,
  onLoadMoreCommits,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--vscode-scrollbarSlider-background)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--vscode-scrollbarSlider-background)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'var(--vscode-scrollbarSlider-hoverBackground)',
        },
      }}
      onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Load more when scrolled to bottom
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMoreCommits && !isLoadingMore) {
          onLoadMoreCommits();
        }
      }}
    >
      <List sx={{ py: 0 }}>
        {allCommits.map((commit) => (
          <CommitListItem
            key={commit.hash}
            commit={commit}
            isSelected={selectedCommitHash === commit.hash}
            onSelect={onCommitSelect}
            onContextMenu={onCommitContextMenu}
          />
        ))}
      </List>

      <LoadMoreSection
        hasMoreCommits={hasMoreCommits}
        isLoading={isLoadingMore}
        onLoadMore={onLoadMoreCommits}
      />

      {allCommits.length === 0 && !isLoadingMore && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: 'var(--vscode-descriptionForeground)'
        }}>
          <Typography sx={{ fontSize: '14px', textAlign: 'center' }}>
            No commits yet
          </Typography>
          <Typography sx={{ fontSize: '12px', textAlign: 'center', mt: 1 }}>
            Create your first commit to see history
          </Typography>
        </Box>
      )}
    </Box>
  );
};