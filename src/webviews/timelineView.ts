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
      localResourceRoots: [this.context.extensionUri]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'ready':
        case 'refresh':
          await this.postState();
          break;
        case 'selectCommit':
          if (typeof message.hash === 'string') {
            await this.postCommitDetail(message.hash);
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
        type: 'state',
        payload: {
          repository: undefined,
          changes: [],
          history: []
        }
      });
      return;
    }

    try {
      const git = simpleGit(repository.localPath);
      const status = await git.status();
      const changes: ChangeEntry[] = status.files.map((file) => ({
        path: file.path,
        status: this.formatStatusCode(file.index, file.working_dir)
      }));

      const log = await git.log({ maxCount: 50 });
      const commits: CommitEntry[] = log.all.map((commit) => ({
        hash: commit.hash,
        shortHash: commit.hash.slice(0, 7),
        message: commit.message,
        authorName: commit.author_name,
        authorEmail: commit.author_email,
        relativeTime: this.formatRelativeTime(new Date(commit.date)),
        committedAt: commit.date
      }));

      this.view.webview.postMessage({
        type: 'state',
        payload: {
          repository: {
            owner: repository.owner,
            name: repository.name
          },
          changes,
          history: commits
        }
      });
    } catch (error) {
      this.view.webview.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load git data.'
      });
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

  private getHtml(webview: vscode.Webview): string {
    const nonce = Date.now().toString();
    const cspSource = webview.cspSource;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: light dark;
        --tab-bg: var(--vscode-sideBarSectionHeader-background, #1f1f1f);
        --tab-active: var(--vscode-focusBorder, #007acc);
        --card-bg: var(--vscode-sideBar-background, #252526);
        --card-border: var(--vscode-sideBarSectionHeader-border, rgba(255,255,255,0.08));
        --muted: var(--vscode-descriptionForeground, #a0a0a0);
        --text: var(--vscode-foreground);
        --list-hover: var(--vscode-list-hoverBackground, rgba(90,93,94,0.4));
      }

      body {
        margin: 0;
        padding: 0;
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--text);
        background: var(--vscode-sideBar-background);
      }

      .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .tabs {
        display: flex;
        border-bottom: 1px solid var(--card-border);
      }

      .tab {
        flex: 1;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: var(--muted);
        font-weight: 600;
        cursor: pointer;
      }

      .tab.active {
        color: var(--text);
        border-bottom: 2px solid var(--tab-active);
      }

      .timeline {
        flex: 1;
        display: flex;
        min-height: 0;
      }

      .changes-panel,
      .history-panel {
        flex: 1;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .panel-active {
        display: flex;
      }

      .list {
        overflow-y: auto;
        padding: 8px;
      }

      .change-item,
      .commit-card {
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 8px;
        background: var(--card-bg);
        border: 1px solid transparent;
        cursor: pointer;
        transition: background 0.1s ease-in;
      }

      .change-item:hover,
      .commit-card:hover {
        background: var(--list-hover);
      }

      .commit-card.active {
        border-color: var(--tab-active);
      }

      .change-title {
        font-weight: 600;
      }

      .meta {
        font-size: 12px;
        color: var(--muted);
        margin-top: 4px;
      }

      .history-layout {
        flex: 1;
        display: flex;
        min-height: 0;
      }

      .history-list {
        width: 45%;
        min-width: 200px;
        border-right: 1px solid var(--card-border);
        overflow-y: auto;
        padding: 8px;
      }

      .history-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .detail-header {
        padding: 16px;
        border-bottom: 1px solid var(--card-border);
      }

      .detail-header h2 {
        margin: 0 0 6px;
        font-size: 16px;
      }

      .detail-summary {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 12px;
        color: var(--muted);
      }

      .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 999px;
        font-size: 11px;
      }

      .badge.additions {
        background: rgba(63, 185, 80, 0.2);
        color: #3fb950;
      }

      .badge.deletions {
        background: rgba(248, 81, 73, 0.2);
        color: #f85149;
      }

      .files-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .files-list h3 {
        margin: 0 0 8px;
        font-size: 13px;
        color: var(--muted);
      }

      .file-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 6px;
        background: var(--card-bg);
        border: 1px solid transparent;
      }

      .file-row:hover {
        background: var(--list-hover);
      }

      .file-path {
        font-size: 12px;
        word-break: break-all;
      }

      .status-pill {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 12px;
        border: 1px solid var(--card-border);
      }

      .placeholder {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
        padding: 24px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="tabs">
        <button class="tab active" data-tab="changes">Changes</button>
        <button class="tab" data-tab="history">History</button>
      </div>
      <div class="timeline">
        <section id="changes" class="changes-panel panel-active">
          <div class="list" id="changesList"></div>
        </section>
        <section id="history" class="history-panel">
          <div class="history-layout">
            <div class="history-list" id="historyList"></div>
            <div class="history-detail" id="historyDetail">
              <div class="placeholder">Select a commit to see details.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <script nonce="${nonce}">
      (function () {
        const vscode = acquireVsCodeApi();
        const tabs = Array.from(document.querySelectorAll('.tab'));
        const panels = {
          changes: document.getElementById('changes'),
          history: document.getElementById('history')
        };
        const changesList = document.getElementById('changesList');
        const historyList = document.getElementById('historyList');
        const historyDetail = document.getElementById('historyDetail');
        let activeCommitHash = null;

        tabs.forEach((tab) => {
          tab.addEventListener('click', () => {
            tabs.forEach((btn) => btn.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            Object.keys(panels).forEach((name) => {
              const element = panels[name];
              if (!element) {
                return;
              }
              if (name === target) {
                element.classList.add('panel-active');
              } else {
                element.classList.remove('panel-active');
              }
            });
          });
        });

        function escapeHtml(value) {
          return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function renderChanges(changes) {
          changesList.innerHTML = '';
          if (!changes || changes.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Working tree clean.';
            changesList.appendChild(placeholder);
            return;
          }

          changes.forEach((change) => {
            const card = document.createElement('div');
            card.className = 'change-item';

            const title = document.createElement('div');
            title.className = 'change-title';
            title.textContent = change.path;
            card.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = 'Status: ' + change.status;
            card.appendChild(meta);

            changesList.appendChild(card);
          });
        }

        function renderHistory(commits) {
          historyList.innerHTML = '';
          if (!commits || commits.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'No commits found.';
            historyList.appendChild(placeholder);
            return;
          }

          commits.forEach((commit) => {
            const card = document.createElement('div');
            card.className = 'commit-card';
            card.dataset.hash = commit.hash;

            const title = document.createElement('div');
            title.className = 'change-title';
            title.textContent = commit.message || commit.hash;
            card.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = commit.authorName + ' - ' + commit.relativeTime;
            card.appendChild(meta);

            card.addEventListener('click', () => {
              activeCommitHash = commit.hash;
              vscode.postMessage({ type: 'selectCommit', hash: commit.hash });
              Array.from(historyList.querySelectorAll('.commit-card')).forEach((element) => {
                element.classList.toggle('active', element.dataset.hash === commit.hash);
              });
            });

            historyList.appendChild(card);
          });
        }

        function renderCommitDetail(detail) {
          if (!detail) {
            historyDetail.innerHTML = '<div class="placeholder">Select a commit to see details.</div>';
            return;
          }

          const headerHtml =
            '<h2>' + escapeHtml(detail.summary.message) + '</h2>' +
            '<div class="detail-summary">' +
            '<span>' + escapeHtml(detail.summary.authorName) + ' - ' + detail.summary.relativeTime + '</span>' +
            '<span>' + detail.summary.shortHash + '</span>' +
            '<span class="badge additions">+' + detail.summary.additions + '</span>' +
            '<span class="badge deletions">-' + detail.summary.deletions + '</span>' +
            '<span>' + detail.summary.fileCount + ' files changed</span>' +
            '</div>';

          const header = document.createElement('div');
          header.className = 'detail-header';
          header.innerHTML = headerHtml;

          const filesList = document.createElement('div');
          filesList.className = 'files-list';

          const heading = document.createElement('h3');
          heading.textContent = 'Changed files';
          filesList.appendChild(heading);

          detail.files.forEach((file) => {
            const row = document.createElement('div');
            row.className = 'file-row';

            const pathEl = document.createElement('div');
            pathEl.className = 'file-path';
            pathEl.textContent = file.path;
            row.appendChild(pathEl);

            const statusEl = document.createElement('div');
            statusEl.className = 'status-pill';
            const add = typeof file.additions === 'number' ? '+ ' + file.additions : '';
            const del = typeof file.deletions === 'number' ? '- ' + file.deletions : '';
            const parts = [file.status];
            if (add) {
              parts.push(add);
            }
            if (del) {
              parts.push(del);
            }
            statusEl.textContent = parts.join(' ');
            row.appendChild(statusEl);

            filesList.appendChild(row);
          });

          historyDetail.innerHTML = '';
          historyDetail.appendChild(header);
          historyDetail.appendChild(filesList);
        }

        window.addEventListener('message', (event) => {
          const message = event.data;
          switch (message.type) {
            case 'state':
              renderChanges(message.payload.changes);
              renderHistory(message.payload.history);
              if (activeCommitHash) {
                const selector = '.commit-card[data-hash="' + activeCommitHash + '"]';
                const activeCard = historyList.querySelector(selector);
                if (activeCard) {
                  activeCard.classList.add('active');
                }
              }
              break;
            case 'commitDetail':
              renderCommitDetail(message.payload);
              break;
            case 'error':
              console.error(message.payload);
              break;
            default:
              break;
          }
        });

        vscode.postMessage({ type: 'ready' });
      })();
    </script>
  </body>
</html>`;
  }
}
