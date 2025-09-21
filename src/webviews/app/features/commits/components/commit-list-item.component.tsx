import React from 'react';
import { ListItem, ListItemText, Typography, Box, Avatar } from '@mui/material';
import { ArrowUpward as UpArrowIcon } from '@mui/icons-material';
import { Commit } from '../../../domain/entities/commit.entity';
import { CommitTag } from './commit-tag.component';

interface CommitListItemProps {
  commit: Commit;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

export const CommitListItem: React.FC<CommitListItemProps> = ({
  commit,
  onClick,
  onContextMenu
}) => {
  const generateAvatarUrl = (email: string, name: string) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
    const safeEmail = email || 'user@example.com';
    const safeName = name || 'Unknown';
    const colorIndex = safeEmail.charCodeAt(0) % colors.length;
    const color = colors[colorIndex] || colors[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${color.slice(1)}&color=fff&size=32`;
  };

  return (
    <ListItem
      sx={{
        py: 1,
        px: 1.5,
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'var(--vscode-list-hoverBackground)'
        }
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <ListItemText
        sx={{ pl: 1 }}
        primary={
          <Typography sx={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--vscode-foreground)',
            mb: 0.5,
            lineHeight: 1.3
          }}>
            {commit.message.summary}
          </Typography>
        }
        secondary={
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Avatar
                src={commit.avatarUrl || generateAvatarUrl(commit.author.email, commit.author.name)}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: '10px',
                  bgcolor: 'var(--vscode-button-background)',
                }}
              >
                {commit.author.initials}
              </Avatar>
              <Typography sx={{
                fontSize: '12px',
                color: 'var(--vscode-descriptionForeground)'
              }}>
                {commit.author.name}
              </Typography>
              <Typography sx={{
                fontSize: '11px',
                color: 'var(--vscode-descriptionForeground)'
              }}>
                •
              </Typography>
              <Typography sx={{
                fontSize: '12px',
                color: 'var(--vscode-descriptionForeground)'
              }}>
                {commit.formattedDate}
              </Typography>
              {commit.tags && commit.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  {commit.tags.map(tag => (
                    <CommitTag key={tag} tag={tag} />
                  ))}
                </Box>
              )}
              {!commit.isPushed && (
                <UpArrowIcon sx={{
                  fontSize: 14,
                  color: 'var(--vscode-gitDecoration-untrackedResourceForeground, #10b981)',
                  ml: 1
                }} />
              )}
              <Typography sx={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--vscode-descriptionForeground)',
                ml: 'auto'
              }}>
                {commit.shortHash}
              </Typography>
            </Box>
          </>
        }
      />
    </ListItem>
  );
};