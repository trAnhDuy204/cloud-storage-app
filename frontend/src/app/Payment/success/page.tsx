'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { apiClient } from '../../../../lib/api';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id'); // Stripe
  const orderId = searchParams.get('order_id') || searchParams.get('orderId'); // Cả 2
  const [verifying, setVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Nếu có session_id thì là Stripe
        if (sessionId) {
          const response = await apiClient.get(
            `/api/payment/stripe/verify?session_id=${sessionId}&order_id=${orderId}`
          );
          setPaymentData(response);
        }
        // Clear pending payment
        localStorage.removeItem('pendingPayment');
        localStorage.removeItem('selectedPlan');
      } catch (error) {
        console.error('Verify error:', error);
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [sessionId, orderId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Thanh toán thành công!
        </h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã đăng ký dịch vụ của chúng tôi.
        </p>
        
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-1">Mã đơn hàng</div>
            <div className="font-mono font-semibold text-gray-900">{orderId}</div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/OrganizationAdminPage'}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Về trang quản lý
          </button>
          <button
            onClick={() => window.location.href = '/OrganizationAdminPage'}
            className="w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
