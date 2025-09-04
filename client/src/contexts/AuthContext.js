import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Get the server URL from environment variables
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${SERVER_URL}/api/auth/me`);
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // console.error('Auth check failed:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/auth/login`, { email, password });
      
      const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      setUser(user);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true, user };
    } catch (error) {
      // console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/auth/register`, userData);
      
      const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      setUser(user);
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return { success: true, user };
    } catch (error) {
      // console.error('Registration failed:', error);
      
      // Handle validation errors specifically
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => `${err.path}: ${err.msg}`).join(', ');
        const customError = new Error(`Validation failed: ${errorMessages}`);
        customError.validationErrors = validationErrors;
        throw customError;
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (redirectTo = '/') => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to specified page after logout
    window.location.href = redirectTo;
  };

  const refreshAuth = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${SERVER_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return true;
    } catch (error) {
      // console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await axios.put(`${SERVER_URL}/api/auth/me`, updates);
      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      // console.error('Profile update failed:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/change-password`, { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      // console.error('Password change failed:', error);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/forgot-password`, { email });
      return { success: true };
    } catch (error) {
      // console.error('Password reset request failed:', error);
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/reset-password`, { token, password });
      return { success: true };
    } catch (error) {
      // console.error('Password reset failed:', error);
      throw error;
    }
  };

  const verifyEmail = async (token) => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/verify-email`, { token });
      if (user) {
        setUser({ ...user, isEmailVerified: true });
      }
      return { success: true };
    } catch (error) {
      // console.error('Email verification failed:', error);
      throw error;
    }
  };

  const resendVerification = async (email) => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/resend-verification`, { email });
      return { success: true };
    } catch (error) {
      // console.error('Verification resend failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
