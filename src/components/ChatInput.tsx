import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ChatInput({ onSend, disabled = false, loading = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || disabled || loading) return;
    onSend(message.trim());
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="flex items-end gap-2 p-4 bg-cipher-dark border-t border-cipher-border">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled || loading}
          rows={1}
          className="w-full px-4 py-3 bg-cipher-card border border-cipher-border rounded-lg resize-none font-mono text-sm
            placeholder:text-cipher-muted text-cipher-black
            focus:outline-none focus:border-cipher-accent transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
          />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled || loading}
        className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-cipher-accent text-white
          hover:bg-cipher-accent-hover transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Send size={20} />
        )}
      </button>
      
      <div className="absolute bottom-full right-4 text-xs text-cipher-muted font-mono">
        ⌘ + Enter to send
      </div>
    </div>
  );
}

export default ChatInput;