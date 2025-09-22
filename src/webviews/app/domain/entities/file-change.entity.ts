import { FilePath } from "../value-objects/file-path.vo";
import { FileStatus } from "../value-objects/file-status.vo";

export class FileChange {
  constructor(
    public readonly path: FilePath,
    public readonly status: FileStatus,
    public readonly additions: number = 0,
    public readonly deletions: number = 0,
    public readonly iconClass?: string,
    public readonly iconUri?: string,
  ) {}

  get fileName(): string {
    return this.path.fileName;
  }

  get directory(): string {
    return this.path.directory;
  }

  get extension(): string {
    return this.path.extension;
  }

  get statusColor(): string {
    return this.status.color;
  }

  get statusLabel(): string {
    return this.status.label;
  }

  get hasAdditions(): boolean {
    return this.additions > 0;
  }

  get hasDeletions(): boolean {
    return this.deletions > 0;
  }

  toJSON() {
    return {
      path: this.path.value,
      status: this.status.value,
      additions: this.additions,
      deletions: this.deletions,
      iconClass: this.iconClass,
      iconUri: this.iconUri,
    };
  }
}
