import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../repositoryManager';
import { getPrimaryRepository } from '../utils/repoSelection';
import { CommitDetailViewProvider } from './commitDetailView';

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
    private readonly repositories: RepositoryManager,
    private readonly commitDetailProvider: CommitDetailViewProvider
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'assets'),
        vscode.Uri.joinPath(this.context.extensionUri, 'out')
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    // Handle webview becoming visible/hidden
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Refresh data when webview becomes visible
        this.postState();
      }
    });

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
        case 'getFileDiff':
          await this.getFileDiff(message.hash, message.filePath);
          break;
        case 'openCommitDetail':
          if (typeof message.hash === 'string') {
            await this.commitDetailProvider.showCommitDetails(message.hash);
          }
          break;
        case 'resetToCommit':
          if (typeof message.hash === 'string') {
            await this.resetToCommit(message.hash);
          }
          break;
        case 'checkoutCommit':
          if (typeof message.hash === 'string') {
            await this.checkoutCommit(message.hash);
          }
          break;
        case 'revertCommit':
          if (typeof message.hash === 'string') {
            await this.revertCommit(message.hash);
          }
          break;
        case 'createBranchFromCommit':
          if (typeof message.hash === 'string') {
            await this.createBranchFromCommit(message.hash);
          }
          break;
        case 'createTagFromCommit':
          if (typeof message.hash === 'string') {
            await this.createTagFromCommit(message.hash);
          }
          break;
        case 'cherryPickCommit':
          if (typeof message.hash === 'string') {
            await this.cherryPickCommit(message.hash);
          }
          break;
        case 'viewCommitOnGitHub':
          if (typeof message.hash === 'string') {
            await this.viewCommitOnGitHub(message.hash);
          }
          break;
        case 'createBranch':
          if (typeof message.branchName === 'string') {
            await this.createBranch(message.branchName);
          }
          break;
        case 'createBranchWithChanges':
          if (typeof message.branchName === 'string' && typeof message.bringChanges === 'boolean') {
            await this.createBranchWithChanges(message.branchName, message.bringChanges);
          }
          break;
        case 'loadMoreCommits':
          if (typeof message.offset === 'number') {
            await this.loadMoreCommits(message.offset);
          }
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

      // Check if there are more commits available
      const hasMoreCommits = log.all.length === 50;

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
        history: commits,
        hasMoreCommits,
        offset: 0
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

  private async getFileIconInfo(filePath: string): Promise<{ iconClass?: string; iconUri?: string }> {
    try {
      // Use VS Code's ThemeIcon.File to get the appropriate file icon
      const uri = vscode.Uri.file(filePath);

      // Create a fake file URI to get the file icon from VS Code's theme
      // This approach uses VS Code's internal file icon resolution
      const fileIcon = vscode.ThemeIcon.File;

      // Get the file icon URI that the webview can use
      // Note: This is a simplified approach. A full implementation would need
      // to access VS Code's file icon contribution point directly

      const ext = path.extname(filePath).toLowerCase();
      const baseName = path.basename(filePath).toLowerCase();

      // Use VS Code's codicon for file types as a fallback
      // These work with the default VS Code theme and most icon themes
      let iconName = 'file';

      // Special file names
      if (baseName === 'package.json') iconName = 'package';
      else if (baseName === 'tsconfig.json') iconName = 'gear';
      else if (baseName === '.gitignore') iconName = 'git-commit';
      else if (baseName.startsWith('.env')) iconName = 'gear';
      else if (baseName === 'readme.md') iconName = 'book';
      else if (baseName.startsWith('dockerfile')) iconName = 'file-binary';

      // File extensions
      else {
        switch (ext) {
          case '.ts': iconName = 'symbol-class'; break;
          case '.tsx': iconName = 'symbol-class'; break;
          case '.js': iconName = 'symbol-method'; break;
          case '.jsx': iconName = 'symbol-method'; break;
          case '.json': iconName = 'json'; break;
          case '.html': iconName = 'code'; break;
          case '.css': iconName = 'symbol-color'; break;
          case '.scss': iconName = 'symbol-color'; break;
          case '.md': iconName = 'markdown'; break;
          case '.yml':
          case '.yaml': iconName = 'settings-gear'; break;
          case '.xml': iconName = 'code'; break;
          case '.svg': iconName = 'file-media'; break;
          case '.png':
          case '.jpg':
          case '.jpeg':
          case '.gif': iconName = 'file-media'; break;
          case '.pdf': iconName = 'file-pdf'; break;
          case '.zip': iconName = 'file-zip'; break;
          case '.py': iconName = 'symbol-namespace'; break;
          case '.java': iconName = 'symbol-class'; break;
          case '.go': iconName = 'symbol-method'; break;
          case '.rs': iconName = 'symbol-misc'; break;
          case '.vue': iconName = 'symbol-namespace'; break;
          case '.sql': iconName = 'database'; break;
          case '.lock': iconName = 'lock'; break;
          case '.txt': iconName = 'file-text'; break;
          case '.log': iconName = 'output'; break;
          default: iconName = 'file'; break;
        }
      }

      // Return the codicon class name that the webview can use
      return { iconClass: `codicon codicon-${iconName}` };
    } catch (error) {
      return { iconClass: 'codicon codicon-file' };
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
        iconClass?: string;
        iconUri?: string;
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

        const iconInfo = await this.getFileIconInfo(filePath);
        files.push({
          path: filePath,
          status,
          additions,
          deletions,
          ...iconInfo
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

  private async getFileDiff(hash: string, filePath: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !hash || !filePath) return;

    try {
      const git = simpleGit(repository.localPath);

      // Create temporary files for diff comparison
      const tempDir = vscode.Uri.joinPath(this.context.globalStorageUri, 'temp');
      await vscode.workspace.fs.createDirectory(tempDir);

      // Get the current version of the file (if it exists)
      const currentFilePath = vscode.Uri.file(path.join(repository.localPath, filePath));
      let currentExists = false;
      try {
        await vscode.workspace.fs.stat(currentFilePath);
        currentExists = true;
      } catch {
        // File doesn't exist in current working directory
      }

      // Get the file content from the commit
      let oldContent = '';
      try {
        oldContent = await git.raw(['show', `${hash}^:${filePath}`]);
      } catch {
        // File didn't exist in parent commit (newly added)
      }

      let newContent = '';
      try {
        newContent = await git.raw(['show', `${hash}:${filePath}`]);
      } catch {
        // File was deleted in this commit
      }

      // Create temporary files
      const oldTempFile = vscode.Uri.joinPath(tempDir, `${hash}-old-${path.basename(filePath)}`);
      const newTempFile = vscode.Uri.joinPath(tempDir, `${hash}-new-${path.basename(filePath)}`);

      await vscode.workspace.fs.writeFile(oldTempFile, Buffer.from(oldContent, 'utf8'));
      await vscode.workspace.fs.writeFile(newTempFile, Buffer.from(newContent, 'utf8'));

      // Open diff in VS Code editor
      const title = `${path.basename(filePath)} (${hash.substring(0, 7)})`;
      await vscode.commands.executeCommand(
        'vscode.diff',
        oldTempFile,
        newTempFile,
        title
      );

      // Show success message
      vscode.window.showInformationMessage(`Opened diff for ${filePath}`);

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file diff: ${error}`);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'main.js')
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https:; script-src ${webview.cspSource} 'unsafe-inline'; img-src https: data:; font-src ${webview.cspSource} https:;">
    <title>GitHub Desktop Timeline</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css">
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
        .codicon {
            font-family: 'codicon';
            cursor: default;
            user-select: none;
            color: var(--vscode-foreground);
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
    <script type="module" src="${reactAppUri}"></script>
</body>
</html>`;
  }

  private async resetToCommit(hash: string): Promise<void> {
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
        await this.postState();
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reset: ${error}`);
      }
    }
  }

  private async checkoutCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkout(hash);
      vscode.window.showInformationMessage(`Checked out commit ${hash.substring(0, 7)}`);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to checkout commit: ${error}`);
    }
  }

  private async revertCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.revert(hash, ['--no-edit']);
      vscode.window.showInformationMessage(`Reverted commit ${hash.substring(0, 7)}`);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to revert commit: ${error}`);
    }
  }

  private async createBranchFromCommit(hash: string): Promise<void> {
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
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
    }
  }

  private async createTagFromCommit(hash: string): Promise<void> {
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

  private async cherryPickCommit(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.raw(['cherry-pick', hash]);
      vscode.window.showInformationMessage(`Cherry-picked commit ${hash.substring(0, 7)}`);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to cherry-pick commit: ${error}`);
    }
  }

  private async viewCommitOnGitHub(hash: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository?.remoteUrl) {
      vscode.window.showWarningMessage('No GitHub remote found');
      return;
    }

    try {
      // Extract GitHub URL from git remote
      const githubUrl = repository.remoteUrl
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/\.git$/, '');

      const commitUrl = `${githubUrl}/commit/${hash}`;
      vscode.env.openExternal(vscode.Uri.parse(commitUrl));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open GitHub: ${error}`);
    }
  }

  private async createBranch(branchName: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);
      await git.checkoutLocalBranch(branchName);
      vscode.window.showInformationMessage(`Created and switched to branch '${branchName}'`);
      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch: ${error}`);
    }
  }

  private async createBranchWithChanges(branchName: string, bringChanges: boolean): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !branchName) return;

    try {
      const git = simpleGit(repository.localPath);

      if (bringChanges) {
        // Create branch and bring changes
        await git.checkoutLocalBranch(branchName);
        vscode.window.showInformationMessage(`Created branch '${branchName}' with uncommitted changes`);
      } else {
        // Stash changes, create branch, then switch back to restore stash
        await git.stash(['push', '-m', 'Auto-stash before branch creation']);
        await git.checkoutLocalBranch(branchName);
        vscode.window.showInformationMessage(`Created branch '${branchName}' and stashed changes`);
      }

      await this.postState();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create branch with changes: ${error}`);
    }
  }

  private async loadMoreCommits(offset: number): Promise<void> {
    if (!this.view) return;

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);
      // Use raw git command with proper skip syntax
      const logOutput = await git.raw([
        'log',
        '--oneline',
        '--format=%H%x09%an%x09%ae%x09%ad%x09%s',
        '--date=iso',
        '--max-count=50',
        `--skip=${offset}`
      ]);

      const lines = logOutput.trim().split('\n').filter(line => line.trim());
      const commits: any[] = lines.map((line) => {
        const [hash, author, email, date, ...messageParts] = line.split('\t');
        const message = messageParts.join('\t'); // Rejoin in case message contains tabs

        return {
          hash,
          message,
          author: author,
          email: email,
          date: this.formatRelativeTime(new Date(date))
        };
      });

      // Check if there are more commits available
      const hasMoreCommits = commits.length === 50;

      this.view.webview.postMessage({
        command: 'loadMoreCommitsResponse',
        history: commits,
        hasMoreCommits,
        offset: offset + 50
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load more commits: ${error}`);
    }
  }
}