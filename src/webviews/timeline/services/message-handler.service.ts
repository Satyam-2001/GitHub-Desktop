import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../../../core/repositories/repository-manager';
import { AccountManager } from '../../../core/accounts/account-manager';
import { getPrimaryRepository } from '../../../shared/utils/repo-selection';
import { CommitDetailViewProvider } from '../../commitDetail/commit-detail-view-provider';
import { WebviewMessage, FileIconInfo } from '../interfaces/timeline-view-provider.interface';
import { GitOperationsService } from './git-operations.service';

export class MessageHandlerService {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager,
    private readonly accounts: AccountManager,
    private readonly commitDetailProvider: CommitDetailViewProvider,
    private readonly gitService: GitOperationsService,
    private readonly view: vscode.WebviewView
  ) {}

  async handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'ready':
      case 'refresh':
        await this.handleRefresh();
        break;
      case 'stageFiles':
        await this.handleStageFiles(message.files);
        break;
      case 'unstageFiles':
        await this.handleUnstageFiles(message.files);
        break;
      case 'commit':
        await this.handleCommit(message.message);
        break;
      case 'push':
        await this.handlePush();
        break;
      case 'pull':
        await this.handlePull();
        break;
      case 'checkoutBranch':
        await this.handleCheckoutBranch(message.branch);
        break;
      case 'mergeBranch':
        await this.handleMergeBranch(message.fromBranch, message.toBranch);
        break;
      case 'createPullRequest':
        await this.handleCreatePullRequest(message.branch);
        break;
      case 'getCommitDetails':
        await this.handleGetCommitDetails(message.hash);
        break;
      case 'getFileDiff':
        await this.handleGetFileDiff(message.hash, message.filePath);
        break;
      case 'openCommitDetail':
        if (typeof message.hash === 'string') {
          await this.commitDetailProvider.showCommitDetails(message.hash);
        }
        break;
      case 'resetToCommit':
        if (typeof message.hash === 'string') {
          await this.handleResetToCommit(message.hash);
        }
        break;
      case 'checkoutCommit':
        if (typeof message.hash === 'string') {
          await this.handleCheckoutCommit(message.hash);
        }
        break;
      case 'revertCommit':
        if (typeof message.hash === 'string') {
          await this.handleRevertCommit(message.hash);
        }
        break;
      case 'createBranchFromCommit':
        if (typeof message.hash === 'string') {
          await this.handleCreateBranchFromCommit(message.hash);
        }
        break;
      case 'createTagFromCommit':
        if (typeof message.hash === 'string') {
          await this.handleCreateTagFromCommit(message.hash);
        }
        break;
      case 'cherryPickCommit':
        if (typeof message.hash === 'string') {
          await this.handleCherryPickCommit(message.hash);
        }
        break;
      case 'viewCommitOnGitHub':
        if (typeof message.hash === 'string') {
          await this.handleViewCommitOnGitHub(message.hash);
        }
        break;
      case 'createBranch':
        if (typeof message.branchName === 'string') {
          await this.handleCreateBranch(message.branchName);
        }
        break;
      case 'createBranchWithChanges':
        if (typeof message.branchName === 'string' && typeof message.bringChanges === 'boolean') {
          await this.handleCreateBranchWithChanges(message.branchName, message.bringChanges);
        }
        break;
      case 'loadMoreCommits':
        if (typeof message.offset === 'number') {
          await this.handleLoadMoreCommits(message.offset);
        }
        break;
      case 'fetch':
        await this.handleFetch();
        break;
      case 'publish':
        await this.handlePublish();
        break;
      case 'selectCommit':
        if (typeof message.hash === 'string') {
          await this.handleSelectCommit(message.hash);
        }
        break;
      case 'selectFile':
        if (typeof message.hash === 'string' && typeof message.path === 'string') {
          await this.handleSelectFile(message.hash, message.path);
        }
        break;
      default:
        break;
    }
  }

  private async configureGitWithAuth(repositoryPath: string): Promise<any | null> {
    const activeAccount = this.accounts.getActiveAccount();
    if (!activeAccount) {
      return null;
    }

    const token = await this.accounts.getToken(activeAccount.id);
    if (!token) {
      return null;
    }

    const git = simpleGit(repositoryPath);

    // Configure git with authentication for GitHub operations
    try {
      // Get the repository info to determine the remote URL format
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');

      if (origin && origin.refs.fetch) {
        let remoteUrl = origin.refs.fetch;

        // If it's a GitHub HTTPS URL, update it with the token
        if (remoteUrl.includes('github.com')) {
          // Convert SSH to HTTPS if necessary
          if (remoteUrl.startsWith('git@github.com:')) {
            remoteUrl = remoteUrl.replace('git@github.com:', 'https://github.com/');
            if (!remoteUrl.endsWith('.git')) {
              remoteUrl += '.git';
            }
          }

          // Add authentication to HTTPS URL
          if (remoteUrl.startsWith('https://github.com/')) {
            const urlWithAuth = remoteUrl.replace(
              'https://github.com/',
              `https://${encodeURIComponent(activeAccount.login)}:${encodeURIComponent(token)}@github.com/`
            );

            // Temporarily update the remote URL for this operation
            await git.remote(['set-url', 'origin', urlWithAuth]);

            // Return git instance with a cleanup function
            const originalUrl = remoteUrl;
            const gitWithCleanup = {
              ...git,
              push: async (...args: any[]) => {
                try {
                  const result = await git.push(...args);
                  // Restore original URL after operation
                  await git.remote(['set-url', 'origin', originalUrl]);
                  return result;
                } catch (error) {
                  // Restore original URL even on error
                  await git.remote(['set-url', 'origin', originalUrl]);
                  throw error;
                }
              },
              pull: async (...args: any[]) => {
                try {
                  const result = await git.pull(...args);
                  // Restore original URL after operation
                  await git.remote(['set-url', 'origin', originalUrl]);
                  return result;
                } catch (error) {
                  // Restore original URL even on error
                  await git.remote(['set-url', 'origin', originalUrl]);
                  throw error;
                }
              }
            };

            return gitWithCleanup;
          }
        }
      }
    } catch (error) {
      console.error('Failed to configure git with auth:', error);
    }

    // Return regular git instance if no special auth needed
    return git;
  }

  private async handleRefresh(): Promise<void> {
    try {
      const data = await this.gitService.getRepositoryData();
      if (!data) {
        this.view.webview.postMessage({
          command: 'updateRepository',
          repository: null
        });
        return;
      }

      this.view.webview.postMessage({
        command: 'updateChanges',
        changes: data.changes
      });

      this.view.webview.postMessage({
        command: 'updateHistory',
        history: data.commits,
        hasMoreCommits: data.hasMoreCommits,
        offset: 0
      });

      this.view.webview.postMessage({
        command: 'updateBranches',
        branches: data.branches,
        currentBranch: data.currentBranch,
        branchActivity: data.branchActivity
      });

      this.view.webview.postMessage({
        command: 'updateRepository',
        repository: data.repository
      });

      this.view.webview.postMessage({
        command: 'updateRemoteStatus',
        remoteStatus: data.remoteStatus,
        tags: data.tags
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to refresh: ${error}`);
    }
  }

  private async handleStageFiles(files: string[]): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !files?.length) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.add(files);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to stage files: ${error}`);
    }
  }

  private async handleUnstageFiles(files: string[]): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !files?.length) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.reset(['HEAD', ...files]);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to unstage files: ${error}`);
    }
  }

  private async handleCommit(message: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !message?.trim()) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.commit(message);
      await this.handleRefresh();
      vscode.window.showInformationMessage('Commit created successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to commit: ${error}`);
    }
  }

  private async handlePush(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = await this.configureGitWithAuth(repository.localPath);
      if (!git) {
        vscode.window.showErrorMessage('No authenticated GitHub account found. Please sign in first.');
        return;
      }

      await git.push();
      await this.handleRefresh(); // Refresh all data including remote status
      vscode.window.showInformationMessage('Pushed successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to push: ${error}`);
    }
  }

  private async handlePull(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = await this.configureGitWithAuth(repository.localPath);
      if (!git) {
        vscode.window.showErrorMessage('No authenticated GitHub account found. Please sign in first.');
        return;
      }

      await git.pull();
      await this.handleRefresh();
      vscode.window.showInformationMessage('Pulled successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to pull: ${error}`);
    }
  }

  private async handleCheckoutBranch(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkout(branchName);
      await this.handleRefresh();
      vscode.window.showInformationMessage(`Checked out branch: ${branchName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to checkout branch: ${error}`);
    }
  }

  private async handleMergeBranch(fromBranch: string, toBranch: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !fromBranch || !toBranch) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkout(toBranch);
      await git.merge([fromBranch]);
      await this.handleRefresh();
      vscode.window.showInformationMessage(`Successfully merged ${fromBranch} into ${toBranch}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to merge branches: ${error}`);
    }
  }

  private async handleCreatePullRequest(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const repoUrl = repository.remoteUrl;
      if (repoUrl) {
        const githubUrl = repoUrl
          .replace(/^git@github\.com:/, 'https://github.com/')
          .replace(/\.git$/, '');

        const prUrl = `${githubUrl}/compare/${branchName}?expand=1`;
        vscode.env.openExternal(vscode.Uri.parse(prUrl));
        vscode.window.showInformationMessage(`Opening pull request creation for ${branchName}`);
      } else {
        vscode.window.showWarningMessage('No remote repository configured');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create pull request: ${error}`);
    }
  }

  private async handleGetCommitDetails(hash: string): Promise<void> {
    try {
      const detail = await this.gitService.getCommitDetail(hash);
      this.view.webview.postMessage({
        type: 'commitDetail',
        payload: detail
      });
    } catch (error) {
      this.view.webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load commit details.'
      });
    }
  }

  private async handleGetFileDiff(hash: string, filePath: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      let diff = await git.raw(['show', hash, '--patch', '--', filePath]);
      if (!diff.trim()) {
        diff = await git.raw(['show', hash, '--', filePath]);
      }

      this.view.webview.postMessage({
        type: 'fileDiff',
        payload: {
          path: filePath,
          diff
        }
      });
    } catch (error) {
      this.view.webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load file diff.'
      });
    }
  }

  private async handleResetToCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    const confirm = await vscode.window.showWarningMessage(
      `Are you sure you want to reset to commit ${hash.substring(0, 7)}? This will discard all changes after this commit.`,
      { modal: true },
      'Reset',
      'Cancel'
    );

    if (confirm === 'Reset') {
      try {
        const git = simpleGit(repository.localPath);
        await git.reset(['--hard', hash]);
        vscode.window.showInformationMessage(`Reset to commit ${hash.substring(0, 7)}`);
        await this.handleRefresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reset: ${error}`);
      }
    }
  }

  private async handleCheckoutCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkout(hash);
      vscode.window.showInformationMessage(`Checked out commit ${hash.substring(0, 7)}`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to checkout commit: ${error}`);
    }
  }

  private async handleRevertCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.revert(hash, ['--no-edit']);
      vscode.window.showInformationMessage(`Reverted commit ${hash.substring(0, 7)}`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to revert commit: ${error}`);
    }
  }

  private async handleCreateBranchFromCommit(hash: string): Promise<void> {
    const branchName = await vscode.window.showInputBox({
      prompt: 'Enter new branch name',
      placeHolder: 'feature-branch-name',
      ignoreFocusOut: true
    });

    if (!branchName) return;

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkoutBranch(branchName, hash);
      vscode.window.showInformationMessage(`Created branch '${branchName}' from commit ${hash.substring(0, 7)}`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
    }
  }

  private async handleCreateTagFromCommit(hash: string): Promise<void> {
    const tagName = await vscode.window.showInputBox({
      prompt: 'Enter tag name',
      placeHolder: 'v1.0.0',
      ignoreFocusOut: true
    });

    if (!tagName) return;

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.raw(['tag', tagName, hash]);
      vscode.window.showInformationMessage(`Created tag '${tagName}' on commit ${hash.substring(0, 7)}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create tag: ${error}`);
    }
  }

  private async handleCherryPickCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.raw(['cherry-pick', hash]);
      vscode.window.showInformationMessage(`Cherry-picked commit ${hash.substring(0, 7)}`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to cherry-pick commit: ${error}`);
    }
  }

  private async handleViewCommitOnGitHub(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository?.remoteUrl) {
      vscode.window.showWarningMessage('No GitHub remote found');
      return;
    }

    try {
      const githubUrl = repository.remoteUrl
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/\.git$/, '');

      const commitUrl = `${githubUrl}/commit/${hash}`;
      vscode.env.openExternal(vscode.Uri.parse(commitUrl));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open GitHub: ${error}`);
    }
  }

  private async handleCreateBranch(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkoutLocalBranch(branchName);
      vscode.window.showInformationMessage(`Created and switched to branch '${branchName}'`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
    }
  }

  private async handleCreateBranchWithChanges(branchName: string, bringChanges: boolean): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);

      if (bringChanges) {
        await git.checkoutLocalBranch(branchName);
        vscode.window.showInformationMessage(`Created branch '${branchName}' with uncommitted changes`);
      } else {
        await git.stash(['push', '-m', 'Auto-stash before branch creation']);
        await git.checkoutLocalBranch(branchName);
        vscode.window.showInformationMessage(`Created branch '${branchName}' and stashed changes`);
      }

      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch with changes: ${error}`);
    }
  }

  private async handleLoadMoreCommits(offset: number): Promise<void> {
    try {
      const result = await this.gitService.loadMoreCommits(offset);
      this.view.webview.postMessage({
        command: 'loadMoreCommitsResponse',
        history: result.commits,
        hasMoreCommits: result.hasMoreCommits,
        offset: result.newOffset
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load more commits: ${error}`);
    }
  }

  private async handleSelectCommit(hash: string): Promise<void> {
    try {
      const detail = await this.gitService.getCommitDetail(hash);
      this.view.webview.postMessage({
        type: 'commitDetail',
        payload: detail
      });
    } catch (error) {
      this.view.webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load commit details.'
      });
    }
  }

  private async handleSelectFile(hash: string, filePath: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      let diff = await git.raw(['show', hash, '--patch', '--', filePath]);
      if (!diff.trim()) {
        diff = await git.raw(['show', hash, '--', filePath]);
      }

      this.view.webview.postMessage({
        type: 'fileDiff',
        payload: {
          path: filePath,
          diff
        }
      });
    } catch (error) {
      this.view.webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load file diff.'
      });
    }
  }

  private async handleFetch(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.fetch();
      vscode.window.showInformationMessage('Fetched from remote successfully');
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fetch: ${error}`);
    }
  }

  private async handlePublish(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      const branch = await git.branch();
      const currentBranch = branch.current;

      if (!currentBranch) {
        vscode.window.showErrorMessage('No branch selected');
        return;
      }

      // Check if we have a remote
      const remotes = await git.getRemotes(true);
      if (remotes.length === 0) {
        vscode.window.showErrorMessage('No remote repository configured');
        return;
      }

      const defaultRemote = remotes[0].name;
      await git.push(['-u', defaultRemote, currentBranch]);
      vscode.window.showInformationMessage(`Published branch '${currentBranch}' to ${defaultRemote}`);
      await this.handleRefresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to publish branch: ${error}`);
    }
  }
}