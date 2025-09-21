import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { GitChange } from '../../../bridge';

interface FileChangesListProps {
  title: string;
  changes: GitChange[];
  selectedFiles: Set<string>;
  onFileToggle: (filePath: string) => void;
  onActionClick?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

const getStatusIndicator = (status: string) => {
  switch (status.toUpperCase()) {
    case 'M':
    case 'MODIFIED':
      return { label: 'M', color: '#569cd6' }; // Blue
    case 'A':
    case 'ADDED':
      return { label: 'A', color: '#4fc1ff' }; // Light blue
    case 'D':
    case 'DELETED':
      return { label: 'D', color: '#f85149' }; // Red
    case 'R':
    case 'RENAMED':
      return { label: 'R', color: '#a5a5a5' }; // Gray
    case 'U':
    case 'UNTRACKED':
      return { label: 'U', color: '#73c991' }; // Green
    default:
      return { label: '?', color: '#a5a5a5' };
  }
};

export const FileChangesList: React.FC<FileChangesListProps> = ({
  title,
  changes,
  selectedFiles,
  onFileToggle,
  onActionClick,
  actionLabel,
  actionIcon,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (changes.length === 0) return null;

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const getFileDirectory = (path: string) => {
    const parts = path.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  };

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        bgcolor: 'var(--vscode-sideBarSectionHeader-background)',
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
        cursor: 'pointer'
      }}
      onClick={() => setCollapsed(!collapsed)}
      >
        <IconButton
          size="small"
          sx={{
            p: 0,
            mr: 0.5,
            color: 'var(--vscode-sideBarSectionHeader-foreground)'
          }}
        >
          {collapsed ? <ArrowRightIcon sx={{ fontSize: 16 }} /> : <ArrowDownIcon sx={{ fontSize: 16 }} />}
        </IconButton>

        <Typography sx={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--vscode-sideBarSectionHeader-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flex: 1
        }}>
          {title}
        </Typography>

        <Typography sx={{
          fontSize: '11px',
          color: 'var(--vscode-sideBarSectionHeader-foreground)',
          mr: 1
        }}>
          {changes.length}
        </Typography>

        {onActionClick && actionLabel && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
            size="small"
            sx={{
              p: 0.25,
              color: 'var(--vscode-sideBarSectionHeader-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-toolbar-hoverBackground)'
              }
            }}
          >
            {actionIcon}
          </IconButton>
        )}
      </Box>

      {/* File List */}
      <Collapse in={!collapsed}>
        <List sx={{ py: 0 }}>
          {changes.map((change) => {
            const status = getStatusIndicator(change.status);
            const fileName = getFileName(change.path);
            const directory = getFileDirectory(change.path);

            return (
              <ListItem
                key={change.path}
                sx={{
                  py: 0.25,
                  px: 1,
                  cursor: 'pointer',
                  minHeight: 22,
                  '&:hover': {
                    bgcolor: 'var(--vscode-list-hoverBackground)'
                  },
                  '&:focus': {
                    bgcolor: 'var(--vscode-list-focusBackground)',
                    outline: 'none'
                  }
                }}
                onClick={() => onFileToggle(change.path)}
              >
                <ListItemIcon sx={{ minWidth: 20, mr: 0.5 }}>
                  <FileIcon sx={{
                    fontSize: 16,
                    color: 'var(--vscode-icon-foreground)'
                  }} />
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{
                        fontSize: '13px',
                        color: 'var(--vscode-foreground)',
                        lineHeight: 1
                      }}>
                        {fileName}
                      </Typography>
                      {directory && (
                        <Typography sx={{
                          fontSize: '11px',
                          color: 'var(--vscode-descriptionForeground)',
                          lineHeight: 1
                        }}>
                          {directory}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ my: 0 }}
                />

                <Typography sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: status.color,
                  minWidth: 12,
                  textAlign: 'center',
                  lineHeight: 1
                }}>
                  {status.label}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
};