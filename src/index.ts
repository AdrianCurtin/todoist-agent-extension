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
  Assistant
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



  async createAssistant(assistant: Assistant): Promise<void> {
    const API_TOKEN_KEY = 'todoist-api-token';
    // Add Todoist capability to the assistant
    assistant.tools = assistant.tools || [];
    assistant.tools.push({
      type: 'todoist',
      enabled: true,
      settings: {
        apiToken: await this.getSetting(PLUGIN_NAME, API_TOKEN_KEY) as string
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
    await this.registerSettings();
    
    // Initialize the main module
    try {
      return executeOnMain(MODULE_PATH, "run", 0);
    } catch (error) {
      console.error('Failed to initialize Todoist plugin:', error);
    }
  }

  /**
   * Register plugin settings
   */
  async registerSettings(): Promise<void> {
    try {
      // Get path to the settings.json file
      const settingsPath = await joinPath(['resources', 'settings.json']);
      
      // Create the directory if it doesn't exist
      const dirPath = await joinPath(['resources']);
      if (!(await fs.existsSync(dirPath))) {
        await fs.mkdir(dirPath, { recursive: true });
      }
      
      // Write the settings to the file
      await fs.writeFileSync(settingsPath, JSON.stringify(SETTINGS, null, 2));
      
      console.log('Todoist plugin settings registered successfully');
    } catch (error) {
      console.error('Failed to register Todoist plugin settings:', error);
    }
  }

  onUnload(): void {
    console.log('Unloading Todoist Extension');
    // Clean up any resources if needed
  }
}

/**
 * Register extension functions with Jan
 */
export function init({ register }: { register: RegisterExtensionPoint }) {
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