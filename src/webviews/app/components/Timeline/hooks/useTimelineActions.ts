import { VSCodeBridge, GitChange, GitCommit } from '../../../bridge';
import { ContextMenuState } from '../types/timeline.types';

interface UseTimelineActionsProps {
  bridge: VSCodeBridge;
  changes: GitChange[];
  selectedFiles: Set<string>;
  commitMessage: string;
  newBranchName: string;
  allCommits: GitCommit[];
  hasMoreCommits: boolean;
  isLoadingMore: boolean;
  setSelectedFiles: (files: Set<string>) => void;
  setCommitMessage: (message: string) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setNewBranchDialog: (open: boolean) => void;
  setNewBranchName: (name: string) => void;
  setUncommittedChangesDialog: (open: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setSelectedCommitHash: (hash: string | null) => void;
}

export const useTimelineActions = ({
  bridge,
  changes,
  selectedFiles,
  commitMessage,
  newBranchName,
  allCommits,
  hasMoreCommits,
  isLoadingMore,
  setSelectedFiles,
  setCommitMessage,
  setContextMenu,
  setNewBranchDialog,
  setNewBranchName,
  setUncommittedChangesDialog,
  setIsLoadingMore,
  setSelectedCommitHash,
}: UseTimelineActionsProps) => {

  const handleFileToggle = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleStageFiles = () => {
    bridge.sendMessage('stageFiles', { files: Array.from(selectedFiles) });
    setSelectedFiles(new Set());
  };

  const handleUnstageFiles = () => {
    bridge.sendMessage('unstageFiles', { files: Array.from(selectedFiles) });
    setSelectedFiles(new Set());
  };

  const handleCommit = () => {
    if (commitMessage.trim()) {
      bridge.sendMessage('commit', { message: commitMessage });
      setCommitMessage('');
    }
  };

  const handlePush = () => {
    bridge.sendMessage('push');
  };

  const handlePull = () => {
    bridge.sendMessage('pull');
  };

  const handleRefresh = () => {
    bridge.sendMessage('refresh');
  };

  const handleCreateNewBranch = () => {
    const hasUncommittedChanges = changes.length > 0;
    if (hasUncommittedChanges) {
      setUncommittedChangesDialog(true);
    } else {
      setNewBranchDialog(true);
    }
  };

  const handleCreateBranchWithChanges = (bringChanges: boolean) => {
    setUncommittedChangesDialog(false);

    if (bringChanges) {
      bridge.sendMessage('createBranchWithChanges', {
        branchName: newBranchName,
        bringChanges: true
      });
    } else {
      bridge.sendMessage('createBranchWithChanges', {
        branchName: newBranchName,
        bringChanges: false
      });
    }

    setNewBranchName('');
    setNewBranchDialog(true);
  };

  const handleConfirmCreateBranch = () => {
    if (newBranchName.trim()) {
      bridge.sendMessage('createBranch', { branchName: newBranchName.trim() });
      setNewBranchDialog(false);
      setNewBranchName('');
    }
  };

  const handleLoadMoreCommits = () => {
    if (!isLoadingMore && hasMoreCommits) {
      setIsLoadingMore(true);
      bridge.sendMessage('loadMoreCommits', { offset: allCommits.length });
    }
  };

  const handleCommitSelect = (commit: GitCommit) => {
    console.log('Selecting commit:', commit.hash);
    setSelectedCommitHash(commit.hash);
    bridge.sendMessage('openCommitDetail', { hash: commit.hash });
  };

  const handleCommitContextMenu = (event: React.MouseEvent, commit: GitCommit) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      commit,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, commit: GitCommit) => {
    switch (action) {
      case 'reset':
        bridge.sendMessage('resetToCommit', { hash: commit.hash });
        break;
      case 'checkout':
        bridge.sendMessage('checkoutCommit', { hash: commit.hash });
        break;
      case 'reorder':
        bridge.sendMessage('reorderCommit', { hash: commit.hash });
        break;
      case 'revert':
        bridge.sendMessage('revertCommit', { hash: commit.hash });
        break;
      case 'createBranch':
        bridge.sendMessage('createBranchFromCommit', { hash: commit.hash });
        break;
      case 'createTag':
        bridge.sendMessage('createTagFromCommit', { hash: commit.hash });
        break;
      case 'cherryPick':
        bridge.sendMessage('cherryPickCommit', { hash: commit.hash });
        break;
      case 'copySha':
        navigator.clipboard.writeText(commit.hash);
        break;
      case 'copyTag':
        navigator.clipboard.writeText(`${commit.message || 'No message'} (${(commit.hash || '').substring(0, 7)})`);
        break;
      case 'viewOnGitHub':
        bridge.sendMessage('viewCommitOnGitHub', { hash: commit.hash });
        break;
    }
    handleContextMenuClose();
  };

  return {
    handleFileToggle,
    handleStageFiles,
    handleUnstageFiles,
    handleCommit,
    handlePush,
    handlePull,
    handleRefresh,
    handleCreateNewBranch,
    handleCreateBranchWithChanges,
    handleConfirmCreateBranch,
    handleLoadMoreCommits,
    handleCommitSelect,
    handleCommitContextMenu,
    handleContextMenuClose,
    handleContextMenuAction,
  };
};