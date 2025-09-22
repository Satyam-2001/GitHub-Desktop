import { VSCodeBridge } from "../../bridge";

export interface CommitFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  iconClass?: string;
  iconUri?: string;
}

export interface CommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  avatarUrl?: string;
  files: CommitFile[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface CommitDetailPanelProps {
  commit: CommitDetail | null;
  onClose: () => void;
  bridge: VSCodeBridge;
}

export interface CommitHeaderProps {
  commit: CommitDetail;
  onClose: () => void;
}

export interface FileListProps {
  files: CommitFile[];
  onFileSelect: (filePath: string) => void;
}

export interface FileListItemProps {
  file: CommitFile;
  onFileSelect: (filePath: string) => void;
}
