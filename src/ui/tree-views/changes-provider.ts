import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../../core/repositories/repository-manager';
import { getPrimaryRepository } from '../../shared/utils/repo-selection';

class ChangeItem extends vscode.TreeItem {
  constructor(label: string, description: string | undefined, resourceUri: vscode.Uri | undefined) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.resourceUri = resourceUri;
    this.iconPath = new vscode.ThemeIcon('git-commit');
    this.contextValue = 'githubDesktop.change';
  }
}

export class ChangesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
      return [this.createInfoItem('Open a Git repository to see local changes.')];
    }

    try {
      const git = simpleGit(repository.localPath);
      const status = await git.status();
      const items: vscode.TreeItem[] = [];

      const add = (filePath: string, state: string) => {
        const absolutePath = path.join(repository.localPath, filePath);
        const relPath = path.relative(repository.localPath, absolutePath) || filePath;
        const label = `${state} ${relPath}`.trim();
        const item = new ChangeItem(label, undefined, vscode.Uri.file(absolutePath));
        items.push(item);
      };

      if (status.files.length === 0) {
        return [this.createInfoItem('Working tree clean.')];
      }

      for (const file of status.files) {
        const state = this.formatStatusCode(file.index, file.working_dir);
        add(file.path, state);
      }

      return items;
    } catch (error) {
      return [this.createInfoItem('Unable to read git status for the current repository.')];
    }
  }

  private formatStatusCode(index: string, workingDir: string): string {
    const combined = `${index ?? ''}${workingDir ?? ''}`.trim();
    return combined.length > 0 ? combined : '�';
  }

  private createInfoItem(message: string): vscode.TreeItem {
    const item = new vscode.TreeItem(message, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('info');
    item.contextValue = 'githubDesktop.info';
    return item;
  }
}
