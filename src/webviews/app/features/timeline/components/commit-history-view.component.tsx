import React, { useState } from 'react';
import { Box } from '@mui/material';
import { CommitList } from '../../commits/components/commit-list.component';
import { CommitContextMenu } from '../../commits/components/commit-context-menu.component';
import { useCommits } from '../../commits/hooks/use-commits.hook';
import { Commit } from '../../../domain/entities/commit.entity';

export const CommitHistoryView: React.FC = () => {
  const { commits, loading, hasMore, loadMore, refresh } = useCommits();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    commit: Commit | null;
  } | null>(null);

  const handleCommitSelect = (commit: Commit) => {
    // Open commit detail panel or navigate to commit detail view
    console.log('Selected commit:', commit.fullHash);
  };

  const handleCommitContextMenu = (event: React.MouseEvent, commit: Commit) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      commit,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <CommitList
        commits={commits}
        loading={loading}
        hasMore={hasMore}
        onCommitSelect={handleCommitSelect}
        onCommitContextMenu={handleCommitContextMenu}
        onLoadMore={loadMore}
      />

      {contextMenu && (
        <CommitContextMenu
          commit={contextMenu.commit}
          anchorPosition={{
            top: contextMenu.mouseY,
            left: contextMenu.mouseX
          }}
          open={Boolean(contextMenu)}
          onClose={handleContextMenuClose}
        />
      )}
    </Box>
  );
};