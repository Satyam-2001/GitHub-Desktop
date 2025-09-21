import { Branch } from '../../../domain/entities/branch.entity';
import { BranchName } from '../../../domain/value-objects/branch-name.vo';
import { VSCodeBridge } from '../../../shared/infrastructure/bridge/vscode-bridge.interface';

export interface BranchService {
  getAllBranches(): Promise<Branch[]>;
  getCurrentBranch(): Promise<Branch | null>;
  createBranch(name: BranchName, bringChanges?: boolean): Promise<void>;
  switchToBranch(name: BranchName): Promise<void>;
  deleteBranch(name: BranchName): Promise<void>;
}

export class BranchServiceImpl implements BranchService {
  constructor(private readonly bridge: VSCodeBridge) {}

  async getAllBranches(): Promise<Branch[]> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.command === 'updateBranches') {
          this.bridge.offMessage(handler);
          resolve(message.branches.map((name: string) => this.mapToBranch(name, message)));
        }
      };

      this.bridge.onMessage(handler);
      this.bridge.sendMessage('refresh');
    });
  }

  async getCurrentBranch(): Promise<Branch | null> {
    return new Promise((resolve) => {
      const handler = (message: any) => {
        if (message.command === 'updateBranches') {
          this.bridge.offMessage(handler);
          const currentBranch = message.currentBranch;
          resolve(currentBranch ? this.mapToBranch(currentBranch, message, true) : null);
        }
      };

      this.bridge.onMessage(handler);
      this.bridge.sendMessage('refresh');
    });
  }

  async createBranch(name: BranchName, bringChanges = false): Promise<void> {
    if (bringChanges) {
      this.bridge.sendMessage('createBranchWithChanges', {
        branchName: name.value,
        bringChanges: true
      });
    } else {
      this.bridge.sendMessage('createBranch', {
        branchName: name.value
      });
    }
  }

  async switchToBranch(name: BranchName): Promise<void> {
    this.bridge.sendMessage('checkoutBranch', {
      branch: name.value
    });
  }

  async deleteBranch(name: BranchName): Promise<void> {
    // Implementation would depend on bridge API
    throw new Error('Delete branch not implemented');
  }

  private mapToBranch(name: string, data: any, isCurrent = false): Branch {
    const branchName = new BranchName(name);
    const lastActivity = data.branchActivity?.[name];

    return new Branch(
      branchName,
      isCurrent,
      lastActivity ? new (require('../../../domain/value-objects/commit-date.vo').CommitDate)(lastActivity) : undefined,
      name.startsWith('origin/')
    );
  }
}