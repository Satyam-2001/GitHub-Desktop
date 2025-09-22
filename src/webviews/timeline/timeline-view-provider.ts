import * as vscode from "vscode";
import { RepositoryManager } from "../../core/repositories/repository-manager";
import { AccountManager } from "../../core/accounts/account-manager";
import { CommitDetailViewProvider } from "../commitDetail/commit-detail-view-provider";
import {
  ITimelineViewProvider,
  WebviewMessage,
} from "./interfaces/timeline-view-provider.interface";
import { GitOperationsService } from "./services/git-operations.service";
import { WebviewHtmlService } from "./services/webview-html.service";
import { MessageHandlerService } from "./services/message-handler.service";
import { FileIconService } from "./services/file-icon.service";

export class TimelineViewProvider implements ITimelineViewProvider {
  private view: vscode.WebviewView | undefined;
  private gitService: GitOperationsService;
  private htmlService: WebviewHtmlService;
  private messageHandler: MessageHandlerService | undefined;
  private fileIconService: FileIconService;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager,
    private readonly accounts: AccountManager,
    private readonly commitDetailProvider: CommitDetailViewProvider,
  ) {
    this.gitService = new GitOperationsService(repositories);
    this.htmlService = new WebviewHtmlService(context, repositories);
    this.fileIconService = new FileIconService();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    this.setupWebview(webviewView);
    this.setupMessageHandler();
    this.setupEventHandlers(webviewView);
    return this.refreshData();
  }

  async refresh(): Promise<void> {
    if (this.view && this.messageHandler) {
      await this.messageHandler.handleMessage({ command: "refresh" });
    }
  }

  private setupWebview(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out", "webview"),
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "out",
          "webview",
          "assets",
        ),
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
      ],
    };
    webviewView.webview.html = this.htmlService.generateHtml(
      webviewView.webview,
    );
  }

  private setupMessageHandler(): void {
    if (!this.view) return;

    this.messageHandler = new MessageHandlerService(
      this.context,
      this.repositories,
      this.accounts,
      this.commitDetailProvider,
      this.gitService,
      this.view,
    );
  }

  private setupEventHandlers(webviewView: vscode.WebviewView): void {
    // Handle webview becoming visible/hidden
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refreshData();
      }
    });

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      if (this.messageHandler) {
        await this.messageHandler.handleMessage(message);
      }
    });
  }

  private async refreshData(): Promise<void> {
    if (this.messageHandler) {
      await this.messageHandler.handleMessage({ command: "refresh" });
    }
  }
}
