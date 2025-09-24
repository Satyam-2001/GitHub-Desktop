import * as path from "path";
import * as vscode from "vscode";
import simpleGit from "simple-git";
import { RepositoryManager } from "../../../core/repositories/repository-manager";
import { getPrimaryRepository } from "../../../shared/utils/repo-selection";
import {
  ChangeEntry,
  CommitEntry,
  CommitDetail,
  CommitDetailFile,
} from "../interfaces/timeline-view-provider.interface";
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

export class GitOperationsService {
  constructor(private readonly repositories: RepositoryManager) {}

  async getRepositoryData(): Promise<{
    changes: ChangeEntry[];
    commits: CommitEntry[];
    hasMoreCommits: boolean;
    branches: string[];
    currentBranch: string | null;
    branchActivity: Record<string, string>;
    repository: any;
    remoteStatus: {
      hasRemote: boolean;
      isPublished: boolean;
      ahead: number;
      behind: number;
      lastFetched: Date | null;
      remoteBranch: string | null;
    };
    tags: Record<string, string[]>;
  } | null> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      return null;
    }

    try {
      const git = simpleGit(repository.localPath);
      const [status, log, branch, remotes, tags] = await Promise.all([
        git.status(),
        git.log({ maxCount: 50 }),
        git.branch(),
        git.getRemotes(true),
        git.tags(),
      ]);

      const changes: ChangeEntry[] = status.files.map((file) => ({
        path: file.path,
        status: this.formatStatusCode(file.index, file.working_dir),
        staged: file.index !== " " && file.index !== "?",
      }));

      // Get tags for each commit
      const tagMap = await this.getTagsForCommits(git);

      // Get remote tracking status to determine which commits are pushed
      const remoteStatus = await this.getRemoteStatus(
        git,
        branch.current,
        remotes,
      );

      const commits: CommitEntry[] = log.all.map((commit, index) => ({
        hash: commit.hash || "",
        shortHash: (commit.hash || "").slice(0, 7),
        message: commit.message || "",
        author: commit.author_name || "Unknown",
        email: commit.author_email || "",
        authorName: commit.author_name || "",
        authorEmail: commit.author_email || "",
        relativeTime: this.formatRelativeTime(commit.date),
        committedAt: commit.date ? String(commit.date) : "",
        tags: tagMap[commit.hash || ""] || [],
        // First 'ahead' commits are unpushed
        isPushed: remoteStatus.isPublished
          ? index >= remoteStatus.ahead
          : false,
      }));

      const hasMoreCommits = log.all.length === 50;

      // Get branch activity dates
      const branchActivity: Record<string, string> = {};
      for (const branchName of branch.all) {
        try {
          const lastCommit = await git.raw([
            "log",
            "-1",
            "--format=%cr",
            branchName,
          ]);
          branchActivity[branchName] = lastCommit.trim();
        } catch (error) {
          // If we can't get the date, skip it
        }
      }

      return {
        changes,
        commits,
        hasMoreCommits,
        branches: branch.all,
        currentBranch: branch.current,
        branchActivity,
        repository: {
          name: path.basename(repository.localPath),
          path: repository.localPath,
          remote: repository.remoteUrl,
        },
        remoteStatus,
        tags: tagMap,
      };
    } catch (error) {
      throw new Error(`Failed to load git data: ${error}`);
    }
  }

  async getCommitDetail(hash: string): Promise<CommitDetail> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      throw new Error("No repository found");
    }

    try {
      const git = simpleGit(repository.localPath);
      const raw = await git.raw([
        "show",
        hash,
        "--numstat",
        "--pretty=format:%H%n%an%n%ae%n%ad%n%s",
        "--date=iso",
      ]);

      const lines = raw.split("\n");
      const summaryHash = lines.shift() ?? hash;
      const authorName = lines.shift() ?? "";
      const authorEmail = lines.shift() ?? "";
      const committedAt = lines.shift() ?? "";
      const message = lines.shift() ?? "";
      if (lines[0] === "") {
        lines.shift();
      }

      const files: CommitDetail["files"] = [];
      let additions = 0;
      let deletions = 0;

      for (const line of lines) {
        if (!line.trim()) continue;
        const [addStr, delStr, filePath] = line.split("\t");
        if (!filePath) continue;

        const addVal = addStr === "-" ? null : Number.parseInt(addStr, 10);
        const delVal = delStr === "-" ? null : Number.parseInt(delStr, 10);

        if (typeof addVal === "number" && !Number.isNaN(addVal)) {
          additions += addVal;
        }
        if (typeof delVal === "number" && !Number.isNaN(delVal)) {
          deletions += delVal;
        }

        files.push({
          path: filePath,
          status: "",
          additions: addVal ?? null,
          deletions: delVal ?? null,
        });
      }

      // Get file status information
      const statusRaw = await git.raw([
        "show",
        hash,
        "--name-status",
        "--pretty=format:",
      ]);
      const statusMap = new Map<string, string>();
      for (const line of statusRaw.split("\n")) {
        if (!line.trim()) continue;
        const [state, filePath] = line.split("\t");
        if (filePath) {
          statusMap.set(filePath, state);
        }
      }

      // Update file status
      for (const file of files) {
        file.status = statusMap.get(file.path) ?? "M";
      }

      return {
        summary: {
          hash: summaryHash,
          shortHash: summaryHash.slice(0, 7),
          message,
          authorName,
          authorEmail,
          committedAt,
          relativeTime: this.formatRelativeTime(new Date(committedAt)),
          additions,
          deletions,
          fileCount: files.length,
        },
        files,
      };
    } catch (error) {
      throw new Error(`Failed to load commit details: ${error}`);
    }
  }

  async loadMoreCommits(offset: number): Promise<{
    commits: CommitEntry[];
    hasMoreCommits: boolean;
    newOffset: number;
  }> {
    const repository = getPrimaryRepository(this.repositories);
    if (!repository) {
      throw new Error("No repository found");
    }

    try {
      const git = simpleGit(repository.localPath);
      const [logOutput, branch, remotes] = await Promise.all([
        git.raw([
          "log",
          "--oneline",
          "--format=%H%x09%an%x09%ae%x09%ad%x09%s",
          "--date=iso",
          "--max-count=50",
          `--skip=${offset}`,
        ]),
        git.branch(),
        git.getRemotes(true),
      ]);

      // Get remote status to determine which commits are pushed
      const remoteStatus = await this.getRemoteStatus(
        git,
        branch.current,
        remotes,
      );

      const lines = logOutput
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      const commits: CommitEntry[] = lines.map((line, index) => {
        const [hash, author, email, date, ...messageParts] = line.split("\t");
        const message = messageParts.join("\t");

        return {
          hash: hash || "",
          shortHash: (hash || "").slice(0, 7),
          message: message || "",
          author: author || "Unknown",
          email: email || "",
          authorName: author || "",
          authorEmail: email || "",
          relativeTime: this.formatRelativeTime(this.parseGitDate(date)),
          committedAt: date || "",
          // Commits loaded after offset are likely pushed (since first 'ahead' commits from offset 0 are unpushed)
          isPushed: remoteStatus.isPublished
            ? offset + index >= remoteStatus.ahead
            : false,
        };
      });

      const hasMoreCommits = commits.length === 50;

      return {
        commits,
        hasMoreCommits,
        newOffset: offset + 50,
      };
    } catch (error) {
      throw new Error(`Failed to load more commits: ${error}`);
    }
  }

  private formatStatusCode(index: string, workingDir: string): string {
    const combined = `${index ?? ""}${workingDir ?? ""}`.trim();
    return combined.length > 0 ? combined : "--";
  }

  private parseGitDate(dateInput: string | Date | any): Date {
    // If it's already a Date object (from simple-git), return it
    if (dateInput instanceof Date) {
      return Number.isNaN(dateInput.getTime())
        ? new Date("1970-01-01")
        : dateInput;
    }

    // If it's not a string, convert to string
    const dateString = String(dateInput || "");

    if (
      !dateString ||
      dateString.trim() === "" ||
      dateString === "undefined" ||
      dateString === "null"
    ) {
      return new Date("1970-01-01"); // Return epoch as fallback
    }

    // Try to parse the date string directly
    const parsedDate = new Date(dateString);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    // If standard parsing fails, try to handle Git's ISO format
    try {
      // Git typically returns dates in ISO format like "2024-01-15 10:30:45 +0000"
      const isoMatch = dateString.match(
        /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/,
      );
      if (isoMatch) {
        const [, datePart, timePart] = isoMatch;
        return new Date(`${datePart}T${timePart}Z`);
      }

      // Try Unix timestamp (if it's just numbers)
      const timestamp = parseInt(dateString, 10);
      if (!Number.isNaN(timestamp) && timestamp > 0) {
        // If it looks like a Unix timestamp (seconds), convert to milliseconds
        const date = new Date(
          timestamp > 1000000000000 ? timestamp : timestamp * 1000,
        );
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      // Fall through to fallback
    }

    // Return epoch as final fallback
    return new Date("1970-01-01");
  }

  private async getTagsForCommits(git: any): Promise<Record<string, string[]>> {
    const tagMap: Record<string, string[]> = {};

    try {
      const tagList = await git.raw(["show-ref", "--tags"]);
      const lines = tagList.split("\n").filter((line: string) => line.trim());

      for (const line of lines) {
        const [hash, ref] = line.split(" ");
        if (!hash || !ref) continue;

        const tagName = ref.replace("refs/tags/", "");
        if (!tagMap[hash]) {
          tagMap[hash] = [];
        }
        tagMap[hash].push(tagName);
      }

      // Also get annotated tags pointing to commits
      const annotatedTags = await git.raw([
        "for-each-ref",
        "--format=%(objectname) %(refname:short) %(object)",
        "refs/tags",
      ]);
      const annotatedLines = annotatedTags
        .split("\n")
        .filter((line: string) => line.trim());

      for (const line of annotatedLines) {
        const parts = line.split(" ");
        if (parts.length >= 3) {
          const [, tagName, commitHash] = parts;
          if (commitHash && commitHash.length === 40) {
            if (!tagMap[commitHash]) {
              tagMap[commitHash] = [];
            }
            if (!tagMap[commitHash].includes(tagName)) {
              tagMap[commitHash].push(tagName);
            }
          }
        }
      }
    } catch (error) {
      // Silently fail if tags cannot be retrieved
    }

    return tagMap;
  }

  private async getRemoteStatus(
    git: any,
    currentBranch: string | null,
    remotes: any[],
  ): Promise<{
    hasRemote: boolean;
    isPublished: boolean;
    ahead: number;
    behind: number;
    lastFetched: Date | null;
    remoteBranch: string | null;
  }> {
    if (!currentBranch || remotes.length === 0) {
      return {
        hasRemote: false,
        isPublished: false,
        ahead: 0,
        behind: 0,
        lastFetched: null,
        remoteBranch: null,
      };
    }

    try {
      // Check if current branch has a remote tracking branch
      const trackingInfo = await git.raw(["branch", "-vv", "--no-color"]);
      const lines = trackingInfo.split("\n");
      let remoteBranch: string | null = null;
      let ahead = 0;
      let behind = 0;

      for (const line of lines) {
        if (line.trim().startsWith("*")) {
          // Parse remote tracking info
          const match = line.match(/\[([^\]]+)\]/);
          if (match) {
            const trackingPart = match[1];
            const remoteParts = trackingPart.split(":");
            remoteBranch = remoteParts[0].trim();

            // Parse ahead/behind
            const aheadMatch = trackingPart.match(/ahead (\d+)/);
            const behindMatch = trackingPart.match(/behind (\d+)/);

            if (aheadMatch) {
              ahead = parseInt(aheadMatch[1], 10);
            }
            if (behindMatch) {
              behind = parseInt(behindMatch[1], 10);
            }
          }
          break;
        }
      }

      // Get last fetch time from git reflog
      let lastFetched: Date | null = null;
      try {
        // Try to get fetch time from reflog entries for origin
        const fetchLog = await git.raw([
          "reflog",
          "show",
          "refs/remotes/origin/HEAD",
          "--date=iso",
          "-n",
          "1",
          "--format=%cd",
        ]);
        if (fetchLog.trim()) {
          const fetchDate = new Date(fetchLog.trim());
          if (!isNaN(fetchDate.getTime())) {
            lastFetched = fetchDate;
          }
        }
      } catch {
        // Fallback: Try to get from main/master branch reflog
        try {
          const branches = [remoteBranch, "main", "master"];
          for (const branch of branches) {
            if (!branch) continue;
            try {
              const branchLog = await git.raw([
                "reflog",
                "show",
                `refs/remotes/origin/${branch.replace('origin/', '')}`,
                "--date=iso",
                "-n",
                "1",
                "--format=%cd",
              ]);
              if (branchLog.trim()) {
                const branchDate = new Date(branchLog.trim());
                if (!isNaN(branchDate.getTime())) {
                  lastFetched = branchDate;
                  break;
                }
              }
            } catch {
              // Continue to next branch
            }
          }
        } catch {
          // Final fallback: check FETCH_HEAD file modification time
          try {
            const fs = require("fs");
            const fetchHeadPath = path.join(git.gitDir || ".git", "FETCH_HEAD");
            const stats = fs.statSync(fetchHeadPath);
            // Only use FETCH_HEAD if it's recent (within last 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (stats.mtime.getTime() > thirtyDaysAgo) {
              lastFetched = stats.mtime;
            }
          } catch {
            // Ignore if FETCH_HEAD doesn't exist or is inaccessible
          }
        }
      }

      return {
        hasRemote: remotes.length > 0,
        isPublished: remoteBranch !== null,
        ahead,
        behind,
        lastFetched,
        remoteBranch,
      };
    } catch (error) {
      return {
        hasRemote: remotes.length > 0,
        isPublished: false,
        ahead: 0,
        behind: 0,
        lastFetched: null,
        remoteBranch: null,
      };
    }
  }

  private formatRelativeTime(date: Date | string | any): string {
    let actualDate: Date;

    if (date instanceof Date) {
      actualDate = date;
    } else {
      actualDate = this.parseGitDate(date);
    }

    if (Number.isNaN(actualDate.getTime())) {
      return "Unknown date";
    }

    // Use simple relative time calculation instead of dayjs
    const diff = Date.now() - actualDate.getTime();
    const seconds = Math.round(diff / 1000);
    if (seconds < 60) {
      return "just now";
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 30) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }
    const months = Math.round(days / 30);
    if (months < 12) {
      return `${months} month${months === 1 ? "" : "s"} ago`;
    }
    const years = Math.round(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
}
