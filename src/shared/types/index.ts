export interface StoredAccount {
  id: string;
  login: string;
  name?: string;
  avatarUrl?: string;
  tokenKey: string;
  baseUrl?: string; // For GitHub Enterprise Server
}

export interface TrackedRepository {
  id: string;
  owner: string;
  name: string;
  defaultBranch?: string;
  localPath: string;
  remoteUrl?: string;
  accountId?: string;
}
