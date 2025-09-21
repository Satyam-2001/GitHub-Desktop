export class CommitId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.length < 7) {
      throw new Error('Invalid commit ID: must be at least 7 characters');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  get shortHash(): string {
    return this._value.substring(0, 7);
  }

  equals(other: CommitId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}