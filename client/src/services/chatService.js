export const API_BASE = 'https://finmate-vnfb.onrender.com/api';

export const chatService = {
  async sendMessage(query) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  },
  
  async getHistory(limit = 20) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/chat/history?limit=${limit}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    
    return response.json();
  },
  
  async clearHistory() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/chat/clear`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear history');
    }
    
    return response.json();
  }
};