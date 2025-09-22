import * as vscode from "vscode";
import { randomUUID } from "crypto";
import { TrackedRepository } from "../../shared/types";

const REPOSITORIES_KEY = "githubDesktop.repositories";

export class RepositoryManager {
  private repositories: TrackedRepository[] = [];
  private readonly _onDidChangeRepositories = new vscode.EventEmitter<void>();

  public readonly onDidChangeRepositories = this._onDidChangeRepositories.event;

  constructor(private readonly globalState: vscode.Memento) {}

  async initialize(): Promise<void> {
    this.repositories = this.globalState.get<TrackedRepository[]>(
      REPOSITORIES_KEY,
      [],
    );
  }

  getRepositories(accountId?: string): TrackedRepository[] {
    if (!accountId) {
      return [...this.repositories];
    }
    return this.repositories.filter((repo) => repo.accountId === accountId);
  }

  findByPath(path: string): TrackedRepository | undefined {
    return this.repositories.find((repo) => repo.localPath === path);
  }

  async addRepository(
    partial: Omit<TrackedRepository, "id">,
  ): Promise<TrackedRepository> {
    const existing = this.repositories.find(
      (repo) =>
        repo.localPath === partial.localPath ||
        (!!repo.remoteUrl &&
          !!partial.remoteUrl &&
          repo.remoteUrl === partial.remoteUrl),
    );
    if (existing) {
      const updated = Object.assign(existing, partial);
      await this.persist();
      this._onDidChangeRepositories.fire();
      return updated;
    }

    const repository: TrackedRepository = {
      id: randomUUID(),
      ...partial,
    };
    this.repositories.push(repository);
    await this.persist();
    this._onDidChangeRepositories.fire();
    return repository;
  }

  async updateRepository(
    id: string,
    updates: Partial<TrackedRepository>,
  ): Promise<TrackedRepository | undefined> {
    const repo = this.repositories.find((candidate) => candidate.id === id);
    if (!repo) {
      return undefined;
    }
    Object.assign(repo, updates);
    await this.persist();
    this._onDidChangeRepositories.fire();
    return repo;
  }

  async removeRepository(id: string): Promise<void> {
    const index = this.repositories.findIndex((repo) => repo.id === id);
    if (index === -1) {
      return;
    }
    this.repositories.splice(index, 1);
    await this.persist();
    this._onDidChangeRepositories.fire();
  }

  private async persist(): Promise<void> {
    await this.globalState.update(REPOSITORIES_KEY, this.repositories);
  }
}
