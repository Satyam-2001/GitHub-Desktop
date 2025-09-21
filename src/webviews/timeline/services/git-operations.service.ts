import * as path from 'path';
import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { RepositoryManager } from '../../../core/repositories/repository-manager';
import { getPrimaryRepository } from '../../../shared/utils/repo-selection';
import { ChangeEntry, CommitEntry, CommitDetail, CommitDetailFile } from '../interfaces/timeline-view-provider.interface';

export class GitOperationsService {
  constructor(private readonly repositories: RepositoryManager) {}

  async getRepositoryData(): Promise<{
    changes: ChangeEntry[];
    commits: CommitEntry[];
    hasMoreCommits: boolean;
    branches: string[];
    currentBranch: string | null;
    branchActivity: Record<string, string>;
    repository: any;
  } | null> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return null;
    }

    try {
      const git = simpleGit(repository.localPath);
      const [status, log, branch] = await Promise.all([
        git.status(),
        git.log({ maxCount: 50 }),
        git.branch()
      ]);

      const changes: ChangeEntry[] = status.files.map((file) => ({
        path: file.path,
        status: this.formatStatusCode(file.index, file.working_dir),
        staged: file.index !== ' ' && file.index !== '?'
      }));

      const commits: CommitEntry[] = log.all.map((commit) => ({
        hash: commit.hash || '',
        shortHash: (commit.hash || '').slice(0, 7),
        message: commit.message || '',
        author: commit.author_name || 'Unknown',
        email: commit.author_email || '',
        authorName: commit.author_name || '',
        authorEmail: commit.author_email || '',
        relativeTime: this.formatRelativeTime(commit.date),
        committedAt: commit.date ? String(commit.date) : ''
      }));

      const hasMoreCommits = log.all.length === 50;

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

      return {
        changes,
        commits,
        hasMoreCommits,
        branches: branch.all,
        currentBranch: branch.current,
        branchActivity,
        repository: {
          name: path.basename(repository.localPath),
          path: repository.localPath,
          remote: repository.remoteUrl
        }
      };
    } catch (error) {
      throw new Error(`Failed to load git data: ${error}`);
    }
  }

  async getCommitDetail(hash: string): Promise<CommitDetail> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      throw new Error('No repository found');
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
        if (!line.trim()) continue;
        const [addStr, delStr, filePath] = line.split('\t');
        if (!filePath) continue;

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

      // Get file status information
      const statusRaw = await git.raw(['show', hash, '--name-status', '--pretty=format:']);
      const statusMap = new Map<string, string>();
      for (const line of statusRaw.split('\n')) {
        if (!line.trim()) continue;
        const [state, filePath] = line.split('\t');
        if (filePath) {
          statusMap.set(filePath, state);
        }
      }

      // Update file status
      for (const file of files) {
        file.status = statusMap.get(file.path) ?? 'M';
      }

      return {
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
    } catch (error) {
      throw new Error(`Failed to load commit details: ${error}`);
    }
  }

  async loadMoreCommits(offset: number): Promise<{
    commits: CommitEntry[];
    hasMoreCommits: boolean;
    newOffset: number;
  }> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      throw new Error('No repository found');
    }

    try {
      const git = simpleGit(repository.localPath);
      const logOutput = await git.raw([
        'log',
        '--oneline',
        '--format=%H%x09%an%x09%ae%x09%ad%x09%s',
        '--date=iso',
        '--max-count=50',
        `--skip=${offset}`
      ]);

      const lines = logOutput.trim().split('\n').filter(line => line.trim());
      const commits: CommitEntry[] = lines.map((line) => {
        const [hash, author, email, date, ...messageParts] = line.split('\t');
        const message = messageParts.join('\t');

        return {
          hash: hash || '',
          shortHash: (hash || '').slice(0, 7),
          message: message || '',
          author: author || 'Unknown',
          email: email || '',
          authorName: author || '',
          authorEmail: email || '',
          relativeTime: this.formatRelativeTime(this.parseGitDate(date)),
          committedAt: date || ''
        };
      });

      const hasMoreCommits = commits.length === 50;

      return {
        commits,
        hasMoreCommits,
        newOffset: offset + 50
      };
    } catch (error) {
      throw new Error(`Failed to load more commits: ${error}`);
    }
  }

  private formatStatusCode(index: string, workingDir: string): string {
    const combined = `${index ?? ''}${workingDir ?? ''}`.trim();
    return combined.length > 0 ? combined : '--';
  }

  private parseGitDate(dateInput: string | Date | any): Date {
    // If it's already a Date object (from simple-git), return it
    if (dateInput instanceof Date) {
      return Number.isNaN(dateInput.getTime()) ? new Date('1970-01-01') : dateInput;
    }

    // If it's not a string, convert to string
    const dateString = String(dateInput || '');

    if (!dateString || dateString.trim() === '' || dateString === 'undefined' || dateString === 'null') {
      return new Date('1970-01-01'); // Return epoch as fallback
    }

    // Try to parse the date string directly
    const parsedDate = new Date(dateString);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    // If standard parsing fails, try to handle Git's ISO format
    try {
      // Git typically returns dates in ISO format like "2024-01-15 10:30:45 +0000"
      const isoMatch = dateString.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
      if (isoMatch) {
        const [, datePart, timePart] = isoMatch;
        return new Date(`${datePart}T${timePart}Z`);
      }

      // Try Unix timestamp (if it's just numbers)
      const timestamp = parseInt(dateString, 10);
      if (!Number.isNaN(timestamp) && timestamp > 0) {
        // If it looks like a Unix timestamp (seconds), convert to milliseconds
        const date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      // Fall through to fallback
    }

    // Return epoch as final fallback
    return new Date('1970-01-01');
  }

  private formatRelativeTime(date: Date | string | any): string {
    let actualDate: Date;

    if (date instanceof Date) {
      actualDate = date;
    } else {
      actualDate = this.parseGitDate(date);
    }

    if (Number.isNaN(actualDate.getTime())) {
      return 'Unknown date';
    }
    const diff = Date.now() - actualDate.getTime();
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