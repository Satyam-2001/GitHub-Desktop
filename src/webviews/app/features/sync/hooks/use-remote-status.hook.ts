import { useState, useEffect } from 'react';
import { VSCodeBridge } from '../../../shared/infrastructure/bridge/vscode-bridge.interface';
import { ServiceLocator } from '../../../shared/infrastructure/di/service-locator';

interface RemoteStatus {
  hasRemote: boolean;
  isPublished: boolean;
  ahead: number;
  behind: number;
  lastFetched: Date | null;
  remoteBranch: string | null;
}

export const useRemoteStatus = () => {
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus | null>(null);
  const bridge = ServiceLocator.getInstance().get<VSCodeBridge>('VSCodeBridge');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'updateRemoteStatus' && message.remoteStatus) {
        setRemoteStatus(message.remoteStatus);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial data
    bridge?.postMessage({ command: 'ready' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [bridge]);

  const publish = () => {
    bridge?.postMessage({ command: 'publish' });
  };

  const fetch = () => {
    bridge?.postMessage({ command: 'fetch' });
  };

  const push = () => {
    bridge?.postMessage({ command: 'push' });
  };

  const pull = () => {
    bridge?.postMessage({ command: 'pull' });
  };

  return {
    remoteStatus,
    publish,
    fetch,
    push,
    pull
  };
};