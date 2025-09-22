import { BranchName } from "../value-objects/branch-name.vo";
import { CommitDate } from "../value-objects/commit-date.vo";

export class Branch {
  constructor(
    public readonly name: BranchName,
    public readonly isCurrent: boolean = false,
    public readonly lastActivity?: CommitDate,
    public readonly isRemote: boolean = false,
  ) {}

  get displayName(): string {
    return this.name.displayName;
  }

  get shortName(): string {
    return this.name.shortName;
  }

  get activityText(): string {
    return this.lastActivity?.relative ?? "No activity";
  }

  get isLocal(): boolean {
    return !this.isRemote;
  }

  toJSON() {
    return {
      name: this.name.value,
      isCurrent: this.isCurrent,
      lastActivity: this.lastActivity?.formatted,
      isRemote: this.isRemote,
    };
  }
}
