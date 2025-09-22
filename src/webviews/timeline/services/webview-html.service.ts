import * as path from "path";
import * as vscode from "vscode";
import { RepositoryManager } from "../../../core/repositories/repository-manager";
import { getPrimaryRepository } from "../../../shared/utils/repo-selection";

export class WebviewHtmlService {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly repositories: RepositoryManager,
  ) {}

  generateHtml(webview: vscode.Webview): string {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "webview",
        "main.js",
      ),
    );

    const repository = getPrimaryRepository(this.repositories);
    const initialData = {
      changes: [],
      history: [],
      branches: [],
      currentBranch: null,
      repository: repository
        ? {
            name: path.basename(repository.localPath),
            path: repository.localPath,
            remote: repository.remoteUrl,
          }
        : null,
      accounts: [],
      activeAccount: null,
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
}
