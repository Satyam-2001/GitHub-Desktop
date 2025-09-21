import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import {
  CloudUpload as PublishIcon,
  CloudDownload as PullIcon,
  CloudSync as FetchIcon,
  ArrowUpward as PushIcon,
  ArrowDownward as DownIcon,
} from '@mui/icons-material';

interface SyncButtonProps {
  remoteStatus: {
    hasRemote: boolean;
    isPublished: boolean;
    ahead: number;
    behind: number;
    lastFetched: Date | null;
    remoteBranch: string | null;
  };
  onPublish: () => void;
  onFetch: () => void;
  onPush: () => void;
  onPull: () => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  remoteStatus,
  onPublish,
  onFetch,
  onPush,
  onPull,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedText, setLastFetchedText] = useState('');

  useEffect(() => {
    const updateLastFetchedText = () => {
      if (remoteStatus.lastFetched) {
        const fetchedDate = new Date(remoteStatus.lastFetched);
        const diff = Date.now() - fetchedDate.getTime();
        const seconds = Math.round(diff / 1000);

        if (seconds < 60) {
          setLastFetchedText('just now');
        } else {
          const minutes = Math.round(seconds / 60);
          if (minutes < 60) {
            setLastFetchedText(`${minutes} minute${minutes === 1 ? '' : 's'} ago`);
          } else {
            const hours = Math.round(minutes / 60);
            if (hours < 24) {
              setLastFetchedText(`${hours} hour${hours === 1 ? '' : 's'} ago`);
            } else {
              const days = Math.round(hours / 24);
              setLastFetchedText(`${days} day${days === 1 ? '' : 's'} ago`);
            }
          }
        }
      } else {
        setLastFetchedText('Never');
      }
    };

    updateLastFetchedText();
    const interval = setInterval(updateLastFetchedText, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [remoteStatus.lastFetched]);

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  // Not published to remote
  if (!remoteStatus.isPublished) {
    return (
      <Button
        variant="contained"
        onClick={() => handleAction(onPublish)}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={16} /> : <PublishIcon />}
        sx={{
          bgcolor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          textTransform: 'none',
          fontSize: '13px',
          minWidth: '140px',
          height: '28px',
          '&:hover': {
            bgcolor: 'var(--vscode-button-hoverBackground)',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        Publish branch
      </Button>
    );
  }

  // Has changes to pull and push
  if (remoteStatus.behind > 0 && remoteStatus.ahead > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          variant="contained"
          onClick={() => handleAction(onPull)}
          disabled={isLoading}
          startIcon={<DownIcon />}
          sx={{
            bgcolor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            textTransform: 'none',
            fontSize: '13px',
            height: '28px',
            borderRadius: '3px 0 0 3px',
            minWidth: '80px',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)',
            }
          }}
        >
          <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Pull
            <Box component="span" sx={{
              bgcolor: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)',
              borderRadius: '10px',
              px: 0.7,
              py: 0.1,
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px'
            }}>
              {remoteStatus.behind}
            </Box>
          </Typography>
        </Button>
        <Button
          variant="contained"
          onClick={() => handleAction(onPush)}
          disabled={isLoading}
          endIcon={<PushIcon />}
          sx={{
            bgcolor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            textTransform: 'none',
            fontSize: '13px',
            height: '28px',
            borderRadius: '0 3px 3px 0',
            minWidth: '80px',
            borderLeft: '1px solid var(--vscode-button-separator-background)',
            '&:hover': {
              bgcolor: 'var(--vscode-button-hoverBackground)',
            }
          }}
        >
          <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={{
              bgcolor: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)',
              borderRadius: '10px',
              px: 0.7,
              py: 0.1,
              fontSize: '11px',
              fontWeight: 600,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px'
            }}>
              {remoteStatus.ahead}
            </Box>
            Push
          </Typography>
        </Button>
      </Box>
    );
  }

  // Only has commits to pull
  if (remoteStatus.behind > 0) {
    return (
      <Button
        variant="contained"
        onClick={() => handleAction(onPull)}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={16} /> : <PullIcon />}
        sx={{
          bgcolor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          textTransform: 'none',
          fontSize: '13px',
          minWidth: '140px',
          height: '28px',
          '&:hover': {
            bgcolor: 'var(--vscode-button-hoverBackground)',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          Pull origin
          <Box component="span" sx={{
            bgcolor: 'var(--vscode-badge-background)',
            color: 'var(--vscode-badge-foreground)',
            borderRadius: '10px',
            px: 0.7,
            py: 0.1,
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px'
          }}>
            {remoteStatus.behind}
          </Box>
          <DownIcon sx={{ fontSize: 14 }} />
        </Typography>
      </Button>
    );
  }

  // Only has commits to push
  if (remoteStatus.ahead > 0) {
    return (
      <Button
        variant="contained"
        onClick={() => handleAction(onPush)}
        disabled={isLoading}
        endIcon={isLoading ? <CircularProgress size={16} /> : <PushIcon />}
        sx={{
          bgcolor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          textTransform: 'none',
          fontSize: '13px',
          minWidth: '140px',
          height: '28px',
          '&:hover': {
            bgcolor: 'var(--vscode-button-hoverBackground)',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          Push origin
          <Box component="span" sx={{
            bgcolor: 'var(--vscode-badge-background)',
            color: 'var(--vscode-badge-foreground)',
            borderRadius: '10px',
            px: 0.7,
            py: 0.1,
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px'
          }}>
            {remoteStatus.ahead}
          </Box>
          <PushIcon sx={{ fontSize: 14 }} />
        </Typography>
      </Button>
    );
  }

  // Everything is up to date - show fetch button
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Button
        variant="contained"
        onClick={() => handleAction(onFetch)}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={16} /> : <FetchIcon />}
        sx={{
          bgcolor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          textTransform: 'none',
          fontSize: '13px',
          minWidth: '140px',
          height: '28px',
          '&:hover': {
            bgcolor: 'var(--vscode-button-hoverBackground)',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        Fetch origin
      </Button>
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          color: 'var(--vscode-descriptionForeground)',
          fontSize: '11px',
        }}
      >
        Last fetched {lastFetchedText}
      </Typography>
    </Box>
  );
};