import { createContext, useState, useContext, useCallback } from 'react';
import { chatService } from '../services/chatService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      const history = await chatService.getHistory(20);
      const formattedMessages = [];
      
      // Reverse to show newest at bottom (oldest in array first)
      [...history].reverse().forEach(chat => {
        formattedMessages.push({ role: 'user', content: chat.query });
        formattedMessages.push({ role: 'assistant', content: chat.response });
      });
      
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load chat history');
    }
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    setMessages(prev => [...prev, { role: 'user', content }]);
    
    try {
      const response = await chatService.sendMessage(content);
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.response }
      ]);
      
      return response;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear messages:', err);
      setError('Failed to clear chat history');
    }
  }, []);

  const value = {
    messages,
    isLoading,
    error,
    sendMessage,
    loadHistory,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};