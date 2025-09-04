import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  CheckSquare, Plus, Calendar, Clock, MoreVertical, Edit, Trash2, X, Eye, Menu,
  Filter, Search, SortAsc, SortDesc, Grid, List, Star, AlertTriangle, 
  TrendingUp, Users, Target, Zap, Sparkles, Brain, BarChart3, 
  ChevronDown, ChevronRight, Play, Pause, RotateCcw, Archive
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import LeftSidebar from '../components/common/LeftSidebar';

const Tasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { tasks, updateTask, deleteTask, isLoading } = useTask();
  const { projects, fetchProjects } = useProject();
  const { logout } = useAuth();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedHours: '',
    tags: ''
  });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Enhanced UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [expandedSections, setExpandedSections] = useState({
    todo: true,
    in_progress: true,
    review: true,
    testing: true,
    completed: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  // Get project ID from URL parameters
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    } else {
      // Redirect to dashboard if no project ID is provided
      navigate('/dashboard');
    }
    // Projects will be fetched by LeftSidebar when needed
  }, [projectId, navigate, location.pathname]);

  // Enhanced task filtering and sorting
  const filteredTasks = tasks.filter(task => {
    // Project filter
    const taskProjectId = task.project?._id || task.project;
    const matchesProject = taskProjectId === selectedProject;
    
    // Search filter
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    
    // Priority filter
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesProject && matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        const priorityOrder = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        break;
      case 'createdAt':
      default:
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const getProjectName = () => {
    const project = projects.find(p => p._id === selectedProject);
    return project ? project.name : 'Unknown Project';
  };



  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      // Show user-friendly error message
      alert(`Failed to update task status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        // Handle error silently or show user-friendly message
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours || '',
      tags: task.tags ? task.tags.join(', ') : ''
    });
    setEditModalOpen(true);
  };

  const handleViewTask = (task) => {
    setViewingTask(task);
    setViewModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const updatedData = {
        ...editFormData,
        estimatedHours: editFormData.estimatedHours ? parseFloat(editFormData.estimatedHours) : undefined,
        tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        dueDate: editFormData.dueDate || undefined
      };

      await updateTask(editingTask._id, updatedData);
      setEditModalOpen(false);
      setEditingTask(null);
      setEditFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        estimatedHours: '',
        tags: ''
      });
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'urgent': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'critical': return 'text-red-700 bg-red-200 dark:bg-red-800/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'todo': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'review': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'testing': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Enhanced UI Helper Functions
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    setSelectedTasks(filteredTasks.map(task => task._id));
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  // Dropdown handlers
  const handleDropdownToggle = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleBulkStatusChange = async (newStatus) => {
    try {
      const promises = selectedTasks.map(taskId => 
        updateTask(taskId, { status: newStatus })
      );
      await Promise.all(promises);
      setSelectedTasks([]);
      setBulkActionsOpen(false);
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const getTaskCount = (status) => {
    return filteredTasks.filter(task => task.status === status).length;
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return filteredTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    );
  };

  const getHighPriorityTasks = () => {
    return filteredTasks.filter(task => 
      ['critical', 'urgent', 'high'].includes(task.priority) && task.status !== 'completed'
    );
  };

  return (
    <>
      <Helmet>
        <title>Tasks - AI Task Manager</title>
        <meta name="description" content="Manage your tasks with AI-powered insights" />
      </Helmet>
      

      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0', left: '0', right: '0' }}>
        {/* Premium Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
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
                
                {/* Premium Logo and Title */}
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                    <CheckSquare className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      Task Management
                </h1>
                    <p className="text-sm text-slate-400 font-medium">AI-Powered Productivity Hub</p>
                  </div>
                </div>
                
                {/* Project Context Badge */}
                <div className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                  <span className="text-sm font-semibold text-blue-300 flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>{getProjectName()}</span>
                  </span>
                </div>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex items-center space-x-6">
                <a href="/dashboard" className="text-white/80 hover:text-white transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/profile" className="text-white/80 hover:text-white transition-colors font-medium">
                  Profile
                </a>
              </nav>
              
              {/* Premium Action Buttons */}
              <div className="flex items-center space-x-4">
                <motion.button 
                  onClick={() => navigate('/tasks/create')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-600 text-white px-8 py-3 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transform transition-all duration-300 font-semibold text-lg flex items-center space-x-3 border border-blue-400/30 hover:border-blue-400/50"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Create Task</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </motion.button>
                <button
                  onClick={logout}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-200 font-medium border border-red-500/30 hover:border-red-500/50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full py-8">
          {/* Premium Control Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="px-8 mb-8"
          >
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                
                {/* Search and Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  {/* Task Stats */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {filteredTasks.length} Tasks
                      </span>
                    </div>
                    {getOverdueTasks().length > 0 && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                          {getOverdueTasks().length} Overdue
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  


                  {/* Sort Controls */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="title">Title</option>
                      <option value="priority">Priority</option>
                      <option value="dueDate">Due Date</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <SortDesc className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      showFilters 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Status
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="testing">Testing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Quick Actions
                        </label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setFilterStatus('all');
                              setFilterPriority('all');
                              setSearchQuery('');
                            }}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setFilterStatus('in_progress')}
                            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                          >
                            Active Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>






          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="px-8"
          >
            {isLoading ? (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-300">Loading tasks...</p>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                <div className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    No tasks in this project
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Create your first task in this project to get started
                  </p>
                    <button 
                    onClick={() => navigate(`/tasks/create?project=${selectedProject}`)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                    <span>Create Task</span>
                    </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* To Do Section */}
                {filteredTasks.filter(task => task.status === 'todo').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                      To Do
                    </h2>
                    <div className="space-y-4">
                                              {filteredTasks.filter(task => task.status === 'todo').map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500"
                        >
                          {/* Animated Background Elements */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors">
                                    {task.title}
                                  </h3>
                                  
                                  {/* Priority and Status Badges */}
                                  <div className="flex items-center space-x-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                      {task.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {task.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                      {task.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                      {task.status === 'in_progress' ? 'In Progress' : 
                                       task.status === 'todo' ? 'To Do' : 
                                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                                

                              </div>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Meta */}
                              <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                )}
                                
                                {/* Assignee Information */}
                                {task.assignee && (
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {task.assignee.firstName?.[0] || task.assignee.username?.[0] || 'U'}
                                        {task.assignee.lastName?.[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {task.assignee.firstName && task.assignee.lastName 
                                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                        : task.assignee.username || 'Unknown User'
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Task Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              {/* View Description Button */}
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="View Description"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                              
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="testing">Testing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              
                              <div className="relative group dropdown-container">
                                <button onClick={() => handleDropdownToggle(task._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 z-10 ${
                                  openDropdown === task._id ? 'opacity-100 visible' : 'opacity-0 invisible'
                                }`}>
                                  <div className="py-1">
                                    <button 
                                      onClick={() => {
                                        handleEditTask(task);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 w-full text-left"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Task</span>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleDeleteTask(task._id);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                        <span>Delete Task</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress Section */}
                {filteredTasks.filter(task => task.status === 'in_progress').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                      In Progress
                    </h2>
                    <div className="space-y-4">
                      {filteredTasks.filter(task => task.status === 'in_progress').map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                        >
                          {/* Animated Background Elements */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {task.title}
                                  </h3>
                                  
                                  {/* Priority and Status Badges */}
                                  <div className="flex items-center space-x-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                      {task.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {task.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                      {task.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                      {task.status === 'in_progress' ? 'In Progress' : 
                                       task.status === 'todo' ? 'To Do' : 
                                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Meta */}
                              <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                )}
                                
                                {/* Assignee Information */}
                                {task.assignee && (
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {task.assignee.firstName?.[0] || task.assignee.username?.[0] || 'U'}
                                        {task.assignee.lastName?.[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {task.assignee.firstName && task.assignee.lastName 
                                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                        : task.assignee.username || 'Unknown User'
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Task Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              {/* View Description Button */}
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="View Description"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                              
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="testing">Testing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              
                              <div className="relative group dropdown-container">
                                <button onClick={() => handleDropdownToggle(task._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 z-10 ${
                                  openDropdown === task._id ? 'opacity-100 visible' : 'opacity-0 invisible'
                                }`}>
                                  <div className="py-1">
                                    <button 
                                      onClick={() => {
                                        handleEditTask(task);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 w-full text-left"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Task</span>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleDeleteTask(task._id);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                        <span>Delete Task</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Section */}
                {filteredTasks.filter(task => task.status === 'review').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                      Review
                    </h2>
                    <div className="space-y-4">
                      {filteredTasks.filter(task => task.status === 'review').map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
                        >
                          {/* Animated Background Elements */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                    {task.title}
                                  </h3>
                                  
                                  {/* Priority and Status Badges */}
                                  <div className="flex items-center space-x-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                      {task.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {task.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                      {task.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                      {task.status === 'in_progress' ? 'In Progress' : 
                                       task.status === 'todo' ? 'To Do' : 
                                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Meta */}
                              <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                )}
                                
                                {/* Assignee Information */}
                                {task.assignee && (
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {task.assignee.firstName?.[0] || task.assignee.username?.[0] || 'U'}
                                        {task.assignee.lastName?.[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {task.assignee.firstName && task.assignee.lastName 
                                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                        : task.assignee.username || 'Unknown User'
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Task Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              {/* View Description Button */}
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="View Description"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                              
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="testing">Testing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              
                              <div className="relative group dropdown-container">
                                <button onClick={() => handleDropdownToggle(task._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 z-10 ${
                                  openDropdown === task._id ? 'opacity-100 visible' : 'opacity-0 invisible'
                                }`}>
                                  <div className="py-1">
                                    <button 
                                      onClick={() => {
                                        handleEditTask(task);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 w-full text-left"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Task</span>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleDeleteTask(task._id);
                                        handleDropdownClose();
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                        <span>Delete Task</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testing Section */}
                {filteredTasks.filter(task => task.status === 'testing').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                      Testing
                    </h2>
                    <div className="space-y-4">
                      {filteredTasks.filter(task => task.status === 'testing').map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                        >
                          {/* Animated Background Elements */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <div className="flex-1">
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                    {task.title}
                                  </h3>
                                  
                                  {/* Priority and Status Badges */}
                                  <div className="flex items-center space-x-3 mb-3">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                      {task.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                      {task.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                      {task.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                      {task.status === 'in_progress' ? 'In Progress' : 
                                       task.status === 'todo' ? 'To Do' : 
                                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Meta */}
                              <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                {task.dueDate && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                )}
                                
                                {/* Assignee Information */}
                                {task.assignee && (
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {task.assignee.firstName?.[0] || task.assignee.username?.[0] || 'U'}
                                        {task.assignee.lastName?.[0] || ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {task.assignee.firstName && task.assignee.lastName 
                                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                        : task.assignee.username || 'Unknown User'
                                      }
                                    </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Task Actions */}
                              <div className="flex items-center space-x-2 ml-4">
                                {/* View Description Button */}
                                <button
                                  onClick={() => handleViewTask(task)}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  title="View Description"
                                >
                                  <Eye className="w-4 h-4 text-slate-500" />
                                </button>
                                
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                  className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="testing">Testing</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                
                                <div className="relative group dropdown-container">
                                  <button onClick={() => handleDropdownToggle(task._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                  </button>
                                  
                                  {/* Dropdown Menu */}
                                  <div className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 z-10 ${
                                  openDropdown === task._id ? 'opacity-100 visible' : 'opacity-0 invisible'
                                }`}>
                                    <div className="py-1">
                                      <button 
                                        onClick={() => handleEditTask(task)}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 w-full text-left"
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Task</span>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteTask(task._id)}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                          <span>Delete Task</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Section */}
                  {filteredTasks.filter(task => task.status === 'completed').length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4 px-2">
                        Completed
                      </h2>
                      <div className="space-y-4">
                        {filteredTasks.filter(task => task.status === 'completed').map((task, index) => (
                          <motion.div
                            key={task._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                          className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-slate-800/80 dark:via-slate-800/70 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500"
                          >
                            {/* Animated Background Elements */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10 flex items-start justify-between">
                              <div className="flex-1">
                                {/* Task Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                                      {task.title}
                                    </h3>
                                    
                                    {/* Priority and Status Badges */}
                                    <div className="flex items-center space-x-3 mb-3">
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                        {task.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                        {task.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                                        {task.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                      </span>
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                        {task.status === 'in_progress' ? 'In Progress' : 
                                         task.status === 'todo' ? 'To Do' : 
                                         task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Task Description */}
                                {task.description && (
                                  <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {/* Task Meta */}
                                <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                  {task.dueDate && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>Due: {formatDate(task.dueDate)}</span>
                                    </div>
                                  )}
                                  {task.estimatedHours && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{task.estimatedHours}h</span>
                                    </div>
                                  )}
                                  
                                  {/* Assignee Information */}
                                  {task.assignee && (
                                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                          {task.assignee.firstName?.[0] || task.assignee.username?.[0] || 'U'}
                                          {task.assignee.lastName?.[0] || ''}
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium">
                                        {task.assignee.firstName && task.assignee.lastName 
                                          ? `${task.assignee.firstName} ${task.assignee.lastName}`
                                          : task.assignee.username || 'Unknown User'
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Task Actions */}
                              <div className="flex items-center space-x-2 ml-4">
                                {/* View Description Button */}
                                <button
                                  onClick={() => handleViewTask(task)}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  title="View Description"
                                >
                                  <Eye className="w-4 h-4 text-slate-500" />
                                </button>
                                
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                  className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="testing">Testing</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                
                                <div className="relative group dropdown-container">
                                  <button onClick={() => handleDropdownToggle(task._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                  </button>
                                  
                                  {/* Dropdown Menu */}
                                  <div className={`absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 z-10 ${
                                  openDropdown === task._id ? 'opacity-100 visible' : 'opacity-0 invisible'
                                }`}>
                                    <div className="py-1">
                                      <button 
                                        onClick={() => handleEditTask(task)}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 w-full text-left"
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Task</span>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteTask(task._id)}
                                        className="flex items-center space-x-4 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                          <span>Delete Task</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Edit Task Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Edit Task
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  placeholder="Enter task title..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  placeholder="Enter task description..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Due Date and Estimated Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={editFormData.dueDate}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={editFormData.estimatedHours}
                    onChange={handleEditFormChange}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={editFormData.tags}
                  onChange={handleEditFormChange}
                  placeholder="Enter tags separated by commas..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Update Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Task Description Modal */}
      {viewModalOpen && viewingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Task Details
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Title */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {viewingTask.title}
                </h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(viewingTask.priority)}`}>
                    {viewingTask.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(viewingTask.status)}`}>
                    {viewingTask.status === 'in_progress' ? 'In Progress' : 
                     viewingTask.status === 'todo' ? 'To Do' : 
                     viewingTask.status.charAt(0).toUpperCase() + viewingTask.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Description
                </h4>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                  {viewingTask.description ? (
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {viewingTask.description}
                    </p>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      No description provided
                    </p>
                  )}
                </div>
              </div>

              {/* Task Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                {viewingTask.dueDate && (
                  <div>
                    <h4 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Due Date
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {formatDate(viewingTask.dueDate)}
                    </p>
                  </div>
                )}

                {/* Estimated Hours */}
                {viewingTask.estimatedHours && (
                  <div>
                    <h4 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Estimated Hours
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {viewingTask.estimatedHours} hours
                    </p>
                  </div>
                )}

                {/* Tags */}
                {viewingTask.tags && viewingTask.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingTask.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Created/Updated Info */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(viewingTask.createdAt)}
                  </div>
                  {viewingTask.updatedAt && viewingTask.updatedAt !== viewingTask.createdAt && (
                    <div>
                      <span className="font-medium">Updated:</span> {formatDate(viewingTask.updatedAt)}
                    </div>
        )}
      </div>
              </div>

              {/* Close Button */}
              <div className="pt-6">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Left Sidebar */}
      <LeftSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
    </>
  );
};

export default Tasks;
