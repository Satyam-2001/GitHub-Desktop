import { VSCodeBridge } from '../bridge';

export class GitService {
  constructor(private bridge: VSCodeBridge) {}

  async push(): Promise<void> {
    this.bridge.sendMessage('push');
    // Simple delay to allow the operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async pull(): Promise<void> {
    this.bridge.sendMessage('pull');
    // Simple delay to allow the operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async fetch(): Promise<void> {
    this.bridge.sendMessage('fetch');
    // Simple delay to allow the operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async publish(): Promise<void> {
    this.bridge.sendMessage('publish');
    // Simple delay to allow the operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}