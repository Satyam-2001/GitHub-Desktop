import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { iconThemeService } from '../iconThemeService';
import { RepositoryManager } from '../repositoryManager';
import { getPrimaryRepository } from '../utils/repoSelection';

interface CommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  files: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
    iconUri?: string;
  }>;
  totalAdditions: number;
  totalDeletions: number;
}

export class CommitDetailViewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private commitHash: string | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager
  ) {}

  public async showCommitDetails(commitHash: string): Promise<void> {
    this.commitHash = commitHash;

    // Create or show the webview panel
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'commitDetail',
        'Commit Details',
        vscode.ViewColumn.Beside, // Open beside current editor
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview'),
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'assets'),
            vscode.Uri.joinPath(this.context.extensionUri, 'out')
          ]
        }
      );

      this.panel.webview.html = this.getHtml(this.panel.webview);

      // Handle panel disposal
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      // Handle messages from webview
      this.panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
          case 'ready':
            await this.loadCommitDetails();
            break;
          case 'getFileDiff':
            await this.getFileDiff(message.hash, message.filePath);
            break;
        }
      });
    }

    // Load commit details
    await this.loadCommitDetails();
  }

  private async loadCommitDetails(): Promise<void> {
    if (!this.commitHash || !this.panel) return;

    const repository = getPrimaryRepository(this.repositories);
    if (!repository) return;

    try {
      const git = simpleGit(repository.localPath);

      // Get commit info
      const commitInfo = await git.show([this.commitHash, '--name-status', '--format=%H%n%an%n%ae%n%ad%n%s%n%b']);
      const lines = commitInfo.split('\n');

      const fullHash = lines[0];
      const author = lines[1];
      const email = lines[2];
      const date = lines[3];
      const message = lines[4];

      // Get file changes with statistics
      const stats = await git.raw(['show', this.commitHash, '--numstat', '--format=']);
      const statLines = stats.split('\n').filter(line => line.trim());

      const files: Array<{
        path: string;
        status: string;
        additions: number;
        deletions: number;
        iconUri?: string;
      }> = [];

      let totalAdditions = 0;
      let totalDeletions = 0;

      // Get file status
      const statusOutput = await git.raw(['show', this.commitHash, '--name-status', '--format=']);
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

        const iconInfo = this.panel
          ? await iconThemeService.getIconForFile(this.panel.webview, filePath)
          : undefined;

        files.push({
          path: filePath,
          status,
          additions,
          deletions,
          iconUri: iconInfo?.iconUri
        });

        totalAdditions += additions;
        totalDeletions += deletions;
      }

      const commitDetail: CommitDetail = {
        hash: fullHash,
        message,
        author,
        email,
        date: this.formatRelativeTime(new Date(date)),
        files,
        totalAdditions,
        totalDeletions
      };

      this.panel.webview.postMessage({
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

      const oldTempFile = vscode.Uri.joinPath(tempDir, `${hash}_old_${path.basename(filePath)}`);
      const newTempFile = vscode.Uri.joinPath(tempDir, `${hash}_new_${path.basename(filePath)}`);

      // Get file content before and after commit
      let oldContent = '';
      try {
        oldContent = await git.show([`${hash}~1:${filePath}`]);
      } catch {
        // File might be new, so old content is empty
      }

      const newContent = await git.show([`${hash}:${filePath}`]);

      // Write temporary files
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

  public async refresh(): Promise<void> {
    await this.loadCommitDetails();
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'commit-detail.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src https: data:;">
    <title>Commit Details</title>
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
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
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

        // Signal that webview is ready
        vscode.postMessage({ command: 'ready' });
    </script>
    <script type="module" src="${reactAppUri}"></script>
</body>
</html>`;
  }
}
