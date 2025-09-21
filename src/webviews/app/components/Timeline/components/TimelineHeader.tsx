import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Popover,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CallSplit as BranchIcon,
  KeyboardArrowDown as DropdownIcon,
  ArrowDownward as PullIcon,
  CloudUpload as PublishIcon,
  CloudDownload as FetchIcon,
  ArrowUpward as PushIcon,
  FlashOn as ForceIcon,
} from "@mui/icons-material";
import { BranchDropdown } from "../BranchDropdown";
import { VSCodeBridge, RemoteStatus } from "../../../bridge";
import { useGitOperations } from "../../../hooks/useGitOperations";

interface TimelineHeaderProps {
  currentBranch: string | null;
  branches: string[];
  branchActivity: Record<string, string>;
  remoteStatus?: RemoteStatus | null;
  bridge: VSCodeBridge;
  onCreateNewBranch: () => void;
  onRefresh: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  currentBranch,
  branches,
  branchActivity,
  remoteStatus,
  bridge,
  onCreateNewBranch,
  onRefresh,
}) => {
  const [syncAnchorEl, setSyncAnchorEl] = useState<HTMLElement | null>(null);
  const [lastFetchedText, setLastFetchedText] = useState("");
  const gitOps = useGitOperations(bridge);

  const syncOpen = Boolean(syncAnchorEl);

  useEffect(() => {
    if (!remoteStatus) return;

    const updateLastFetchedText = () => {
      if (remoteStatus.lastFetched) {
        const fetchedDate = new Date(remoteStatus.lastFetched);
        const diff = Date.now() - fetchedDate.getTime();
        const seconds = Math.round(diff / 1000);

        if (seconds < 60) {
          setLastFetchedText("just now");
        } else {
          const minutes = Math.round(seconds / 60);
          if (minutes < 60) {
            setLastFetchedText(
              `${minutes} minute${minutes === 1 ? "" : "s"} ago`
            );
          } else {
            const hours = Math.round(minutes / 60);
            if (hours < 24) {
              setLastFetchedText(`${hours} hour${hours === 1 ? "" : "s"} ago`);
            } else {
              const days = Math.round(hours / 24);
              setLastFetchedText(`${days} day${days === 1 ? "" : "s"} ago`);
            }
          }
        }
      } else {
        setLastFetchedText("Never");
      }
    };

    updateLastFetchedText();
    const interval = setInterval(updateLastFetchedText, 60000);
    return () => clearInterval(interval);
  }, [remoteStatus]);

  const handleSyncClick = (event: React.MouseEvent<HTMLElement>) => {
    // Perform sync action based on remote status
    if (!remoteStatus) return;

    if (!remoteStatus.isPublished) {
      gitOps.publish.mutate();
    } else if (remoteStatus.behind > 0 && remoteStatus.ahead > 0) {
      gitOps.pull.mutate();
    } else if (remoteStatus.behind > 0) {
      gitOps.pull.mutate();
    } else if (remoteStatus.ahead > 0) {
      gitOps.push.mutate();
    } else {
      gitOps.fetch.mutate();
    }
  };

  const handleSyncDropdownClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setSyncAnchorEl(event.currentTarget);
  };

  const handleSyncClose = () => {
    setSyncAnchorEl(null);
  };

  const getSyncStatus = () => {
    if (!remoteStatus)
      return { title: "Sync", icon: FetchIcon, showCounts: false };

    if (!remoteStatus.isPublished) {
      return { title: "Publish branch", icon: PublishIcon, showCounts: false };
    } else if (remoteStatus.behind > 0 && remoteStatus.ahead > 0) {
      return { title: "Pull origin", icon: PullIcon, showCounts: true };
    } else if (remoteStatus.behind > 0) {
      return { title: "Pull origin", icon: PullIcon, showCounts: true };
    } else if (remoteStatus.ahead > 0) {
      return { title: "Push origin", icon: PushIcon, showCounts: true };
    } else {
      return { title: "Fetch origin", icon: FetchIcon, showCounts: false };
    }
  };

  const syncStatus = getSyncStatus();
  const isLoading =
    gitOps.push.isLoading ||
    gitOps.pull.isLoading ||
    gitOps.fetch.isLoading ||
    gitOps.publish.isLoading;

  // Show dropdown only when there are remote changes or commits to push
  const shouldShowDropdown =
    remoteStatus && (remoteStatus.behind > 0 || remoteStatus.ahead > 0);

  const handleFetch = () => {
    gitOps.fetch.mutate();
    handleSyncClose();
  };

  const handleForcePush = () => {
    bridge.sendMessage("forcePush");
    handleSyncClose();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
          bgcolor: "var(--vscode-sideBar-background)",
          minHeight: "48px",
          gap: 1,
        }}
      >
        {/* Branch Section */}
        <Box sx={{ width: "50%" }}>
          <BranchDropdown
            currentBranch={currentBranch}
            branches={branches}
            branchActivity={branchActivity}
            bridge={bridge}
          />
        </Box>

        {/* Sync Section */}
        <Box
          onClick={handleSyncClick}
          sx={{
            display: "flex",
            alignItems: "center",
            width: "50%",
            cursor: "pointer",
            "&:hover": {
              bgcolor: "var(--vscode-list-hoverBackground)",
            },
            borderRadius: "3px",
            px: 1,
            py: 0.5,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <syncStatus.icon
            sx={{
              fontSize: 16,
              color: "var(--vscode-descriptionForeground)",
              mr: 1,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: "13px",
                color: "var(--vscode-foreground)",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {syncStatus.title}
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: "var(--vscode-descriptionForeground)",
                lineHeight: 1.2,
              }}
            >
              Last fetched {lastFetchedText}
            </Typography>
          </Box>

          {/* Sync Counters */}
          {remoteStatus && syncStatus.showCounts && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mr: 1,
              }}
            >
              {remoteStatus.behind > 0 && (
                <>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "var(--vscode-foreground)",
                      bgcolor: "var(--vscode-badge-background)",
                      px: 0.5,
                      borderRadius: "2px",
                      minWidth: "16px",
                      textAlign: "center",
                    }}
                  >
                    {remoteStatus.behind}
                  </Typography>
                  <PullIcon
                    sx={{
                      fontSize: 12,
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  />
                </>
              )}
              {remoteStatus.ahead > 0 && (
                <>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "var(--vscode-foreground)",
                      bgcolor: "var(--vscode-badge-background)",
                      px: 0.5,
                      borderRadius: "2px",
                      minWidth: "16px",
                      textAlign: "center",
                    }}
                  >
                    {remoteStatus.ahead}
                  </Typography>
                  <PullIcon
                    sx={{
                      fontSize: 12,
                      color: "var(--vscode-descriptionForeground)",
                      transform: "rotate(180deg)",
                    }}
                  />
                </>
              )}
            </Box>
          )}

          {shouldShowDropdown && (
            <Box
              onClick={handleSyncDropdownClick}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0.5,
                borderRadius: "2px",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "var(--vscode-toolbar-hoverBackground)",
                },
              }}
            >
              <DropdownIcon
                sx={{
                  fontSize: 16,
                  color: "var(--vscode-descriptionForeground)",
                  transform: syncOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Sync Dropdown */}
      <Popover
        open={syncOpen}
        anchorEl={syncAnchorEl}
        onClose={handleSyncClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              bgcolor: "var(--vscode-sideBar-background)",
              border: "1px solid var(--vscode-sideBarSectionHeader-border)",
              borderRadius: 1,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
              minWidth: 200,
            },
          },
        }}
      >
        <MenuList sx={{ py: 1 }}>
          <MenuItem
            onClick={handleFetch}
            sx={{
              py: 1,
              px: 2,
              color: "var(--vscode-foreground)",
              "&:hover": {
                bgcolor: "var(--vscode-list-hoverBackground)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <FetchIcon
                sx={{
                  fontSize: 16,
                  color: "var(--vscode-descriptionForeground)",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Fetch Origin"
              primaryTypographyProps={{
                fontSize: "13px",
                color: "var(--vscode-foreground)",
              }}
            />
          </MenuItem>

          {remoteStatus && remoteStatus.ahead > 0 && (
            <MenuItem
              onClick={handleForcePush}
              sx={{
                py: 1,
                px: 2,
                color: "var(--vscode-foreground)",
                "&:hover": {
                  bgcolor: "var(--vscode-list-hoverBackground)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ForceIcon
                  sx={{
                    fontSize: 16,
                    color: "var(--vscode-descriptionForeground)",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Force Push"
                primaryTypographyProps={{
                  fontSize: "13px",
                  color: "var(--vscode-foreground)",
                }}
              />
            </MenuItem>
          )}
        </MenuList>
      </Popover>
    </>
  );
};
