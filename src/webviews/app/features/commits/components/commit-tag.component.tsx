import React from 'react';
import { Chip } from '@mui/material';
import { LocalOffer as TagIcon } from '@mui/icons-material';

interface CommitTagProps {
  tag: string;
}

export const CommitTag: React.FC<CommitTagProps> = ({ tag }) => {
  return (
    <Chip
      label={tag}
      size="small"
      icon={<TagIcon />}
      sx={{
        height: '18px',
        fontSize: '11px',
        bgcolor: 'var(--vscode-badge-background)',
        color: 'var(--vscode-badge-foreground)',
        borderRadius: '10px',
        '& .MuiChip-icon': {
          fontSize: '12px',
          marginLeft: '4px',
          color: 'var(--vscode-badge-foreground)'
        },
        '& .MuiChip-label': {
          px: 0.8,
          py: 0
        }
      }}
    />
  );
};