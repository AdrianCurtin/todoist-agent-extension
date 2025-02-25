/**
 * Todoist integration for Jan AI
 */

import {
  fs,
  joinPath,
  AssistantExtension,
  RegisterExtensionPoint,
  ToolManager,
  InferenceTool,
  AssistantTool,
  MessageRequest,
  executeOnMain,
  Assistant,
  SettingComponentProps,
  getJanDataFolderPath
} from "@janhq/core";
import { CommandHandler } from './command-handler';

/**
 * Todoist Tool Implementation - Extends InferenceTool
 */
export class TodoistTool extends InferenceTool {
  name: string = 'todoist';

  async process(
    data: MessageRequest,
    tool?: AssistantTool
  ): Promise<MessageRequest> {
    if (!data.model || !data.messages) {
      return Promise.resolve(data);
    }

    const latestMessage = data.messages[data.messages.length - 1];
    if (!latestMessage || !latestMessage.content) {
      return Promise.resolve(data);
    }

    // Get the message content
    let content = '';
    if (typeof latestMessage.content === 'string') {
      content = latestMessage.content;
    } else if (latestMessage.content.length > 0 && latestMessage.content[0].text) {
      content = latestMessage.content[0].text;
    }

    // Check if the message is a Todoist command
    if (content.trim().toLowerCase().startsWith('/todoist')) {
      try {
        // Process the command
        const response = await CommandHandler.processCommand(content);
        
        // Update the message content with the response
        if (typeof latestMessage.content === 'string') {
          data.messages[data.messages.length - 1].content = response;
        } else {
          data.messages[data.messages.length - 1].content = response;
        }
      } catch (error) {
        // Handle errors
        const errorMessage = `Error processing Todoist command: ${error.message || 'Unknown error'}`;
        if (typeof latestMessage.content === 'string') {
          data.messages[data.messages.length - 1].content = errorMessage;
        } else {
          data.messages[data.messages.length - 1].content = errorMessage;
        }
      }
    }

    return Promise.resolve(data);
  }
}

/**
 * Settings definition for the plugin
 */
const SETTINGS = [
  {
    key: "todoist-api-token",
    title: "Todoist API Token",
    description: "API token to connect to your Todoist account. You can find this in Todoist Settings > Integrations > Developer > API token.",
    controllerType: "input",
    controllerProps: {
      value: "",
      placeholder: "Enter your Todoist API token",
      type: "password",
      inputActions: ["unobscure", "copy"]
    }
  }
];

/**
 * Main Todoist Extension class
 */
export default class TodoistExtension extends AssistantExtension {
  private assistants: Assistant[] = [];


  private defaultAssistant: Assistant = {
    avatar: '',
    thread_location: undefined,
    id: 'jan',
    object: 'assistant',
    created_at: Date.now() / 1000,
    name: 'Todoist Assistant',
    description: 'A default assistant that can use all downloaded models',
    model: '*',
    instructions: '',
    tools: [
      {
        type: 'retrieval',
        enabled: false,
        useTimeWeightedRetriever: false,
        settings: {
          top_k: 2,
          chunk_size: 1024,
          chunk_overlap: 64,
          retrieval_template: `Use the following pieces of context to answer the question at the end.
----------------
CONTEXT: {CONTEXT}
----------------
QUESTION: {QUESTION}
----------------
Helpful Answer:`,
        },
      },
    ],
    file_ids: [],
    metadata: undefined,
  }


  async createAssistant(assistant: Assistant): Promise<void> {
    const API_TOKEN_KEY = 'todoist-api-token';
    // Add Todoist capability to the assistant
    assistant.tools = assistant.tools || [];
    assistant.tools.push({
      type: 'todoist',
      enabled: true,
      settings: {
        apiToken: await this.getSetting(API_TOKEN_KEY,'') as string
      }
    });
    
    this.assistants.push(assistant);
  }

  async deleteAssistant(assistant: Assistant): Promise<void> {
    const index = this.assistants.findIndex(a => a.id === assistant.id);
    if (index !== -1) {
      this.assistants.splice(index, 1);
    }
  }

  async getAssistants(): Promise<Assistant[]> {
    return this.assistants;
  }

  async onLoad() {
    console.log('Loading Todoist Extension');
    
    // Register the todoist tool
    ToolManager.instance().register(new TodoistTool());
    
    // Register settings
    await this.registerSettings([]);

    const token = await this.getSetting('todoist-api-token', '');

    if(!token || token === '') {
      // If the API token is not set, initialize it with a placeholder
      await this.updateSettings([
        {
          key: 'todoist-api-token',
          title: 'Todoist API Token',
          description: 'API token to connect to your Todoist account. You can find this in Todoist Settings > Integrations > Developer > API token.',
          controllerType: 'input',
          controllerProps: {
            value: '123456',
            "placeholder": "hf_**********************************",
            "type": "password",
            "inputActions": [
              "unobscure",
              "copy"]
          } as any,
        },
      ])
      console.log('Todoist API token setting initialized');
    } else {
      console.log('Todoist API token setting already exists');
      console.log('Todoist API token:', token);
    }
    
    // Initialize the main module
    try {
      this.createAssistant(this.defaultAssistant);
    } catch (error) {
      console.error('Failed to initialize Todoist plugin:', error);
    }
  }

