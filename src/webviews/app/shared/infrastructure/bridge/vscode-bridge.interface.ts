export interface VSCodeMessage {
  command: string;
  [key: string]: any;
}

export interface VSCodeBridge {
  sendMessage(command: string, data?: any): void;
  onMessage(handler: (message: VSCodeMessage) => void): void;
  offMessage(handler: (message: VSCodeMessage) => void): void;
  getState(): any;
  setState(state: any): void;
}

export class VSCodeBridgeImpl implements VSCodeBridge {
  private messageHandlers: Set<(message: VSCodeMessage) => void> = new Set();
  private vscodeApi: any;

  constructor() {
    if (typeof window !== "undefined" && (window as any).vscodeApi) {
      this.vscodeApi = (window as any).vscodeApi;
      this.setupMessageListener();
    }
  }

  sendMessage(command: string, data: any = {}): void {
    if (this.vscodeApi) {
      this.vscodeApi.postMessage({ command, ...data });
    }
  }

  onMessage(handler: (message: VSCodeMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  offMessage(handler: (message: VSCodeMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  getState(): any {
    return this.vscodeApi?.getState();
  }

  setState(state: any): void {
    this.vscodeApi?.setState(state);
  }

  private setupMessageListener(): void {
    window.addEventListener("message", (event) => {
      const message = event.data;
      this.messageHandlers.forEach((handler) => handler(message));
    });
  }
}
