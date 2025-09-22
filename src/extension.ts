import { iconThemeService } from "./core/services/icon-theme.service";
import * as path from "path";
import { promises as fs } from "fs";
import * as vscode from "vscode";
import simpleGit from "simple-git";
import { AccountManager } from "./core/accounts/account-manager";
import { RepositoryManager } from "./core/repositories/repository-manager";
import { AccountsProvider } from "./ui/tree-views/accounts-provider";
import { RepositoriesProvider } from "./ui/tree-views/repositories-provider";
import { TimelineViewProvider } from "./webviews/timeline/timeline-view-provider";
import { CommitDetailViewProvider } from "./webviews/commitDetail/commit-detail-view-provider";
import { TrackedRepository } from "./shared/types";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const accountManager = new AccountManager(
    context.globalState,
    context.secrets,
  );
  const repositoryManager = new RepositoryManager(context.globalState);
  await accountManager.initialize();
  await repositoryManager.initialize();

  const accountsProvider = new AccountsProvider(accountManager);
  const repositoriesProvider = new RepositoriesProvider(
    repositoryManager,
    accountManager,
  );
  const commitDetailProvider = new CommitDetailViewProvider(
    context,
    repositoryManager,
  );
  const timelineProvider = new TimelineViewProvider(
    context,
    repositoryManager,
    accountManager,
    commitDetailProvider,
  );

  const refreshAllViews = () => {
    void timelineProvider.refresh();
    accountsProvider.refresh();
    repositoriesProvider.refresh();
  };

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "githubDesktop.accounts",
      accountsProvider,
    ),
    vscode.window.registerTreeDataProvider(
      "githubDesktop.repositories",
      repositoriesProvider,
    ),
    vscode.window.registerWebviewViewProvider(
      "githubDesktop.timeline",
      timelineProvider,
    ),
    vscode.commands.registerCommand("githubDesktop.signIn", async () => {
      const account = await accountManager.signIn();
      if (account) {
        await linkUnassignedRepositories(repositoryManager, account.id);
        refreshAllViews();
      }
    }),
    vscode.commands.registerCommand("githubDesktop.signOut", () =>
      accountManager.signOut(),
    ),
    vscode.commands.registerCommand(
      "githubDesktop.signOutAccount",
      (item: any) => {
        const accountId = item?.account?.id;
        return accountManager.signOut(accountId);
      },
    ),
    vscode.commands.registerCommand("githubDesktop.switchAccount", () =>
      accountManager.switchAccount(),
    ),
    vscode.commands.registerCommand(
      "githubDesktop.switchToAccount",
      (accountId: string) => accountsProvider.switchToAccount(accountId),
    ),
    vscode.commands.registerCommand("githubDesktop.cloneRepository", () =>
      cloneRepository(accountManager, repositoryManager, timelineProvider),
    ),
    vscode.commands.registerCommand(
      "githubDesktop.openRepository",
      (repo?: TrackedRepository) => openRepository(repositoryManager, repo),
    ),
    vscode.commands.registerCommand("githubDesktop.createIssue", () =>
      createIssue(accountManager, repositoryManager),
    ),
    vscode.commands.registerCommand("githubDesktop.refreshViews", () =>
      refreshAllViews(),
    ),
    vscode.commands.registerCommand("githubDesktop.addAccount", async () => {
      const account = await accountManager.signIn();
      if (account) {
        await linkUnassignedRepositories(repositoryManager, account.id);
        refreshAllViews();
      }
    }),
    vscode.commands.registerCommand(
      "githubDesktop.manageAccounts",
      async () => {
        const accounts = accountManager.getAccounts();
        if (accounts.length === 0) {
          vscode.window.showInformationMessage(
            "No GitHub accounts available. Sign in first.",
          );
          return;
        }

        const activeAccount = accountManager.getActiveAccount();
        const items = accounts.map((account) => ({
          label: account.login,
          description: account.name || "",
          detail: account.id === activeAccount?.id ? "● Active Account" : "",
          account,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select an account to manage",
          matchOnDescription: true,
        });

        if (selected) {
          const action = await vscode.window.showQuickPick(
            [
              { label: "$(arrow-right) Set as Active", value: "activate" },
              { label: "$(sign-out) Sign Out", value: "signout" },
              { label: "$(sync) Refresh Token", value: "refresh" },
            ],
            {
              placeHolder: `Manage ${selected.account.login}`,
            },
          );

          if (action?.value === "activate") {
            await accountManager.setActiveAccount(selected.account.id);
            refreshAllViews();
          } else if (action?.value === "signout") {
            await accountManager.signOut(selected.account.id);
            refreshAllViews();
          } else if (action?.value === "refresh") {
            // Refresh token by re-authenticating
            const newAccount = await accountManager.signIn();
            if (newAccount) {
              refreshAllViews();
            }
          }
        }
      },
    ),
    vscode.commands.registerCommand(
      "githubDesktop.removeAccount",
      async (item: any) => {
        const accountId = item?.account?.id;
        if (accountId) {
          await accountManager.signOut(accountId);
          refreshAllViews();
        } else {
          await accountManager.signOut();
          refreshAllViews();
        }
      },
    ),
    vscode.commands.registerCommand("githubDesktop.refreshAccounts", () => {
      accountsProvider.refresh();
    }),
    vscode.workspace.onDidSaveTextDocument(
      () => void timelineProvider.refresh(),
    ),
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await syncWorkspaceRepositories(accountManager, repositoryManager);
      refreshAllViews();
    }),
  );

  await syncWorkspaceRepositories(accountManager, repositoryManager);
  refreshAllViews();

  const active = accountManager.getActiveAccount();
  if (active) {
    await linkUnassignedRepositories(repositoryManager, active.id);
  }
}

