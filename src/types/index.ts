export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  memory: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  code: string;
  status: 'pending' | 'verified' | 'expired';
  uid: string | null;
  apiKey: string | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isEndOfConversation?: boolean;
}

export interface ChatHistory {
  messages: Message[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface OpenCodeResponse {
  id: string;
  choices: Array<{
    delta: {
      content: string;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
}

export interface SaveMemoryParams {
  fact: Record<string, unknown>;
}

export interface RenderUIParams {
  html: string;
}