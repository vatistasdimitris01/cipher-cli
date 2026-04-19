import type { Message, OpenCodeResponse, ToolCall } from '../types';

const OPENCODE_API_URL = 'https://opencode.ai/zen/v1';

export const sendChatMessage = async (
  message: string,
  history: Message[],
  apiKey: string
): Promise<ReadableStream<Uint8Array> | null> => {
  const messages = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: 'user', content: message });

  const response = await fetch(`${OPENCODE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'opencode/zen',
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.body as unknown as ReadableStream<Uint8Array> | null;
};

export const parseStreamResponse = async (
  stream: ReadableStream<Uint8Array>,
  onChunk: (content: string, toolCalls?: ToolCall[]) => void,
  onEnd: () => void
): Promise<void> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let toolCalls: ToolCall[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onEnd();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        const data = line.slice(6);
        if (data === '[DONE]') {
          onEnd();
          return;
        }

        try {
          const parsed: OpenCodeResponse = JSON.parse(data);
          const choice = parsed.choices?.[0];
          
          if (choice?.delta?.content) {
            onChunk(choice.delta.content, choice.delta.tool_calls);
          }
          
          if (choice?.delta?.tool_calls) {
            toolCalls = [...toolCalls, ...choice.delta.tool_calls];
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const parseToolCalls = (toolCalls: ToolCall[]): Record<string, unknown> => {
  const tools: Record<string, unknown> = {};
  
  for (const tool of toolCalls) {
    try {
      const args = typeof tool.arguments === 'string' 
        ? JSON.parse(tool.arguments) 
        : tool.arguments;
      tools[tool.name] = args;
    } catch {
      // Skip invalid tool call
    }
  }
  
  return tools;
};

export const detectEndConversation = (content: string): boolean => {
  return content.includes('[END_CONVERSATION]');
};

export const extractContentWithoutEndMarker = (content: string): string => {
  return content.replace(/\[END_CONVERSATION\]/g, '').trim();
};