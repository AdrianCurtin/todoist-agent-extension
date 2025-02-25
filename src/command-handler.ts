/**
 * Handles command parsing and execution for Todoist integration
 */

import { TodoistService } from './todoist-service';
import { executeOnMain } from '@janhq/core';

export class CommandHandler {
  /**
   * Process a command string and execute the corresponding action
   */
  static async processCommand(command: string): Promise<string> {
    // Trim the command and remove the "/todoist " prefix
    const trimmedCommand = command.trim().replace(/^\/todoist\s+/i, '').trim();
    
    // Handle empty command (just "/todoist")
    if (!trimmedCommand) {
      return this.getHelpText();
    }
    
    // Split into command parts
    const parts = trimmedCommand.split(/\s+/);
    const action = parts[0].toLowerCase();
    
    try {
      switch (action) {
        case 'add':
        case 'task':
          return await this.handleAddTask(parts.slice(1).join(' '));
        
        case 'projects':
        case 'project':
        case 'list-projects':
          return await this.handleListProjects();
        
        case 'tasks':
        case 'list-tasks':
        case 'list':
          return await this.handleListTasks(parts.slice(1).join(' '));
        
        case 'complete':
        case 'done':
          return await this.handleCompleteTask(parts[1]);
        
        case 'help':
          return this.getHelpText();
        
        case 'status':
          return await this.handleStatus();
        
        default:
          return `Unknown command: ${action}\n\n${this.getHelpText()}`;
      }
    } catch (error) {
      return `Error: ${error.message || 'Something went wrong'}`;
    }
  }
  
  /**
   * Handle checking the status of the Todoist connection
   */
  private static async handleStatus(): Promise<string> {
    try {
      // Try to fetch projects as a test of the connection
      await executeOnMain(MODULE_PATH, "getProjects");
      return "✅ Todoist connection is working! Your API token is valid.";
    } catch (error) {
      let errorMessage = error.message || '';
      
      if (errorMessage.includes('API token not found') || errorMessage.includes('401')) {
        return "❌ API token is missing or invalid. Please set your Todoist API token in Jan Settings > Extensions > Todoist.";
      }
      
      return `❌ Todoist connection error: ${errorMessage}. Please check your internet connection and API token.`;
    }
  }
  
  /**
   * Handle adding a new task
   */
  private static async handleAddTask(taskInput: string): Promise<string> {
    if (!taskInput) {
      return 'Error: Task content is required';
    }
    
    // Parse the task input to extract components
    const { content, dueString, projectName } = TodoistService.parseTaskInput(taskInput);
    
    let projectId: string | undefined;
    
    // If project name is provided, find its ID
    if (projectName) {
      try {
        const projects = await executeOnMain(MODULE_PATH, "getProjects");
        const project = projects.find(p => 
          p.name.toLowerCase() === projectName.toLowerCase()
        );
        
        if (project) {
          projectId = project.id;
        } else {
          return `Error: Project "${projectName}" not found`;
        }
      } catch (error) {
        return `Error fetching projects: ${error.message}`;
      }
    }
    
    try {
      const task = await executeOnMain(MODULE_PATH,
        "addTask", 
        content, 
        dueString, 
        projectId
      );
      
      return `Task added successfully!\n\n${TodoistService.formatTask(task)}`;
    } catch (error) {
      return `Error adding task: ${error.message}`;
    }
  }
  
  /**
   * Handle listing all projects
   */
  private static async handleListProjects(): Promise<string> {
    try {
      const projects = await executeOnMain(MODULE_PATH, "getProjects");
      
      if (!projects || projects.length === 0) {
        return 'No projects found';
      }
      
      let response = '📋 Your Todoist Projects:\n\n';
      
      projects.forEach((project: any) => {
        const star = project.is_favorite ? '⭐ ' : '';
        response += `${star}${project.name} (ID: ${project.id})\n`;
      });
      
      return response;
    } catch (error) {
      return `Error fetching projects: ${error.message}`;
    }
  }
  
  /**
   * Handle listing tasks with optional filter
   */
  private static async handleListTasks(filter: string): Promise<string> {
    try {
      // Check if user specified a project ID using project:X format
      let projectId: string | undefined;
      const projectMatch = filter.match(/project:(\w+)/i);
      
      if (projectMatch) {
        // Remove the project filter from the filter string
        filter = filter.replace(projectMatch[0], '').trim();
        
        // Try to find the project by name
        const projects = await executeOnMain(MODULE_PATH, "getProjects");
        const project = projects.find((p: any) => 
          p.name.toLowerCase() === projectMatch[1].toLowerCase()
        );
        
        if (project) {
          projectId = project.id;
        } else {
          return `Error: Project "${projectMatch[1]}" not found`;
        }
      }
      
      const tasks = await executeOnMain(MODULE_PATH, "getTasks", filter, projectId);
      
      if (!tasks || tasks.length === 0) {
        return 'No tasks found matching your criteria';
      }
      
      let response = `📋 Your Todoist Tasks ${filter ? `(Filter: ${filter})` : ''}:\n\n`;
      
      tasks.forEach((task: any) => {
        response += `ID: ${task.id}\n`;
        response += TodoistService.formatTask(task);
        response += '---\n';
      });
      
      return response;
    } catch (error) {
      return `Error fetching tasks: ${error.message}`;
    }
  }
  
  /**
   * Handle completing a task
   */
  private static async handleCompleteTask(taskId: string): Promise<string> {
    if (!taskId) {
      return 'Error: Task ID is required';
    }
    
    try {
      const result = await executeOnMain(MODULE_PATH, "completeTask", taskId);
      
      if (result) {
        return `✅ Task ${taskId} marked as complete!`;
      } else {
        return `Error: Failed to complete task ${taskId}`;
      }
    } catch (error) {
      return `Error completing task: ${error.message}`;
    }
  }
  
  /**
   * Get help text for the plugin
   */
  private static getHelpText(): string {
    return `
📚 Jan Todoist Plugin Help

Available commands:

✏️ Add Tasks:
  /todoist add Buy milk tomorrow
  /todoist add Finish report by Friday in Work

📋 View Tasks:
  /todoist tasks
  /todoist tasks today
  /todoist tasks project:Work

📂 View Projects:
  /todoist projects

✅ Complete Tasks:
  /todoist complete TASK_ID

🔍 Check Status:
  /todoist status

❓ Get Help:
  /todoist help

⚙️ Configure:
  Set your API token in Jan Settings > Extensions > Todoist
`.trim();
  }
}