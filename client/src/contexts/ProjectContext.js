import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const hasFetched = useRef(false);
  
  // Listen for task changes to refresh projects
  useEffect(() => {
    const handleTaskChange = () => {

      // Reset hasFetched to allow refreshing
      hasFetched.current = false;
      fetchProjects();
    };
    
    window.addEventListener('taskChange', handleTaskChange);
    return () => window.removeEventListener('taskChange', handleTaskChange);
  }, []);

  // Fetch all projects for the authenticated user
  const fetchProjects = useCallback(async () => {
    try {
      // Prevent multiple simultaneous calls
      if (isLoading) {

        return;
      }

      // Prevent fetching if we already have projects and have already fetched
      if (hasFetched.current && projects.length > 0) {
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {

        return;
      }

      const response = await axios.get(`${SERVER_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const projectsWithCounts = response.data.data.map(project => {

          return {
            ...project,
            taskCount: Array.isArray(project.tasks) ? project.tasks.length : 0,
            memberCount: Array.isArray(project.members) ? project.members.length : 0
          };
        });

        setProjects(projectsWithCounts);
        hasFetched.current = true;
      }
    } catch (error) {

      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = async (projectData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${SERVER_URL}/api/projects`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newProject = response.data.data;
        setProjects(prev => [...prev, newProject]);
        toast.success('Project created successfully!');
        return newProject;
      }
    } catch (error) {
      // console.error('Failed to create project:', error);
      toast.error('Failed to create project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a project
  const updateProject = async (projectId, updates) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${SERVER_URL}/api/projects/${projectId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedProject = response.data.data;
        setProjects(prev => prev.map(project => 
          project._id === projectId ? updatedProject : project
        ));
        toast.success('Project updated successfully!');
        return updatedProject;
      }
    } catch (error) {
      // console.error('Failed to update project:', error);
      toast.error('Failed to update project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${SERVER_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(prev => prev.filter(project => project._id !== projectId));
      toast.success('Project deleted successfully!');
    } catch (error) {
      // console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get project by ID
  const getProjectById = (projectId) => {
    return projects.find(project => project._id === projectId);
  };

  // Select a project
  const selectProject = (projectId) => {
    setSelectedProject(projectId);
  };

  // Clear selected project
  const clearSelectedProject = () => {
    setSelectedProject(null);
  };

  // Get project tasks
  const getProjectTasks = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project?.tasks || [];
  };

  // Get project members
  const getProjectMembers = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project?.members || [];
  };

  // Add member to project
  const addProjectMember = async (projectId, memberData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${SERVER_URL}/api/projects/${projectId}/members`, memberData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh projects to get updated member list
        await fetchProjects();
        toast.success('Member added to project successfully!');
        return response.data.data;
      }
    } catch (error) {
      // console.error('Failed to add member to project:', error);
      toast.error('Failed to add member to project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member from project
  const removeProjectMember = async (projectId, memberId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${SERVER_URL}/api/projects/${projectId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh projects to get updated member list
      await fetchProjects();
      toast.success('Member removed from project successfully!');
    } catch (error) {
      // console.error('Failed to remove member from project:', error);
      toast.error('Failed to remove member from project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update member role
  const updateMemberRole = async (projectId, memberId, newRole) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${SERVER_URL}/api/projects/${projectId}/members/${memberId}`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh projects to get updated member list
        await fetchProjects();
        toast.success('Member role updated successfully!');
        return response.data.data;
      }
    } catch (error) {
      // console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Invite user to project
  const inviteUserToProject = async (projectId, inviteData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${SERVER_URL}/api/projects/${projectId}/invite`, inviteData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Invitation sent successfully!');
        return response.data.data;
      }
    } catch (error) {
      // console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    projects,
    isLoading,
    selectedProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    selectProject,
    clearSelectedProject,
    getProjectTasks,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    updateMemberRole,
    inviteUserToProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectProvider;
