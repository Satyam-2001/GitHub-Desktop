import React from 'react';
import { Box } from '@mui/material';
import { TimelineProps } from './types/timeline.types';
import { useTimelineState } from './hooks/useTimelineState';
import { useTimelineActions } from './hooks/useTimelineActions';
import { TimelineHeader } from './components/TimelineHeader';
import { TimelineTabs } from './components/TimelineTabs';
import { ChangesView } from './components/ChangesView';
import { HistoryView } from './components/HistoryView';
import { ContextMenuAdjusted } from './components/ContextMenuAdjusted';
import { NewBranchDialog } from './components/NewBranchDialog';
import { UncommittedChangesDialog } from './components/UncommittedChangesDialog';

export const Timeline: React.FC<TimelineProps> = ({
  changes,
  history,
  branches,
  branchActivity,
  currentBranch,
  repository,
  bridge,
  hasMoreCommits = false,
  commitsOffset = 0,
  remoteStatus,
}) => {
  const { state, actions } = useTimelineState(bridge, history, commitsOffset);

  const timelineActions = useTimelineActions({
    bridge,
    changes,
    selectedFiles: state.selectedFiles,
    commitMessage: state.commitMessage,
    newBranchName: state.newBranchName,
    allCommits: state.allCommits,
    hasMoreCommits,
    isLoadingMore: state.isLoadingMore,
    setSelectedFiles: actions.setSelectedFiles,
    setCommitMessage: actions.setCommitMessage,
    setContextMenu: actions.setContextMenu,
    setNewBranchDialog: actions.setNewBranchDialog,
    setNewBranchName: actions.setNewBranchName,
    setUncommittedChangesDialog: actions.setUncommittedChangesDialog,
    setIsLoadingMore: actions.setIsLoadingMore,
    setSelectedCommitHash: actions.setSelectedCommitHash,
  });

  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'var(--vscode-sideBar-background)',
      color: 'var(--vscode-foreground)',
      fontFamily: 'var(--vscode-font-family)'
    }}>
      {/* Header */}
      <TimelineHeader
        currentBranch={currentBranch}
        branches={branches}
        branchActivity={branchActivity}
        remoteStatus={remoteStatus}
        bridge={bridge}
        onCreateNewBranch={timelineActions.handleCreateNewBranch}
        onRefresh={timelineActions.handleRefresh}
      />

      {/* Tabs */}
      {/* <TimelineTabs
        activeTab={state.activeTab}
        changes={changes}
        history={history}
        onTabChange={actions.setActiveTab}
      /> */}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {state.activeTab === 'changes' ? (
          <ChangesView
            changes={changes}
            selectedFiles={state.selectedFiles}
            commitMessage={state.commitMessage}
            currentBranch={currentBranch}
            onFileToggle={timelineActions.handleFileToggle}
            onStageFiles={timelineActions.handleStageFiles}
            onUnstageFiles={timelineActions.handleUnstageFiles}
            onCommitMessageChange={actions.setCommitMessage}
            onCommit={timelineActions.handleCommit}
            onPush={timelineActions.handlePush}
            onPull={timelineActions.handlePull}
          />
        ) : (
          <HistoryView
            allCommits={state.allCommits}
            selectedCommitHash={state.selectedCommitHash}
            hasMoreCommits={hasMoreCommits}
            isLoadingMore={state.isLoadingMore}
            onCommitSelect={timelineActions.handleCommitSelect}
            onCommitContextMenu={timelineActions.handleCommitContextMenu}
            onLoadMoreCommits={timelineActions.handleLoadMoreCommits}
          />
        )}
      </Box>

      {/* Context Menu */}
      {state.contextMenu && (
        <ContextMenuAdjusted
          contextMenu={state.contextMenu}
          onClose={timelineActions.handleContextMenuClose}
          onAction={timelineActions.handleContextMenuAction}
        />
      )}

      {/* New Branch Dialog */}
      <NewBranchDialog
        open={state.newBranchDialog}
        branchName={state.newBranchName}
        onClose={() => actions.setNewBranchDialog(false)}
        onBranchNameChange={actions.setNewBranchName}
        onConfirm={timelineActions.handleConfirmCreateBranch}
      />

      {/* Uncommitted Changes Dialog */}
      <UncommittedChangesDialog
        open={state.uncommittedChangesDialog}
        branchName={state.newBranchName}
        onClose={() => actions.setUncommittedChangesDialog(false)}
        onBranchNameChange={actions.setNewBranchName}
        onLeaveChanges={() => timelineActions.handleCreateBranchWithChanges(false)}
        onBringChanges={() => timelineActions.handleCreateBranchWithChanges(true)}
      />
    </Box>
  );
};