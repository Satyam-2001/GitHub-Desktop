import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface LoadMoreSectionProps {
  hasMoreCommits: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export const LoadMoreSection: React.FC<LoadMoreSectionProps> = ({
  hasMoreCommits,
  isLoading,
  onLoadMore,
}) => {
  if (!hasMoreCommits) return null;

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      p: 2,
      borderTop: '1px solid var(--vscode-sideBarSectionHeader-border)'
    }}>
      {isLoading ? (
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