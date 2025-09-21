import React from "react";
import { Box } from "@mui/material";
import { CommitDetailPanelProps } from "./types";
import { CommitHeader } from "./components/CommitHeader";
import { FileList } from "./components/FileList";

export const CommitDetailPanel: React.FC<CommitDetailPanelProps> = ({
  commit,
  onClose,
  bridge,
}) => {
  if (!commit) return null;

  const handleFileSelect = async (filePath: string) => {
    bridge.sendMessage("getFileDiff", {
      hash: commit.hash,
      filePath,
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        bgcolor: "var(--vscode-sideBar-background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CommitHeader commit={commit} onClose={onClose} />
      <FileList files={commit.files} onFileSelect={handleFileSelect} />
    </Box>
  );
};