export function deactivate(): void {
  // nothing to clean up
}

async function cloneRepository(
  accounts: AccountManager,
  repositories: RepositoryManager,
  timeline: TimelineViewProvider,
): Promise<void> {
  const account = accounts.getActiveAccount() ?? (await accounts.signIn());
  if (!account) {
    return;
  }

  const repoInput = await vscode.window.showInputBox({
    prompt: "Enter a repository URL or owner/name",
    placeHolder: "owner/name or https://github.com/owner/name",
    ignoreFocusOut: true,
  });

  if (!repoInput) {
    return;
  }

  const parsed = parseRepositoryIdentifier(repoInput.trim());
  if (!parsed) {
    vscode.window.showErrorMessage(
      "Could not parse the repository identifier.",
    );
    return;
  }

  const folderSelection = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select destination folder",
  });
  if (!folderSelection || folderSelection.length === 0) {
    return;
  }

  const baseDir = folderSelection[0].fsPath;
  const targetPath = path.join(baseDir, parsed.name);
  if (await exists(targetPath)) {
    const overwrite = await vscode.window.showWarningMessage(
      `The folder ${parsed.name} already exists. Overwrite?`,
      { modal: true },
      "Overwrite",
      "Cancel",
    );
    if (overwrite !== "Overwrite") {
      return;
    }
    await fs.rm(targetPath, { recursive: true, force: true });
  }

  const token = await accounts.getToken(account.id);
  if (!token) {
    return;
  }

  const encodedUser = encodeURIComponent(account.login);
  const remoteWithToken = `https://${encodedUser}:${encodeURIComponent(
    token,
  )}@github.com/${parsed.owner}/${parsed.name}.git`;
  const cleanRemote = `https://github.com/${parsed.owner}/${parsed.name}.git`;

  const git = simpleGit();
  const progress = vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Cloning ${parsed.owner}/${parsed.name}`,
      cancellable: false,
    },
    async (progressState) => {
      progressState.report({ message: "Fetching repository data..." });
      await git.clone(remoteWithToken, targetPath, ["--progress"]);
      const repoGit = simpleGit(targetPath);
      await repoGit.remote(["set-url", "origin", cleanRemote]);
    },
  );

  try {
    await progress;
    await repositories.addRepository({
      accountId: account.id,
      localPath: targetPath,
      owner: parsed.owner,
      name: parsed.name,
      remoteUrl: cleanRemote,
    });
    await timeline.refresh();
    vscode.window.showInformationMessage(
      `Cloned ${parsed.owner}/${parsed.name} successfully.`,
    );
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Failed to clone repository: ${error.message}`,
      );
    } else {
      vscode.window.showErrorMessage("Failed to clone repository.");
    }
  }
}

