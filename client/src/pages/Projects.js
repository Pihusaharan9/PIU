import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Users, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const { logout } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Projects - AI Task Manager</title>
        <meta name="description" content="Manage your projects and collaborate with your team" />
      </Helmet>

      <div className="min-h-screen w-full bg-white dark:bg-slate-800" style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0', left: '0', right: '0' }}>
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 w-full">
          <div className="w-full px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Projects
                </h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex items-center space-x-6">
                <a href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dashboard
                </a>
                <a href="/tasks" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Tasks
                </a>
                <a href="/projects" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold">
                  Projects
                </a>
                <a href="/profile" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Profile
                </a>
              </nav>
              
              <div className="flex items-center space-x-4">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>New Project</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Create New Project Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer group"
            >
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Create New Project
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Start a new project and invite your team
                </p>
              </div>
            </motion.div>

            {/* Sample Project Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Website Redesign
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                Complete redesign of the company website with modern UI/UX principles
              </p>
              
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>5 members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Dec 15</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-600/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                🚀 Ready to Start Your First Project?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">
                Create your first project to start collaborating with your team. 
                AI Task Manager will help you organize tasks, track progress, and 
                optimize your workflow.
              </p>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto">
                <Plus className="w-5 h-5" />
                <span>Create Project</span>
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Projects;
