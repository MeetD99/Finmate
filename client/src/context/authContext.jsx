import axios from "axios"
import { createContext, useState, useEffect } from "react"

export const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(
        JSON.parse(localStorage.getItem("user") ) || null
    );

    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    // Listen for user updates from other components
    useEffect(() => {
        const handleUserUpdate = (event) => {
            setCurrentUser(event.detail);
        };
        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    // Function to clear user-specific data from localStorage
    const clearUserData = () => {
        localStorage.removeItem('finmateData');
        localStorage.removeItem('riskAppetiteData');
    };

    const login = async (inputs) => {
        try {
            const res = await axios.post("http://localhost:8080/api/auth/login", inputs);
            
            // Clear any existing user data before setting new user
            clearUserData();
            
            setCurrentUser(res.data);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await axios.post("http://localhost:8080/api/auth/logout");
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            clearUserData();
            localStorage.removeItem("user");
            setCurrentUser(null);
        }
    }

    useEffect(()=>{
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
        }
    }, [currentUser]);

    return(
        <AuthContext.Provider value={{currentUser, setCurrentUser, login, logout, clearUserData}}>
            {children}
        </AuthContext.Provider>
    );
}