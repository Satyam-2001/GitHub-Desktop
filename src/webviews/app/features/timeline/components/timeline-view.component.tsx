import React, { useState } from 'react';
import { Box } from '@mui/material';
import { TimelineHeader } from './timeline-header.component';
import { TimelineTabs } from './timeline-tabs.component';
import { ChangesView } from '../../changes/components/changes-view.component';
import { CommitHistoryView } from './commit-history-view.component';

interface TimelineViewProps {
  initialState?: any;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ initialState }) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: 'var(--vscode-sideBar-background)',
      color: 'var(--vscode-foreground)'
    }}>
      <TimelineHeader />
      <TimelineTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'changes' && <ChangesView />}
      {activeTab === 'history' && <CommitHistoryView />}
    </Box>
  );
};