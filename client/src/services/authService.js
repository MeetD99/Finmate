import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://finmate-vnfb.onrender.com/api";

export const authService = {
  // Login user and store token
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Set axios default headers for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user and remove token
  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Optionally call backend logout endpoint
    return axios.post(`${API_BASE_URL}/auth/logout`);
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  }
};