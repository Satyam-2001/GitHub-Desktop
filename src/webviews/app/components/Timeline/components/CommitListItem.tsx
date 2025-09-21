import React from "react";
import {
  ListItem,
  ListItemText,
  Typography,
  Box,
  Avatar,
  Chip,
} from "@mui/material";
import {
  LocalOffer as TagIcon,
  ArrowUpward as UpArrowIcon,
} from "@mui/icons-material";
import { GitCommit } from "../../../bridge";
import { formatCommitDate, generateAvatarUrl } from "../utils/timeline.utils";

interface CommitListItemProps {
  commit: GitCommit;
  isSelected: boolean;
  onSelect: (commit: GitCommit) => void;
  onContextMenu: (event: React.MouseEvent, commit: GitCommit) => void;
}

export const CommitListItem: React.FC<CommitListItemProps> = ({
  commit,
  isSelected,
  onSelect,
  onContextMenu,
}) => {
  return (
    <ListItem
      sx={{
        py: 0.5,
        px: 0.8,
        borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
        cursor: "pointer",
        bgcolor: isSelected
          ? "var(--vscode-list-activeSelectionBackground)"
          : "transparent",
        "&:hover": {
          bgcolor: isSelected
            ? "var(--vscode-list-activeSelectionBackground)"
            : "var(--vscode-list-hoverBackground)",
        },
      }}
      onClick={() => onSelect(commit)}
      onContextMenu={(e) => onContextMenu(e, commit)}
    >
      <ListItemText
        sx={{ pl: 1 }}
        primary={
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--vscode-foreground)",
              mb: 0.5,
              lineHeight: 1.3,
            }}
          >
            {commit.message}
          </Typography>
        }
        secondary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Avatar
              src={generateAvatarUrl(commit.email || "", commit.author)}
              sx={{
                width: 16,
                height: 16,
                fontSize: "10px",
                bgcolor: "var(--vscode-button-background)",
              }}
            >
              {(commit.author || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              sx={{
                fontSize: "12px",
                color: "var(--vscode-descriptionForeground)",
                fontWeight: 500,
              }}
            >
              {commit.author}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              •
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              {commit.relativeTime || formatCommitDate(commit.date)}
            </Typography>

            {commit.tags && commit.tags.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                {commit.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    icon={<TagIcon />}
                    sx={{
                      height: "18px",
                      fontSize: "11px",
                      bgcolor: "var(--vscode-badge-background)",
                      color: "var(--vscode-badge-foreground)",
                      borderRadius: "10px",
                      "& .MuiChip-icon": {
                        fontSize: "12px",
                        marginLeft: "4px",
                        color: "var(--vscode-badge-foreground)",
                      },
                      "& .MuiChip-label": {
                        px: 0.8,
                        py: 0,
                      },
                    }}
                  />
                ))}
              </Box>
            )}

            {commit.isPushed === false && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  ml: 'auto',
                }}
              >
                <UpArrowIcon
                  sx={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: 'var(--vscode-badge-foreground)',
                  }}
                />
              </Box>
            )}

            {/* <Typography
              sx={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "var(--vscode-descriptionForeground)",
                ml: "auto",
              }}
            >
              {(commit.hash || "").substring(0, 7)}
            </Typography> */}
          </Box>
        }
      />
    </ListItem>
  );
};
