import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../../core/repositories/repository-manager';
import { getPrimaryRepository } from '../../shared/utils/repo-selection';

const MAX_COMMITS = 50;

class HistoryItem extends vscode.TreeItem {
  constructor(label: string, description: string, tooltip: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.tooltip = tooltip;
    this.iconPath = new vscode.ThemeIcon('history');
    this.contextValue = 'githubDesktop.historyEntry';
  }
}

export class HistoryProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly repositories: RepositoryManager) {
    this.repositories.onDidChangeRepositories(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return [this.createInfoItem('Open a Git repository to see commit history.')];
    }

    try {
      const git = simpleGit(repository.localPath);
      const log = await git.log({ maxCount: MAX_COMMITS });
      if (log.all.length === 0) {
        return [this.createInfoItem('No commits found.')];
      }

      return log.all.map((commit) => {
        const when = this.formatRelativeTime(new Date(commit.date));
        const description = `${commit.author_name} � ${when}`;
        const tooltip = `${commit.hash}\n${commit.author_name} <${commit.author_email}>\n${commit.date}`;
        return new HistoryItem(commit.message, description, tooltip);
      });
    } catch (error) {
      return [this.createInfoItem('Unable to read git history for the current repository.')];
    }
  }

  private createInfoItem(message: string): vscode.TreeItem {
    const item = new vscode.TreeItem(message, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('info');
    item.contextValue = 'githubDesktop.info';
    return item;
  }

  private formatRelativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const seconds = Math.round(diff / 1000);
    if (seconds < 60) {
      return 'just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    const months = Math.round(days / 30);
    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.round(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}
