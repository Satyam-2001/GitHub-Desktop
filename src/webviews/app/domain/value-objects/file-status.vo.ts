export type FileStatusType = 'M' | 'A' | 'D' | 'R' | 'C' | '??';

export class FileStatus {
  private readonly _value: FileStatusType;

  constructor(value: string) {
    const safeValue = value || '';
    const statusCode = safeValue.charAt(0) as FileStatusType;
    if (!this.isValidStatus(statusCode)) {
      throw new Error(`Invalid file status: ${value}`);
    }
    this._value = statusCode;
  }

  get value(): FileStatusType {
    return this._value;
  }

  get label(): string {
    switch (this._value) {
      case 'M': return 'Modified';
      case 'A': return 'Added';
      case 'D': return 'Deleted';
      case 'R': return 'Renamed';
      case 'C': return 'Copied';
      case '??': return 'Untracked';
      default: return 'Unknown';
    }
  }

  get color(): string {
    switch (this._value) {
      case 'M': return '#f59e0b'; // Modified - amber
      case 'A': return '#10b981'; // Added - green
      case 'D': return '#ef4444'; // Deleted - red
      case 'R': return '#8b5cf6'; // Renamed - purple
      case 'C': return '#06b6d4'; // Copied - cyan
      case '??': return '#6b7280'; // Untracked - gray
      default: return '#6b7280';
    }
  }

  get isModified(): boolean {
    return this._value === 'M';
  }

  get isAdded(): boolean {
    return this._value === 'A';
  }

  get isDeleted(): boolean {
    return this._value === 'D';
  }

  private isValidStatus(status: string): status is FileStatusType {
    return ['M', 'A', 'D', 'R', 'C', '??'].includes(status);
  }

  equals(other: FileStatus): boolean {
    return this._value === other._value;
  }
}