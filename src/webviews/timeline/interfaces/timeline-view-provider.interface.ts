import * as vscode from 'vscode';

export interface ChangeEntry {
  path: string;
  status: string;
  staged?: boolean;
}

export interface CommitEntry {
  hash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  relativeTime: string;
  committedAt: string;
}

export interface CommitDetail {
  summary: CommitEntry & {
    additions: number;
    deletions: number;
    fileCount: number;
  };
  files: Array<{
    path: string;
    status: string;
    additions: number | null;
    deletions: number | null;
  }>;
}

export interface FileIconInfo {
  iconClass?: string;
  iconUri?: string;
}

export interface CommitDetailFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  iconClass?: string;
  iconUri?: string;
}

export interface WebviewMessage {
  command: string;
  [key: string]: any;
}

export interface ITimelineViewProvider extends vscode.WebviewViewProvider {
  refresh(): Promise<void>;
}