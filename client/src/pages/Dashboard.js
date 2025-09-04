import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Plus, CheckCircle, Clock, TrendingUp, Menu, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import { useAI } from '../contexts/AIContext';
import { TaskStatusChart, WeeklyProgressChart } from '../components/analytics/TaskChart';
import AIInsights from '../components/ai/AIInsights';
import AITaskPrioritization from '../components/ai/AITaskPrioritization';
import AITaskSuggestions from '../components/ai/AITaskSuggestions';
import LeftSidebar from '../components/common/LeftSidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats, tasks, isLoading } = useTask();
  const { projects, fetchProjects } = useProject();

  const [showAIInsightsExpanded, setShowAIInsightsExpanded] = useState(false);
  const [showAIPrioritizationExpanded, setShowAIPrioritizationExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAIPrioritization = async () => {
    try {
      setShowAIPrioritizationExpanded(true);
      // The prioritization will be fetched by the AIPrioritization component when it renders
    } catch (error) {
      // Handle error silently
    }
  };

  const handleAIInsightsExpansion = async () => {
    try {
      setShowAIInsightsExpanded(true);
      // The insights will be fetched by the AIInsights component when it renders
    } catch (error) {
      // Handle error silently
    }
  };

  // Calculate weekly progress from actual task data
  const calculateWeeklyProgress = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start from Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = weekDays.map((day, index) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Count tasks created on this day
      const created = tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= dayStart && createdDate < dayEnd;
      }).length;

      // Count tasks completed on this day
      // For completed tasks, we'll use updatedAt as completion date
      // This assumes tasks are updated when marked as completed
      const completed = tasks.filter(task => {
        if (task.status !== 'completed') return false;
        const updatedDate = new Date(task.updatedAt);
        return updatedDate >= dayStart && updatedDate < dayEnd;
      }).length;

      return { day, created, completed };
    });

    return weeklyData;
  };

  // Dashboard is global - fetch projects for general info
  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, fetchProjects]);

  return (
    <>
      <Helmet>
        <title>Dashboard | AI-Powered Task Management</title>
        <meta name="description" content="PIU - World's most advanced AI-powered task management dashboard" />
      </Helmet>

      <div className="min-h-screen w-full bg-white dark:bg-slate-800" style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0', left: '0', right: '0' }}>
        {/* Premium PIU Header */}
        <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="relative z-10 w-full px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center space-x-6">
                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 mr-4"
                >
                  <Menu className="w-6 h-6 text-white/80" />
                </button>
                
                {/* PIU Logo */}
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                    <span className="text-2xl font-black text-white">PIU</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-ping"></div>
                </div>
                
                                  <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">AI-Powered Task Management</p>
                  </div>
              </div>
              
              {/* Welcome Message */}
              <div className="flex items-center space-x-6">
                <span className="text-white/80 font-medium">
                  Welcome, {user?.firstName || user?.username || 'User'}!
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full py-8">
          {/* Premium PIU Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 px-8"
          >
            <div className="relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 rounded-3xl blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-5xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-6">
                  Welcome to PIU
                </h2>
                <p className="text-2xl text-slate-400 font-medium max-w-4xl mx-auto leading-relaxed">
                  Experience the future of task management with world-class AI insights, 
                  premium analytics, and unparalleled productivity tools.
                </p>
                
                {/* Premium Badge */}
                <div className="inline-flex items-center space-x-2 mt-6 px-6 py-3 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-purple-500/30 rounded-2xl">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-300">Premium Platform</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium PIU Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 px-8"
          >
            {/* Total Tasks Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-blue-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{stats?.total || 0}</h3>
                <p className="text-blue-400 font-semibold text-lg">Total Tasks</p>
                <div className="mt-6 w-full bg-slate-600/30 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats?.total || 0) / 10 * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>

            {/* In Progress Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-yellow-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-yellow-500/50 transition-all duration-500">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{stats?.inProgress || 0}</h3>
                <p className="text-yellow-400 font-semibold text-lg">In Progress</p>
                <div className="mt-6 w-full bg-slate-600/30 rounded-full h-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats?.inProgress || 0) / 10 * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>

            {/* Completed Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-green-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-green-500/50 transition-all duration-500">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{stats?.completed || 0}</h3>
                <p className="text-green-400 font-semibold text-lg">Completed</p>
                <div className="mt-6 w-full bg-slate-600/30 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((stats?.completed || 0) / 10 * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>

            {/* Productivity Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-500">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white mb-2">{stats?.productivity || 0}%</h3>
                <p className="text-purple-400 font-semibold text-lg">Productivity</p>
                <div className="mt-6 w-full bg-slate-600/30 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${stats?.productivity || 0}%` }}></div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Premium PIU Create Task Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl mx-8 hover:shadow-blue-500/25 transition-all duration-500"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-6">
                  <Plus className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  Create New Task
                </h3>
                <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">
                  Transform your ideas into actionable tasks with PIU's intuitive creation system
                </p>
              </div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/tasks/create')}
                className="group w-full py-4 px-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transform transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-3 border border-blue-400/30 hover:border-blue-400/50"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create New Task</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </motion.button>
            </div>
          </motion.div>

          {/* Premium PIU Analytics Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 px-8"
          >
            {/* Task Status Distribution Chart */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Task Status Distribution
                  </h3>
                </div>
                {stats ? (
                  <TaskStatusChart stats={stats} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                      <p className="text-slate-300">Loading task statistics...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Weekly Progress Chart */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Weekly Progress
                  </h3>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                      <p className="text-slate-400">Loading weekly progress...</p>
                    </div>
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <WeeklyProgressChart weeklyData={calculateWeeklyProgress()} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-300">No tasks available for weekly progress</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Premium PIU AI Task Suggestions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl mx-8 mt-8 hover:shadow-pink-500/25 transition-all duration-500"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-rose-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-2xl mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  AI Task Suggestions
                </h3>
                <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">
                  Discover intelligent task ideas powered by PIU's advanced AI algorithms
                </p>
              </div>

              {/* AI Task Suggestions Component */}
              <AITaskSuggestions />
            </div>
          </motion.div>

          {/* Premium PIU AI Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl mx-8 mt-8 hover:shadow-blue-500/25 transition-all duration-500"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  AI Productivity Insights
                </h3>
                <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">
                  Unlock your productivity potential with PIU's advanced AI analysis
                </p>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAIInsightsExpansion}
                className="group w-full py-4 px-8 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transform transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-3 border border-blue-400/30 hover:border-blue-400/50"
              >
                <Brain className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span>Get AI Productivity Insights</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </motion.button>

              {/* Expanded AI Insights Content */}
              {showAIInsightsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 pt-8 border-t border-slate-600/50"
                >
                  <AIInsights onClose={() => setShowAIInsightsExpanded(false)} />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Premium PIU AI Task Prioritization Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl mx-8 mt-8 hover:shadow-emerald-500/25 transition-all duration-500"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl mb-6">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  AI Task Prioritization
                </h3>
                <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">
                  Let PIU's AI optimize your task order for maximum productivity
                </p>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAIPrioritization}
                className="group w-full py-4 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/25 transform transition-all duration-300 font-semibold text-lg flex items-center justify-center space-x-3 border border-emerald-400/30 hover:border-emerald-400/50"
              >
                <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span>Prioritize Tasks with AI</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </motion.button>

              {/* Expanded AI Prioritization Content */}
              {showAIPrioritizationExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 pt-8 border-t border-slate-600/50"
                >
                  <AITaskPrioritization onClose={() => setShowAIPrioritizationExpanded(false)} />
                </motion.div>
              )}
            </div>
          </motion.div>


        </main>

        {/* Left Sidebar */}
        <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* AI Insights Modal - No longer needed since it's inline */}
      </div>
    </>
  );
};

export default Dashboard;