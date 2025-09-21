import React from "react";
import { Box, Typography, List } from "@mui/material";
import { FileListProps } from "../types";
import { FileListItem } from "./FileListItem";

export const FileList: React.FC<FileListProps> = ({ files, onFileSelect }) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
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
      <Typography
        sx={{
          px: 2,
          py: 1,
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--vscode-foreground)",
          bgcolor: "var(--vscode-sideBar-background)",
          borderBottom: "1px solid var(--vscode-sideBarSectionHeader-border)",
        }}
      >
        Changed Files ({files.length})
      </Typography>

      <List sx={{ py: 0 }}>
        {files.map((file, index) => (
          <FileListItem
            key={index}
            file={file}
            onFileSelect={onFileSelect}
          />
        ))}
      </List>

      {files.length === 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 100,
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          <Typography sx={{ fontSize: "13px" }}>No files changed</Typography>
        </Box>
      )}
    </Box>
  );
};