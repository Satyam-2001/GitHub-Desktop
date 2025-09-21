import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { StoredAccount } from '../../shared/types';

const ACCOUNTS_KEY = 'githubDesktop.accounts';
const ACTIVE_ACCOUNT_KEY = 'githubDesktop.activeAccountId';
const execFileAsync = promisify(execFile);

interface AccountQuickPickItem extends vscode.QuickPickItem {
  account: StoredAccount;
}

export class AccountManager {
  private accounts: StoredAccount[] = [];
  private activeAccountId: string | undefined;
  private readonly _onDidChangeAccounts = new vscode.EventEmitter<void>();

  public readonly onDidChangeAccounts = this._onDidChangeAccounts.event;

  constructor(
    private readonly globalState: vscode.Memento,
    private readonly secretStorage: vscode.SecretStorage
  ) {}

  async initialize(): Promise<void> {
    this.accounts = this.globalState.get<StoredAccount[]>(ACCOUNTS_KEY, []);
    this.activeAccountId = this.globalState.get<string>(ACTIVE_ACCOUNT_KEY);

    const filtered: StoredAccount[] = [];
    for (const account of this.accounts) {
      const token = await this.secretStorage.get(account.tokenKey);
      if (token) {
        filtered.push(account);
      }
    }

    if (filtered.length !== this.accounts.length) {
      this.accounts = filtered;
      await this.persist();
    }

    if (this.accounts.length > 0 && !this.activeAccountId) {
      this.activeAccountId = this.accounts[0].id;
      await this.globalState.update(ACTIVE_ACCOUNT_KEY, this.activeAccountId);
    }
  }

  getAccounts(): StoredAccount[] {
    return [...this.accounts];
  }

  getActiveAccount(): StoredAccount | undefined {
    if (!this.activeAccountId) {
      return undefined;
    }
    return this.accounts.find((account) => account.id === this.activeAccountId);
  }

  getAccountById(id: string): StoredAccount | undefined {
    return this.accounts.find((account) => account.id === id);
  }

