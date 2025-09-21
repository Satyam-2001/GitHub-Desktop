import { Commit } from '../../../domain/entities/commit.entity';
import { CommitId } from '../../../domain/value-objects/commit-id.vo';
import { VSCodeBridge } from '../../../shared/infrastructure/bridge/vscode-bridge.interface';

export interface CommitService {
  getCommitDetails(commitId: CommitId): Promise<Commit>;
  getCommitHistory(offset?: number, limit?: number): Promise<Commit[]>;
  loadMoreCommits(offset: number): Promise<{ commits: Commit[]; hasMore: boolean }>;
}

export class CommitServiceImpl implements CommitService {
  constructor(private readonly bridge: VSCodeBridge) {}

  async getCommitDetails(commitId: CommitId): Promise<Commit> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.command === 'commitDetails' && message.commitDetail.hash === commitId.value) {
          this.bridge.offMessage(handler);
          resolve(this.mapToCommit(message.commitDetail));
        }
      };

      this.bridge.onMessage(handler);
      this.bridge.sendMessage('getCommitDetails', { hash: commitId.value });
    });
  }

  async getCommitHistory(offset = 0, limit = 50): Promise<Commit[]> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.command === 'updateHistory') {
          this.bridge.offMessage(handler);
          resolve(message.history.map((item: any) => this.mapToCommit(item)));
        }
      };

      this.bridge.onMessage(handler);
      if (offset > 0) {
        this.bridge.sendMessage('loadMoreCommits', { offset });
      } else {
        this.bridge.sendMessage('refresh');
      }
    });
  }

  async loadMoreCommits(offset: number): Promise<{ commits: Commit[]; hasMore: boolean }> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.command === 'loadMoreCommitsResponse') {
          this.bridge.offMessage(handler);
          resolve({
            commits: message.history.map((item: any) => this.mapToCommit(item)),
            hasMore: message.hasMoreCommits
          });
        }
      };

      this.bridge.onMessage(handler);
      this.bridge.sendMessage('loadMoreCommits', { offset });
    });
  }

  private mapToCommit(data: any): Commit {
    // This would be implemented with proper mapping logic
    // For now, returning a simplified implementation
    throw new Error('Mapping implementation needed');
  }
}