async function openRepository(
  repositories: RepositoryManager,
  repoArg?: TrackedRepository,
): Promise<void> {
  let repo = repoArg;
  if (!repo) {
    const selection = await pickRepository(repositories);
    repo = selection ?? undefined;
  }
  if (!repo) {
    return;
  }

  const uri = vscode.Uri.file(repo.localPath);
  await vscode.commands.executeCommand("vscode.openFolder", uri, {
    forceNewWindow: false,
  });
}

async function createIssue(
  accounts: AccountManager,
  repositories: RepositoryManager,
): Promise<void> {
  const repo = await pickRepository(repositories);
  if (!repo) {
    vscode.window.showInformationMessage("Select or clone a repository first.");
    return;
  }

  let accountId = repo.accountId;
  let account = accountId ? accounts.getAccountById(accountId) : undefined;
  if (!account) {
    account = accounts.getActiveAccount() ?? (await accounts.signIn());
    if (!account) {
      return;
    }
    accountId = account.id;
    await repositories.updateRepository(repo.id, { accountId });
  }

  const octokit = await accounts.getOctokit(accountId);
  if (!octokit) {
    return;
  }

  const title = await vscode.window.showInputBox({
    prompt: "Issue title",
    ignoreFocusOut: true,
  });
  if (!title) {
    return;
  }

  const body = await vscode.window.showInputBox({
    prompt: "Issue description (optional)",
    ignoreFocusOut: true,
    value: "",
  });

  try {
    const response = await octokit.rest.issues.create({
      owner: repo.owner,
      repo: repo.name,
      title,
      body: body ?? undefined,
    });
    vscode.window.showInformationMessage(
      `Issue created: ${response.data.title}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Failed to create issue: ${error.message}`,
      );
    } else {
      vscode.window.showErrorMessage("Failed to create issue.");
    }
  }
}

function parseRepositoryIdentifier(
  input: string,
): { owner: string; name: string } | undefined {
  const patterns = [
    /github.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(input.trim());
    if (match) {
      return { owner: match[1], name: match[2] };
    }
  }
  return undefined;
}

async function pickRepository(
  repositories: RepositoryManager,
): Promise<TrackedRepository | undefined> {
  const repos = repositories.getRepositories();
  if (repos.length === 0) {
    return undefined;
  }

  const selection = await vscode.window.showQuickPick(
    repos.map((repo) => ({
      label: `${repo.owner}/${repo.name}`,
      description: repo.localPath,
      repo,
    })),
    {
      placeHolder: "Select a repository",
      ignoreFocusOut: true,
    },
  );
  return selection?.repo;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function syncWorkspaceRepositories(
  accounts: AccountManager,
  repositories: RepositoryManager,
): Promise<void> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of folders) {
    const localPath = folder.uri.fsPath;
    if (repositories.findByPath(localPath)) {
      continue;
    }

    if (!(await exists(path.join(localPath, ".git")))) {
      continue;
    }

    const metadata = await detectRepositoryMetadata(localPath);
    if (!metadata) {
      continue;
    }

    await repositories.addRepository({
      localPath,
      owner: metadata.owner,
      name: metadata.name,
      remoteUrl: metadata.remoteUrl,
      accountId: accounts.getActiveAccount()?.id,
    });
  }
}

async function detectRepositoryMetadata(
  localPath: string,
): Promise<{ owner: string; name: string; remoteUrl?: string }> {
  try {
    const git = simpleGit(localPath);
    const remotes = await git.getRemotes(true);
    const origin =
      remotes.find((remote) => remote.name === "origin") ?? remotes[0];
    const remoteUrl = origin?.refs.fetch ?? origin?.refs.push;
    if (remoteUrl) {
      const parsed = parseRepositoryIdentifier(remoteUrl);
      if (parsed) {
        return { ...parsed, remoteUrl };
      }
    }
  } catch {
    // fall through to folder-based metadata
  }

  const folderName = path.basename(localPath);
  return { owner: "local", name: folderName };
}

async function linkUnassignedRepositories(
  repositories: RepositoryManager,
  accountId: string,
): Promise<void> {
  const repos = repositories.getRepositories();
  const updates = repos.filter((repo) => !repo.accountId);
  for (const repo of updates) {
    await repositories.updateRepository(repo.id, { accountId });
  }
}
