export class FilePath {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('File path cannot be empty');
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  get fileName(): string {
    return this._value.split('/').pop() || this._value;
  }

  get directory(): string {
    const parts = this._value.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  }

  get extension(): string {
    const fileName = this.fileName;
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  get depth(): number {
    return this._value.split('/').length;
  }

  isInDirectory(directory: string): boolean {
    return this._value.startsWith(directory + '/');
  }

  equals(other: FilePath): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}