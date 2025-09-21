import { useState, useEffect, useCallback } from 'react';
import { Branch } from '../../../domain/entities/branch.entity';
import { BranchName } from '../../../domain/value-objects/branch-name.vo';
import { BranchService } from '../services/branch.service';
import { useService } from '../../../shared/infrastructure/di/service-locator';

interface UseBranchesResult {
  branches: Branch[];
  currentBranch: Branch | null;
  loading: boolean;
  error: string | null;
  createBranch: (name: string, bringChanges?: boolean) => Promise<void>;
  switchToBranch: (branch: Branch) => Promise<void>;
  refresh: () => void;
}

export const useBranches = (): UseBranchesResult => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchService = useService<BranchService>('BranchService');

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [allBranches, current] = await Promise.all([
        branchService.getAllBranches(),
        branchService.getCurrentBranch()
      ]);

      setBranches(allBranches);
      setCurrentBranch(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [branchService]);

  const createBranch = useCallback(async (name: string, bringChanges = false) => {
    try {
      const branchName = new BranchName(name);
      await branchService.createBranch(branchName, bringChanges);
      await loadBranches(); // Refresh after creating
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
      throw err;
    }
  }, [branchService, loadBranches]);

  const switchToBranch = useCallback(async (branch: Branch) => {
    try {
      await branchService.switchToBranch(branch.name);
      await loadBranches(); // Refresh after switching
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
      throw err;
    }
  }, [branchService, loadBranches]);

  const refresh = useCallback(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return {
    branches,
    currentBranch,
    loading,
    error,
    createBranch,
    switchToBranch,
    refresh
  };
};