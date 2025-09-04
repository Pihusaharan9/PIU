import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Flag, User, Hash, Sparkles, CheckCircle, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import { useAI } from '../contexts/AIContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Force full width styles
const fullWidthStyles = {
  width: '100vw',
  maxWidth: '100vw',
  margin: '0',
  padding: '0',
  left: '0',
  right: '0'
};

const CreateTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createTask } = useTask();
  const { projects } = useProject();
  const { optimizeTask } = useAI();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedHours: '',
    assignee: ''
  });

  // Get project from URL parameters and set as default
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setFormData(prev => ({ ...prev, project: projectId }));
    }
  }, [location.search]);

  // Fetch organization members
  useEffect(() => {
    const fetchOrganizationMembers = async () => {
      if (!user || !user.organization) return;
      
      try {
        setIsLoadingMembers(true);
        const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
        const response = await fetch(`${SERVER_URL}/api/auth/organization-members`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrganizationMembers(data.data);
          // Set current user as default assignee
          setFormData(prev => ({ ...prev, assignee: user._id }));
        } else {
          // console.error('Failed to fetch organization members');
        }
      } catch (error) {
        // console.error('Error fetching organization members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchOrganizationMembers();
  }, [user]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAIOptimization = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a task title first');
      return;
    }

    try {
      setIsOptimizing(true);
      // console.log('🔄 Starting AI optimization for:', formData.title);
      
      const optimizedTask = await optimizeTask(formData.title, formData.description);
      // console.log('🤖 AI Response received:', optimizedTask);
      
      // Use the AI-generated comprehensive description directly
      setFormData(prev => {
        const newFormData = {
          ...prev,
          title: optimizedTask.optimizedTitle || prev.title,
          description: optimizedTask.optimizedDescription || prev.description,
          estimatedHours: optimizedTask.estimatedHours ? optimizedTask.estimatedHours.toString() : prev.estimatedHours,
          priority: optimizedTask.priority || prev.priority
        };
        
        // console.log('📝 Updated form data:', newFormData);
        return newFormData;
      });

      // Success message is already handled in AIContext
    } catch (error) {
      // console.error('AI optimization failed:', error);
      toast.error('Failed to optimize task. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!formData.project) {
      toast.error('Please select a project');
      return;
    }

    try {
      setIsLoading(true);
      // console.log('🚀 Starting task creation...');
      // console.log('📝 Form data:', formData);
      
      // Format the data
      const taskData = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate || undefined
      };
      
      // console.log('📊 Formatted task data:', taskData);

      const result = await createTask(taskData);
      // console.log('✅ Task created successfully:', result);
      
      // Success message is already handled in TaskContext
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        estimatedHours: '',
        assignee: user._id
      });

      // Navigate back to project-specific tasks page
      // console.log('🔄 Navigating to project tasks...');
      navigate(`/tasks/project/${formData.project}`);
    } catch (error) {
      // console.error('❌ Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-800" style={fullWidthStyles}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 w-full">
        <div className="w-full">
          <div className="flex items-center py-6 px-8">
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Tasks</span>
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create New Task
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-8">
        <div className="w-full">
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-slate-800 w-full"
          >
            <form onSubmit={handleSubmit} className="space-y-8 p-8">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                    Task Title *
                  </label>

                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title..."
                  className="w-full px-8 py-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  required
                />
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  📁 Project *
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full px-8 py-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    No projects available. Please create a project first.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                    Description
                  </label>

                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter task description or click 'Optimize with AI' to generate comprehensive description with Definition of Done and Acceptance Criteria..."
                  rows={12}
                  className="w-full px-8 py-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-base"
                />

              </div>

              {/* AI Optimization Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleAIOptimization}
                  disabled={isOptimizing || !formData.title.trim()}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>🤖 AI is optimizing your task...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span>✨ Optimize with AI</span>
                    </>
                  )}
                </button>
              </div>
              
              {isOptimizing && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-3 px-6 py-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-base text-blue-700 dark:text-blue-300">
                      AI is analyzing your task and generating comprehensive description...
                    </span>
                  </div>
                </div>
              )}
              
              {!formData.title.trim() && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Enter a task title to enable AI optimization
                </p>
              )}

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Priority */}
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Flag className="w-4 h-4 inline mr-2" />
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
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

                {/* Due Date */}
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Team Member Assignment */}
              <div>
                <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Assign To
                </label>
                {isLoadingMembers ? (
                  <div className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400">
                    Loading team members...
                  </div>
                ) : (
                  <select
                    name="assignee"
                    value={formData.assignee}
                    onChange={handleChange}
                    className="w-full px-8 py-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select team member</option>
                    {/* Admin User */}
                    {organizationMembers.admin && (
                      <option value={organizationMembers.admin._id}>
                        {organizationMembers.admin.firstName} {organizationMembers.admin.lastName} (Admin)
                      </option>
                    )}
                    {/* Team Members */}
                    {organizationMembers.members && organizationMembers.members.map((member, index) => (
                      <option key={member.user._id || index} value={member.user._id}>
                        {member.user.firstName} {member.user.lastName} ({member.role})
                      </option>
                    ))}
                  </select>
                )}
                {Object.keys(organizationMembers).length === 0 && !isLoadingMembers && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    No team members found. Please add team members to your organization first.
                  </p>
                )}
              </div>



              {/* Actions */}
              <div className="flex space-x-6 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Task...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Create Task
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateTask;
