export const API_BASE = 'http://localhost:8080/api';

export const chatService = {
  async sendMessage(query) {
    const response = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  },
  
  async getHistory(limit = 20) {
    const response = await fetch(`${API_BASE}/chat/history?limit=${limit}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    
    return response.json();
  },
  
  async clearHistory() {
    const response = await fetch(`${API_BASE}/chat/clear`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear history');
    }
    
    return response.json();
  }
};