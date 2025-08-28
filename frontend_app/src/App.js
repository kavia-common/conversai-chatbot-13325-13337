import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { sendChatPrompt } from './services/perplexityClient';

// Simple message bubble component
function Message({ role, content }) {
  return (
    <div
      className={`message-row ${role === 'user' ? 'user' : 'assistant'}`}
      role="listitem"
      aria-label={role === 'user' ? 'User message' : 'Assistant message'}
    >
      <div className="avatar" aria-hidden="true">
        {role === 'user' ? '🧑' : '🤖'}
      </div>
      <div className="bubble">{content}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** This is the public App component that renders the chatbot UI and wires handlers. */
  const [theme, setTheme] = useState('light');
  const [messages, setMessages] = useState([
    { id: 'm1', role: 'assistant', content: 'Hi! I am your AI assistant. Ask me anything.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const listRef = useRef(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Auto scroll to bottom on new messages
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    // Add user message and placeholder assistant message for streaming
    const assistantId = `a-${Date.now() + 1}`;
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);

    let streamedText = '';

    try {
      await sendChatPrompt({
        prompt: trimmed,
        onStart: () => {},
        onToken: (token) => {
          streamedText += token;
          // Update the last assistant message with streamed content
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: streamedText } : m)));
        },
        onComplete: (finalText) => {
          setIsLoading(false);
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: finalText || streamedText } : m)));
        },
        onError: (err) => {
          setIsLoading(false);
          const errorText = `Error: ${err?.message || 'Failed to get response'}`;
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: errorText } : m)));
        },
      });
    } catch (e) {
      // error already handled in onError
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="App">
      <header className="chat-header">
        <div className="brand">
          <div className="dot" />
          <span>ConversAI</span>
        </div>
        <div className="header-actions">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="sidebar" aria-label="Sidebar for future features">
          <h3>Coming soon</h3>
          <ul>
            <li>Saved conversations</li>
            <li>Knowledge base</li>
            <li>Prompt templates</li>
          </ul>
        </aside>

        <main className="chat-main">
          <div className="messages" ref={listRef} role="list" aria-live="polite">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} content={m.content} />
            ))}
            {isLoading && (
              <div className="typing-indicator">
                <span className="dot-anim" />
                <span className="dot-anim" />
                <span className="dot-anim" />
              </div>
            )}
          </div>

          <div className="input-bar">
            <textarea
              aria-label="Type your message"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              title="Send"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
