import { useEffect, useState } from 'react';
import { 
  Info, BarChart3, Settings, Library, 
  Users, UsersRound, DollarSign, Link2, 
  Clock, AlertCircle, Download, Search,
  ChevronLeft, ChevronRight, Filter, 
  Upload as UploadIcon, Eye, Trash2,
  Activity, FileText, RefreshCw
} from 'lucide-react';
import Link from "next/link";
import { apiClient } from '../../../lib/api';

interface Log {
  id: string;
  operation?: string;
  action?: string;
  activityType?: string;
  bytes?: number;
  size?: string;
  createdAt?: string;
  timestamp?: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  file?: {
    id: string;
    name: string;
    mimeType: string;
  } | null;
  ipAddress?: string;
  userAgent?: string;
  targetType?: string;
  targetId?: string;
  details?: any;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const LogsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('logs');
  const [activeTab, setActiveTab] = useState<'traffic' | 'audit' | 'activities'>('traffic');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filterOperation, setFilterOperation] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterActivityType, setFilterActivityType] = useState('all');
  const [filterUserId, setFilterUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary data
  const [summary, setSummary] = useState<any>(null);

  const menuItems = [
    { id: 'info', icon: Info, label: 'Thông tin', link: '/OrganizationAdminPage/info' },
    { id: 'statistic', icon: BarChart3, label: 'Statistic', link: '/OrganizationAdminPage/statistic' },
    { id: 'users', icon: Users, label: 'Người dùng', link: '/OrganizationAdminPage/usersadmin' },
    { id: 'billing', icon: DollarSign, label: 'Billing', link: '/PricingPage' },
    { id: 'links', icon: Link2, label: 'Links', link: '/OrganizationAdminPage' },
    { id: 'logs', icon: Clock, label: 'Logs', link: '/OrganizationAdminPage/logs' },
  ];

  useEffect(() => {
    fetchLogs();
  }, [activeTab, pagination.page, filterOperation, filterAction, filterActivityType, filterUserId, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'traffic') {
      fetchSummary();
    }
  }, [activeTab, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      switch (activeTab) {
        case 'traffic':
          endpoint = '/api/logs/traffic';
          if (filterOperation !== 'all') params.append('operation', filterOperation);
          break;
        case 'audit':
          endpoint = '/api/logs/audit';
          if (filterAction !== 'all') params.append('action', filterAction);
          break;
        case 'activities':
          endpoint = '/api/logs/activities';
          if (filterActivityType !== 'all') params.append('activityType', filterActivityType);
          break;
      }

      if (filterUserId) params.append('userId', filterUserId);

      const response = await apiClient.get(`${endpoint}?${params.toString()}`);

      if (response.success) {
        const data = response.data;
        setLogs(data.logs || data.activities || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(`/api/logs/traffic/summary?${params.toString()}`);
      
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const token = localStorage.getItem('token');
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL}/api/logs/export?${params.toString()}&token=${token}`;
      link.download = `${activeTab}-logs.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed');
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'upload':
        return <UploadIcon className="w-4 h-4 text-blue-500" />;
      case 'download':
        return <Download className="w-4 h-4 text-green-500" />;
      case 'stream':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOperationBadgeColor = (operation: string) => {
    switch (operation) {
      case 'upload':
        return 'bg-blue-100 text-blue-800';
      case 'download':
        return 'bg-green-100 text-green-800';
      case 'stream':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery.length < 2) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user?.name?.toLowerCase().includes(query) ||
      log.user?.email?.toLowerCase().includes(query) ||
      log.file?.name?.toLowerCase().includes(query)
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchLogs}
            className="w-full py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
          >
            Retry
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
        <div className="px-6 py-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-orange-500">Admin</span>
        </div>

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
                    ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-medium' 
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
         {/* MOBILE HEADER */}
          <div className="lg:hidden h-14 bg-white border-b flex items-center px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {/* Hamburger */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-gray-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="ml-3 font-semibold text-gray-800">
              Dashboard
            </span>
          </div>
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                
              <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLogs}
                  className="px-4 py-2 border text-gray-700 cursor-pointer border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 cursor-pointer bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('traffic')}
                className={`pb-3 px-1 text-sm cursor-pointer font-medium border-b-2 transition-colors ${
                  activeTab === 'traffic'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Traffic Logs
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3 px-1 text-sm cursor-pointer font-medium border-b-2 transition-colors ${
                  activeTab === 'audit'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`pb-3 px-1 text-sm cursor-pointer font-medium border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                User Activities
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Operation Filter */}
              {activeTab === 'traffic' && (
                <select
                  value={filterOperation}
                  onChange={(e) => setFilterOperation(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Operations</option>
                  <option value="upload">Upload</option>
                  <option value="download">Download</option>
                  <option value="delete">Delete</option>
                </select>
              )}

              {/* Action Filter */}
              {activeTab === 'audit' && (
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              )}

              {/* Activity Type Filter */}
              {activeTab === 'activities' && (
                <select
                  value={filterActivityType}
                  onChange={(e) => setFilterActivityType(e.target.value)}
                  className="px-3 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Activities</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                </select>
              )}

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user, email, file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-gray-700 cursor-pointer text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards for Traffic */}
          {activeTab === 'traffic' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Traffic</div>
                <div className="text-2xl font-bold text-gray-900">{summary.total.totalSize}</div>
                <div className="text-xs text-gray-500 mt-1">{summary.total.count.toLocaleString()} operations</div>
              </div>
              {summary.byOperation.map((op: any) => (
                <div key={op.operation} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getOperationIcon(op.operation)}
                    <span className="text-sm text-gray-600 capitalize">{op.operation}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{op.totalSize}</div>
                  <div className="text-xs text-gray-500 mt-1">{op.count.toLocaleString()} operations</div>
                </div>
              ))}
            </div>
          )}

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">User</th>
                    {activeTab === 'traffic' && (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Operation</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">File</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Size</th>
                      </>
                    )}
                    {activeTab === 'audit' && (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Action</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Target</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">IP Address</th>
                      </>
                    )}
                    {activeTab === 'activities' && (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">Activity</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 uppercase">IP Address</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(log.createdAt || log.timestamp || '')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">{log.user?.email || 'N/A'}</div>
                        </td>
                        {activeTab === 'traffic' && (
                          <>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getOperationBadgeColor(log.operation || '')}`}>
                                {getOperationIcon(log.operation || '')}
                                {log.operation}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.file?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.size || '0 B'}
                            </td>
                          </>
                        )}
                        {activeTab === 'audit' && (
                          <>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>{log.targetType || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{log.targetId || ''}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {log.ipAddress || 'N/A'}
                            </td>
                          </>
                        )}
                        {activeTab === 'activities' && (
                          <>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.activityType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {log.ipAddress || 'N/A'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            pagination.page === page
                              ? 'bg-orange-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LogsPage;