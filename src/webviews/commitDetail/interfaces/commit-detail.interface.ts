import * as vscode from 'vscode';

export interface CommitDetailFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  iconUri?: string;
}

export interface CommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  files: CommitDetailFile[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface CommitDetailMessage {
  command: string;
  hash?: string;
  filePath?: string;
}

export interface ICommitDetailViewProvider {
  showCommitDetails(commitHash: string): Promise<void>;
  refresh(): Promise<void>;
}

export interface ICommitDetailService {
  getCommitDetail(commitHash: string, webview?: vscode.Webview): Promise<CommitDetail>;
  createFileDiff(hash: string, filePath: string): Promise<void>;
}