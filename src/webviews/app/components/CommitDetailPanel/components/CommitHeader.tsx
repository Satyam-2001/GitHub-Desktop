import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { CommitHeaderProps } from "../types";
import { formatCommitDate } from "../utils/date.utils";
import { generateAvatarUrl } from "../utils/avatar.utils";

export const CommitHeader: React.FC<CommitHeaderProps> = ({
  commit,
  onClose,
}) => {
  return (
    <Box
      sx={{
        p: 2,
        borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
        bgcolor: "var(--vscode-sideBarSectionHeader-background)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--vscode-foreground)",
          }}
        >
          {commit.message}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "var(--vscode-foreground)",
            "&:hover": {
              bgcolor: "var(--vscode-list-hoverBackground)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Avatar
          src={commit.avatarUrl || generateAvatarUrl(commit.email, commit.author)}
          sx={{
            width: 24,
            height: 24,
            fontSize: "11px",
            bgcolor: "var(--vscode-button-background)",
          }}
        >
          {(commit.author || 'U').charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography
            sx={{
              fontSize: "13px",
              color: "var(--vscode-foreground)",
              fontWeight: 500,
            }}
          >
            {commit.author}
          </Typography>
          <Typography
            sx={{
              fontSize: "11px",
              color: "var(--vscode-descriptionForeground)",
            }}
          >
            {formatCommitDate(commit.date)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontFamily: "monospace",
            color: "var(--vscode-descriptionForeground)",
            bgcolor: "var(--vscode-input-background)",
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
            fontSize: "10px",
            bgcolor: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
            "& .MuiChip-icon": { color: "#10b981" },
          }}
        />
        <Chip
          icon={<RemoveIcon sx={{ fontSize: 12 }} />}
          label={`-${commit.totalDeletions}`}
          size="small"
          sx={{
            height: 20,
            fontSize: "10px",
            bgcolor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            "& .MuiChip-icon": { color: "#ef4444" },
          }}
        />
        <Typography
          sx={{
            fontSize: "11px",
            color: "var(--vscode-descriptionForeground)",
            ml: 1,
          }}
        >
          {commit.files.length} files
        </Typography>
      </Box>
    </Box>
  );
};