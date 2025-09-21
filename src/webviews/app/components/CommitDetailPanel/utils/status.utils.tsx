import React from "react";
import {
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";

export const getStatusColor = (status: string): string => {
  const safeStatus = status || '';
  switch (safeStatus.charAt(0)) {
    case "M":
      return "#f59e0b"; // Modified - amber
    case "A":
      return "#10b981"; // Added - green
    case "D":
      return "#ef4444"; // Deleted - red
    case "R":
      return "#8b5cf6"; // Renamed - purple
    default:
      return "#6b7280";
  }
};

export const getStatusIcon = (status: string): React.ReactElement => {
  const safeStatus = status || '';
  switch (safeStatus.charAt(0)) {
    case "A":
      return <AddIcon sx={{ fontSize: 12, color: "#10b981" }} />;
    case "D":
      return <RemoveIcon sx={{ fontSize: 12, color: "#ef4444" }} />;
    default:
      return <FileIcon sx={{ fontSize: 12, color: "#f59e0b" }} />;
  }
};

export const getFileIcon = (file: {
  path: string;
  iconClass?: string;
  iconUri?: string;
}): React.ReactElement => {
  // If we have a custom icon URI from VS Code, use it
  if (file.iconUri) {
    return (
      <img
        src={file.iconUri}
        alt=""
        style={{
          width: "16px",
          height: "16px",
          marginRight: "4px",
        }}
      />
    );
  }

  // If we have a CSS class from VS Code theme, use it
  if (file.iconClass) {
    return (
      <span
        className={file.iconClass}
        style={{
          fontSize: "16px",
          width: "16px",
          height: "16px",
          marginRight: "4px",
          display: "inline-flex",
          alignItems: "center",
          color: "var(--vscode-foreground)",
        }}
      />
    );
  }

  // Fallback to generic file icon
  return (
    <FileIcon sx={{ fontSize: 16, color: "var(--vscode-foreground)" }} />
  );
};