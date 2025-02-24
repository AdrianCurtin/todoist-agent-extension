declare module '@janhq/core' {
  export const core: {
    invokePluginFunc: (modulePath: string, funcName: string, ...args: any[]) => Promise<any>;
    callPluginFunction: (funcName: string, ...args: any[]) => Promise<any>;
    getSetting: (pluginName: string, key: string) => Promise<any>;
    setSetting: (pluginName: string, key: string, value: any) => Promise<void>;
    getThread: (threadId: string) => Promise<Thread>;
    getAssistants: () => Promise<Assistant[]>;
  };

  export const events: {
    on: (event: string, listener: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
  };

  export const fs: {
    existsSync: (path: string) => Promise<boolean>;
    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    writeFileSync: (path: string, data: string) => Promise<void>;
    readFileSync: (path: string, encoding?: string) => Promise<string>;
  };

  export function joinPath(parts: string[]): Promise<string>;

  export enum PluginService {
    OnStart = 'onStart'
  }

  export interface Assistant {
    id: string;
    name: string;
    model: string;
    description?: string;
    instructions?: string;
    avatar?: string;
    [key: string]: any;
  }

  export interface Thread {
    id: string;
    assistantId?: string;
    [key: string]: any;
  }

  export type RegisterExtensionPoint = (service: string, plugin: string, func: Function) => void;
}