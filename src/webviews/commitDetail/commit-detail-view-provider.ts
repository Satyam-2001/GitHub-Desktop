import * as vscode from 'vscode';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RepositoryManager } from '../../core/repositories/repository-manager';
import { ICommitDetailViewProvider, CommitDetailMessage } from './interfaces/commit-detail.interface';
import { CommitDetailService } from './services/commit-detail.service';
import { CommitDetailHtmlService } from './services/commit-detail-html.service';
import { CommitDetailMessageHandlerService } from './services/commit-detail-message-handler.service';

dayjs.extend(relativeTime);

export class CommitDetailViewProvider implements ICommitDetailViewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private commitHash: string | undefined;
  private commitDetailService: CommitDetailService;
  private htmlService: CommitDetailHtmlService;
  private messageHandler: CommitDetailMessageHandlerService | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager
  ) {
    this.commitDetailService = new CommitDetailService(context, repositories);
    this.htmlService = new CommitDetailHtmlService(context);
  }

  public async showCommitDetails(commitHash: string): Promise<void> {
    this.commitHash = commitHash;

    // Create or show the webview panel
    if (this.panel) {
      // Panel exists, just update content and bring to front
      this.panel.reveal(vscode.ViewColumn.Active);
      this.panel.title = `Commit: ${commitHash.substring(0, 7)}`;
      // Update the message handler with the new commit hash
      this.updateMessageHandler();
    } else {
      await this.createPanel();
    }

    // Load commit details
    await this.loadCommitDetails();
  }

  public async refresh(): Promise<void> {
    await this.loadCommitDetails();
  }

  private async createPanel(): Promise<void> {
    this.panel = vscode.window.createWebviewPanel(
      'commitDetail',
      `Commit: ${this.commitHash?.substring(0, 7) || 'Details'}`,
      vscode.ViewColumn.Active, // Open in the currently active column
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview'),
          vscode.Uri.joinPath(
            this.context.extensionUri,
            'out',
            'webview',
            'assets'
          ),
          vscode.Uri.joinPath(this.context.extensionUri, 'out'),
        ],
      }
    );

    this.setupPanel();
  }

  private setupPanel(): void {
    if (!this.panel || !this.commitHash) return;

    this.panel.webview.html = this.htmlService.generateHtml(this.panel.webview);

    // Setup message handler
    this.updateMessageHandler();

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.messageHandler = undefined;
    });

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(async (message: CommitDetailMessage) => {
      if (this.messageHandler) {
        await this.messageHandler.handleMessage(message);
      }
    });
  }

  private updateMessageHandler(): void {
    if (!this.panel || !this.commitHash) return;

    // Create or update the message handler with the current commit hash
    this.messageHandler = new CommitDetailMessageHandlerService(
      this.commitDetailService,
      this.panel,
      this.commitHash
    );
  }

  private async loadCommitDetails(): Promise<void> {
    if (!this.commitHash || !this.messageHandler) return;

    await this.messageHandler.handleMessage({ command: 'ready' });
  }

  // Legacy methods for backward compatibility
  public async getFileDiff(hash: string, filePath: string): Promise<void> {
    try {
      await this.commitDetailService.createFileDiff(hash, filePath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file diff: ${error}`);
    }
  }

  public formatRelativeTime(date: Date): string {
    // This method is now handled internally by the service, but kept for compatibility
    const dayjsDate = dayjs(date);
    const diffInDays = dayjs().diff(dayjsDate, 'day');

    if (diffInDays > 30) {
      return dayjsDate.format('D MMMM, YYYY [at] h:mm A');
    }

    return dayjsDate.fromNow();
  }

  public getHtml(webview: vscode.Webview): string {
    return this.htmlService.generateHtml(webview);
  }
}