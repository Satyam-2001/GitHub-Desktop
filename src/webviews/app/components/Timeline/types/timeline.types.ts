import {
  VSCodeBridge,
  GitChange,
  GitCommit,
  Repository,
  RemoteStatus,
} from "../../../bridge";

export interface TimelineProps {
  changes: GitChange[];
  history: GitCommit[];
  branches: string[];
  branchActivity: Record<string, string>;
  currentBranch: string | null;
  repository: Repository | null;
  bridge: VSCodeBridge;
  hasMoreCommits?: boolean;
  commitsOffset?: number;
  remoteStatus?: RemoteStatus | null;
}

export interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  commit: GitCommit | null;
}

export type TabType = "changes" | "history";

export interface TimelineState {
  activeTab: TabType;
  commitMessage: string;
  selectedFiles: Set<string>;
  contextMenu: ContextMenuState | null;
  newBranchDialog: boolean;
  newBranchName: string;
  uncommittedChangesDialog: boolean;
  isLoadingMore: boolean;
  allCommits: GitCommit[];
  selectedCommitHash: string | null;
}