  /**
   * Register settings for the extension.
   * @param settings
   * @returns
   */
  async registerSettings(settings: SettingComponentProps[]): Promise<void> {
    if (!this.name) {
      console.error('Extension name is not defined')
      return
    }

    const extensionSettingFolderPath = await joinPath([
      await getJanDataFolderPath(),
      'settings',
      this.name,
    ])
    settings.forEach((setting) => {
      setting.extensionName = this.name
    })
    try {
      if (!(await fs.existsSync(extensionSettingFolderPath)))
        await fs.mkdir(extensionSettingFolderPath)
      const settingFilePath = await joinPath([extensionSettingFolderPath, this.settingFileName])

      // Persists new settings
      if (await fs.existsSync(settingFilePath)) {
        const oldSettings = JSON.parse(await fs.readFileSync(settingFilePath, 'utf-8'))
        settings.forEach((setting) => {
          // Keep setting value
          if (setting.controllerProps && Array.isArray(oldSettings))
            setting.controllerProps.value = oldSettings.find(
              (e: any) => e.key === setting.key
            )?.controllerProps?.value
        })
      }
      await fs.writeFileSync(settingFilePath, JSON.stringify(settings, null, 2))
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Get the setting value for the key.
   * @param key
   * @param defaultValue
   * @returns
   */
 /**
   * Get the setting value for the key.
   * @param key
   * @param defaultValue
   * @returns
   */
  async getSetting<T>(key: string, defaultValue: T) {
    const keySetting = (await this.getSettings()).find((setting) => setting.key === key)

    const value = keySetting?.controllerProps.value
    return (value as T) ?? defaultValue
  }

  /**
   * Update the settings for the extension.
   * @param componentProps
   * @returns
   */
  async updateSettings(componentProps: Partial<SettingComponentProps>[]): Promise<void> {
    if (!this.name) return

    const settings = await this.getSettings()

    let updatedSettings = settings.map((setting) => {
      const updatedSetting = componentProps.find(
        (componentProp) => componentProp.key === setting.key
      )
      if (updatedSetting && updatedSetting.controllerProps) {
        setting.controllerProps.value = updatedSetting.controllerProps.value
      }
      return setting
    })

    if (!updatedSettings.length) updatedSettings = componentProps as SettingComponentProps[]

    const settingFolder = await joinPath([
      await getJanDataFolderPath(),
      this.settingFolderName,
      this.name,
    ])

    if (!(await fs.existsSync(settingFolder))) {
      await fs.mkdir(settingFolder)
    }

    const settingPath = await joinPath([settingFolder, this.settingFileName])

    await fs.writeFileSync(settingPath, JSON.stringify(updatedSettings, null, 2))

    updatedSettings.forEach((setting) => {
      this.onSettingUpdate<typeof setting.controllerProps.value>(
        setting.key,
        setting.controllerProps.value
      )
    })
  }

  async onUnload() {
    console.log('Unloading Todoist Extension');
    // Perform any cleanup if necessary
  }
}

/**
 * Register extension functions with Jan
 */
export function init({ register }: { register: RegisterExtensionPoint }) {
  register("todoist:run", PLUGIN_NAME, (param: number) => {
    console.log('Running Todoist extension with param:', param);
    return executeOnMain(MODULE_PATH, "run", param);
  });
  // Register Todoist specific functions
  register("todoist:addTask", PLUGIN_NAME, addTask);
  register("todoist:getProjects", PLUGIN_NAME, getProjects);
  register("todoist:getTasks", PLUGIN_NAME, getTasks);
  register("todoist:completeTask", PLUGIN_NAME, completeTask);
}

// Add task to Todoist
function addTask(content: string, dueString?: string, projectId?: string): Promise<any> {
  return executeOnMain(MODULE_PATH, "addTask", content, dueString, projectId);
}

// Get projects from Todoist
function getProjects(): Promise<any> {
  return executeOnMain(MODULE_PATH, "getProjects");
}

// Get active tasks
function getTasks(filter?: string, projectId?: string): Promise<any> {
  return executeOnMain(MODULE_PATH, "getTasks", filter, projectId);
}

// Complete a task
function completeTask(taskId: string): Promise<any> {
  return executeOnMain(MODULE_PATH, "completeTask", taskId);
}