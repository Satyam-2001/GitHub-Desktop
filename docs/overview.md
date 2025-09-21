# GitHub Desktop for VS Code — Overview

This document describes the structure, capabilities, and data flow for the GitHub Desktop-inspired VS Code extension contained in this workspace.

## Goals
- Provide a GitHub Desktop-like workflow without leaving VS Code.
- Allow simultaneous authentication with multiple GitHub accounts and easy context switching.
- Reuse existing local credentials (GitHub CLI) whenever possible to avoid pasting tokens.
- Simplify cloning, opening, and tracking repositories from the editor.
- Offer a lightweight entry point for issue creation and future GitHub interactions.

## Extension Activation
The extension activates on startup (`onStartupFinished`), whenever one of the contributed commands runs, or when the GitHub Desktop views are opened. Activation wires up managers, registers commands, syncs workspace repositories, and initializes the panel UI.

```ts
activate(context: vscode.ExtensionContext)
```
- Instantiates `AccountManager` and `RepositoryManager` using the extension's global state and secret storage.
- Boots the combined **Changes & History** webview alongside the Accounts and Repositories tree view providers.
- Registers command handlers for sign-in/out, account switching, repository cloning/opening, issue creation, and manual refresh.
- Focuses the custom activity bar container and reconciles workspace folders so repos with `.git` are listed immediately.

## Core Components

### AccountManager (`src/accountManager.ts`)
- Persists account metadata (`StoredAccount`) in global state.
- Stores personal access tokens (PATs) in VS Code Secret Storage under randomized keys.
- Attempts to reuse GitHub CLI (`gh auth token`) credentials before prompting for a PAT.
- Emits `onDidChangeAccounts` for tree providers or other features to react to changes.
- Provides helpers to fetch authenticated Octokit clients scoped to the active or selected account.

### RepositoryManager (`src/repositoryManager.ts`)
- Tracks cloned or opened repositories (`TrackedRepository`) in global state, including whether they are linked to a signed-in account.
- Guarantees unique entries per local path or remote URL and exposes `updateRepository` for metadata changes.
- Emits `onDidChangeRepositories` whenever the repository list mutates.

### TimelineViewProvider (`src/webviews/timelineView.ts`)
- Supplies the HTML/CSS/JS for the combined Changes & History panel.
- Reads git status/log output via `simple-git`, formats commit cards, and renders file-level detail when a history entry is selected.
- Refreshes automatically when repositories change, when files are saved, or when the user triggers a manual refresh.

### Tree Data Providers (`src/treeViews/`)
- `AccountsProvider` renders the list of signed-in accounts and indicates which one is active.
- `RepositoriesProvider` surfaces tracked repositories (local or remote) and exposes quick entry points for cloning or opening projects.

### Commands (`contributes.commands` in `package.json`)
- `githubDesktop.signIn` / `githubDesktop.signOut` / `githubDesktop.switchAccount`
- `githubDesktop.cloneRepository` / `githubDesktop.openRepository`
- `githubDesktop.createIssue`
- `githubDesktop.refreshViews`

Each command is registered in `src/extension.ts` and depends on the managers above to read or mutate state.

## Authentication Flow
1. The extension tries `gh auth token`; if successful, the token is used immediately and stored securely.
2. If the CLI is unavailable, the user is prompted for a PAT (`repo`, `read:org`, `workflow`).
3. Octokit validates the token by requesting `GET /user`.
4. Account details are stored; tokens remain in Secret Storage.
5. The active account defaults to the newest signed-in account but can be changed via the switch command.

Tokens are never written to disk outside VS Code's secure storage. If secret storage removes a token (for example, due to a user action), the manager prunes the corresponding account on the next activation.

## Repository Detection Flow
1. On activation—and whenever workspace folders change—the extension scans each folder for a `.git` directory.
2. If a match is found, `simple-git` inspects remotes to derive the owner/name pair.
3. The repository is added to the global store (without requiring a clone) and linked to the active account if one is present.
4. Repositories without linked accounts can be associated later when issue creation or other account-dependent commands run.

## Data Persistence
- `context.globalState` keeps serialized lists of accounts and repositories.
- `context.secrets` retains PATs mapped to generated token keys.
- Both stores survive across VS Code sessions; tree views read from them during activation.

## UI Surface
- Activity bar container `githubDesktop` hosts the combined **Changes & History** webview and the **Accounts**/**Repositories** tree views (collapsed by default).
- Commit cards mimic GitHub Desktop styling with author/time metadata and highlight the currently selected entry.
- Selecting a commit displays a detail pane with aggregate stats and per-file changes (additions, deletions, status code).

## Extensibility Notes
- Add new GitHub workflows by requesting Octokit clients from `AccountManager`.
- Extend repository metadata by updating `TrackedRepository` and handling state migrations in `RepositoryManager`.
- Timeline templates can be extended by posting additional messages through `TimelineViewProvider`.

## Development Workflow
1. `npm install`
2. `npm run compile` (one-off build) or `npm run watch`
3. Launch the **Run Extension** debug configuration (see `.vscode/launch.json`).

Tests are not yet implemented. When adding tests, prefer VS Code's extension test harness and bind them in `package.json` scripts.
