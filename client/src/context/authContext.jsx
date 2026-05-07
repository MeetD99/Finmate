import axios from "axios"
import { createContext, useState, useEffect } from "react"

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "https://finmate-vnfb.onrender.com/api"

export const AuthContextProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );
    const [accessToken, setAccessToken] = useState(
        localStorage.getItem("accessToken") || null
    );

    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    if (accessToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }

    axios.interceptors.response.use(
        response => response,
        async error => {
            const originalRequest = error.config;
            
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                    const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
                        withCredentials: true
                    });
                    
                    const newAccessToken = res.data.access_token;
                    setAccessToken(newAccessToken);
                    localStorage.setItem("accessToken", newAccessToken);
                    
                    axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    return axios(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    logout();
                    return Promise.reject(refreshError);
                }
            }
            
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const handleUserUpdate = (event) => {
            setCurrentUser(event.detail);
        };
        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    const clearUserData = () => {
        localStorage.removeItem('finmateData');
        localStorage.removeItem('riskAppetiteData');
    };

    const login = async (inputs) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, inputs);
            
            clearUserData();
            
            setCurrentUser(res.data);
            
            const authHeader = res.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                setAccessToken(token);
                localStorage.setItem("accessToken", token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`, {}, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            clearUserData();
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            setAccessToken(null);
            delete axios.defaults.headers.common['Authorization'];
            setCurrentUser(null);
        }
    }

    const register = async (inputs) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, inputs);
            
            clearUserData();
            
            setCurrentUser(res.data);
            
            const authHeader = res.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                setAccessToken(token);
                localStorage.setItem("accessToken", token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            return res.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
        }
    }, [currentUser]);

    return(
        <AuthContext.Provider value={{currentUser, setCurrentUser, login, logout, register, accessToken}}>
            {children}
        </AuthContext.Provider>
    );
}