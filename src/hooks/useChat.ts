import { useState, useCallback, useRef } from 'react';
import { db, doc, getDoc, setDoc, Timestamp } from '../lib/firebase';
import type { Message, ToolCall } from '../types';

export interface ChatState {
  messages: Message[];
  loading: boolean;
  isEndOfConversation: boolean;
}

export function useChat(apiKey: string | null, uid: string | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    isEndOfConversation: false,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveMemory = useCallback(async (fact: Record<string, unknown>) => {
    if (!uid) return;
    
    const userDocRef = doc(db, `users/${uid}`);
    const userDoc = await getDoc(userDocRef);
    const currentMemory = userDoc.data()?.memory || {};
    
    await setDoc(userDocRef, {
      memory: { ...currentMemory, ...fact },
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }, [uid]);

  const renderUI = useCallback((html: string) => {
    console.log('Render UI:', html);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey || state.loading || state.isEndOfConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      loading: true,
    }));

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const history = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history, apiKey }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }

          if (data.startsWith('[TOOL_CALL]')) {
            try {
              const toolCall = JSON.parse(data.slice(11));
              toolCalls.push(toolCall);
            } catch {
              // Skip invalid tool call
            }
            continue;
          }

          fullContent += data;
        }
      }

      const isEnd = fullContent.includes('[END_CONVERSATION]');
      const cleanContent = fullContent.replace(/\[END_CONVERSATION\]/g, '');

      for (const tool of toolCalls) {
        if (tool.name === 'save_memory') {
          try {
            const args = typeof tool.arguments === 'string'
              ? JSON.parse(tool.arguments)
              : tool.arguments;
            await saveMemory(args.fact || args);
          } catch (err) {
            console.error('save_memory error:', err);
          }
        } else if (tool.name === 'render_ui') {
          try {
            const args = typeof tool.arguments === 'string'
              ? JSON.parse(tool.arguments)
              : tool.arguments;
            renderUI(args.html);
          } catch (err) {
            console.error('render_ui error:', err);
          }
        }
      }

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: cleanContent, isTyping: false, isEndOfConversation: isEnd }
            : m
        ),
        loading: false,
        isEndOfConversation: isEnd,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: 'Error: Failed to get response', isTyping: false }
            : m
        ),
        loading: false,
      }));
    }
  }, [apiKey, state.messages, state.loading, state.isEndOfConversation, saveMemory, renderUI]);

  const clearChat = useCallback(() => {
    setState({ messages: [], loading: false, isEndOfConversation: false });
  }, []);

  return { ...state, sendMessage, clearChat };
}

export default useChat;