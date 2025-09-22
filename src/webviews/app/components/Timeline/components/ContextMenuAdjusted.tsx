import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  MenuList,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  RestartAlt as ResetIcon,
  CheckCircle as CheckoutIcon,
  Reorder as ReorderIcon,
  Undo as RevertIcon,
  AccountTree as BranchIcon,
  LocalOffer as TagIcon,
  CallMerge as CherryPickIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ViewIcon,
} from '@mui/icons-material';
import { ContextMenuState } from '../types/timeline.types';
import { GitCommit } from '../../../bridge';

interface ContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onAction: (action: string, commit: GitCommit) => void;
}

export const ContextMenuAdjusted: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = contextMenu.mouseY;
      let left = contextMenu.mouseX;

      // Adjust horizontal position if menu would overflow right edge
      if (left + menuRect.width > viewportWidth) {
        left = viewportWidth - menuRect.width - 10;
      }

      // Adjust vertical position if menu would overflow bottom edge
      if (top + menuRect.height > viewportHeight) {
        top = viewportHeight - menuRect.height - 10;
      }

      // Ensure menu doesn't go off left or top edges
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setPosition({ top, left });
    }
  }, [contextMenu.mouseX, contextMenu.mouseY]);

  const menuItemStyles = {
    fontSize: '13px',
    color: 'var(--vscode-menu-foreground, #cccccc)',
    px: 2,
    py: 0.5,
    minHeight: 'auto',
    '&:hover': {
      bgcolor: 'var(--vscode-menu-selectionBackground, #094771)',
      color: 'var(--vscode-menu-selectionForeground, #ffffff)'
    },
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
        }}
        onClick={onClose}
      />

      {/* Menu */}
      <Paper
        ref={menuRef}
        sx={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 1301,
          bgcolor: 'var(--vscode-menu-background, #2d2d30)',
          border: '1px solid var(--vscode-menu-border, #454545)',
          borderRadius: '3px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          minWidth: 220,
          py: 0.5,
          maxHeight: 'calc(100vh - 20px)',
          overflowY: 'auto',
          visibility: position.top === 0 && position.left === 0 ? 'hidden' : 'visible',
        }}
      >
        <MenuList dense disablePadding>
          <MenuItem
            onClick={() => onAction('reset', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <ResetIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Reset to commit...
          </MenuItem>

          <MenuItem
            onClick={() => onAction('checkout', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <CheckoutIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Checkout commit
          </MenuItem>

          <MenuItem
            onClick={() => onAction('reorder', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <ReorderIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Reorder commit
          </MenuItem>

          <MenuItem
            onClick={() => onAction('revert', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <RevertIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Revert changes in commit
          </MenuItem>

          <Divider sx={{
            borderColor: 'var(--vscode-menu-separatorBackground, #454545)',
            my: 0.5
          }} />

          <MenuItem
            onClick={() => onAction('createBranch', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <BranchIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Create branch from commit
          </MenuItem>

          <MenuItem
            onClick={() => onAction('createTag', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <TagIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Create tag...
          </MenuItem>

          <MenuItem
            onClick={() => onAction('cherryPick', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <CherryPickIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Cherry-pick commit...
          </MenuItem>

          <Divider sx={{
            borderColor: 'var(--vscode-menu-separatorBackground, #454545)',
            my: 0.5
          }} />

          <MenuItem
            onClick={() => onAction('copySha', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <CopyIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Copy SHA
          </MenuItem>

          <MenuItem
            onClick={() => onAction('copyTag', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <CopyIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            Copy tag
          </MenuItem>

          <MenuItem
            onClick={() => onAction('viewOnGitHub', contextMenu.commit!)}
            sx={menuItemStyles}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <ViewIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            View on GitHub
          </MenuItem>
        </MenuList>
      </Paper>
    </>
  );
};