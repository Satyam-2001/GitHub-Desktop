import * as vscode from 'vscode';

export class CommitDetailHtmlService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  generateHtml(webview: vscode.Webview): string {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'out',
        'webview',
        'commit-detail.js'
      )
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