import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  FolderOpen,
  CheckSquare,
  Users,
  Plus,
  Home,
  UserPlus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import TeamMemberModal from './TeamMemberModal';

const LeftSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, fetchProjects, isLoading, createProject } = useProject();
  const { user } = useAuth();
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [teamMemberModalOpen, setTeamMemberModalOpen] = useState(false);
  const [usersExpanded, setUsersExpanded] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [myTasksExpanded, setMyTasksExpanded] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [isLoadingMyTasks, setIsLoadingMyTasks] = useState(false);

  useEffect(() => {
    // Only fetch projects once when sidebar first opens and projects are empty
    if (isOpen && projects.length === 0) {
      fetchProjects();
    }
  }, [isOpen, projects.length]);

  useEffect(() => {
    // Get project ID from URL if we're on a project-specific page
    const pathParts = location.pathname.split('/');
    
    if (pathParts[1] === 'projects' && pathParts[2]) {
      setSelectedProject(pathParts[2]);
    } else if (pathParts[1] === 'tasks' && pathParts[2] === 'project' && pathParts[3]) {
      setSelectedProject(pathParts[3]);
    } else if (pathParts[1] === 'tasks' && location.search.includes('project=')) {
      const urlParams = new URLSearchParams(location.search);
      const projectId = urlParams.get('project');
      setSelectedProject(projectId);
    }
  }, [location]);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };



  const handleProjectTasks = (projectId) => {
    setSelectedProject(projectId);
    navigate(`/tasks/project/${projectId}`);
  };



  const isActive = (path) => {
    return location.pathname === path;
  };

  const isProjectActive = (projectId) => {
    return selectedProject === projectId;
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      await createProject({ name: newProjectName.trim() });
      setNewProjectName('');
      setCreateProjectModalOpen(false);
      // Success message is already handled in ProjectContext
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const fetchOrganizationMembers = async () => {
    if (!user || !user.organization) return;
    
    try {
      setIsLoadingUsers(true);
      const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${SERVER_URL}/api/auth/organization-members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizationMembers(data.data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUsersToggle = () => {
    const newExpanded = !usersExpanded;
    setUsersExpanded(newExpanded);
    
    // Fetch members when expanding
    if (newExpanded && Object.keys(organizationMembers).length === 0) {
      fetchOrganizationMembers();
    }
  };

  const fetchMyTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoadingMyTasks(true);
      const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${SERVER_URL}/api/tasks/my-tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyTasks(data.data || []);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoadingMyTasks(false);
    }
  };

  const handleMyTasksToggle = () => {
    const newExpanded = !myTasksExpanded;
    setMyTasksExpanded(newExpanded);
    
    // Fetch tasks when expanding
    if (newExpanded && myTasks.length === 0) {
      fetchMyTasks();
    }
  };

  // Refresh my tasks when they might have changed
  const refreshMyTasks = () => {
    if (myTasksExpanded) {
      fetchMyTasks();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Premium PIU Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 z-50 shadow-2xl"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            {/* Premium Header */}
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-lg font-black text-white">PIU</span>
                </div>
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Navigation
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Premium Workspace</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <X className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Premium Navigation Content */}
            <div className="relative z-10 p-6 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
              

              


              {/* Premium Dashboard Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
              </div>

              {/* Premium My Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">
                    My Tasks
                  </h3>
                  <div className="flex items-center space-x-1">
                    {myTasksExpanded && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={refreshMyTasks}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all duration-300 group"
                        title="Refresh tasks"
                      >
                        <svg className="w-3 h-3 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMyTasksToggle}
                      className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                      title={myTasksExpanded ? "Collapse tasks" : "Expand tasks"}
                    >
                      {myTasksExpanded ? (
                        <ChevronDown className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                      )}
                    </motion.button>
                  </div>
                </div>
                
                {/* Tasks List */}
                {myTasksExpanded && (
                  <div className="space-y-2">
                    {isLoadingMyTasks ? (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-white/60 font-medium">
                          Loading tasks...
                        </p>
                      </div>
                    ) : myTasks.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <CheckSquare className="w-6 h-6 text-white/60" />
                        </div>
                        <p className="text-sm text-white/60 font-medium">
                          No tasks assigned
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myTasks.map((task) => (
                          <motion.div
                            key={task._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {task.title}
                                </p>
                                <p className="text-xs text-white/70 mt-1">
                                  {task.project?.name || 'No Project'} • {task.priority}
                                </p>
                                <div className="flex items-center space-x-2 mt-3">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    task.status === 'completed' ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30' :
                                    task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/30' :
                                    task.status === 'review' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30' :
                                    task.status === 'testing' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30' :
                                    'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-500/30'
                                  }`}>
                                    {task.status.replace('_', ' ')}
                                  </span>
                                  {task.dueDate && (
                                    <span className="text-xs text-white/60 font-medium">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/tasks/project/${task.project?._id || 'general'}`)}
                              className="w-full mt-3 text-xs text-blue-400 hover:text-blue-300 font-medium text-center transition-colors"
                            >
                              View in Project
                            </motion.button>
                          </motion.div>
                        ))}
                        

                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Premium Projects Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">
                    Projects
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCreateProjectModalOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                    title="Add New Project"
                  >
                    <Plus className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                  </motion.button>
                </div>


                {projects.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FolderOpen className="w-6 h-6 text-white/60" />
                    </div>
                    <p className="text-sm text-white/60 font-medium mb-4">
                      No projects yet
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCreateProjectModalOpen(true)}
                      className="text-blue-400 text-sm hover:text-blue-300 font-medium transition-colors"
                    >
                      Create your first project
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div key={project._id} className="space-y-1">
                        {/* Project Header */}
                        <button
                          onClick={() => toggleProject(project._id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                            isProjectActive(project._id)
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <FolderOpen className="w-5 h-5" />
                            <span className="font-medium">{project.name}</span>
                          </div>
                          {expandedProjects[project._id] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        {/* Project Dropdown Content */}
                        <AnimatePresence>
                          {expandedProjects[project._id] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-6 space-y-1"
                            >
                              {/* Project Tasks */}
                              <motion.button
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleProjectTasks(project._id)}
                                className="group w-full flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300"
                              >
                                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300">
                                  <CheckSquare className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-medium">Tasks</span>
                              </motion.button>


                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Premium Organization Users Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-wider">
                    Organization Users
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleUsersToggle}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                    title={usersExpanded ? "Collapse users" : "Expand users"}
                  >
                    {usersExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                    )}
                  </motion.button>
                </div>
                
                {/* Users List */}
                {usersExpanded && (
                  <div className="space-y-2">
                    {isLoadingUsers ? (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-white/60 font-medium">
                          Loading users...
                        </p>
                      </div>
                    ) : Object.keys(organizationMembers).length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-white/60" />
                        </div>
                        <p className="text-sm text-white/60 font-medium">
                          No users found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Premium Admin User */}
                        {organizationMembers.admin && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center space-x-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30"
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                {organizationMembers.admin.firstName?.[0]}{organizationMembers.admin.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {organizationMembers.admin.firstName} {organizationMembers.admin.lastName}
                              </p>
                              <p className="text-xs text-white/70 truncate">
                                {organizationMembers.admin.email} • Admin
                              </p>
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Premium Team Members */}
                        {organizationMembers.members && organizationMembers.members.map((member, index) => (
                          <motion.div
                            key={member.user._id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4 px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-xs text-white/70 truncate">
                                {member.user.email} • {member.role}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Premium Total Count */}
                        <div className="text-center py-3">
                          <p className="text-xs text-white/60 font-medium">
                            {organizationMembers.totalMembers || 0} total users
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Premium Quick Actions */}
              <div className="space-y-3 pt-6 border-t border-slate-700/50">
                <h3 className="text-sm font-black text-white/80 uppercase tracking-wider mb-4">
                  Quick Actions
                </h3>
                
                {/* Premium Add Team Member Button - Only for Admins */}
                {user && user.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTeamMemberModalOpen(true)}
                    className="group w-full flex items-center space-x-4 px-5 py-4 rounded-2xl hover:bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-transparent hover:border-purple-500/30 text-white/80 hover:text-white transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold">Add Team Member</span>
                      <p className="text-xs text-white/60">Invite new users</p>
                    </div>
                  </motion.button>
                )}
                
                {/* Premium User Info */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-white/60 px-4 py-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/20"
                  >
                    <p className="font-medium">Role: {user.role}</p>
                    <p className="font-medium">Email: {user.email}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/tasks/create')}
                  className="group w-full flex items-center space-x-4 px-5 py-4 rounded-2xl hover:bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-transparent hover:border-blue-500/30 text-white/80 hover:text-white transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold">Create Task</span>
                    <p className="text-xs text-white/60">Add new task</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/profile')}
                  className="group w-full flex items-center space-x-4 px-5 py-4 rounded-2xl hover:bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-transparent hover:border-emerald-500/30 text-white/80 hover:text-white transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold">Profile</span>
                    <p className="text-xs text-white/60">View settings</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Create Project Modal */}
      {createProjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Create New Project
              </h2>
              <button
                onClick={() => setCreateProjectModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setCreateProjectModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={teamMemberModalOpen}
        onClose={() => setTeamMemberModalOpen(false)}
        onSuccess={(data) => {
          toast.success('Team member added successfully!');
          // Refresh organization members list
          if (usersExpanded) {
            fetchOrganizationMembers();
          }
        }}
      />
    </AnimatePresence>
  );
};

export default LeftSidebar;
