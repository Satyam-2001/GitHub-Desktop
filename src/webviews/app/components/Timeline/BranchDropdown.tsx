import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Popover,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AccountTree as BranchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Search as SearchIcon,
  MergeType as MergeIcon,
  GitHub as PRIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { VSCodeBridge } from "../../bridge";

interface BranchDropdownProps {
  currentBranch: string | null;
  branches: string[];
  branchActivity: Record<string, string>;
  bridge: VSCodeBridge;
}

interface BranchGroups {
  default: string[];
  recent: string[];
  other: string[];
}

export const BranchDropdown: React.FC<BranchDropdownProps> = ({
  currentBranch,
  branches,
  branchActivity,
  bridge,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeSearchTerm, setMergeSearchTerm] = useState("");
  const [selectedMergeBranch, setSelectedMergeBranch] = useState<string | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSearchTerm("");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBranchSelect = (branch: string) => {
    if (branch !== currentBranch) {
      bridge.sendMessage("checkoutBranch", { branch });
    }
    handleClose();
  };

  const handleMergeDialogOpen = () => {
    setMergeDialogOpen(true);
    setMergeSearchTerm("");
    setSelectedMergeBranch(null);
    handleClose();
  };

  const handleMergeDialogClose = () => {
    setMergeDialogOpen(false);
    setSelectedMergeBranch(null);
    setMergeSearchTerm("");
  };

  const handleMerge = () => {
    if (selectedMergeBranch && currentBranch) {
      bridge.sendMessage("mergeBranch", {
        fromBranch: selectedMergeBranch,
        toBranch: currentBranch,
      });
      handleMergeDialogClose();
    }
  };

  const handleCreatePR = () => {
    if (currentBranch) {
      bridge.sendMessage("createPullRequest", { branch: currentBranch });
    }
    handleClose();
  };

  // Group branches
  const groupBranches = (): BranchGroups => {
    // Handle undefined or null branches array
    const safeBranches = branches || [];
    const safeBranchActivity = branchActivity || {};

    const defaultBranches = safeBranches.filter((branch) =>
      ["main", "master", "develop", "dev"].includes(branch.toLowerCase())
    );

    const nonDefaultBranches = safeBranches.filter(
      (branch) => !defaultBranches.includes(branch) && branch !== currentBranch
    );

    // Sort by activity date for recent branches
    const sortedByActivity = nonDefaultBranches.sort((a, b) => {
      const aActivity = safeBranchActivity[a] || "";
      const bActivity = safeBranchActivity[b] || "";
      return aActivity.localeCompare(bActivity);
    });

    const recentBranches = sortedByActivity.slice(0, 3);
    const otherBranches = sortedByActivity.slice(3);

    return {
      default: defaultBranches,
      recent: recentBranches,
      other: otherBranches,
    };
  };

  const filteredBranches = () => {
    if (!searchTerm) return groupBranches();

    const filtered = (branches || []).filter((branch) =>
      (branch || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return {
      default: [],
      recent: [],
      other: filtered,
    };
  };

  const filteredMergeBranches = () => {
    return (branches || []).filter(
      (branch) =>
        branch !== currentBranch &&
        (branch || '').toLowerCase().includes((mergeSearchTerm || '').toLowerCase())
    );
  };

  const branchGroups = filteredBranches();

  const renderBranchGroup = (
    title: string,
    branches: string[],
    showDivider: boolean = true
  ) => {
    if (branches.length === 0) return null;

    return (
      <Box key={title}>
        {showDivider && (
          <Divider
            sx={{
              my: 0.5,
              mx: 1,
              borderColor: "var(--vscode-sideBarSectionHeader-border)",
            }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            display: "block",
            color: "var(--vscode-descriptionForeground)",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            bgcolor: "var(--vscode-sideBar-background)",
          }}
        >
          {title}
        </Typography>
        {branches.map((branch) => (
          <ListItem
            key={branch}
            sx={{
              py: 0.5,
              px: 2,
              cursor: "pointer",
              minHeight: "auto",
              bgcolor: "var(--vscode-sideBar-background)",
              "&:hover": {
                bgcolor: "var(--vscode-list-hoverBackground)",
              },
            }}
            onClick={() => handleBranchSelect(branch)}
          >
            <ListItemIcon sx={{ minWidth: 20, mr: 1 }}>
              <BranchIcon
                sx={{
                  fontSize: 14,
                  color: "var(--vscode-descriptionForeground)",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "var(--vscode-foreground)",
                    }}
                  >
                    {branch}
                  </Typography>
                  {branchActivity[branch] && (
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "var(--vscode-descriptionForeground)",
                        ml: 1,
                      }}
                    >
                      {branchActivity[branch]}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleClick}
        sx={{
          minWidth: 140,
          justifyContent: "space-between",
          color: "var(--vscode-foreground)",
          fontSize: "14px",
          fontWeight: 500,
          textTransform: "none",
          px: 1,
          py: 0.5,
          bgcolor: "var(--vscode-sideBar-background)",
          "&:hover": {
            bgcolor: "var(--vscode-list-hoverBackground)",
          },
        }}
        endIcon={
          <ArrowDownIcon
            sx={{
              fontSize: 16,
              color: "var(--vscode-foreground)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
          <BranchIcon sx={{ fontSize: 16, mr: 1 }} />
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentBranch || "No branch"}
          </Typography>
        </Box>
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 450,
            bgcolor: "var(--vscode-sideBar-background)",
            border: "1px solid var(--vscode-sideBarSectionHeader-border)",
            borderRadius: 1,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
          },
        }}
      >
        {/* Search */}
        <Box sx={{ p: 1.5, bgcolor: "var(--vscode-sideBar-background)" }}>
          <TextField
            fullWidth
            placeholder="Find a branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: 16,
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm("")}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon
                      sx={{ fontSize: 14, color: "var(--vscode-foreground)" }}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                fontSize: "13px",
                "& fieldset": {
                  borderColor: "var(--vscode-input-border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--vscode-input-border)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--vscode-focusBorder)",
                },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "var(--vscode-input-placeholderForeground)",
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Content */}
        <Box
          sx={{
            height: 280,
            overflow: "auto",
            bgcolor: "var(--vscode-sideBar-background)",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "var(--vscode-scrollbarSlider-background)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--vscode-scrollbarSlider-background)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--vscode-scrollbarSlider-hoverBackground)",
            },
          }}
        >
          {currentBranch && (
            <ListItem
              sx={{
                py: 0.5,
                px: 2,
                bgcolor: "var(--vscode-list-activeSelectionBackground)",
                "&:hover": {
                  bgcolor: "var(--vscode-list-activeSelectionBackground)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 20, mr: 1 }}>
                <BranchIcon
                  sx={{
                    fontSize: 14,
                    color: "var(--vscode-list-activeSelectionForeground)",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--vscode-list-activeSelectionForeground)",
                    }}
                  >
                    {currentBranch} (current)
                  </Typography>
                }
              />
            </ListItem>
          )}

          {!searchTerm && (
            <>
              {renderBranchGroup("Default", branchGroups.default)}
              {renderBranchGroup("Recent", branchGroups.recent)}
              {renderBranchGroup("Other", branchGroups.other)}
            </>
          )}

          {searchTerm &&
            renderBranchGroup("Search Results", branchGroups.other, false)}
        </Box>

        {/* Actions */}
        <Box
          sx={{
            bgcolor: "var(--vscode-sideBar-background)",
            borderTop: "1px solid var(--vscode-sideBarSectionHeader-border)",
          }}
        >
          <Button
            fullWidth
            startIcon={<MergeIcon sx={{ fontSize: 14 }} />}
            onClick={handleMergeDialogOpen}
            sx={{
              justifyContent: "flex-start",
              color: "var(--vscode-foreground)",
              fontSize: "13px",
              textTransform: "none",
              py: 1,
              m: 1,
              bgcolor: "var(--vscode-sideBar-background)",
              "&:hover": {
                bgcolor: "var(--vscode-list-hoverBackground)",
              },
            }}
          >
            Choose branch to merge into {currentBranch}
          </Button>

          {currentBranch &&
            currentBranch !== "main" &&
            currentBranch !== "master" && (
              <Button
                fullWidth
                startIcon={<PRIcon sx={{ fontSize: 14 }} />}
                onClick={handleCreatePR}
                sx={{
                  justifyContent: "flex-start",
                  color: "var(--vscode-foreground)",
                  fontSize: "13px",
                  textTransform: "none",
                  py: 1,
                  bgcolor: "var(--vscode-sideBar-background)",
                  "&:hover": {
                    bgcolor: "var(--vscode-list-hoverBackground)",
                  },
                }}
              >
                Create Pull Request
              </Button>
            )}
        </Box>
      </Popover>

      {/* Merge Dialog */}
      <Dialog
        open={mergeDialogOpen}
        onClose={handleMergeDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "var(--vscode-sideBar-background)",
            color: "var(--vscode-foreground)",
            border: "1px solid var(--vscode-sideBarSectionHeader-border)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "var(--vscode-sideBar-background)",
            color: "var(--vscode-foreground)",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          Merge into {currentBranch}
        </DialogTitle>
        <DialogContent
          sx={{ bgcolor: "var(--vscode-sideBar-background)", pt: 1 }}
        >
          <TextField
            fullWidth
            placeholder="Search branches..."
            value={mergeSearchTerm}
            onChange={(e) => setMergeSearchTerm(e.target.value)}
            size="small"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                bgcolor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                fontSize: "13px",
                "& fieldset": {
                  borderColor: "var(--vscode-input-border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--vscode-input-border)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--vscode-focusBorder)",
                },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "var(--vscode-input-placeholderForeground)",
                opacity: 1,
              },
            }}
          />
          <Box
            sx={{
              maxHeight: 300,
              overflow: "auto",
              border: "1px solid var(--vscode-sideBarSectionHeader-border)",
              borderRadius: 1,
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "var(--vscode-scrollbarSlider-background)",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "var(--vscode-scrollbarSlider-background)",
                borderRadius: "4px",
              },
            }}
          >
            <List sx={{ py: 0 }}>
              {filteredMergeBranches().map((branch) => (
                <ListItem
                  key={branch}
                  sx={{
                    py: 1,
                    px: 2,
                    cursor: "pointer",
                    bgcolor:
                      selectedMergeBranch === branch
                        ? "var(--vscode-list-activeSelectionBackground)"
                        : "var(--vscode-sideBar-background)",
                    "&:hover": {
                      bgcolor: "var(--vscode-list-hoverBackground)",
                    },
                  }}
                  onClick={() => setSelectedMergeBranch(branch)}
                >
                  <ListItemIcon sx={{ minWidth: 20, mr: 1 }}>
                    <BranchIcon
                      sx={{
                        fontSize: 14,
                        color: "var(--vscode-descriptionForeground)",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color:
                              selectedMergeBranch === branch
                                ? "var(--vscode-list-activeSelectionForeground)"
                                : "var(--vscode-foreground)",
                          }}
                        >
                          {branch}
                        </Typography>
                        {branchActivity[branch] && (
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "var(--vscode-descriptionForeground)",
                              ml: 1,
                            }}
                          >
                            {branchActivity[branch]}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ bgcolor: "var(--vscode-sideBar-background)", gap: 1 }}
        >
          <Button
            onClick={handleMergeDialogClose}
            sx={{
              color: "var(--vscode-foreground)",
              fontSize: "13px",
              textTransform: "none",
              "&:hover": {
                bgcolor: "var(--vscode-list-hoverBackground)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedMergeBranch}
            variant="contained"
            sx={{
              bgcolor: "var(--vscode-button-background)",
              color: "var(--vscode-button-foreground)",
              fontSize: "13px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "var(--vscode-button-hoverBackground)",
                boxShadow: "none",
              },
              "&:disabled": {
                bgcolor: "var(--vscode-button-secondaryBackground)",
                color: "var(--vscode-button-secondaryForeground)",
              },
            }}
          >
            Merge {selectedMergeBranch || "branch"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
