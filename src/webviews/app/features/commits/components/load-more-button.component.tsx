import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface LoadMoreButtonProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  hasMore,
  loading,
  onLoadMore
}) => {
  if (!hasMore) return null;

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      p: 2,
      borderTop: '1px solid var(--vscode-sideBarSectionHeader-border)'
    }}>
      {loading ? (
        <Typography sx={{
          fontSize: '13px',
          color: 'var(--vscode-descriptionForeground)'
        }}>
          Loading more commits...
        </Typography>
      ) : (
        <Button
          size="small"
          onClick={onLoadMore}
          sx={{
            fontSize: '12px',
            textTransform: 'none',
            color: 'var(--vscode-button-foreground)',
            bgcolor: 'var(--vscode-button-background)',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)'
            }
          }}
        >
          Load More Commits
        </Button>
      )}
    </Box>
  );
};