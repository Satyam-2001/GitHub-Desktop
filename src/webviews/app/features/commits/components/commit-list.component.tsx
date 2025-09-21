import React from 'react';
import { Box, List } from '@mui/material';
import { Commit } from '../../../domain/entities/commit.entity';
import { CommitListItem } from './commit-list-item.component';
import { LoadMoreButton } from './load-more-button.component';

interface CommitListProps {
  commits: Commit[];
  loading: boolean;
  hasMore: boolean;
  onCommitSelect: (commit: Commit) => void;
  onCommitContextMenu: (event: React.MouseEvent, commit: Commit) => void;
  onLoadMore: () => void;
}

export const CommitList: React.FC<CommitListProps> = ({
  commits,
  loading,
  hasMore,
  onCommitSelect,
  onCommitContextMenu,
  onLoadMore
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
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
          onLoadMore();
        }
      }}
    >
      <List sx={{ py: 0 }}>
        {commits.map((commit) => (
          <CommitListItem
            key={commit.fullHash}
            commit={commit}
            onClick={() => onCommitSelect(commit)}
            onContextMenu={(e) => onCommitContextMenu(e, commit)}
          />
        ))}
      </List>

      <LoadMoreButton
        hasMore={hasMore}
        loading={loading}
        onLoadMore={onLoadMore}
      />
    </Box>
  );
};