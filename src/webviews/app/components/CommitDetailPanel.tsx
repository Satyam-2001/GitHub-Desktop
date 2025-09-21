import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { VSCodeBridge } from '../bridge';

interface CommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  avatarUrl?: string;
  files: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
  totalAdditions: number;
  totalDeletions: number;
}

interface CommitDetailPanelProps {
  commit: CommitDetail | null;
  onClose: () => void;
  bridge: VSCodeBridge;
}

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({
  commit,
  onClose,
  bridge,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!commit) return null;

  const getStatusColor = (status: string) => {
    switch (status.charAt(0)) {
      case 'M': return '#f59e0b'; // Modified - amber
      case 'A': return '#10b981'; // Added - green
      case 'D': return '#ef4444'; // Deleted - red
      case 'R': return '#8b5cf6'; // Renamed - purple
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.charAt(0)) {
      case 'A': return <AddIcon sx={{ fontSize: 12, color: '#10b981' }} />;
      case 'D': return <RemoveIcon sx={{ fontSize: 12, color: '#ef4444' }} />;
      default: return <FileIcon sx={{ fontSize: 12, color: '#f59e0b' }} />;
    }
  };

  const generateAvatarUrl = (email: string) => {
    // Generate a simple avatar URL - in real implementation you'd use GitHub API or Gravatar
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
    const colorIndex = email.charCodeAt(0) % colors.length;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(commit.author)}&background=${colors[colorIndex].slice(1)}&color=fff&size=32`;
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setLoading(true);
    setFileDiff(null);

    // Request file diff from backend
    bridge.sendMessage('getFileDiff', {
      hash: commit.hash,
      filePath
    });
  };

  const handleBackToFileList = () => {
    setSelectedFile(null);
    setFileDiff(null);
  };

  // Listen for file diff response
  React.useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.command === 'fileDiff' && message.filePath === selectedFile) {
        setFileDiff(message.diff);
        setLoading(false);
      }
    };

    bridge.onMessage(handleMessage);
  }, [bridge, selectedFile]);

  const renderDiffLine = (line: string, index: number) => {
    let lineClass = '';
    let backgroundColor = '';

    if (line.startsWith('+')) {
      lineClass = 'diff-addition';
      backgroundColor = 'rgba(16, 185, 129, 0.1)';
    } else if (line.startsWith('-')) {
      lineClass = 'diff-deletion';
      backgroundColor = 'rgba(239, 68, 68, 0.1)';
    } else if (line.startsWith('@@')) {
      lineClass = 'diff-hunk';
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }

    return (
      <Box
        key={index}
        sx={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: 1.4,
          whiteSpace: 'pre',
          px: 1,
          py: 0.25,
          backgroundColor,
          borderLeft: line.startsWith('+') ? '3px solid #10b981' :
                     line.startsWith('-') ? '3px solid #ef4444' :
                     'none',
          color: line.startsWith('+') ? '#10b981' :
                 line.startsWith('-') ? '#ef4444' :
                 line.startsWith('@@') ? '#3b82f6' :
                 'var(--vscode-foreground)',
        }}
      >
        {line || ' '}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: 400,
        height: '100%',
        bgcolor: 'var(--vscode-sideBar-background)',
        borderLeft: '1px solid var(--vscode-sideBarSectionHeader-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
          bgcolor: 'var(--vscode-sideBar-background)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedFile && (
              <IconButton
                onClick={handleBackToFileList}
                size="small"
                sx={{
                  color: 'var(--vscode-foreground)',
                  '&:hover': {
                    bgcolor: 'var(--vscode-list-hoverBackground)',
                  },
                }}
              >
                <BackIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--vscode-foreground)',
              }}
            >
              {selectedFile ? selectedFile : 'Commit Details'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--vscode-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-list-hoverBackground)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Commit Info - Only show when not viewing a file */}
        {!selectedFile && (
          <>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--vscode-foreground)',
                mb: 1,
                lineHeight: 1.4,
              }}
            >
              {commit.message}
            </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            src={commit.avatarUrl || generateAvatarUrl(commit.email)}
            sx={{
              width: 24,
              height: 24,
              fontSize: '11px',
              bgcolor: 'var(--vscode-button-background)',
            }}
          >
            {commit.author.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontSize: '13px',
                color: 'var(--vscode-foreground)',
                fontWeight: 500,
              }}
            >
              {commit.author}
            </Typography>
            <Typography
              sx={{
                fontSize: '11px',
                color: 'var(--vscode-descriptionForeground)',
              }}
            >
              {commit.date}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--vscode-descriptionForeground)',
              bgcolor: 'var(--vscode-input-background)',
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
            }}
          >
            {commit.hash.substring(0, 7)}
          </Typography>
          <Chip
            icon={<AddIcon sx={{ fontSize: 12 }} />}
            label={`+${commit.totalAdditions}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              '& .MuiChip-icon': { color: '#10b981' },
            }}
          />
          <Chip
            icon={<RemoveIcon sx={{ fontSize: 12 }} />}
            label={`-${commit.totalDeletions}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              '& .MuiChip-icon': { color: '#ef4444' },
            }}
          />
          <Typography
            sx={{
              fontSize: '11px',
              color: 'var(--vscode-descriptionForeground)',
              ml: 1,
            }}
          >
            {commit.files.length} files
          </Typography>
        </Box>
          </>
        )}
      </Box>

      {/* Content Area */}
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
      >
        {!selectedFile ? (
          <>
            {/* Files List */}
            <Typography
              sx={{
                px: 2,
                py: 1,
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--vscode-foreground)',
                bgcolor: 'var(--vscode-sideBar-background)',
                borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
              }}
            >
              Changed Files ({commit.files.length})
            </Typography>

            <List sx={{ py: 0 }}>
              {commit.files.map((file, index) => (
                <ListItem
                  key={index}
                  sx={{
                    py: 1,
                    px: 2,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
                    '&:hover': {
                      bgcolor: 'var(--vscode-list-hoverBackground)',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                  onClick={() => handleFileSelect(file.path)}
                >
              <ListItemIcon sx={{ minWidth: 20, mr: 1 }}>
                {getStatusIcon(file.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        color: 'var(--vscode-foreground)',
                        mb: 0.5,
                        wordBreak: 'break-all',
                      }}
                    >
                      {file.path}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={file.status}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '10px',
                          fontWeight: 500,
                          bgcolor: getStatusColor(file.status),
                          color: 'white',
                        }}
                      />
                      {file.additions > 0 && (
                        <Typography
                          sx={{
                            fontSize: '11px',
                            color: '#10b981',
                            fontWeight: 500,
                          }}
                        >
                          +{file.additions}
                        </Typography>
                      )}
                      {file.deletions > 0 && (
                        <Typography
                          sx={{
                            fontSize: '11px',
                            color: '#ef4444',
                            fontWeight: 500,
                          }}
                        >
                          -{file.deletions}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {commit.files.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 100,
              color: 'var(--vscode-descriptionForeground)',
            }}
          >
            <Typography sx={{ fontSize: '13px' }}>No files changed</Typography>
          </Box>
        )}
          </>
        ) : (
          /* File Diff View */
          <Box sx={{ height: '100%' }}>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  gap: 2,
                }}
              >
                <CircularProgress size={20} />
                <Typography sx={{ fontSize: '13px', color: 'var(--vscode-descriptionForeground)' }}>
                  Loading diff...
                </Typography>
              </Box>
            ) : fileDiff ? (
              <Box
                sx={{
                  bgcolor: 'var(--vscode-editor-background)',
                  border: '1px solid var(--vscode-sideBarSectionHeader-border)',
                  borderRadius: 1,
                  overflow: 'auto',
                  height: '100%',
                }}
              >
                {fileDiff.split('\n').map((line, index) => renderDiffLine(line, index))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  color: 'var(--vscode-descriptionForeground)',
                }}
              >
                <Typography sx={{ fontSize: '13px' }}>No diff available</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};