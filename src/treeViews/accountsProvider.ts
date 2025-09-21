import * as vscode from 'vscode';
import { AccountManager } from '../accountManager';
import { StoredAccount } from '../types';

class AccountItem extends vscode.TreeItem {
  constructor(account: StoredAccount, active: boolean) {
    super(account.login, vscode.TreeItemCollapsibleState.None);
    this.description = active ? 'Active' : account.name ?? '';
    this.contextValue = active ? 'githubDesktop.activeAccount' : 'githubDesktop.account';
    this.iconPath = new vscode.ThemeIcon(active ? 'account' : 'person');
    this.tooltip = account.name ? `${account.login}\n${account.name}` : account.login;
  }
}

export class AccountsProvider implements vscode.TreeDataProvider<AccountItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<AccountItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly accountManager: AccountManager) {
    this.accountManager.onDidChangeAccounts(() => this.refresh());
  }

  getTreeItem(element: AccountItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(): vscode.ProviderResult<AccountItem[]> {
    const accounts = this.accountManager.getAccounts();
    if (accounts.length === 0) {
      const item = new vscode.TreeItem('Sign in to GitHub', vscode.TreeItemCollapsibleState.None);
      item.command = {
        command: 'githubDesktop.signIn',
        title: 'Sign In'
      };
      item.iconPath = new vscode.ThemeIcon('sign-in');
      return [item];
    }
    const active = this.accountManager.getActiveAccount();
    return accounts.map((account) => new AccountItem(account, account.id === active?.id));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
