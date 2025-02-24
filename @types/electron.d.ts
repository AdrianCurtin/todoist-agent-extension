declare module 'electron' {
  export interface IpcMainEvent {
    sender: any;
  }

  export const ipcMain: {
    handle: (channel: string, listener: (event: IpcMainEvent, ...args: any[]) => Promise<any> | any) => void;
  };
}