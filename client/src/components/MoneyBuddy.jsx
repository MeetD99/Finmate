import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { FaExpand} from 'react-icons/fa'

const MoneyBuddy = ({ compact = true }) => {
  const { 
    messages, 
    isLoading, 
    sendMessage,
    loadHistory
  } = useChat();
  
  const [input, setInput] = useState('');
  const [showFull, setShowFull] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevMessageCount = useRef(0);
  const isInitialized = useRef(false);

  useEffect(() => {
    loadHistory().then(() => {
      isInitialized.current = true;
    });
  }, []);

  // Scroll ONLY the chat container, not the page
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom only after initial load AND when new message is added
  useEffect(() => {
    if (isInitialized.current && messages.length > prevMessageCount.current && messages.length > 0) {
      setTimeout(scrollToBottom, 50);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    
    await sendMessage(message);
  };

  const getWelcomeMessage = () => {
    return "Namaste! I'm MulyaAI, your AI financial advisor. Ask me anything about investing, budgeting, taxes, or financial planning - I'm here to help!";
  };

  return (
    <>
      {/* Main Component */}
      <div className={`w-full bg-fin-surface rounded-fin-lg p-4 sm:p-5 fin-shadow-sm border border-fin-outline-variant flex flex-col ${compact && !showFull ? 'max-h-[300px]' : 'h-[500px] lg:h-[600px]'}`}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h3 className="text-sm font-semibold text-fin-text-main">
            MulyaAI
          </h3>
          
          {messages.length > 0 && (
            <button
              onClick={loadHistory}
              className="ml-auto text-xs text-fin-text-variant hover:text-fin-primary"
            >
              Refresh
            </button>
          )}
          <button
            onClick={() => setShowFull(true)}
            className="p-1 hover:bg-fin-surface-low rounded transition-colors"
            title="Expand"
          >
            <FaExpand size={15}/>
          </button>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-3 space-y-3 pr-2 card-scrollbar min-h-0"
        >
          {messages.length === 0 ? (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div className="bg-fin-surface-low p-3 text-xs sm:text-sm text-fin-text-main leading-relaxed border border-fin-outline-variant/30 rounded-lg">
                {getWelcomeMessage()}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' ? (
                  <div className="w-6 h-6 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-fin-surface-low flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-fin-text-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                )}
                <div className={`p-2.5 text-xs sm:text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-fin-primary text-white rounded-lg' 
                    : 'bg-fin-surface-low text-fin-text-main border border-fin-outline-variant/30 rounded-lg'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-fin-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div className="bg-fin-surface-low p-3 rounded-lg border border-fin-outline-variant/30">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about investments, taxes, budgeting..."
            className="flex-1 px-3 py-2 border border-fin-outline-variant text-sm focus:outline-none focus:ring-1 focus:ring-fin-primary/50 rounded-fin-md"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 text-sm font-medium rounded-fin-md transition-colors ${
              isLoading || !input.trim() 
                ? 'bg-gray-200 text-fin-text-variant cursor-not-allowed' 
                : 'bg-fin-primary text-white hover:bg-fin-primary-container'
            }`}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Modal Overlay */}
      {showFull && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-fin-surface rounded-fin-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-fin-outline-variant">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <h3 className="text-base font-semibold text-fin-text-main">MulyaAI</h3>
              </div>
              <button
                onClick={() => setShowFull(false)}
                className="p-2 hover:bg-fin-surface-low rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-fin-text-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div 
              ref={(el) => { 
                if (chatContainerRef.current && el) {
                  chatContainerRef.current = el.querySelector('.chat-messages');
                }
              }}
              className="chat-messages flex-1 overflow-y-auto p-4 space-y-3 card-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div className="bg-fin-surface-low p-4 text-sm text-fin-text-main leading-relaxed border border-fin-outline-variant/30 rounded-lg">
                    {getWelcomeMessage()}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-fin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-fin-surface-low flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-fin-text-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    )}
                    <div className={`p-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-fin-primary text-white rounded-lg' 
                        : 'bg-fin-surface-low text-fin-text-main border border-fin-outline-variant/30 rounded-lg'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-fin-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-fin-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div className="bg-fin-surface-low p-3 rounded-lg border border-fin-outline-variant/30">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.15s]"></div>
                      <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce [animation-delay:0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-fin-outline-variant flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about investments, taxes, budgeting..."
                className="flex-1 px-4 py-3 border border-fin-outline-variant text-sm focus:outline-none focus:ring-1 focus:ring-fin-primary/50 rounded-fin-md"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`px-5 py-3 text-sm font-medium rounded-fin-md transition-colors ${
                  isLoading || !input.trim() 
                    ? 'bg-gray-200 text-fin-text-variant cursor-not-allowed' 
                    : 'bg-fin-primary text-white hover:bg-fin-primary-container'
                }`}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MoneyBuddy;