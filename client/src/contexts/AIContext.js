import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const AIContext = createContext();

// Get the server URL from environment variables
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Get AI task prioritization
  const prioritizeTasks = async (preferences = {}) => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/ai/prioritize`, 
        { preferences },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      
      if (result.aiPowered) {
        toast.success('🤖 AI prioritization complete!');
      } else {
        toast.success('✨ Prioritization completed with fallback methods');
      }

      return result.data;
    } catch (error) {
      toast.error('Failed to get AI prioritization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get AI task suggestions
  const getTaskSuggestions = async (userContext = {}) => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/ai/suggestions`, 
        userContext,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      setSuggestions(result.data.suggestions || []);
      
      if (result.aiPowered) {
        toast.success('🤖 AI suggestions generated!');
      } else {
        toast.success('✨ Suggestions generated with fallback methods');
      }

      return result.data;
    } catch (error) {
       toast.error('Failed to get AI suggestions');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get AI productivity insights
  const getProductivityInsights = async () => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${SERVER_URL}/api/ai/insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;
      
      // Check if the response is valid
      if (!result.success) {
        throw new Error(result.message || 'Failed to get insights');
      }
      
      if (!result.data) {
        throw new Error('No insights data received');
      }
      
      setInsights(result.data);
      
      if (result.aiPowered) {
        toast.success('🤖 AI insights generated!');
      } else {
        toast.success('✨ Insights generated with fallback analysis');
      }

      return result.data;
    } catch (error) {
      console.error('AI insights error:', error);
      toast.error(`Failed to get AI insights: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Optimize task with AI
  const optimizeTask = async (title, description = '') => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/ai/optimize-task`, 
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      
      if (result.success && result.data) {
        // Check if it's AI-powered or fallback
        const isAIPowered = result.data.optimizedDescription && result.data.optimizedDescription.length > 100;
        
        if (isAIPowered) {
          toast.success('🤖 Task optimized by AI!');
        } else {
          toast.success('✨ Task enhanced with fallback methods');
        }

        return result.data;
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      toast.error('Failed to optimize task');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get smart schedule suggestions
  const getSmartSchedule = async () => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${SERVER_URL}/api/ai/smart-schedule`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      
      if (result.aiPowered) {
        toast.success('🤖 Smart schedule generated!');
      }

      return result.data;
    } catch (error) {
      toast.error('Failed to generate smart schedule');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear AI data
  const clearAIData = () => {
    setInsights(null);
    setSuggestions([]);
  };

  const value = {
    isLoading,
    insights,
    suggestions,
    prioritizeTasks,
    getTaskSuggestions,
    getProductivityInsights,
    optimizeTask,
    getSmartSchedule,
    clearAIData
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export default AIProvider;
