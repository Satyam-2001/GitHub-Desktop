import { CommitId } from '../value-objects/commit-id.vo';
import { CommitMessage } from '../value-objects/commit-message.vo';
import { Author } from '../value-objects/author.vo';
import { CommitDate } from '../value-objects/commit-date.vo';
import { FileChange } from './file-change.entity';

export class Commit {
  constructor(
    public readonly id: CommitId,
    public readonly message: CommitMessage,
    public readonly author: Author,
    public readonly date: CommitDate,
    public readonly files: FileChange[] = [],
    public readonly avatarUrl?: string,
    public readonly tags?: string[],
    public readonly isPushed: boolean = true
  ) {}

  get shortHash(): string {
    return this.id.shortHash;
  }

  get fullHash(): string {
    return this.id.value;
  }

  get totalAdditions(): number {
    return this.files.reduce((sum, file) => sum + file.additions, 0);
  }

  get totalDeletions(): number {
    return this.files.reduce((sum, file) => sum + file.deletions, 0);
  }

  get fileCount(): number {
    return this.files.length;
  }

  get formattedDate(): string {
    return this.date.formatted;
  }

  get relativeDate(): string {
    return this.date.relative;
  }

  toJSON() {
    return {
      hash: this.id.value,
      message: this.message.value,
      author: this.author.name,
      email: this.author.email,
      date: this.date.formatted,
      files: this.files.map(f => f.toJSON()),
      totalAdditions: this.totalAdditions,
      totalDeletions: this.totalDeletions,
      avatarUrl: this.avatarUrl,
      tags: this.tags,
      isPushed: this.isPushed
    };
  }
}