export interface VSCodeApi {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

export interface InitialWebviewState {
  changes: GitChange[];
  history: GitCommit[];
  branches: string[];
  currentBranch: string | null;
  repository: Repository | null;
  accounts: GitHubAccount[];
  activeAccount: GitHubAccount | null;
  hasMoreCommits?: boolean;
  commitsOffset?: number;
  remoteStatus?: RemoteStatus;
}

export interface GitChange {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  email?: string;
  date: string;
  relativeTime?: string;
  tags?: string[];
  isPushed?: boolean;
}

export interface RemoteStatus {
  hasRemote: boolean;
  isPublished: boolean;
  ahead: number;
  behind: number;
  lastFetched: Date | null;
  remoteBranch: string | null;
}

export interface Repository {
  name: string;
  path: string;
  remote?: string;
}

export interface GitHubAccount {
  username: string;
  email: string;
  avatar?: string;
  token?: string;
}

export interface VSCodeBridge {
  sendMessage: (command: string, data?: any) => void;
  onMessage: (handler: (message: any) => void) => void;
  getState: () => any;
  setState: (state: any) => void;
}

export function createVSCodeBridge(vscodeApi: VSCodeApi): VSCodeBridge {
  const messageHandlers: ((message: any) => void)[] = [];

  window.addEventListener("message", (event) => {
    const message = event.data;
    messageHandlers.forEach((handler) => handler(message));
  });

  return {
    sendMessage: (command: string, data?: any) => {
      vscodeApi.postMessage({ command, ...data });
    },
    onMessage: (handler: (message: any) => void) => {
      messageHandlers.push(handler);
    },
    getState: () => vscodeApi.getState(),
    setState: (state: any) => vscodeApi.setState(state),
  };
}