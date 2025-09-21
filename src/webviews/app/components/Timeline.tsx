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
  Menu,
  MenuItem,
  MenuList,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudUpload as PushIcon,
  CloudDownload as PullIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
  CheckCircle as CheckoutIcon,
  Reorder as ReorderIcon,
  Undo as RevertIcon,
  AccountTree as BranchIcon,
  LocalOffer as TagIcon,
  CallMerge as CherryPickIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ViewIcon,
} from '@mui/icons-material';
import { VSCodeBridge, GitChange, GitCommit, Repository } from '../bridge';
import { BranchDropdown } from './BranchDropdown';

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
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    commit: GitCommit | null;
  } | null>(null);

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
    console.log('Selecting commit:', commit.hash);
    bridge.sendMessage('openCommitDetail', { hash: commit.hash });
  };

  const handleCommitContextMenu = (event: React.MouseEvent, commit: GitCommit) => {
    event.preventDefault();

    // Always set the new context menu, even if one is already open
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      commit,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, commit: GitCommit) => {
    switch (action) {
      case 'reset':
        bridge.sendMessage('resetToCommit', { hash: commit.hash });
        break;
      case 'checkout':
        bridge.sendMessage('checkoutCommit', { hash: commit.hash });
        break;
      case 'reorder':
        bridge.sendMessage('reorderCommit', { hash: commit.hash });
        break;
      case 'revert':
        bridge.sendMessage('revertCommit', { hash: commit.hash });
        break;
      case 'createBranch':
        bridge.sendMessage('createBranchFromCommit', { hash: commit.hash });
        break;
      case 'createTag':
        bridge.sendMessage('createTagFromCommit', { hash: commit.hash });
        break;
      case 'cherryPick':
        bridge.sendMessage('cherryPickCommit', { hash: commit.hash });
        break;
      case 'copySha':
        navigator.clipboard.writeText(commit.hash);
        break;
      case 'copyTag':
        navigator.clipboard.writeText(`${commit.message} (${commit.hash.substring(0, 7)})`);
        break;
      case 'viewOnGitHub':
        bridge.sendMessage('viewCommitOnGitHub', { hash: commit.hash });
        break;
    }
    handleContextMenuClose();
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
        py: 1,
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
          <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {history.map((commit) => (
                  <ListItem
                    key={commit.hash}
                    sx={{
                      py: 1,
                      px: 1.5,
                      borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'var(--vscode-list-hoverBackground)'
                      }
                    }}
                    onClick={() => handleCommitSelect(commit)}
                    onContextMenu={(e) => handleCommitContextMenu(e, commit)}
                  >
                    <ListItemText
                      sx={{ pl: 1 }}
                      primary={
                        <Typography sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--vscode-foreground)',
                          mb: 0.5,
                          lineHeight: 1.3
                        }}>
                          {commit.message}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Avatar
                            src={generateAvatarUrl(commit.email || '', commit.author)}
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: '10px',
                              bgcolor: 'var(--vscode-button-background)',
                            }}
                          >
                            {commit.author.charAt(0).toUpperCase()}
                          </Avatar>
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
        )}
      </Box>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
            }}
            onClick={handleContextMenuClose}
          />

          {/* Menu */}
          <Paper
            sx={{
              position: 'fixed',
              top: contextMenu.mouseY,
              left: contextMenu.mouseX,
              zIndex: 1301,
              bgcolor: 'var(--vscode-menu-background, #2d2d30)',
              border: '1px solid var(--vscode-menu-border, #454545)',
              borderRadius: '3px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
              minWidth: 220,
              py: 0.5,
            }}
          >
            <MenuList dense disablePadding>
              <MenuItem
                onClick={() => handleContextMenuAction('reset', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <ResetIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Reset to commit...
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('checkout', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <CheckoutIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Checkout commit
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('reorder', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <ReorderIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Reorder commit
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('revert', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <RevertIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Revert changes in commit
              </MenuItem>

              <Divider sx={{
                borderColor: 'var(--vscode-menu-separatorBackground, #454545)',
                my: 0.5
              }} />

              <MenuItem
                onClick={() => handleContextMenuAction('createBranch', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <BranchIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Create branch from commit
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('createTag', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <TagIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Create tag...
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('cherryPick', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <CherryPickIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Cherry-pick commit...
              </MenuItem>

              <Divider sx={{
                borderColor: 'var(--vscode-menu-separatorBackground, #454545)',
                my: 0.5
              }} />

              <MenuItem
                onClick={() => handleContextMenuAction('copySha', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <CopyIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Copy SHA
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('copyTag', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <CopyIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                Copy tag
              </MenuItem>

              <MenuItem
                onClick={() => handleContextMenuAction('viewOnGitHub', contextMenu.commit!)}
                sx={{
                  fontSize: '13px',
                  color: 'var(--vscode-menu-foreground, #cccccc)',
                  px: 2,
                  py: 0.5,
                  minHeight: 'auto',
                  '&:hover': {
                    bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
                    color: 'var(--vscode-menu-selectionForeground, #ffffff)'
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <ViewIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                View on GitHub
              </MenuItem>
            </MenuList>
          </Paper>
        </>
      )}
    </Box>
  );
};