import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { GitChange } from '../../../bridge';
import { getStatusColor } from '../utils/timeline.utils';

interface FileChangesListProps {
  title: string;
  changes: GitChange[];
  selectedFiles: Set<string>;
  onFileToggle: (filePath: string) => void;
  onActionClick?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

export const FileChangesList: React.FC<FileChangesListProps> = ({
  title,
  changes,
  selectedFiles,
  onFileToggle,
  onActionClick,
  actionLabel,
  actionIcon,
}) => {
  if (changes.length === 0) return null;

  return (
    <Box>
      <Box sx={{
        px: 2,
        py: 1.5,
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography sx={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--vscode-foreground)'
        }}>
          {title} ({changes.length})
        </Typography>
        {selectedFiles.size > 0 && onActionClick && actionLabel && (
          <Button
            onClick={onActionClick}
            size="small"
            startIcon={actionIcon}
            sx={{
              fontSize: '11px',
              textTransform: 'none',
              color: 'var(--vscode-foreground)',
              minHeight: 'auto',
              py: 0.5
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
      <List sx={{ py: 0 }}>
        {changes.map((change) => (
          <ListItem
            key={change.path}
            sx={{
              py: 0.75,
              px: 0,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'var(--vscode-list-hoverBackground)'
              }
            }}
            onClick={() => onFileToggle(change.path)}
          >
            <ListItemIcon sx={{ minWidth: 24, ml: 2 }}>
              <Checkbox
                checked={selectedFiles.has(change.path)}
                size="small"
                sx={{
                  color: 'var(--vscode-checkbox-border)',
                  '&.Mui-checked': {
                    color: 'var(--vscode-checkbox-background)'
                  }
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-foreground)'
                }}>
                  {change.path}
                </Typography>
              }
              secondary={
                <Chip
                  label={change.status}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '10px',
                    fontWeight: 500,
                    bgcolor: getStatusColor(change.status),
                    color: 'white',
                    mt: 0.5
                  }}
                />
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};