import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Bot, User } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-cipher-card rounded text-sm font-mono text-cipher-accent">
      {children}
    </code>
  );
}

function CodeBlock({ code, language = 'javascript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-md overflow-hidden my-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-cipher-card hover:bg-cipher-border z-10"
        aria-label="Copy code"
      >
        {copied ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <Copy size={14} className="text-cipher-muted" />
        )}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#1F1F1F',
          fontSize: '13px',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isEndOfConversation = message.isEndOfConversation || message.content.includes('[END_CONVERSATION]');
  
  const content = message.content.replace(/\[END_CONVERSATION\]/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-cipher-accent flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-cipher-card flex items-center justify-center">
            <Bot size={16} className="text-cipher-muted" />
          </div>
        )}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="text-xs text-cipher-muted mb-1 font-mono">
          {isUser ? 'You' : 'Cipher'}
        </div>
        
        <div
          className={`px-4 py-3 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-wrap
            ${isUser 
              ? 'bg-cipher-accent text-white' 
              : 'bg-cipher-card text-cipher-black border border-cipher-border'
            }
            ${message.isTyping ? 'animate-pulse' : ''}
          `}
        >
          {message.isTyping ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-cipher-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-cipher-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cipher-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <ReactMarkdown
              components={{
                code({ className, children }: { className?: string; children?: React.ReactNode }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return <InlineCode>{children}</InlineCode>;
                  }
                  
                  return (
                    <CodeBlock
                      code={String(children).replace(/\n$/, '')}
                      language={match[1]}
                    />
                  );
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li>{children}</li>;
                },
                a({ href, children }) {
                  return (
                    <a 
                      href={href} 
                      className="text-cipher-accent hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                strong({ children }) {
                  return <strong className="font-semibold">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic">{children}</em>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-semibold mb-1">{children}</h3>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
        
        {isEndOfConversation && !isUser && (
          <div className="mt-2 px-3 py-2 bg-cipher-dark border border-cipher-border rounded text-xs text-cipher-muted font-mono">
            [END_CONVERSATION] — This conversation has ended.
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChatMessage;