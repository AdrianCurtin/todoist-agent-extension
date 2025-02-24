/**
 * Todoist integration for Jan AI
 */

import { PluginService, RegisterExtensionPoint, core, fs, joinPath } from "@janhq/core";
import { MessageListener } from "./message-listener";

// Settings array for the plugin
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
 * Functions to register with Jan
 */
function onStart(): Promise<any> {
  // Initialize the message listener
  MessageListener.getInstance().init();
  
  // Register settings
  registerSettings(SETTINGS);
  
  // Initialize the main module
  return core.invokePluginFunc(MODULE_PATH, "run", 0);
}

/**
 * Register plugin settings
 */
async function registerSettings(settings: any[]): Promise<void> {
  try {
    // Get path to the settings.json file
    const settingsPath = await joinPath(['resources', 'settings.json']);
    
    // Create the directory if it doesn't exist
    const dirPath = await joinPath(['resources']);
    if (!(await fs.existsSync(dirPath))) {
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    // Write the settings to the file
    await fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    console.log('Todoist plugin settings registered successfully');
  } catch (error) {
    console.error('Failed to register Todoist plugin settings:', error);
  }
}

// Add task to Todoist
function addTask(content: string, dueString?: string, projectId?: string): Promise<any> {
  return core.invokePluginFunc(MODULE_PATH, "addTask", content, dueString, projectId);
}

// Get projects from Todoist
function getProjects(): Promise<any> {
  return core.invokePluginFunc(MODULE_PATH, "getProjects");
}

// Get active tasks
function getTasks(filter?: string, projectId?: string): Promise<any> {
  return core.invokePluginFunc(MODULE_PATH, "getTasks", filter, projectId);
}

// Complete a task
function completeTask(taskId: string): Promise<any> {
  return core.invokePluginFunc(MODULE_PATH, "completeTask", taskId);
}

// Initialize plugin by registering extension functions
export function init({ register }: { register: RegisterExtensionPoint }) {
  register(PluginService.OnStart, PLUGIN_NAME, onStart);
  
  // Register Todoist specific functions
  register("todoist:addTask", PLUGIN_NAME, addTask);
  register("todoist:getProjects", PLUGIN_NAME, getProjects);
  register("todoist:getTasks", PLUGIN_NAME, getTasks);
  register("todoist:completeTask", PLUGIN_NAME, completeTask);
}