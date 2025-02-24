/**
 * Provides a service interface for interacting with Todoist API
 */

export interface TodoistTask {
  id: string;
  content: string;
  project_id?: string;
  description?: string;
  due?: {
    date: string;
    string: string;
    recurring: boolean;
  };
  priority?: number;
  url?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color?: string;
  is_favorite?: boolean;
}

export class TodoistService {
  /**
   * Formats a task object for display
   */
  static formatTask(task: TodoistTask): string {
    let formatted = `📝 Task: ${task.content}\n`;
    
    if (task.description) {
      formatted += `📄 Description: ${task.description}\n`;
    }
    
    if (task.due) {
      formatted += `📅 Due: ${task.due.string || task.due.date}\n`;
      if (task.due.recurring) {
        formatted += `🔁 Recurring\n`;
      }
    }
    
    if (task.priority) {
      // Todoist priority is 1 (normal) to 4 (urgent)
      const priorities = ['', 'Low', 'Medium', 'High', 'Urgent'];
      formatted += `⚠️ Priority: ${priorities[task.priority]}\n`;
    }
    
    if (task.url) {
      formatted += `🔗 Link: ${task.url}\n`;
    }
    
    return formatted;
  }
  
  /**
   * Parses a natural language input to extract task components
   * Very basic implementation - can be enhanced
   */
  static parseTaskInput(input: string): {
    content: string;
    dueString?: string;
    projectName?: string;
  } {
    // Simple regex patterns to extract components
    const dueMatch = input.match(/\b(today|tomorrow|next week|on\s+\w+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i);
    const projectMatch = input.match(/\bin\s+([^,]+?)(?:,|\s*$)/i);
    
    // Extract the components
    const dueString = dueMatch ? dueMatch[1] : undefined;
    const projectName = projectMatch ? projectMatch[1].trim() : undefined;
    
    // Remove the extracted parts from the content
    let content = input;
    if (dueMatch) {
      content = content.replace(dueMatch[0], '');
    }
    if (projectMatch) {
      content = content.replace(projectMatch[0], '');
    }
    
    // Clean up the content
    content = content.trim().replace(/\s{2,}/g, ' ');
    
    return {
      content,
      dueString,
      projectName
    };
  }
}