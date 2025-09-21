export class BranchName {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Branch name cannot be empty');
    }

    if (!this.isValidBranchName(value)) {
      throw new Error('Invalid branch name format');
    }

    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  get displayName(): string {
    // Remove origin/ prefix for remote branches
    return this._value.replace(/^origin\//, '');
  }

  get shortName(): string {
    // Get just the branch name without any prefixes
    const parts = this._value.split('/');
    return parts[parts.length - 1];
  }

  get isRemote(): boolean {
    return this._value.startsWith('origin/') || this._value.startsWith('remotes/');
  }

  get isFeatureBranch(): boolean {
    return this._value.includes('feature/') || this._value.includes('feat/');
  }

  get isBugfixBranch(): boolean {
    return this._value.includes('bugfix/') || this._value.includes('fix/');
  }

  private isValidBranchName(name: string): boolean {
    // Basic git branch name validation
    const invalidChars = /[\s~^:?*[\]\\]/;
    return !invalidChars.test(name) &&
           !name.startsWith('.') &&
           !name.endsWith('.') &&
           !name.includes('..');
  }

  equals(other: BranchName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}