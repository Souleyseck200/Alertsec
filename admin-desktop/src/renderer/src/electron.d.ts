export {};

declare global {
  interface Window {
    electron: {
      sendNotification: (title: string, body: string) => Promise<void>;
      onSOS: (callback: (data: any) => void) => void;
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, val: any) => Promise<void>;
      };
      log: (msg: string) => void;
    };
  }
}
