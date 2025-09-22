import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { iconThemeService } from '../../../core/services/icon-theme.service';
import { RepositoryManager } from '../../../core/repositories/repository-manager';
import { getPrimaryRepository } from '../../../shared/utils/repo-selection';
import { CommitDetail, CommitDetailFile, ICommitDetailService } from '../interfaces/commit-detail.interface';

dayjs.extend(relativeTime);

export class CommitDetailService implements ICommitDetailService {
  private static diffViewColumn: vscode.ViewColumn = vscode.ViewColumn.Three;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager
  ) {}

  async getCommitDetail(commitHash: string, webview?: vscode.Webview): Promise<CommitDetail> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      throw new Error('No repository found');
    }

    try {
      const git = simpleGit(repository.localPath);

      // Get commit info
      const commitInfo = await git.show([
        commitHash,
        '--name-status',
        '--format=%H%n%an%n%ae%n%ad%n%s%n%b',
      ]);
      const lines = commitInfo.split('\n');

      const fullHash = lines[0];
      const author = lines[1];
      const email = lines[2];
      const date = lines[3];
      const message = lines[4];

      // Get file changes with statistics
      const stats = await git.raw([
        'show',
        commitHash,
        '--numstat',
        '--format=',
      ]);
      const statLines = stats.split('\n').filter((line) => line.trim());

      const files: CommitDetailFile[] = [];
      let totalAdditions = 0;
      let totalDeletions = 0;

      // Get file status
      const statusOutput = await git.raw([
        'show',
        commitHash,
        '--name-status',
        '--format=',
      ]);
      const statusLines = statusOutput
        .split('\n')
        .filter((line) => line.trim());

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

        const iconInfo = webview
          ? await iconThemeService.getIconForFile(webview, filePath)
          : undefined;

        files.push({
          path: filePath,
          status,
          additions,
          deletions,
          iconUri: iconInfo?.iconUri,
        });

        totalAdditions += additions;
        totalDeletions += deletions;
      }

      return {
        hash: fullHash,
        message,
        author,
        email,
        date: this.formatRelativeTime(new Date(date)),
        files,
        totalAdditions,
        totalDeletions,
      };
    } catch (error) {
      throw new Error(`Failed to get commit details: ${error}`);
    }
  }

  async createFileDiff(hash: string, filePath: string): Promise<void> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository || !hash || !filePath) {
      throw new Error('Invalid parameters for file diff');
    }

    try {
      const git = simpleGit(repository.localPath);

      // Create temporary files for diff comparison
      const tempDir = vscode.Uri.joinPath(
        this.context.globalStorageUri,
        'temp'
      );
      await vscode.workspace.fs.createDirectory(tempDir);

      const oldTempFile = vscode.Uri.joinPath(
        tempDir,
        `${hash}_old_${path.basename(filePath)}`
      );
      const newTempFile = vscode.Uri.joinPath(
        tempDir,
        `${hash}_new_${path.basename(filePath)}`
      );

      // Get file content before and after commit
      let oldContent = '';
      try {
        oldContent = await git.show([`${hash}~1:${filePath}`]);
      } catch {
        // File might be new, so old content is empty
      }

      const newContent = await git.show([`${hash}:${filePath}`]);

      // Write temporary files
      await vscode.workspace.fs.writeFile(
        oldTempFile,
        Buffer.from(oldContent, 'utf8')
      );
      await vscode.workspace.fs.writeFile(
        newTempFile,
        Buffer.from(newContent, 'utf8')
      );

      // Open diff in a specific dedicated column
      const title = `${path.basename(filePath)} (${hash.substring(0, 7)})`;

      // Use the native diff command - it will automatically reuse the column
      await vscode.commands.executeCommand(
        'vscode.diff',
        oldTempFile,
        newTempFile,
        title
      );

      // Show success message
      vscode.window.showInformationMessage(`Opened diff for ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to open file diff: ${error}`);
    }
  }

  private formatRelativeTime(date: Date): string {
    const dayjsDate = dayjs(date);
    const diffInDays = dayjs().diff(dayjsDate, 'day');

    if (diffInDays > 30) {
      // For dates older than 30 days, show formatted date with time
      return dayjsDate.format('D MMMM, YYYY [at] h:mm A');
    }

    return dayjsDate.fromNow();
  }
}