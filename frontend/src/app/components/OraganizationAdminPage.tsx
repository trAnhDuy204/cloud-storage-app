import { useEffect, useState } from 'react';
import { 
  Info, BarChart3, Settings, Library, 
  Users, UsersRound, DollarSign, Link2, 
  Clock, AlertCircle
} from 'lucide-react';
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
  users: any[];
}

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('info');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //lấy token và user từ localStorage
  const user = getUser();
  const token = getToken();
  const organizationId = user.organizationId;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
    { id: 'info', icon: Info, label: 'Thông tin', active: true ,link: '/OrganizationAdminPage/info'},
    { id: 'statistic', icon: BarChart3, label: 'Statistic' ,link: '/OrganizationAdminPage/statistic'},
    { id: 'settings', icon: Settings, label: 'Cài đặt' ,link: '/OrganizationAdminPage'},
    { id: 'library', icon: Library, label: 'Thư viện' ,link: '/OrganizationAdminPage'},
    { id: 'users', icon: Users, label: 'Người dùng' ,link: '/OrganizationAdminPage/usersadmin'},
    { id: 'groups', icon: UsersRound, label: 'Hội Nhóm' ,link: '/OrganizationAdminPage'},
    { id: 'billing', icon: DollarSign, label: 'Billing' ,link: '/PricingPage'},
    { id: 'links', icon: Link2, label: 'Links' ,link: '/OrganizationAdminPage'},
    { id: 'logs', icon: Clock, label: 'Logs' ,link: '/OrganizationAdminPage'},
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Team Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Team Name Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Tên Nhóm</div>
                  <div className="text-lg font-semibold text-gray-900">{dashboardData.organization.name}</div>
                </div>
              </div>
            </div>

            {/* Plan Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {dashboardData.plan?.name.charAt(0) || 'F'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500"> Gói tài nguyên hiện tại</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {dashboardData.plan?.name || 'Free'}
                  </div>
                </div>
              </div>
            </div>

            {/* Organization ID Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ID</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">ID</div>
                  <div className="text-lg font-semibold text-gray-900">{dashboardData.organization.id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Active Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Tài khoản đang hoạt động</div>
              <div className="text-4xl font-bold text-gray-900">{dashboardData.stats.activeUsers}</div>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Tổng số tài khoản</div>
              <div className="text-4xl font-bold text-gray-900">{dashboardData.stats.totalUsers}</div>
            </div>

            {/* User Number Limit */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Tài khoản truy cập tối đa</div>
              <div className="text-4xl font-bold text-gray-900">{dashboardData.stats.userNumLimit}</div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Space Used */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Dung lượng sử dụng</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                {dashboardData.stats.spaceUsedPercentage.toFixed(2)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.stats.spaceUsedPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-500">
                {dashboardData.stats.storageUsed} / {dashboardData.stats.storageLimit}
              </div>
            </div>

            {/* Traffic This Month */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">Dung lượng phát sinh tháng này</div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                {dashboardData.stats.trafficPercentage.toFixed(2)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.stats.trafficPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-500">
                {dashboardData.stats.trafficThisMonth} / {dashboardData.stats.trafficLimit}
              </div>
            </div>
          </div>        
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;