import * as path from "path";
import * as vscode from "vscode";
import simpleGit from "simple-git";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { RepositoryManager } from "../../core/repositories/repository-manager";
import { getPrimaryRepository } from "../../shared/utils/repo-selection";
import { CommitDetailViewProvider } from "../commitDetail/commit-detail-view-provider";
import {
  HistoryExplorerCommit,
  HistoryExplorerInitialState,
  HistoryExplorerFilters,
  HistoryExplorerResponse,
} from "./types/history-explorer.types";

dayjs.extend(relativeTime);

type WebviewMessage = {
  command: string;
  [key: string]: any;
};

export class HistoryExplorerViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "githubDesktop.historyExplorer";

  private view: vscode.WebviewView | undefined;
  private currentFilters: HistoryExplorerFilters = {};

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager,
    private readonly commitDetailProvider: CommitDetailViewProvider,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "out", "webview"),
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
      ],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      await this.handleMessage(message);
    });

    return this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.view) return;
    const payload = await this.getHistoryData(this.currentFilters, 0);
    this.postMessage({ type: "historyData", payload });
  }

  private postMessage(message: any): void {
    this.view?.webview.postMessage(message);
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case "ready": {
        await this.refresh();
        break;
      }
      case "applyFilters": {
        const filters: HistoryExplorerFilters = message.filters || {};
        this.currentFilters = { ...filters };
        const payload = await this.getHistoryData(this.currentFilters, 0);
        this.postMessage({ type: "historyData", payload });
        break;
      }
      case "loadMore": {
        const offset = typeof message.offset === "number" ? message.offset : 0;
        const payload = await this.getHistoryData(this.currentFilters, offset);
        this.postMessage({ type: "historyAppend", payload });
        break;
      }
      case "openCommit": {
        if (typeof message.hash === "string" && message.hash.length > 0) {
          await this.commitDetailProvider.showCommitDetails(message.hash);
        }
        break;
      }
      default:
        break;
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "webview",
        "history-explorer.js",
      ),
    );

    const codiconsUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css",
    );

    const stylesUri = webview.asWebviewUri(codiconsUri);

    const initialState: HistoryExplorerInitialState = {
      graphLines: [],
      commits: [],
      filters: {},
      branches: [],
      authors: [],
      hasMore: false,
      offset: 0,
      repository: null,
    };

    const csp = `default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} https:; script-src ${webview.cspSource};`;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Git History Explorer</title>
    <link rel="stylesheet" href="${stylesUri}" />
    <style>
      html, body {
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        background-color: var(--vscode-sideBar-background);
        color: var(--vscode-foreground);
        font-family: var(--vscode-font-family, "Segoe UI", sans-serif);
      }
      #root {
        width: 100%;
        height: 100%;
      }
      .codicon {
        font-family: "codicon";
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const vscode = acquireVsCodeApi();
      window.vscodeApi = {
        postMessage: (message) => vscode.postMessage(message),
        getState: () => vscode.getState(),
        setState: (state) => vscode.setState(state)
      };
      window.historyExplorerInitialState = ${JSON.stringify(initialState)};
    </script>
    <script type="module" src="${scriptUri}"></script>
  </body>
</html>`;
  }

  private async getHistoryData(
    filters: HistoryExplorerFilters,
    offset: number,
  ): Promise<HistoryExplorerResponse> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return {
        graphLines: [],
        commits: [],
        filters: { ...filters, offset },
        branches: [],
        authors: [],
        hasMore: false,
        nextOffset: offset,
        repository: null,
      };
    }

    const resolvedFilters: HistoryExplorerFilters = {
      pageSize: filters.pageSize ?? 50,
      branches: filters.branches,
      author: filters.author,
      searchText: filters.searchText,
      allBranches: filters.allBranches ?? false,
      filePath: filters.filePath,
    };

    const git = simpleGit(repository.localPath);
    const pageSize = resolvedFilters.pageSize ?? 50;

    const baseArgs = [
      "log",
      `--max-count=${pageSize}`,
      `--skip=${offset}`,
      "--date=iso",
      "--pretty=format:%H%x09%an%x09%ae%x09%ad%x09%s",
    ];

    const graphArgs = [
      "log",
      "--graph",
      "--color=never",
      "--date=iso",
      `--max-count=${pageSize}`,
      `--skip=${offset}`,
      "--pretty=format:%h%x09%s",
    ];

    if (resolvedFilters.searchText) {
      baseArgs.push(`--grep=${resolvedFilters.searchText}`);
      baseArgs.push("--regexp-ignore-case");
      graphArgs.push(`--grep=${resolvedFilters.searchText}`);
      graphArgs.push("--regexp-ignore-case");
    }

    if (resolvedFilters.author) {
      baseArgs.push(`--author=${resolvedFilters.author}`);
      graphArgs.push(`--author=${resolvedFilters.author}`);
    }

    if (resolvedFilters.allBranches) {
      baseArgs.push("--all");
      graphArgs.push("--all");
    } else if (resolvedFilters.branches && resolvedFilters.branches.length > 0) {
      baseArgs.push(...resolvedFilters.branches);
      graphArgs.push(...resolvedFilters.branches);
    }

    if (resolvedFilters.filePath) {
      baseArgs.push("--", resolvedFilters.filePath);
      graphArgs.push("--", resolvedFilters.filePath);
    }

    const [logOutput, graphOutput, branchesData, authorsData] = await Promise.all([
      git.raw(baseArgs),
      git.raw(graphArgs),
      git.branch(["-a"]),
      git.raw(["log", "--no-merges", "--format=%an%x09%ae"]),
    ]);

    const commits: HistoryExplorerCommit[] = logOutput
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [hash, authorName, authorEmail, committedAt, message] = line.split("\t");
        const shortHash = hash?.slice(0, 7) ?? "";
        const dateIso = committedAt ?? "";
        const relative = dateIso ? dayjs(dateIso).fromNow() : "";
        return {
          hash: hash ?? "",
          shortHash,
          message: message ?? "",
          author: authorName ?? "",
          authorEmail: authorEmail ?? "",
          date: dateIso,
          relativeTime: relative,
        };
      });

    const graphLines = graphOutput
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/\t/g, " "));

    const authors = Array.from(
      new Map(
        authorsData
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line) => {
            const [name, email] = line.split("\t");
            return [
              `${name ?? ""}|${email ?? ""}`,
              {
                name: name ?? "",
                email: email ?? "",
              },
            ];
          }),
      ).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));

    const branches = branchesData.all ?? [];

    const hasMore = commits.length === pageSize;
    const nextOffset = offset + commits.length;

    return {
      graphLines,
      commits,
      filters: { ...resolvedFilters, offset },
      branches,
      authors,
      hasMore,
      nextOffset,
      repository: {
        name: path.basename(repository.localPath),
        path: repository.localPath,
        remote: repository.remoteUrl,
      },
    };
  }
}

