# GitHub Desktop for VS Code

A VS Code extension that mirrors common GitHub Desktop workflows. It focuses on seamless multi-account management, repository cloning, and lightweight issue tracking without leaving the editor.

## Features
- Combined **Changes & History** panel modelled after GitHub Desktop, with commit cards and file detail breakdowns.
- Sign in with multiple GitHub accounts using locally cached credentials (GitHub CLI) or personal access tokens (PATs).
- Switch the active account without signing out.
- Automatically recognise repositories already opened in the workspace; no need to re-clone.
- Clone repositories with the selected account, including private repositories.
- Manage cloned repositories from a dedicated GitHub Desktop activity bar view.
- Open repositories in the current VS Code window.
- Create issues directly from VS Code.

## Getting Started
1. Install dependencies: `npm install`.
2. Build the extension: `npm run compile`.
3. Launch the extension in VS Code: press `F5` or run the `Debug: Start Debugging` command.

## Usage
1. Open the **GitHub Desktop** view in the activity bar.
2. Run **GitHub Desktop: Sign In**. If the GitHub CLI (`gh`) is signed in, its token will be reused automatically; otherwise provide a PAT with at least `repo`, `read:org`, and `workflow` scopes.
3. Repeat sign-in for additional accounts. The accounts tree view highlights the active account.
4. Open any Git repository in the workspace—GitHub Desktop will detect it and populate the combined **Changes & History** view automatically, including inline diffs for each file. Use **GitHub Desktop: Clone Repository** only when you need to bring a new project locally.
5. Trigger **GitHub Desktop: Switch Active Account** at any time to operate with a different account.
6. When viewing the **Repositories** tree, select an entry to open it in the current window, or run **GitHub Desktop: Create Issue** to open an issue under the corresponding repository.
7. Use **GitHub Desktop: Refresh Views** if you need to force-refresh the panels.

## Commands
- `GitHub Desktop: Sign In` (`githubDesktop.signIn`)
- `GitHub Desktop: Sign Out` (`githubDesktop.signOut`)
- `GitHub Desktop: Switch Active Account` (`githubDesktop.switchAccount`)
- `GitHub Desktop: Clone Repository` (`githubDesktop.cloneRepository`)
- `GitHub Desktop: Open Repository` (`githubDesktop.openRepository`)
- `GitHub Desktop: Create Issue` (`githubDesktop.createIssue`)
- `GitHub Desktop: Refresh Views` (`githubDesktop.refreshViews`)

## Configuration
This extension stores account metadata in the global VS Code state and persists their tokens securely in the Secret Storage API. If the GitHub CLI is installed and authenticated, its session is reused to avoid copying tokens manually.

## Roadmap
- Fetch and display pull requests, branches, and status checks.
- Offer history, commit, stash, and branch management experiences similar to GitHub Desktop.
- Surface GitHub notifications per account.

