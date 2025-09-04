import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Clock, Flag, Tag, Lightbulb, X, FolderOpen, Users } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTask } from '../../contexts/TaskContext';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AITaskSuggestions = () => {
  const navigate = useNavigate();
  const { getTaskSuggestions, suggestions, isLoading } = useAI();
  const { createTask } = useTask();
  const { projects, fetchProjects } = useProject();
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [userContext, setUserContext] = useState({
    industry: 'general',
    role: 'professional',
    currentFocus: 'productivity',
    workStyle: 'balanced'
  });

  // Fetch projects and organization members when component mounts
  useEffect(() => {
    fetchProjects();
    fetchOrganizationMembers();
  }, [fetchProjects]);

  const fetchOrganizationMembers = async () => {
    try {
      const response = await fetch('/api/auth/organization-members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const responseData = await response.json();

        
        // Handle the actual API response structure
        if (responseData.success && responseData.data) {
          const { admin, members } = responseData.data;
          
          // Combine admin and members into a single array
          let allMembers = [];
          
          if (admin) {
            allMembers.push({
              ...admin,
              role: 'admin'
            });
          }
          
          if (members && Array.isArray(members)) {
            // Extract user data from members array
            const memberUsers = members.map(member => ({
              ...member.user,
              role: member.role || 'member'
            }));
            allMembers = [...allMembers, ...memberUsers];
          }
          

          setOrganizationMembers(allMembers);
          
          // Set current user as default assignee
          if (allMembers.length > 0) {
            setSelectedAssignee(user?._id || allMembers[0]._id);
          }
        } else {
          setOrganizationMembers([]);
        }
      } else {
        setOrganizationMembers([]);
      }
    } catch (error) {
      setOrganizationMembers([]);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      await getTaskSuggestions(userContext);
      setShowSuggestions(true);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleCreateTaskFromSuggestion = async (suggestion) => {
    // Store the selected suggestion and show project modal
    setSelectedSuggestion(suggestion);
    setShowProjectModal(true);
  };

  const handleCreateTaskWithProject = async (projectId) => {
    try {
      // Validate that an assignee is selected
      if (!selectedAssignee) {
        toast.error('Please select an assignee for this task');
        return;
      }

      setIsRedirecting(true);
      
      await createTask({
        title: selectedSuggestion.title,
        description: selectedSuggestion.description,
        priority: selectedSuggestion.priority,
        estimatedHours: selectedSuggestion.estimatedHours,
        tags: selectedSuggestion.tags || [],
        status: 'todo',
        project: projectId,
        assignee: selectedAssignee
      }, false); // Don't show default success message
      
      toast.success('Task created from AI suggestion! Redirecting to project tasks...');
      setShowProjectModal(false);
      setSelectedSuggestion(null);
      
      // Redirect to the specific project's tasks page after a short delay
      setTimeout(() => {
        navigate(`/tasks/project/${projectId}`);
      }, 1500);
    } catch (error) {
      toast.error('Failed to create task');
      setIsRedirecting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  return (
    <div className="relative z-10">


      {/* Context Settings */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Industry
          </label>
          <select
            value={userContext.industry}
            onChange={(e) => setUserContext(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
          >
            <option value="general">General</option>
            <option value="technology">Technology</option>
            <option value="marketing">Marketing</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Role
          </label>
          <select
            value={userContext.role}
            onChange={(e) => setUserContext(prev => ({ ...prev, role: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
          >
            <option value="professional">Professional</option>
            <option value="manager">Manager</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="student">Student</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Current Focus
          </label>
          <select
            value={userContext.currentFocus}
            onChange={(e) => setUserContext(prev => ({ ...prev, currentFocus: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
          >
            <option value="productivity">Productivity</option>
            <option value="learning">Learning</option>
            <option value="growth">Growth</option>
            <option value="organization">Organization</option>
            <option value="collaboration">Collaboration</option>
            <option value="innovation">Innovation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Work Style
          </label>
          <select
            value={userContext.workStyle}
            onChange={(e) => setUserContext(prev => ({ ...prev, workStyle: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
          >
            <option value="balanced">Balanced</option>
            <option value="intense">Intense</option>
            <option value="flexible">Flexible</option>
            <option value="structured">Structured</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateSuggestions}
        disabled={isLoading}
        className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-pink-500/25 transform transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 border border-pink-400/30 hover:border-pink-400/50"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating AI Suggestions...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Task Suggestions</span>
          </>
        )}
      </motion.button>

      {/* Suggestions List */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 dark:text-white">AI Generated Tasks</h4>
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-slate-900 dark:text-white text-sm">
                    {suggestion.title}
                  </h5>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  {suggestion.description}
                </p>

                {/* Task Meta */}
                <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {suggestion.estimatedHours && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{suggestion.estimatedHours}h</span>
                    </div>
                  )}
                  
                  {suggestion.tags && suggestion.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>{suggestion.tags.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                {suggestion.reasoning && (
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Create Task Button */}
                <button
                  onClick={() => handleCreateTaskFromSuggestion(suggestion)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create This Task</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Selection Modal */}
      <AnimatePresence>
        {showProjectModal && selectedSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Create Task
                  </h3>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Task Preview */}
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                  {selectedSuggestion.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedSuggestion.description}
                </p>
              </div>

              {/* Assignee Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Assign this task to:
                </label>
                
                {!Array.isArray(organizationMembers) || organizationMembers.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {!Array.isArray(organizationMembers) ? 'Loading team members...' : 'No team members available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {organizationMembers
                      .filter(member => member && member._id) // Filter out invalid members
                      .map((member) => (
                        <button
                          key={member._id}
                          onClick={() => setSelectedAssignee(member._id)}
                          className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                            selectedAssignee === member._id
                              ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.firstName ? member.firstName.charAt(0) : 'U'}
                            </div>
                            <div className="text-left">
                              <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                                {member.firstName || 'Unknown'} {member.lastName || 'User'}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {member.role || 'Member'}
                              </p>
                            </div>
                            {selectedAssignee === member._id && (
                              <div className="ml-auto">
                                <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Project Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Choose which project to add this task to:
                </label>
                
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects available</p>
                    <p className="text-xs opacity-75">Create a project first to add tasks</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                         {projects.map((project) => (
                       <button
                         key={project._id}
                         onClick={() => handleCreateTaskWithProject(project._id)}
                         disabled={isRedirecting}
                         className={`w-full p-3 text-left bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-all duration-200 ${
                           isRedirecting 
                             ? 'opacity-50 cursor-not-allowed' 
                             : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600'
                         }`}
                       >
                         <div className="flex items-center justify-between">
                           <div>
                             <h5 className="font-medium text-slate-900 dark:text-white text-sm">
                               {project.name}
                             </h5>
                             {project.description && (
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                 {project.description}
                               </p>
                             )}
                           </div>
                           {isRedirecting ? (
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                           ) : (
                             <Plus className="w-4 h-4 text-purple-600" />
                           )}
                         </div>
                       </button>
                     ))}
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowProjectModal(false)}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AITaskSuggestions;
