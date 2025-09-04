import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Context
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { TaskProvider } from './contexts/TaskContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { AIProvider } from './contexts/AIContext';

// Components
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
        <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <TaskProvider>
            <ProjectProvider>
              <AIProvider>
                <div className="min-h-screen w-full bg-white dark:bg-slate-800 transition-colors duration-500" style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0', left: '0', right: '0' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/tasks/project/:projectId" element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="/tasks/create" element={
                <ProtectedRoute>
                  <CreateTask />
                </ProtectedRoute>
              } />
              {/* Redirect old /tasks route to dashboard */}
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
            </div>
              </AIProvider>
            </ProjectProvider>
          </TaskProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
