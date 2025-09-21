export class CommitMessage {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Commit message cannot be empty');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  get summary(): string {
    const firstLine = this._value.split('\n')[0];
    return firstLine.length > 72 ? firstLine.substring(0, 69) + '...' : firstLine;
  }

  get hasBody(): boolean {
    return this._value.includes('\n');
  }

  get body(): string {
    const lines = this._value.split('\n');
    return lines.slice(1).join('\n').trim();
  }

  equals(other: CommitMessage): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}