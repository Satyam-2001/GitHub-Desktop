import React from "react";
import {
  Box,
  Typography,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { FileListItemProps } from "../types";
import { getStatusColor, getFileIcon } from "../utils/status.utils";

export const FileListItem: React.FC<FileListItemProps> = ({
  file,
  onFileSelect,
}) => {
  return (
    <ListItem
      sx={{
        py: 0.6,
        px: 2,
        cursor: "pointer",
        borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
        "&:hover": {
          bgcolor: "var(--vscode-list-hoverBackground)",
        },
        "&:last-child": {
          borderBottom: "none",
        },
      }}
      onClick={() => onFileSelect(file.path)}
    >
      <ListItemIcon
        sx={{
          minWidth: 28,
          mr: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        {getFileIcon(file)}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                color: "var(--vscode-foreground)",
                mb: 0.5,
                wordBreak: "break-all",
              }}
            >
              {file.path}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={file.status}
                size="small"
                icon={
                  (file.status || '').charAt(0) === "A" ? (
                    <AddIcon sx={{ fontSize: 10 }} />
                  ) : (file.status || '').charAt(0) === "D" ? (
                    <RemoveIcon sx={{ fontSize: 10 }} />
                  ) : undefined
                }
                sx={{
                  height: 18,
                  fontSize: "10px",
                  fontWeight: 500,
                  bgcolor: getStatusColor(file.status),
                  color: "white",
                  "& .MuiChip-icon": {
                    color: "white",
                    fontSize: 10,
                    ml: 0.5,
                  },
                }}
              />
              {file.additions > 0 && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#10b981",
                    fontWeight: 500,
                  }}
                >
                  +{file.additions}
                </Typography>
              )}
              {file.deletions > 0 && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#ef4444",
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
  );
};