/**
 * Listener for Jan messages to intercept Todoist commands
 */

import { events, Assistant, Thread } from '@janhq/core';
import { CommandHandler } from './command-handler';

export class MessageListener {
  private static instance: MessageListener;
  private initialized = false;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MessageListener {
    if (!MessageListener.instance) {
      MessageListener.instance = new MessageListener();
    }
    return MessageListener.instance;
  }
  
  /**
   * Initialize the message listener
   */
  public init(): void {
    if (this.initialized) return;
    
    // Listen for message events
    events.on('message:beforeSend', this.onBeforeMessageSend.bind(this));
    
    this.initialized = true;
    console.log('Todoist message listener initialized');
  }
  
  /**
   * Handle message before it is sent to the model
   */
  private async onBeforeMessageSend(event: any): Promise<void> {
    if (!event || !event.message || !event.message.content) return;
    
    const content = event.message.content;
    const threadId = event.threadId;
    
    // Check if the message starts with Todoist command
    if (typeof content === 'string' && content.trim().toLowerCase().startsWith('/todoist')) {
      // Prevent the message from going to the AI model
      event.preventDefault();
      
      // Process the command
      try {
        const response = await CommandHandler.processCommand(content);
        
        // Send the response as an assistant message
        await this.sendAssistantResponse(threadId, response);
      } catch (error) {
        // Send error message
        const errorMessage = `Error processing Todoist command: ${error.message || 'Unknown error'}`;
        await this.sendAssistantResponse(threadId, errorMessage);
      }
    }
  }
  
  /**
   * Send an assistant response message in the thread
   */
  private async sendAssistantResponse(threadId: string, content: string): Promise<void> {
    try {
      // Find the assistant for this thread
      const thread = await this.getThread(threadId);
      if (!thread || !thread.id) {
        console.error('Thread or assistant ID not found');
        return;
      }
      
      const assistant = await this.getAssistant(thread.id);
      if (!assistant) {
        console.error('Assistant not found');
        return;
      }
      
      // Create the assistant message
      const message = {
        threadId,
        assistant,
        content,
        role: 'assistant',
        model: assistant.model,
      };
      
      // Send the message
      events.emit('message:received', message);
    } catch (error) {
      console.error('Failed to send assistant response:', error);
    }
  }
  
  /**
   * Get a thread by ID
   */
  private async getThread(threadId: string): Promise<Thread | null> {
    try {
      return await core.getThread(threadId);
    } catch (error) {
      console.error('Failed to get thread:', error);
      return null;
    }
  }
  
  /**
   * Get an assistant by ID
   */
  private async getAssistant(assistantId: string): Promise<Assistant | null> {
    try {
      const assistants = await core.getAssistants();
      return assistants.find(a => a.id === assistantId) || null;
    } catch (error) {
      console.error('Failed to get assistant:', error);
      return null;
    }
  }
}