import { useEffect, useState } from 'react';
import { 
  Info, BarChart3, Settings, Library, 
  Users, UsersRound, DollarSign, Link2, 
  Clock, AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from "next/link";
import { apiClient } from '../../../lib/api';
import { getToken, getUser } from "../../app/utils/auth";

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

interface StatisticsData {
  activeUsers: Array<{
    date: string;
    activeUsers: number;
  }>;
  storageUsage: Array<{
    date: string;
    storage: number;
  }>;
  fileCount: Array<{
    date: string;
    count: number;
  }>;
  traffic: Array<{
    date: string;
    traffic: number;
  }>;
}

const StatisticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('statistic');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [timeRange, setTimeRange] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  //lấy token và user từ localStorage
  const user = getUser();
  const token = getToken();
  const organizationId = '8594083b-d6f2-4d7f-b4d6-71864844eb16';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      fetchStatistics();
    }
  }, [timeRange, dashboardData]);

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

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('range', timeRange);
      
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const response = await apiClient.get(
        `/api/statistics/${organizationId}?${params.toString()}`
      );
      
      if (response.success) {
        setStatisticsData(response.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Don't set error state, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  };

  const menuItems = [
    { id: 'info', icon: Info, label: 'Thông tin', link: '/OrganizationAdminPage/info' },
    { id: 'statistic', icon: BarChart3, label: 'Statistic', link: '/OrganizationAdminPage/statistic' },
    { id: 'settings', icon: Settings, label: 'Cài đặt', link: '/OrganizationAdminPage' },
    { id: 'library', icon: Library, label: 'Thư viện', link: '/OrganizationAdminPage' },
    { id: 'users', icon: Users, label: 'Người dùng', link: '/OrganizationAdminPage/usersadmin' },
    { id: 'groups', icon: UsersRound, label: 'Hội Nhóm', link: '/OrganizationAdminPage' },
    { id: 'billing', icon: DollarSign, label: 'Billing', link: '/PricingPage' },
    { id: 'links', icon: Link2, label: 'Links', link: '/OrganizationAdminPage' },
    { id: 'logs', icon: Clock, label: 'Logs', link: '/OrganizationAdminPage' },
  ];

  const tabs = [
    { id: 'file', label: 'File' },
    { id: 'storage', label: 'Storage' },
    { id: 'users', label: 'Users' },
    { id: 'traffic', label: 'Traffic' },
  ];

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;
    
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  // Get chart data based on active tab
  const getChartData = () => {
    if (!statisticsData) return [];
    
    switch (activeTab) {
      case 'users':
        return statisticsData.activeUsers || [];
      case 'storage':
        return statisticsData.storageUsage || [];
      case 'file':
        return statisticsData.fileCount || [];
      case 'traffic':
        return statisticsData.traffic || [];
      default:
        return statisticsData.activeUsers || [];
    }
  };

  const getChartConfig = () => {
    switch (activeTab) {
      case 'users':
        return {
          dataKey: 'activeUsers',
          title: 'Active Users',
          label: 'Active Users',
        };
      case 'storage':
        return {
          dataKey: 'storage',
          title: 'Storage Usage',
          label: 'Storage (GB)',
        };
      case 'file':
        return {
          dataKey: 'count',
          title: 'File Count',
          label: 'Files',
        };
      case 'traffic':
        return {
          dataKey: 'traffic',
          title: 'Traffic',
          label: 'Traffic (MB)',
        };
      default:
        return {
          dataKey: 'activeUsers',
          title: 'Active Users',
          label: 'Active Users',
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
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
            className="w-full py-3 px-6 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const chartConfig = getChartConfig();
  const chartData = getChartData();

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
        {/* Header Tabs */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600"></div>
            </button>
            
            <div className="flex items-center gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    pb-3.5 px-1 cursor-pointer text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 ">
          {/* Time Range Controls */}
          <div className="mb-6 flex flex-wrap items-center gap-4 ">
            <div className="flex items-center gap-2 ">
              <button
                onClick={() => setTimeRange('7days')}
                className={`
                  px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '7days'
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }
                `}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`
                  px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '30days'
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }
                `}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('1year')}
                className={`
                  px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '1year'
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }
                `}
              >
                1 Year
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 cursor-pointer text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="yyyy-mm-dd"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 cursor-pointer text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="yyyy-mm-dd"
              />
              <button
                onClick={handleSubmit}
                className="px-6 py-2 cursor-pointer bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{chartConfig.title}</h2>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">{chartConfig.label}</span>
              </div>
            </div>

            {statsLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No data available for this period</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis}
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={chartConfig.dataKey}
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StatisticsPage;