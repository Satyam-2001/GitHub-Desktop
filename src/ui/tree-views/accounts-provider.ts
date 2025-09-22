import * as vscode from 'vscode';
import { AccountManager } from '../../core/accounts/account-manager';
import { StoredAccount } from '../../shared/types';

class AccountItem extends vscode.TreeItem {
  constructor(
    public readonly account: StoredAccount,
    private readonly active: boolean
  ) {
    super(account.login, vscode.TreeItemCollapsibleState.None);
    this.description = this.getDescription();
    this.contextValue = active ? 'githubDesktop.activeAccount' : 'githubDesktop.account';
    this.iconPath = this.getIcon();
    this.tooltip = this.getTooltip();
    this.command = {
      command: 'githubDesktop.switchToAccount',
      title: 'Switch to this account',
      arguments: [account.id]
    };
  }

  private getDescription(): string {
    let description = '';
    if (this.account.baseUrl && !this.account.baseUrl.includes('github.com')) {
      description = 'Enterprise';
    } else {
      description = this.account.name || '';
    }

    if (this.active) {
      return description ? `● Active • ${description}` : '● Active';
    }
    return description;
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.active) {
      return new vscode.ThemeIcon('account', new vscode.ThemeColor('charts.green'));
    }
    return new vscode.ThemeIcon('person');
  }

  private getTooltip(): string {
    let baseInfo = this.account.login;
    if (this.account.name) {
      baseInfo += `\n${this.account.name}`;
    }
    if (this.account.baseUrl && !this.account.baseUrl.includes('github.com')) {
      baseInfo += `\nGitHub Enterprise: ${this.account.baseUrl}`;
    }
    return this.active ? `${baseInfo}\n\n● Currently active account` : `${baseInfo}\n\nClick to switch to this account`;
  }
}

class AddAccountItem extends vscode.TreeItem {
  constructor() {
    super('Add Account', vscode.TreeItemCollapsibleState.None);
    this.description = 'Sign in to another GitHub account';
    this.contextValue = 'githubDesktop.addAccount';
    this.iconPath = new vscode.ThemeIcon('add', new vscode.ThemeColor('charts.blue'));
    this.tooltip = 'Sign in to another GitHub account';
    this.command = {
      command: 'githubDesktop.addAccount',
      title: 'Add Account'
    };
  }
}

class ManageAccountsItem extends vscode.TreeItem {
  constructor() {
    super('Manage Accounts', vscode.TreeItemCollapsibleState.None);
    this.description = 'Switch, refresh, or remove accounts';
    this.contextValue = 'githubDesktop.manageAccounts';
    this.iconPath = new vscode.ThemeIcon('settings-gear');
    this.tooltip = 'Manage all GitHub accounts';
    this.command = {
      command: 'githubDesktop.manageAccounts',
      title: 'Manage Accounts'
    };
  }
}

type TreeItem = AccountItem | AddAccountItem | ManageAccountsItem | vscode.TreeItem;

export class AccountsProvider implements vscode.TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly accountManager: AccountManager) {
    this.accountManager.onDidChangeAccounts(() => this.refresh());
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(): vscode.ProviderResult<TreeItem[]> {
    const accounts = this.accountManager.getAccounts();
    const items: TreeItem[] = [];

    if (accounts.length === 0) {
      // Show initial sign-in item when no accounts exist
      const signInItem = new vscode.TreeItem('Sign in to GitHub', vscode.TreeItemCollapsibleState.None);
      signInItem.description = 'Get started with GitHub';
      signInItem.command = {
        command: 'githubDesktop.signIn',
        title: 'Sign In'
      };
      signInItem.iconPath = new vscode.ThemeIcon('sign-in');
      signInItem.tooltip = 'Sign in to your GitHub account to get started';
      return [signInItem];
    }

    // Add all accounts
    const activeAccount = this.accountManager.getActiveAccount();

    // Sort accounts: active account first, then alphabetically
    const sortedAccounts = [...accounts].sort((a, b) => {
      if (a.id === activeAccount?.id) return -1;
      if (b.id === activeAccount?.id) return 1;
      return a.login.localeCompare(b.login);
    });

    for (const account of sortedAccounts) {
      items.push(new AccountItem(account, account.id === activeAccount?.id));
    }

    // Add management items at the end
    if (accounts.length > 1) {
      items.push(new ManageAccountsItem());
    }
    items.push(new AddAccountItem());

    return items;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async switchToAccount(accountId: string): Promise<void> {
    const account = this.accountManager.getAccountById(accountId);
    if (!account) {
      vscode.window.showErrorMessage('Account not found.');
      return;
    }

    const activeAccount = this.accountManager.getActiveAccount();
    if (activeAccount?.id === accountId) {
      vscode.window.showInformationMessage(`${account.login} is already the active account.`);
      return;
    }

    try {
      // Show progress while switching
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Switching to ${account.login}...`,
        cancellable: false
      }, async () => {
        await this.accountManager.setActiveAccount(accountId);
        // Refresh the tree to update UI
        this.refresh();
      });

      vscode.window.showInformationMessage(`✓ Switched to ${account.login}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to switch account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
