'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentFailure() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    setCode(searchParams.get('code'));
    setReason(searchParams.get('reason'));
  }, [searchParams]);

  const errorMessages: Record<string, string> = {
    '07': 'Giao dịch bị nghi ngờ gian lận',
    '09': 'Thẻ chưa đăng ký dịch vụ',
    '10': 'Xác thực thông tin không chính xác',
    '11': 'Hết hạn chờ thanh toán',
    '12': 'Thẻ bị khóa',
    '13': 'Sai mật khẩu xác thực',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư',
    '65': 'Vượt quá hạn mức giao dịch',
    '75': 'Ngân hàng bảo trì',
    '79': 'Sai mật khẩu quá số lần quy định',
    default: 'Giao dịch thất bại'
  };

  const message = code? errorMessages[code] || errorMessages.default: 'Có lỗi xảy ra';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {code && (
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-red-600">Mã lỗi: {code}</div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/ReviewPlanPage'}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.href = '/OrganizationAdminPage'}
            className="w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Quay lại trang quản lý
          </button>
        </div>
      </div>
    </div>
  );
}
//Test Stripe

//**Test với thẻ test:**
//```
//Card number: 4242 4242 4242 4242
//Expiry: Any future date (e.g., 12/34)
//CVC: Any 3 digits (e.g., 123)
//ZIP: Any 5 digits (e.g., 12345)