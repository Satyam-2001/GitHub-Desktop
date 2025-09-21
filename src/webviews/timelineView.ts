import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../repositoryManager';
import { getPrimaryRepository } from '../utils/repoSelection';

interface ChangeEntry {
  path: string;
  status: string;
}

interface CommitEntry {
  hash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  relativeTime: string;
  committedAt: string;
}

interface CommitDetail {
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

export class TimelineViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'out')
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'ready':
        case 'refresh':
          await this.postState();
          break;
        case 'stageFiles':
          await this.stageFiles(message.files);
          break;
        case 'unstageFiles':
          await this.unstageFiles(message.files);
          break;
        case 'commit':
          await this.commit(message.message);
          break;
        case 'push':
          await this.push();
          break;
        case 'pull':
          await this.pull();
          break;
        case 'checkoutBranch':
          await this.checkoutBranch(message.branch);
          break;
        case 'mergeBranch':
          await this.mergeBranch(message.fromBranch, message.toBranch);
          break;
        case 'createPullRequest':
          await this.createPullRequest(message.branch);
          break;
        case 'getCommitDetails':
          await this.getCommitDetails(message.hash);
          break;
        case 'selectCommit':
          if (typeof message.hash === 'string') {
            await this.postCommitDetail(message.hash);
          }
          break;
        case 'selectFile':
          if (typeof message.hash === 'string' && typeof message.path === 'string') {
            await this.postFileDiff(message.hash, message.path);
          }
          break;
        default:
          break;
      }
    });

    return this.postState();
  }

  async refresh(): Promise<void> {
    if (this.view) {
      await this.postState();
    }
  }

  private async postState(): Promise<void> {
    if (!this.view) {
      return;
    }

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      this.view.webview.postMessage({
        command: 'updateRepository',
        repository: null
      });
      return;
    }

    try {
      const git = simpleGit(repository.localPath);
      const status = await git.status();
      const changes: any[] = status.files.map((file) => ({
        path: file.path,
        status: this.formatStatusCode(file.index, file.working_dir),
        staged: file.index !== ' ' && file.index !== '?'
      }));

      const log = await git.log({ maxCount: 50 });
      const commits: any[] = log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
        date: this.formatRelativeTime(new Date(commit.date))
      }));

      const branch = await git.branch();

      // Get branch activity dates
      const branchActivity: Record<string, string> = {};
      for (const branchName of branch.all) {
        try {
          const lastCommit = await git.raw(['log', '-1', '--format=%cr', branchName]);
          branchActivity[branchName] = lastCommit.trim();
        } catch (error) {
          // If we can't get the date, skip it
        }
      }

      this.view.webview.postMessage({
        command: 'updateChanges',
        changes
      });

      this.view.webview.postMessage({
        command: 'updateHistory',
        history: commits
      });

      this.view.webview.postMessage({
        command: 'updateBranches',
        branches: branch.all,
        currentBranch: branch.current,
        branchActivity
      });

      this.view.webview.postMessage({
        command: 'updateRepository',
        repository: {
          name: path.basename(repository.localPath),
          path: repository.localPath,
          remote: repository.remoteUrl
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load git data: ${error}`);
    }
  }

  private async postCommitDetail(hash: string): Promise<void> {
    if (!this.view) {
      return;
    }

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return;
    }

    try {
      const git = simpleGit(repository.localPath);
      const raw = await git.raw([
        'show',
        hash,
        '--numstat',
        '--pretty=format:%H%n%an%n%ae%n%ad%n%s',
        '--date=iso'
      ]);

      const lines = raw.split('\n');
      const summaryHash = lines.shift() ?? hash;
      const authorName = lines.shift() ?? '';
      const authorEmail = lines.shift() ?? '';
      const committedAt = lines.shift() ?? '';
      const message = lines.shift() ?? '';
      if (lines[0] === '') {
        lines.shift();
      }

      const files: CommitDetail['files'] = [];
      let additions = 0;
      let deletions = 0;

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }
        const [addStr, delStr, filePath] = line.split('\t');
        if (!filePath) {
          continue;
        }
        const addVal = addStr === '-' ? null : Number.parseInt(addStr, 10);
        const delVal = delStr === '-' ? null : Number.parseInt(delStr, 10);
        if (typeof addVal === 'number' && !Number.isNaN(addVal)) {
          additions += addVal;
        }
        if (typeof delVal === 'number' && !Number.isNaN(delVal)) {
          deletions += delVal;
        }
        files.push({
          path: filePath,
          status: '',
          additions: addVal ?? null,
          deletions: delVal ?? null
        });
      }

      const statusRaw = await git.raw(['show', hash, '--name-status', '--pretty=format:']);
      const statusMap = new Map<string, string>();
      for (const line of statusRaw.split('\n')) {
        if (!line.trim()) {
          continue;
        }
        const [state, filePath] = line.split('\t');
        if (filePath) {
          statusMap.set(filePath, state);
        }
      }

      for (const file of files) {
        file.status = statusMap.get(file.path) ?? 'M';
      }

      const detail: CommitDetail = {
        summary: {
          hash: summaryHash,
          shortHash: summaryHash.slice(0, 7),
          message,
          authorName,
          authorEmail,
          committedAt,
          relativeTime: this.formatRelativeTime(new Date(committedAt)),
          additions,
          deletions,
          fileCount: files.length
        },
        files
      };

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

  private async postFileDiff(hash: string, filePath: string): Promise<void> {
    if (!this.view) {
      return;
    }

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return;
    }

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

  private formatStatusCode(index: string, workingDir: string): string {
    const combined = `${index ?? ''}${workingDir ?? ''}`.trim();
    return combined.length > 0 ? combined : '--';
  }

  private formatRelativeTime(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
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

  private async stageFiles(files: string[]): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !files?.length) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.add(files);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to stage files: ${error}`);
    }
  }

  private async unstageFiles(files: string[]): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !files?.length) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.reset(['HEAD', ...files]);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to unstage files: ${error}`);
    }
  }

  private async commit(message: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !message?.trim()) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.commit(message);
      await this.postState();
      vscode.window.showInformationMessage('Commit created successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to commit: ${error}`);
    }
  }

  private async push(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.push();
      vscode.window.showInformationMessage('Pushed successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to push: ${error}`);
    }
  }

  private async pull(): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.pull();
      await this.postState();
      vscode.window.showInformationMessage('Pulled successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to pull: ${error}`);
    }
  }

  private async checkoutBranch(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkout(branchName);
      await this.postState();
      vscode.window.showInformationMessage(`Checked out branch: ${branchName}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to checkout branch: ${error}`);
    }
  }

  private async mergeBranch(fromBranch: string, toBranch: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !fromBranch || !toBranch) return;

    try {
      const git = simpleGit(repository.localPath);

      // Ensure we're on the target branch
      await git.checkout(toBranch);

      // Perform the merge
      await git.merge([fromBranch]);

      await this.postState();
      vscode.window.showInformationMessage(`Successfully merged ${fromBranch} into ${toBranch}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to merge branches: ${error}`);
    }
  }

  private async createPullRequest(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      // For now, we'll open the GitHub PR creation page
      // In a real implementation, you'd use the GitHub API
      const repoUrl = repository.remoteUrl;
      if (repoUrl) {
        // Extract GitHub URL from git remote
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

  private async getCommitDetails(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !hash) return;

    try {
      const git = simpleGit(repository.localPath);

      // Get commit info
      const commitInfo = await git.show([hash, '--name-status', '--format=%H%n%an%n%ae%n%ad%n%s%n%b']);
      const lines = commitInfo.split('\n');

      const fullHash = lines[0];
      const author = lines[1];
      const email = lines[2];
      const date = lines[3];
      const message = lines[4];

      // Get file changes with statistics
      const stats = await git.raw(['show', hash, '--numstat', '--format=']);
      const statLines = stats.split('\n').filter(line => line.trim());

      const files: Array<{
        path: string;
        status: string;
        additions: number;
        deletions: number;
      }> = [];

      let totalAdditions = 0;
      let totalDeletions = 0;

      // Get file status
      const statusOutput = await git.raw(['show', hash, '--name-status', '--format=']);
      const statusLines = statusOutput.split('\n').filter(line => line.trim());

      const statusMap = new Map<string, string>();
      for (const line of statusLines) {
        const [status, filePath] = line.split('\t');
        if (filePath) {
          statusMap.set(filePath, status);
        }
      }

      // Parse numstat output
      for (const line of statLines) {
        const [addStr, delStr, filePath] = line.split('\t');
        if (!filePath) continue;

        const additions = addStr === '-' ? 0 : parseInt(addStr, 10) || 0;
        const deletions = delStr === '-' ? 0 : parseInt(delStr, 10) || 0;
        const status = statusMap.get(filePath) || 'M';

        files.push({
          path: filePath,
          status,
          additions,
          deletions
        });

        totalAdditions += additions;
        totalDeletions += deletions;
      }

      const commitDetail = {
        hash: fullHash,
        message,
        author,
        email,
        date: this.formatRelativeTime(new Date(date)),
        files,
        totalAdditions,
        totalDeletions
      };

      this.view?.webview.postMessage({
        command: 'commitDetails',
        commitDetail
      });

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to get commit details: ${error}`);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'index.js')
    );

    const repository = getPrimaryRepository(this.repositories);
    const initialData = {
      changes: [],
      history: [],
      branches: [],
      currentBranch: null,
      repository: repository ? {
        name: path.basename(repository.localPath),
        path: repository.localPath,
        remote: repository.remoteUrl
      } : null,
      accounts: [],
      activeAccount: null
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
    <title>GitHub Desktop Timeline</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            color-scheme: light dark;
            font-family: var(--vscode-font-family, "Segoe UI", system-ui, -apple-system, sans-serif);
            font-size: var(--vscode-font-size, 13px);
            overflow: hidden;
        }
        #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body class="vscode-body">
    <div id="root"></div>
    <script>
        const vscode = acquireVsCodeApi();

        // Global functions that React components can call
        window.vscodeApi = {
            postMessage: (message) => vscode.postMessage(message),
            getState: () => vscode.getState(),
            setState: (state) => vscode.setState(state)
        };

        // Pass initial data to React app
        window.initialData = ${JSON.stringify(initialData)};
    </script>
    <script src="${reactAppUri}"></script>
</body>
</html>`;
  }
}