  async signIn(): Promise<StoredAccount | undefined> {
    // Check if GitHub CLI is available
    const cliInfo = await this.getGitHubCliInfo();

    // Provide sign-in options
    const signInMethod = await vscode.window.showQuickPick(
      [
        ...(cliInfo ? [{
          label: '$(github) Use GitHub CLI',
          description: cliInfo.multipleAccounts
            ? `${cliInfo.accountCount} accounts available`
            : `Signed in as ${cliInfo.currentUser}`,
          value: 'cli'
        }] : []),
        {
          label: '$(key) Enter Personal Access Token',
          description: 'Manually enter a GitHub PAT',
          value: 'token'
        },
        ...(cliInfo?.multipleAccounts ? [{
          label: '$(terminal) Switch GitHub CLI Account',
          description: 'Switch to a different GitHub CLI account first',
          value: 'switch-cli'
        }] : [])
      ],
      {
        placeHolder: 'Choose how to sign in to GitHub',
        ignoreFocusOut: true
      }
    );

    if (!signInMethod) {
      return undefined;
    }

    let token: string | undefined;
    let source: string | undefined;

    if (signInMethod.value === 'switch-cli') {
      // Guide user to switch GitHub CLI account
      const terminal = vscode.window.createTerminal('GitHub CLI');
      terminal.show();
      terminal.sendText('gh auth status');
      terminal.sendText('# To switch accounts, use: gh auth switch');

      vscode.window.showInformationMessage(
        'Switch your GitHub CLI account in the terminal, then try adding the account again.',
        'OK'
      );
      return undefined;
    } else if (signInMethod.value === 'cli') {
      // Use current GitHub CLI token
      const cliToken = await this.getGitHubCliToken();
      if (cliToken) {
        token = cliToken.token;
        source = cliToken.source;
      }
    } else {
      // Manual token entry
      token = await vscode.window.showInputBox({
        prompt: 'Enter a GitHub Personal Access Token with repo and workflow scopes',
        placeHolder: 'ghp_xxx...',
        password: true,
        ignoreFocusOut: true
      });
      if (!token) {
        vscode.window.showInformationMessage('GitHub Desktop sign-in cancelled.');
        return undefined;
      }
    }

    if (!token) {
      vscode.window.showErrorMessage('Failed to obtain authentication token.');
      return undefined;
    }

    const octokit = new Octokit({ auth: token });
    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      const existing = this.accounts.find((acc) => acc.login === data.login);
      const tokenKey = existing?.tokenKey ?? `githubDesktop.token.${randomUUID()}`;
      const account: StoredAccount = existing ?? {
        id: randomUUID(),
        login: data.login,
        name: data.name ?? undefined,
        avatarUrl: data.avatar_url ?? undefined,
        tokenKey
      };

      if (existing) {
        existing.name = data.name ?? undefined;
        existing.avatarUrl = data.avatar_url ?? undefined;
      } else {
        this.accounts.push(account);
      }

      await this.secretStorage.store(tokenKey, token);

      this.activeAccountId = account.id;
      await this.persist();
      await this.globalState.update(ACTIVE_ACCOUNT_KEY, this.activeAccountId);
      this._onDidChangeAccounts.fire();

      if (source) {
        vscode.window.showInformationMessage(`Signed in as ${account.login} using ${source}.`);
      } else {
        vscode.window.showInformationMessage(`Signed in as ${account.login}.`);
      }
      return account;
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Failed to authenticate with GitHub: ${error.message}`);
      } else {
        vscode.window.showErrorMessage('Failed to authenticate with GitHub.');
      }
      return undefined;
    }
  }

  async signOut(accountId?: string): Promise<void> {
    const target = accountId
      ? this.accounts.find((account) => account.id === accountId)
      : await this.pickAccount('Select the account to sign out');

    if (!target) {
      return;
    }

    const index = this.accounts.findIndex((account) => account.id === target.id);
    if (index === -1) {
      return;
    }

    await this.secretStorage.delete(target.tokenKey);
    this.accounts.splice(index, 1);

    if (this.activeAccountId === target.id) {
      this.activeAccountId = this.accounts[0]?.id;
      await this.globalState.update(ACTIVE_ACCOUNT_KEY, this.activeAccountId);
    }

    await this.persist();
    this._onDidChangeAccounts.fire();

    vscode.window.showInformationMessage(`Signed out ${target.login}.`);
  }

  async switchAccount(): Promise<StoredAccount | undefined> {
    if (this.accounts.length === 0) {
      vscode.window.showInformationMessage('No GitHub accounts available. Use Sign In first.');
      return undefined;
    }

    const chosen = await this.pickAccount('Select the active GitHub account');
    if (!chosen) {
      return undefined;
    }

    return this.setActiveAccount(chosen.id);
  }

  async setActiveAccount(accountId: string): Promise<StoredAccount | undefined> {
    const account = this.getAccountById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (this.activeAccountId === accountId) {
      return account;
    }

    this.activeAccountId = accountId;
    await this.globalState.update(ACTIVE_ACCOUNT_KEY, this.activeAccountId);
    this._onDidChangeAccounts.fire();

    vscode.window.showInformationMessage(`Active account switched to ${account.login}.`);
    return account;
  }

  async getOctokit(accountId?: string): Promise<Octokit | undefined> {
    const token = await this.getToken(accountId);
    if (!token) {
      return undefined;
    }
    return new Octokit({ auth: token });
  }

  async getToken(accountId?: string): Promise<string | undefined> {
    const account = accountId
      ? this.accounts.find((acc) => acc.id === accountId)
      : this.getActiveAccount();

    if (!account) {
      vscode.window.showWarningMessage('No active GitHub account. Please sign in.');
      return undefined;
    }

    const token = await this.secretStorage.get(account.tokenKey);
    if (!token) {
      vscode.window.showWarningMessage('Stored credentials missing for the selected account. Please sign in again.');
      return undefined;
    }

    return token;
  }

  private async persist(): Promise<void> {
    await this.globalState.update(ACCOUNTS_KEY, this.accounts);
  }

  private async pickAccount(placeHolder: string): Promise<StoredAccount | undefined> {
    const selection = await vscode.window.showQuickPick<AccountQuickPickItem>(
      this.accounts.map<AccountQuickPickItem>((account) => ({
        label: account.login,
        description: account.name ? account.name : undefined,
        account
      })),
      {
        placeHolder,
        ignoreFocusOut: true
      }
    );
    return selection?.account;
  }

  private async getGitHubCliInfo(): Promise<{ currentUser: string; multipleAccounts: boolean; accountCount: number } | undefined> {
    try {
      const { stdout: statusOutput } = await execFileAsync('gh', ['auth', 'status'], {
        encoding: 'utf8'
      });

      // Parse accounts from the status output
      const accountMatches = Array.from(statusOutput.matchAll(/Logged in to [^\s]+ as ([^\s]+)/gi));
      const accounts = accountMatches.map(match => match[1]);

      if (accounts.length === 0) {
        return undefined;
      }

      // Get current active account
      try {
        const { stdout: tokenOutput } = await execFileAsync('gh', ['auth', 'token'], { encoding: 'utf8' });
        const token = tokenOutput.trim();
        if (token) {
          const octokit = new Octokit({ auth: token });
          const { data } = await octokit.rest.users.getAuthenticated();
          return {
            currentUser: data.login,
            multipleAccounts: accounts.length > 1,
            accountCount: accounts.length
          };
        }
      } catch {
        // Fallback to first account in list
      }

      return {
        currentUser: accounts[0],
        multipleAccounts: accounts.length > 1,
        accountCount: accounts.length
      };
    } catch {
      return undefined;
    }
  }

  private async getGitHubCliToken(): Promise<{ token: string; source: string } | undefined> {
    try {
      const { stdout: tokenOutput } = await execFileAsync('gh', ['auth', 'token'], { encoding: 'utf8' });
      const token = tokenOutput.trim();
      if (!token) {
        return undefined;
      }

      try {
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.rest.users.getAuthenticated();
        return { token, source: `GitHub CLI session for ${data.login}` };
      } catch {
        return { token, source: 'GitHub CLI session' };
      }
    } catch {
      return undefined;
    }
  }

}
