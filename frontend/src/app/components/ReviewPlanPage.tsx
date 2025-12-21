import React, { useState, useEffect  } from 'react';
import { Check, X, CreditCard, Building2, ArrowLeft, Shield, Lock, Info, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import { getToken, getUser } from "../../app/utils/auth";

interface Plan {
  id: string;
  name: string;
  description?: string;
  priceUsd: number;
  storageLimitGb: number;
  maxUsers: number;
}

const ReviewPlanPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //lấy token và user từ localStorage
  const user = getUser();

  // Load plan from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        setSelectedPlan(plan);
      } catch (err) {
        setError('Không thể tải thông tin gói dịch vụ');
        console.error('Error parsing plan:', err);
      }
    } else {
      setError('Vui lòng chọn gói dịch vụ trước');
    }
  }, []);

  const getFeatures = (planName: string) => {
    const featuresMap = {
      'Free': [
        { name: 'Chia sẻ file căn bản', included: true },
        { name: 'Ứng dụng di động và máy tính', included: true },
        { name: 'Mã hóa đầu cuối', included: false },
        { name: 'Hỗ trợ ưu tiên', included: false },
        { name: 'Hợp tác nâng cao', included: false },
      ],
      'Normal': [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        { name: 'Chia sẻ file căn bản', included: true },
        { name: 'Ứng dụng di động và máy tính', included: true },
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ qua email', included: true },
        { name: 'Hợp tác nâng cao', included: false },
      ],
      'Pro': [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        { name: 'Chia sẻ file căn bản', included: true },
        { name: 'Ứng dụng di động và máy tính', included: true },
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ ưu tiên', included: true },
        { name: 'Hợp tác nâng cao', included: true },
      ],
      'Enterprise': [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        { name: 'Chia sẻ file căn bản', included: true },
        { name: 'Ứng dụng di động và máy tính', included: true },
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ ưu tiên 24/7', included: true },
        { name: 'Hợp tác nâng cao', included: true },
        { name: 'Xây dựng thương hiệu tùy chỉnh', included: true },
        { name: 'Người quản lý tài khoản chuyên dụng', included: true },
      ]
    };

    return featuresMap[planName as keyof typeof featuresMap] || [];
  };

  const calculateTotal = () => {
    if (!selectedPlan) return '0.00';
    if (billingCycle === 'yearly') {
      return (selectedPlan.priceUsd * 10).toFixed(2);
    }
    return selectedPlan.priceUsd.toFixed(2);
  };

  const getSavings = () => {
    if (!selectedPlan) return null;
    if (billingCycle === 'yearly' && selectedPlan.priceUsd > 0) {
      return (selectedPlan.priceUsd * 2).toFixed(2);
    }
    return null;
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    if (!selectedPlan) {
      alert('Không có thông tin gói dịch vụ');
      return;
    }

    setLoading(true);

    try {
      const organizationId = user?.organizationId;
      const userEmail = user?.email;

      if (paymentMethod === 'stripe') {
      // Gọi API tạo Stripe Checkout Session
      const response = await apiClient.post('/api/payment/stripe/create', {
        planId: selectedPlan.id,
        billingCycle: billingCycle,
        organizationId: organizationId,
        userEmail: userEmail
      });

      if (response.success) {
        // Lưu order info
        localStorage.setItem('pendingPayment', JSON.stringify({
          orderId: response.orderId,
          paymentId: response.paymentId,
          sessionId: response.sessionId,
          plan: selectedPlan,
          billingCycle: billingCycle,
          paymentMethod: 'stripe'
        }));

        // chuyển đến trang Checkout
        window.location.href = response.checkoutUrl;
      }
      } else if (paymentMethod === 'vnpay') {
        // Gọi API tạo vnpay Checkout Session
        const response = await apiClient.post('/api/payment/vnpay/create', {
          planId: selectedPlan.id,
          billingCycle: billingCycle,
          organizationId: organizationId
        });

        if (response.success) {
          // Lưu order info
          localStorage.setItem('pendingPayment', JSON.stringify({
            orderId: response.orderId,
            paymentId: response.paymentId,
            plan: selectedPlan,
            billingCycle: billingCycle
          }));

          //chuyển đến trang thanh toán VNPAY
          window.location.href = response.paymentUrl;
        }
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-red-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full cursor-pointer py-3 px-6 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors"
          >
            Quay lại trang Pricing
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-red-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xác nhận đăng ký gói dịch vụ
          </h1>
          <p className="text-gray-600">
            Xem lại thông tin và chọn phương thức thanh toán
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Plan Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Details Card */}
            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
              selectedPlan.name === 'Pro' ? 'border-2 border-orange-600' : 'border border-gray-200'
            }`}>
              <div className={`text-white px-6 py-4 ${
                selectedPlan.name === 'Free' ? 'bg-gray-600' :
                selectedPlan.name === 'Normal' ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500' :
                selectedPlan.name === 'Pro' ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500' :
                'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPlan.name}</h2>
                    <p className="text-blue-100">{selectedPlan.description || 'Cloud Storage Plan'}</p>
                  </div>
                  {selectedPlan.name === 'Pro' && (
                    <div className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Storage & Users */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedPlan.storageLimitGb >= 1000 
                          ? `${selectedPlan.storageLimitGb / 1000} TB` 
                          : `${selectedPlan.storageLimitGb} GB`}
                      </div>
                      <div className="text-sm text-gray-600">Dung lượng lưu trữ</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{selectedPlan.maxUsers}</div>
                      <div className="text-sm text-gray-600">Người dùng</div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Tính năng bao gồm:</h3>
                  <ul className="space-y-2">
                    {getFeatures(selectedPlan.name).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Billing Cycle Selection */}
                {selectedPlan.priceUsd > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Chu kỳ thanh toán:</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`p-4 cursor-pointer rounded-lg border-2 transition-all ${
                          billingCycle === 'monthly'
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">Hàng tháng</div>
                        <div className="text-2xl font-bold text-orange-600 mt-1">
                          ${selectedPlan.priceUsd.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">/ tháng</div>
                      </button>

                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`p-4 cursor-pointer rounded-lg border-2 transition-all relative ${
                          billingCycle === 'yearly'
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="absolute -top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Save 17%
                        </div>
                        <div className="font-semibold text-gray-900">Hàng năm</div>
                        <div className="text-2xl font-bold text-orange-600 mt-1">
                          ${(selectedPlan.priceUsd * 10).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">/ năm (10 tháng)</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selection - Only show for paid plans */}
            {selectedPlan.priceUsd > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Phương thức thanh toán</h3>
                
                <div className="space-y-3">
                  {/* Stripe */}
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`w-full cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'stripe'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'stripe' ? 'border-orange-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'stripe' && (
                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Stripe</div>
                        <div className="text-sm text-gray-600">Thẻ quốc tế (Visa, Mastercard, Amex)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
                        <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                    </div>
                  </button>

                  {/* VNPay */}
                  <button
                    onClick={() => setPaymentMethod('vnpay')}
                    className={`w-full cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'vnpay'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'vnpay' ? 'border-orange-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'vnpay' && (
                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">VNPay</div>
                        <div className="text-sm text-gray-600">Thẻ nội địa, QR Code, Mobile Banking</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">
                        VNPAY
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Gói dịch vụ:</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                {selectedPlan.priceUsd > 0 && (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Chu kỳ:</span>
                      <span className="font-semibold">
                        {billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                      </span>
                    </div>
                    {getSavings() && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Tiết kiệm:</span>
                        <span className="font-semibold">-${getSavings()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Tổng cộng:</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">
                      ${calculateTotal()}
                    </div>
                    {selectedPlan.priceUsd > 0 && (
                      <div className="text-sm text-gray-600">
                        {billingCycle === 'monthly' ? '/ tháng' : '/ năm'}
                      </div>
                    )}
                    {selectedPlan.priceUsd === 0 && (
                      <div className="text-sm text-green-600 font-medium">
                        Miễn phí
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 cursor-pointer w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      Tôi đã đọc và đồng ý với{' '}
                      <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                        Điều khoản dịch vụ
                      </a>{' '}
                      và{' '}
                      <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                        Chính sách bảo mật
                      </a>
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={(selectedPlan.priceUsd > 0 && !agreedToTerms) || loading}
                className={`w-full cursor-pointer py-4 rounded-lg font-semibold text-white transition-all ${
                  (selectedPlan.priceUsd === 0 || agreedToTerms) && !loading
                    ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </div>
                ) : (
                  selectedPlan.priceUsd === 0 ? 'Kích hoạt gói Free' : 'Xác nhận thanh toán'
                )}
              </button>

              {/* Security Badges */}
              {selectedPlan.priceUsd > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span>Mã hóa SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="w-5 h-5 text-blue-600" />
                    <span>Hoàn tiền trong 30 ngày</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Tôi có thể hủy đăng ký bất cứ lúc nào không?</h4>
              <p className="text-gray-600 text-sm">
                Có, bạn có thể hủy đăng ký bất cứ lúc nào. Dữ liệu của bạn sẽ được giữ lại trong 30 ngày.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Có được hoàn tiền không?</h4>
              <p className="text-gray-600 text-sm">
                Chúng tôi có chính sách hoàn tiền 100% trong vòng 30 ngày đầu tiên nếu bạn không hài lòng.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Thanh toán có an toàn không?</h4>
              <p className="text-gray-600 text-sm">
                Tất cả thanh toán đều được mã hóa và xử lý qua cổng thanh toán được chứng nhận PCI DSS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPlanPage;