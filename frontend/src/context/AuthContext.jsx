/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/api/user/me');
            if (response.data?.user) {
                setUser(response.data.user);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const response = await api.post('/api/auth/login', credentials);
        if (response.data?.user) {
            setUser(response.data.user);
        }
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/api/auth/register', userData);
        if (response.data?.user) {
            setUser(response.data.user);
        }
        return response.data;
    };

    const googleLogin = async (idToken) => {
        const response = await api.post('/api/auth/google-login', { idToken });
        if (response.data?.user) {
            setUser(response.data.user);
        }
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
        }
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const value = {
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
