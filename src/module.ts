/**
 * Main module for Todoist integration
 * Contains functions that run in the main process
 */

import axios from 'axios';
import { ipcMain } from 'electron';

// Settings key for Todoist API token
const API_TOKEN_KEY = 'todoist-api-token';

// Simple stub function for initConfigPath 
async function initConfigPath(): Promise<void> {
  console.log('Config path initialization (stub function)');
  return Promise.resolve();
}

// Get Todoist API token from Jan settings
async function getApiToken(): Promise<string | null> {
  try {
    return await this.getSetting(PLUGIN_NAME, API_TOKEN_KEY) as string;
  } catch (error) {
    console.error('Failed to get Todoist API token:', error);
    return null;
  }
}

// Save Todoist API token to Jan settings
async function saveApiToken(token: string): Promise<void> {
  try {
    await this.setSetting(PLUGIN_NAME, API_TOKEN_KEY, token);
    console.log('Todoist API token saved successfully');
  } catch (error) {
    console.error('Failed to save Todoist API token:', error);
    throw error;
  }
}

// Create axios instance with Todoist API configuration
async function createApiClient() {
  const token = await getApiToken();
  if (!token) {
    throw new Error('Todoist API token not found. Please set up your API token first.');
  }
  
  return axios.create({
    baseURL: 'https://api.todoist.com/rest/v2',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// Add a task to Todoist
async function addTask(content: string, dueString?: string, projectId?: string): Promise<any> {
  try {
    const api = await createApiClient();
    const taskData: any = { content };
    
    if (dueString) taskData.due_string = dueString;
    if (projectId) taskData.project_id = projectId;
    
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Failed to add task to Todoist:', error);
    throw error;
  }
}

// Get all projects from Todoist
async function getProjects(): Promise<any> {
  try {
    const api = await createApiClient();
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Failed to get projects from Todoist:', error);
    throw error;
  }
}

// Get tasks from Todoist
async function getTasks(filter?: string, projectId?: string): Promise<any> {
  try {
    const api = await createApiClient();
    let url = '/tasks';
    
    // Add query parameters if provided
    const params: any = {};
    if (filter) params.filter = filter;
    if (projectId) params.project_id = projectId;
    
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to get tasks from Todoist:', error);
    throw error;
  }
}

// Complete a task in Todoist
async function completeTask(taskId: string): Promise<boolean> {
  try {
    const api = await createApiClient();
    await api.post(`/tasks/${taskId}/close`);
    return true;
  } catch (error) {
    console.error('Failed to complete task in Todoist:', error);
    throw error;
  }
}

// Plugin initialization
function run(param: number): any {
  console.log(`Initializing Jan Todoist Plugin: ${param}`);
  
  // Register IPC handlers for Todoist API token management
  ipcMain.handle('todoist:setApiToken', async (event, token) => {
    try {
      await saveApiToken(token);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  
  ipcMain.handle('todoist:getApiToken', async () => {
    try {
      const token = await getApiToken();
      return { success: true, token };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  
  // Initialize config
  initConfigPath().catch(err => {
    console.error('Failed to initialize config path:', err);
  });
  
  return { success: true, message: 'Jan Todoist Plugin initialized successfully' };
}

module.exports = {
  run,
  addTask,
  getProjects,
  getTasks,
  completeTask
};