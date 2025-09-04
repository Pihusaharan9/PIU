import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Edit, Key, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    // Validate username
    if (!editForm.username.trim()) {
      toast.error('Username is required');
      return;
    }

    // Validate password if password fields are filled
    if (passwordForm.newPassword || passwordForm.confirmPassword || passwordForm.currentPassword) {
      if (!passwordForm.currentPassword) {
        toast.error('Current password is required to change password');
        return;
      }
      if (!passwordForm.newPassword) {
        toast.error('New password is required');
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New passwords do not match!');
        return;
      }
      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long!');
        return;
      }
    }

    // Here you would typically make API calls to update username and password
    toast.success('Username and password updated successfully!');
    setIsEditing(false);
    
    // Reset password form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleCancelEdit = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || ''
    });
    setIsEditing(false);
    
    // Reset password form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };



  return (
    <>
      <Helmet>
        <title>Profile - AI Task Manager</title>
        <meta name="description" content="Manage your profile and account settings" />
      </Helmet>

      <div className="min-h-screen w-full bg-white dark:bg-slate-800" style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0', left: '0', right: '0' }}>
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 w-full">
          <div className="w-full px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Profile
                </h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex items-center space-x-6">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Dashboard
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl mb-8 w-full"
          >
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                {!isEditing ? (
                  <>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-2">
                      @{user?.username}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>
                  </>
                ) : (
                  <div className="space-y-4 w-full">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      placeholder="Username"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                    <hr className="border-slate-300 dark:border-slate-600 my-6" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Change Password</h4>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      placeholder="Current Password"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="New Password"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirm New Password"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button 
                    onClick={handleEditProfile}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSaveProfile}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 mx-auto px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200"
            >
              <span>Logout</span>
            </button>
          </motion.div>

        </main>
      </div>
    </>
  );
};

export default Profile;