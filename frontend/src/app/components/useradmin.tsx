import { useEffect, useState } from 'react';
import {
    Info, BarChart3, Settings, Library,
    Users, UsersRound, DollarSign, Link2,
    Clock, AlertCircle, Plus, Search, X
} from 'lucide-react';
import Link from "next/link";
import { apiClient } from '../../../lib/api';

interface DashboardData {
    organization: {
        id: string;
        name: string;
        storageLimitGb: number;
        createdAt: string;
    };
    plan: {
        id: string;
        name: string;
        priceUsd: number;
        storageLimitGb: number;
        maxUsers: number;
    } | null;
    stats: {
        activeUsers: number;
        totalUsers: number;
        userNumLimit: number;
        storageUsed: string;
        storageLimit: string;
        spaceUsedPercentage: number;
        storageUsedBytes: string;
        storageLimitBytes: string;
        fileCount: number;
        trafficThisMonth: string;
        trafficLimit: string;
        trafficPercentage: number;
    };
    subscription: any;
    users: User[];
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    storageUsed?: number;
    storageQuota?: number;
    createdAt: string;
    updatedAt: string;
}

const UsersAdmin = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState('users');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);

    // TODO: Get organizationId from auth context or session
    const organizationId = '8594083b-d6f2-4d7f-b4d6-71864844eb16';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/api/organizations/${organizationId}/dashboard`);

            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { id: 'info', icon: Info, label: 'Thông tin', link: '/OrganizationAdminPage/info' },
        { id: 'statistic', icon: BarChart3, label: 'Statistic', link: '/OrganizationAdminPage/statistic' },
        { id: 'settings', icon: Settings, label: 'Cài đặt', link: '/OrganizationAdminPage' },
        { id: 'library', icon: Library, label: 'Thư viện', link: '/OrganizationAdminPage' },
        { id: 'users', icon: Users, label: 'Người dùng', active: true, link: '/OrganizationAdminPage/usersadmin' },
        { id: 'groups', icon: UsersRound, label: 'Hội Nhóm', link: '/OrganizationAdminPage' },
        { id: 'billing', icon: DollarSign, label: 'Billing', link: '/PricingPage' },
        { id: 'links', icon: Link2, label: 'Links', link: '/OrganizationAdminPage' },
        { id: 'logs', icon: Clock, label: 'Logs', link: '/OrganizationAdminPage' },
    ];

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    const [newUser, setNewUser] = useState({
        organizationId: dashboardData?.organization.id,
        name: '',
        email: '',
        password: '',
        role: 'member',
    });

    // Get users from dashboardData
    const users = dashboardData?.users || [];

    // Format bytes to readable string
    const formatBytes = (bytes?: number): string => {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        const gb = mb / 1024;

        if (gb >= 1) return `${gb.toFixed(2)} GB`;
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${kb.toFixed(2)} KB`;
    };

    // Format date
    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    // Calculate time ago
    const timeAgo = (dateString?: string): string => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'a few seconds ago';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'admin' && user.role === 'admin');
        return matchesSearch && matchesTab;
    });

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsAddingUser(true);
            const response = await apiClient.post(`/api/users/${organizationId}`, {
                organizationId: newUser.organizationId,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
            });

            if (response.success) {
                // Refresh dashboard data to get updated users list
                await fetchDashboardData();
                setShowAddUserModal(false);
                setNewUser({ organizationId: '', name: '', email: '', password: '', role: 'member' });
                alert('User added successfully!');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to add user');
            console.error('Error adding user:', err);
        } finally {
            setIsAddingUser(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin cursor-pointer rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !dashboardData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không thể tải dữ liệu'}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-red-50">
            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Admin Label */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <span className="text-sm font-semibold text-orange-500">Admin</span>
                </div>

                {/* Menu Items */}
                <nav className="px-3 py-4 overflow-y-auto h-[calc(100vh-140px)]">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.link}
                                onClick={() => {
                                    setActiveMenu(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                  transition-colors duration-200
                  ${isActive
                                        ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white-900 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

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
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        {/* Action Buttons */}
                        <button
                            onClick={() => {
                                if (dashboardData?.stats.totalUsers >= dashboardData.stats.userNumLimit) {
                                    alert('Số lượng user đã đạt giới hạn tối đa!');
                                    return;
                                }
                                setShowAddUserModal(true);
                            }}
                            className={`px-4 py-2 cursor-pointer border border-gray-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-2
                                ${dashboardData?.stats.totalUsers >= dashboardData?.stats.userNumLimit
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }
                            `}
                            disabled={dashboardData?.stats.totalUsers >= dashboardData?.stats.userNumLimit}
                        >
                            <Plus className="w-4 h-4" />
                            Add user
                        </button>
                    </div>


                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Stats Summary */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {dashboardData.stats.activeUsers} active / {dashboardData.stats.totalUsers} total users
                                {dashboardData.stats.userNumLimit && ` (Limit: ${dashboardData.stats.userNumLimit})`}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-3 px-1 cursor-pointer text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                                    ? 'border-orange-500 text-orange-500'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            All ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`pb-3 px-1 cursor-pointer text-sm font-medium border-b-2 transition-colors ${activeTab === 'admin'
                                    ? 'border-orange-500 text-orange-500'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Admin ({users.filter(u => u.role === 'admin').length})
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                        Name
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                        Role
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                        Status
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                        Space Used / Quota
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                        Created At / Last Login
                                    </th>
                                    <th className="w-12 px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div>
                                                <a href='#'>
                                                    <div className="text-sm font-medium text-orange-600 hover:text-orange-700 cursor-pointer">
                                                        {user.name || 'N/A'}
                                                    </div>
                                                </a>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {formatBytes(dashboardData.stats.storageUsed as unknown as number) || '0 KB'} / {formatBytes(dashboardData.stats.storageLimitBytes as unknown as number)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-700">{formatDate(user.createdAt)}</div>
                                            <div className="text-xs text-gray-500">{timeAgo(user.updatedAt)}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No users found</p>
                                {searchQuery && (
                                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isAddingUser}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter user name"
                                    disabled={isAddingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="user@example.com"
                                    disabled={isAddingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter password"
                                    disabled={isAddingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    disabled={isAddingUser}
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                disabled={isAddingUser}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="px-6 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={isAddingUser}
                            >
                                {isAddingUser && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                {isAddingUser ? 'Adding...' : 'Add User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersAdmin;