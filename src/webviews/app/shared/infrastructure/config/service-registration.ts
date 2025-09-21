import { ServiceContainer } from '../di/service-container';
import { VSCodeBridgeImpl } from '../bridge/vscode-bridge.interface';
import { CommitServiceImpl } from '../../../features/commits/services/commit.service';
import { BranchServiceImpl } from '../../../features/branches/services/branch.service';

export const configureServices = (): ServiceContainer => {
  const container = new ServiceContainer();

  // Register bridge
  container.register('VSCodeBridge', () => new VSCodeBridgeImpl());

  // Register feature services
  container.register('CommitService', () => {
    const bridge = container.get('VSCodeBridge');
    return new CommitServiceImpl(bridge);
  });

  container.register('BranchService', () => {
    const bridge = container.get('VSCodeBridge');
    return new BranchServiceImpl(bridge);
  });

  return container;
};