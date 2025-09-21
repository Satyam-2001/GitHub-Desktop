import { useState, useEffect, useCallback } from 'react';
import { Commit } from '../../../domain/entities/commit.entity';
import { CommitService } from '../services/commit.service';
import { useService } from '../../../shared/infrastructure/di/service-locator';

interface UseCommitsResult {
  commits: Commit[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export const useCommits = (): UseCommitsResult => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const commitService = useService<CommitService>('CommitService');

  const loadCommits = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      if (offset === 0) {
        const initialCommits = await commitService.getCommitHistory();
        setCommits(initialCommits);
        setHasMore(initialCommits.length === 50);
      } else {
        const result = await commitService.loadMoreCommits(offset);
        setCommits(prev => [...prev, ...result.commits]);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  }, [commitService]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadCommits(commits.length);
    }
  }, [loading, hasMore, commits.length, loadCommits]);

  const refresh = useCallback(() => {
    setCommits([]);
    loadCommits(0);
  }, [loadCommits]);

  useEffect(() => {
    loadCommits(0);
  }, [loadCommits]);

  return {
    commits,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};