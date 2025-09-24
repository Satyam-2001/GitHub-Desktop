export interface HistoryExplorerCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  relativeTime: string;
}

export interface HistoryExplorerFilters {
  branches?: string[];
  author?: string;
  searchText?: string;
  allBranches?: boolean;
  filePath?: string;
  pageSize?: number;
  offset?: number;
}

export interface HistoryExplorerAuthor {
  name: string;
  email: string;
}

export interface HistoryExplorerInitialState {
  graphLines: string[];
  commits: HistoryExplorerCommit[];
  filters: HistoryExplorerFilters;
  branches: string[];
  authors: HistoryExplorerAuthor[];
  hasMore: boolean;
  offset: number;
  repository: {
    name: string;
    path: string;
    remote?: string;
  } | null;
}

export interface HistoryExplorerResponse {
  graphLines: string[];
  commits: HistoryExplorerCommit[];
  filters: HistoryExplorerFilters;
  branches: string[];
  authors: HistoryExplorerAuthor[];
  hasMore: boolean;
  nextOffset: number;
  repository: {
    name: string;
    path: string;
    remote?: string;
  } | null;
}
