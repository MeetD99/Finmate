import axios from "axios"
import { createContext, useState, useEffect } from "react"
import { authService } from "../services/authService"

export const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set axios defaults
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    // Listen for user updates from other components
    useEffect(() => {
        const handleUserUpdate = (event) => {
            setCurrentUser(event.detail);
        };
        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    // Check for token on app load and set axios headers
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Set axios default header for authenticated requests
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Fetch user info
                    const userData = await authService.getCurrentUser();
                    setCurrentUser(userData);
                }
            } catch (error) {
                // Token might be invalid or expired
                console.log('No valid token found:', error.message);
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Function to clear user-specific data from localStorage
    const clearUserData = () => {
        localStorage.removeItem('finmateData');
        localStorage.removeItem('riskAppetiteData');
    };

    const login = async (inputs) => {
        try {
            const res = await authService.login(inputs);
            
            // Clear any existing user data before setting new user
            clearUserData();
            
            setCurrentUser(res);
            
            return res;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearUserData();
            localStorage.removeItem("user");
            setCurrentUser(null);
            
            // Clear axios auth header
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    useEffect(()=>{
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
        }
    }, [currentUser]);

    return(
        <AuthContext.Provider value={{currentUser, setCurrentUser, login, logout, clearUserData, loading}}>
            {children}
        </AuthContext.Provider>
    );
}