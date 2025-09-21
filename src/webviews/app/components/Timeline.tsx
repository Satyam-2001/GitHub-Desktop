import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Divider,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudUpload as PushIcon,
  CloudDownload as PullIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { VSCodeBridge, GitChange, GitCommit, Repository } from '../bridge';
import { BranchDropdown } from './BranchDropdown';
import { CommitDetailPanel } from './CommitDetailPanel';

interface TimelineProps {
  changes: GitChange[];
  history: GitCommit[];
  branches: string[];
  branchActivity: Record<string, string>;
  currentBranch: string | null;
  repository: Repository | null;
  bridge: VSCodeBridge;
}

export const Timeline: React.FC<TimelineProps> = ({
  changes,
  history,
  branches,
  branchActivity,
  currentBranch,
  repository,
  bridge,
}) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedCommit, setSelectedCommit] = useState<any>(null);
  const [showCommitDetail, setShowCommitDetail] = useState(false);

  const handleTabChange = (tab: 'changes' | 'history') => {
    setActiveTab(tab);
  };

  const handleFileToggle = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleStageFiles = () => {
    bridge.sendMessage('stageFiles', { files: Array.from(selectedFiles) });
    setSelectedFiles(new Set());
  };

  const handleUnstageFiles = () => {
    bridge.sendMessage('unstageFiles', { files: Array.from(selectedFiles) });
    setSelectedFiles(new Set());
  };

  const handleCommit = () => {
    if (commitMessage.trim()) {
      bridge.sendMessage('commit', { message: commitMessage });
      setCommitMessage('');
    }
  };

  const handlePush = () => {
    bridge.sendMessage('push');
  };

  const handlePull = () => {
    bridge.sendMessage('pull');
  };

  const handleRefresh = () => {
    bridge.sendMessage('refresh');
  };

  const handleCommitSelect = (commit: GitCommit) => {
    bridge.sendMessage('getCommitDetails', { hash: commit.hash });
  };

  const handleCommitDetailReceived = (commitDetail: any) => {
    setSelectedCommit(commitDetail);
    setShowCommitDetail(true);
  };

  // Listen for commit details from bridge
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.command === 'commitDetails') {
        handleCommitDetailReceived(message.commitDetail);
      }
    };

    bridge.onMessage(handleMessage);
  }, [bridge]);

  const handleCloseCommitDetail = () => {
    setShowCommitDetail(false);
    setSelectedCommit(null);
  };

  const generateAvatarUrl = (email: string, name: string) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
    const colorIndex = email.charCodeAt(0) % colors.length;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[colorIndex].slice(1)}&color=fff&size=32`;
  };


  const stagedChanges = changes.filter(c => c.staged);
  const unstagedChanges = changes.filter(c => !c.staged);

  const getStatusColor = (status: string) => {
    switch (status.charAt(0)) {
      case 'M': return '#f59e0b'; // Modified - amber
      case 'A': return '#10b981'; // Added - green
      case 'D': return '#ef4444'; // Deleted - red
      case 'R': return '#8b5cf6'; // Renamed - purple
      case '?': return '#6b7280'; // Untracked - gray
      default: return '#6b7280';
    }
  };

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'var(--vscode-sideBar-background)',
      color: 'var(--vscode-foreground)',
      fontFamily: 'var(--vscode-font-family)'
    }}>
      {/* Header */}
      <Box sx={{
        px: 0,
        py: 2,
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
        bgcolor: 'var(--vscode-sideBar-background)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 2 }}>
          <BranchDropdown
            currentBranch={currentBranch}
            branches={branches}
            branchActivity={branchActivity}
            bridge={bridge}
          />
          <IconButton
            onClick={handleRefresh}
            size="small"
            sx={{
              ml: 'auto',
              color: 'var(--vscode-foreground)',
              '&:hover': {
                bgcolor: 'var(--vscode-list-hoverBackground)'
              }
            }}
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{
          color: 'var(--vscode-descriptionForeground)',
          fontSize: '12px',
          px: 2
        }}>
          {repository?.name || 'No repository'}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{
        display: 'flex',
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)'
      }}>
        <Button
          onClick={() => handleTabChange('changes')}
          sx={{
            flex: 1,
            py: 1.5,
            px: 0,
            color: activeTab === 'changes' ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
            borderBottom: activeTab === 'changes' ? '2px solid var(--vscode-focusBorder)' : 'none',
            borderRadius: 0,
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'var(--vscode-list-hoverBackground)'
            }
          }}
        >
          Changes ({changes.length})
        </Button>
        <Button
          onClick={() => handleTabChange('history')}
          sx={{
            flex: 1,
            py: 1.5,
            px: 0,
            color: activeTab === 'history' ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
            borderBottom: activeTab === 'history' ? '2px solid var(--vscode-focusBorder)' : 'none',
            borderRadius: 0,
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'var(--vscode-list-hoverBackground)'
            }
          }}
        >
          History ({history.length})
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'changes' && (
          <>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Staged Changes */}
              {stagedChanges.length > 0 && (
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
                      Staged Changes ({stagedChanges.length})
                    </Typography>
                    {selectedFiles.size > 0 && (
                      <Button
                        onClick={handleUnstageFiles}
                        size="small"
                        startIcon={<RemoveIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          fontSize: '11px',
                          textTransform: 'none',
                          color: 'var(--vscode-foreground)',
                          minHeight: 'auto',
                          py: 0.5
                        }}
                      >
                        Unstage
                      </Button>
                    )}
                  </Box>
                  <List sx={{ py: 0 }}>
                    {stagedChanges.map((change) => (
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
                        onClick={() => handleFileToggle(change.path)}
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
              )}

              {/* Unstaged Changes */}
              {unstagedChanges.length > 0 && (
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
                      Changes ({unstagedChanges.length})
                    </Typography>
                    {selectedFiles.size > 0 && (
                      <Button
                        onClick={handleStageFiles}
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          fontSize: '11px',
                          textTransform: 'none',
                          color: 'var(--vscode-foreground)',
                          minHeight: 'auto',
                          py: 0.5
                        }}
                      >
                        Stage
                      </Button>
                    )}
                  </Box>
                  <List sx={{ py: 0 }}>
                    {unstagedChanges.map((change) => (
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
                        onClick={() => handleFileToggle(change.path)}
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
              )}

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

            {/* Commit Section - Only shown in changes tab */}
            {stagedChanges.length > 0 && (
              <Box sx={{
                px: 2,
                py: 2,
                borderTop: '1px solid var(--vscode-sideBarSectionHeader-border)',
                bgcolor: 'var(--vscode-sideBar-background)'
              }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Summary (required)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'var(--vscode-input-background)',
                      color: 'var(--vscode-input-foreground)',
                      fontSize: '13px',
                      '& fieldset': {
                        borderColor: 'var(--vscode-input-border)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--vscode-inputOption-hoverBackground)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--vscode-focusBorder)'
                      }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'var(--vscode-input-placeholderForeground)',
                      opacity: 1
                    }
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleCommit}
                    disabled={!commitMessage.trim()}
                    sx={{
                      flex: 1,
                      bgcolor: 'var(--vscode-button-background)',
                      color: 'var(--vscode-button-foreground)',
                      fontSize: '13px',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'var(--vscode-button-hoverBackground)'
                      },
                      '&:disabled': {
                        bgcolor: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)'
                      }
                    }}
                  >
                    Commit to {currentBranch}
                  </Button>
                  <IconButton
                    onClick={handlePush}
                    sx={{
                      color: 'var(--vscode-foreground)',
                      '&:hover': {
                        bgcolor: 'var(--vscode-list-hoverBackground)'
                      }
                    }}
                  >
                    <PushIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={handlePull}
                    sx={{
                      color: 'var(--vscode-foreground)',
                      '&:hover': {
                        bgcolor: 'var(--vscode-list-hoverBackground)'
                      }
                    }}
                  >
                    <PullIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Commit List */}
            <Box sx={{
              width: showCommitDetail ? '50%' : '100%',
              borderRight: showCommitDetail ? '1px solid var(--vscode-sideBarSectionHeader-border)' : 'none',
              overflow: 'auto'
            }}>
              <List sx={{ py: 0 }}>
                {history.map((commit) => (
                  <ListItem
                    key={commit.hash}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
                      cursor: 'pointer',
                      bgcolor: selectedCommit?.hash === commit.hash ? 'var(--vscode-list-activeSelectionBackground)' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedCommit?.hash === commit.hash ? 'var(--vscode-list-activeSelectionBackground)' : 'var(--vscode-list-hoverBackground)'
                      }
                    }}
                    onClick={() => handleCommitSelect(commit)}
                  >
                    <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                      <Avatar
                        src={generateAvatarUrl(commit.email || '', commit.author)}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '11px',
                          bgcolor: 'var(--vscode-button-background)',
                        }}
                      >
                        {commit.author.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: selectedCommit?.hash === commit.hash ? 'var(--vscode-list-activeSelectionForeground)' : 'var(--vscode-foreground)',
                          mb: 0.5,
                          lineHeight: 1.3
                        }}>
                          {commit.message}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography sx={{
                            fontSize: '12px',
                            color: 'var(--vscode-descriptionForeground)',
                            fontWeight: 500
                          }}>
                            {commit.author}
                          </Typography>
                          <Typography sx={{
                            fontSize: '12px',
                            color: 'var(--vscode-descriptionForeground)'
                          }}>
                            •
                          </Typography>
                          <Typography sx={{
                            fontSize: '12px',
                            color: 'var(--vscode-descriptionForeground)'
                          }}>
                            {commit.date}
                          </Typography>
                          <Typography sx={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: 'var(--vscode-descriptionForeground)',
                            ml: 'auto'
                          }}>
                            {commit.hash.substring(0, 7)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              {history.length === 0 && (
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

            {/* Commit Detail Panel */}
            {showCommitDetail && (
              <CommitDetailPanel
                commit={selectedCommit}
                onClose={handleCloseCommitDetail}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};