import { useEffect, useState } from 'react';
import { 
  Info, BarChart3, Settings as SettingsIcon, Library, 
  Users, UsersRound, DollarSign, Link2, 
  Clock, AlertCircle, Save, Eye, EyeOff,
  User, Lock, Bell, Key, Building, Trash2,
  Shield, Mail, Check, X
} from 'lucide-react';
import Link from "next/link";
import { apiClient } from '../../../lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  createdAt: string;
  organization: {
    id: string;
    name: string;
    storageLimitGb: number;
    plan: {
      name: string;
      priceUsd: number;
    };
  };
}

interface UsageStats {
  fileCount: number;
  storageUsed: number;
  storageUsedFormatted: string;
  storageLimit: number;
  storageLimitFormatted: string;
  storagePercentage: string;
  trafficThisMonth: number;
  trafficThisMonthFormatted: string;
}

const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Organization form (admin only)
  const [orgName, setOrgName] = useState('');
  const [orgStorageLimit, setOrgStorageLimit] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    fileUploadNotifications: true,
    shareNotifications: true,
    weeklyReport: false,
    securityAlerts: true
  });

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchUsage();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/profile');
      
      if (response.success) {
        setProfile(response.data);
        setName(response.data.name);
        setEmail(response.data.email);
        setOrgName(response.data.organization?.name || '');
        setOrgStorageLimit(response.data.organization?.storageLimitGb?.toString() || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await apiClient.get('/api/users/usage');
      
      if (response.success) {
        setUsage(response.data);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/users/notifications');
      
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.patch('/api/users/profile', {
        name,
        email
      });

      if (response.success) {
        setSuccessMessage('Profile updated successfully');
        await fetchProfile();
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.post('/api/users/change-password', {
        currentPassword,
        newPassword,
      },{ headers: { 'Content-Type': 'application/json' } });

      if (response.success) {
        setSuccessMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organization?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.patch(
        `/api/organizations/${profile.organization.id}/settings`,
        {
          name: orgName,
          storageLimitGb: parseInt(orgStorageLimit)
        }
      );

      if (response.success) {
        setSuccessMessage('Organization settings updated successfully');
        await fetchProfile();
      }
    } catch (err) {
      setError('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.patch('/api/users/notifications', notifications);

      if (response.success) {
        setSuccessMessage('Notification settings updated successfully');
      }
    } catch (err) {
      setError('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Password is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.delete('/api/users/account', {
        data: { password: deletePassword }
      });

      if (response.success) {
        // Logout and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-red-50">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            
            {profile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                  <div className="text-xs text-gray-500">{profile.email}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile.role}
                </div>
              </div>
            )}
          </div>

          {/* Alert Messages */}
          {(error || successMessage) && (
            <div className="mt-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-700">{successMessage}</p>
                  <button onClick={() => setSuccessMessage(null)} className="ml-auto">
                    <X className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Settings Navigation */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <nav className="p-4 space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Lock className="w-5 h-5" />
                Security
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                Notifications
              </button>

              {profile?.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('organization')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'organization'
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                    Organization
                  </button>

                  <button
                    onClick={() => setActiveTab('api')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === 'api'
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Key className="w-5 h-5" />
                    API Keys
                  </button>
                </>
              )}

              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={() => setActiveTab('usage')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === 'usage'
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  Usage
                </button>
              </div>
            </nav>
          </div>

          {/* Settings Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile?.role || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>

                {/* Delete Account Section */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive email updates</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">File Upload Notifications</div>
                      <div className="text-sm text-gray-500">Get notified when files are uploaded</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.fileUploadNotifications}
                        onChange={(e) => setNotifications({...notifications, fileUploadNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">Share Notifications</div>
                      <div className="text-sm text-gray-500">Get notified when files are shared with you</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.shareNotifications}
                        onChange={(e) => setNotifications({...notifications, shareNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">Weekly Report</div>
                      <div className="text-sm text-gray-500">Receive weekly activity summary</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReport}
                        onChange={(e) => setNotifications({...notifications, weeklyReport: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">Security Alerts</div>
                      <div className="text-sm text-gray-500">Get notified about security events</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.securityAlerts}
                        onChange={(e) => setNotifications({...notifications, securityAlerts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleUpdateNotifications}
                    disabled={saving}
                    className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Organization Tab (Admin Only) */}
            {activeTab === 'organization' && profile?.role === 'admin' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Organization Settings</h2>
                
                <form onSubmit={handleUpdateOrganization} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Limit (GB)
                    </label>
                    <input
                      type="number"
                      value={orgStorageLimit}
                      onChange={(e) => setOrgStorageLimit(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter storage limit in GB"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Plan
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {profile.organization?.plan?.name || 'Free Plan'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${profile.organization?.plan?.priceUsd || 0}/month
                        </div>
                      </div>
                      <Link
                        href="/PricingPage"
                        className="px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium"
                      >
                        Upgrade Plan
                      </Link>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      value={profile.organization?.id || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* API Keys Tab (Admin Only) */}
            {activeTab === 'api' && profile?.role === 'admin' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">API Keys</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">API Key Management</h4>
                      <p className="text-sm text-blue-700">
                        API keys allow you to integrate your applications with our platform. Keep your keys secure and never share them publicly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">Production API Key</div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm font-mono text-gray-600">
                        sk_live_••••••••••••••••••••••••1234
                      </code>
                      <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50">
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date().toLocaleDateString()} • Last used: 2 hours ago
                    </div>
                  </div>

                  <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors font-medium flex items-center justify-center gap-2">
                    <Key className="w-5 h-5" />
                    Generate New API Key
                  </button>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Security Best Practices</h4>
                      <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Never commit API keys to version control</li>
                        <li>Rotate keys regularly (recommended: every 90 days)</li>
                        <li>Use environment variables to store keys</li>
                        <li>Revoke keys immediately if compromised</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Usage Statistics</h2>

                {usage && (
                  <div className="space-y-6">
                    {/* Storage Usage */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Storage</h3>
                        <span className="text-2xl font-bold text-gray-900">
                          {usage.storagePercentage}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${usage.storagePercentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{usage.storageUsedFormatted} used</span>
                        <span>{usage.storageLimitFormatted} total</span>
                      </div>
                    </div>

                    {/* File Count */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="text-sm text-gray-600 mb-2">Total Files</div>
                        <div className="text-3xl font-bold text-gray-900">{usage.fileCount}</div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="text-sm text-gray-600 mb-2">Traffic This Month</div>
                        <div className="text-3xl font-bold text-gray-900">{usage.trafficThisMonthFormatted}</div>
                      </div>
                    </div>

                    {/* Upgrade Notice */}
                    {parseFloat(usage.storagePercentage) > 80 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-orange-900 mb-1">Storage Almost Full</h4>
                            <p className="text-sm text-orange-700 mb-3">
                              You're using {usage.storagePercentage}% of your storage. Consider upgrading your plan to get more space.
                            </p>
                            <Link
                              href="/PricingPage"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                            >
                              Upgrade Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete your account? All your data, files, and settings will be permanently deleted.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;