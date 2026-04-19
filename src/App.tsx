import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, LogOut, Trash2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SyncStatus } from './components/SyncStatus';
import { useAuth, useApiKey } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { auth, signOut } from './lib/firebase';

export function App() {
  const { user, loading } = useAuth();
  const { apiKey, saveApiKey } = useApiKey();
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'disconnected'>('disconnected');
  const { messages, loading: chatLoading, isEndOfConversation, sendMessage, clearChat } = useChat(apiKey, user?.uid || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey) {
      setSyncStatus('connected');
    } else {
      setSyncStatus('disconnected');
    }
  }, [apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!apiKey) {
      console.error('No API key');
      return;
    }
    await sendMessage(content);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('cipher_api_key');
    clearChat();
  };

  const handleClear = () => {
    clearChat();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cipher-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-cipher-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-cipher-card border border-cipher-border rounded-lg p-8 text-center">
          <Bot className="w-12 h-12 text-cipher-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-mono text-white mb-2">Cipher</h1>
          <p className="text-cipher-muted font-mono text-sm mb-4">Neural Synthesis</p>
          <p className="text-cipher-muted font-mono text-xs">
            No API key found. Please sign in via CLI or enter your API key manually.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cipher-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-cipher-dark border-b border-cipher-border">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-cipher-accent" />
          <h1 className="text-lg font-bold font-mono text-white">Cipher</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <SyncStatus status={syncStatus} showLabel />
          
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
            )}
          </div>
          
          <button
            onClick={handleClear}
            className="p-2 text-cipher-muted hover:text-white transition-colors"
            title="Clear chat"
          >
            <Trash2 size={18} />
          </button>
          
          <button
            onClick={handleSignOut}
            className="p-2 text-cipher-muted hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      
      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Bot className="w-16 h-16 text-cipher-border mx-auto mb-4" />
              <h2 className="text-xl font-semibold font-mono text-white mb-2">
                Neural Synthesis
              </h2>
              <p className="text-cipher-muted font-mono text-sm">
                Start a conversation with Cipher
              </p>
            </motion.div>
          )}
          
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      {/* Input */}
      <footer className="border-t border-cipher-border">
        <ChatInput
          onSend={handleSend}
          disabled={isEndOfConversation}
          loading={chatLoading}
        />
      </footer>
    </div>
  );
}

export default App;