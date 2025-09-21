import * as vscode from 'vscode';
import { CommitDetailMessage } from '../interfaces/commit-detail.interface';
import { CommitDetailService } from './commit-detail.service';

export class CommitDetailMessageHandlerService {
  constructor(
    private readonly commitDetailService: CommitDetailService,
    private readonly panel: vscode.WebviewPanel,
    private readonly commitHash: string
  ) {}

  async handleMessage(message: CommitDetailMessage): Promise<void> {
    try {
      switch (message.command) {
        case 'ready':
          await this.handleReady();
          break;
        case 'getFileDiff':
          if (message.hash && message.filePath) {
            await this.handleGetFileDiff(message.hash, message.filePath);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Message handling failed: ${error}`);
    }
  }

  private async handleReady(): Promise<void> {
    try {
      const commitDetail = await this.commitDetailService.getCommitDetail(
        this.commitHash,
        this.panel.webview
      );

      this.panel.webview.postMessage({
        command: 'commitDetails',
        commitDetail,
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load commit details: ${error}`);
    }
  }

  private async handleGetFileDiff(hash: string, filePath: string): Promise<void> {
    try {
      await this.commitDetailService.createFileDiff(hash, filePath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file diff: ${error}`);
    }
  }
}