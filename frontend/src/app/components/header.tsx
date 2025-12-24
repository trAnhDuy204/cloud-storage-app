'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { 
  Settings, Menu, X, LogOut, AlertCircle
} from 'lucide-react';
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

export default function Header() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    const t = getToken();

    if (!u || !t) {
      setLoading(false);
      return;
    }

    setUser(u);
    setToken(t);
    setOrganizationId(u.organizationId);
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    fetchDashboardData();
  }, [organizationId]);

  const userName = user?.name;
  
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
  

  const handleLogout = async () => {
  try {
    await apiClient.post('/api/logout', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Logout tracking failed:', err);
  } finally {
    // Xóa token sau cùng
    localStorage.removeItem('token');

    // Redirect về login
    window.location.href = '/login';
  }
};

  
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

  if (!user || !token) {
    return <div>Vui lòng đăng nhập</div>;
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/Hellfile.ico" alt="Hellfile Logo" className='w-15 h-15' />
          <span className="text-xl font-semibold text-gray-800">Hellfile</span>
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right">
          <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs text-gray-500">
              Đã dùng {dashboardData.stats.storageUsed} / {dashboardData.stats.storageLimit}
            </div>
          </div>

          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:bg-gray-300 transition-colors">
  {user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={userName}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <span className="text-sm font-semibold text-gray-700">
      {userName?.charAt(0)?.toUpperCase() || "?"}
    </span>
  )}
</button>


          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <a href="/SettingPage" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Settings className="w-4 h-4" />
              Cài đặt
            </a>

            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <LogOut className="w-4 h-4" />
              Thoát trang quản trị
            </a>

            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
