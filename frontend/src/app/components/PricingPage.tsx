import React, { useEffect, useState } from 'react';
import { Check, X, Users, HardDrive, Zap, Shield, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import { useRouter } from 'next/navigation';

interface Plan {
  id: number;
  name: string;
  priceUsd: number;
  storageLimitGb: number;
  maxUsers: number;
}

interface PlanWithFeatures extends Plan {
  description: string;
  popular: boolean;
  features: { name: string; included: boolean; }[];
}

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await apiClient.get('/api/plans');
        
        if (response.success) {
          // Map database plans với features
          const plansWithFeatures = response.plans.map((plan: Plan) => ({
            ...plan,
            description: getDescription(plan.name),
            popular: plan.name === 'Pro', // Pro là popular
            features: getFeatures(plan.name)
          }));
          
          setPlans(plansWithFeatures);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlans();
  }, []);

  // Helper function: Get description based on plan name
  const getDescription = (planName: string): string => {
    const descriptions: { [key: string]: string } = {
      'Free': 'Thích hợp cho cá nhân',
      'Normal': 'Tốt cho các nhóm nhỏ',
      'Pro': 'Phù hợp cho chuyên nghiệp',
      'Enterprise': 'Giải pháp cho doanh nghiệp lớn'
    };
    return descriptions[planName] || 'Choose this plan';
  };

  // Helper function: Get features based on plan name
  const getFeatures = (planName: string) => {
    const baseFeatures = [
      { name: 'Chia sẻ file căn bản', included: true },
      { name: 'Ứng dụng di động và máy tính', included: true },
    ];

    if (planName === 'Free') {
      return [
        ...baseFeatures,
        { name: 'Mã hóa đầu cuối', included: false },
        { name: 'Hỗ trợ ưu tiên', included: false },
        { name: 'Hợp tác nâng cao', included: false },
      ];
    }

    if (planName === 'Normal') {
      return [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        ...baseFeatures,
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ qua email', included: true },
        { name: 'Hợp tác nâng cao', included: false },
      ];
    }

    if (planName === 'Pro') {
      return [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        ...baseFeatures,
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ ưu tiên', included: true },
        { name: 'Hợp tác nâng cao', included: true },
      ];
    }

    if (planName === 'Enterprise') {
      return [
        { name: 'Chia sẻ tập tin nâng cao', included: true },
        ...baseFeatures,
        { name: 'Mã hóa đầu cuối', included: true },
        { name: 'Hỗ trợ ưu tiên 24/7', included: true },
        { name: 'Hợp tác nâng cao', included: true },
        { name: 'Xây dựng thương hiệu tùy chỉnh', included: true },
        { name: 'Người quản lý tài khoản chuyên dụng', included: true },
      ];
    }

    return baseFeatures;
  };

  const getPrice = (price: number) => {
    if (billingCycle === 'yearly') {
      return (price * 10).toFixed(2);
    }
    return price.toFixed(2);
  };

  const getSavings = (price: number) => {
    if (billingCycle === 'yearly' && price > 0) {
      const yearlySavings = price * 2;
      return `Save $${yearlySavings.toFixed(2)}/year`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải tài nguyên...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Đơn giản, minh bạch giá cả
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Hãy chọn gói phù hợp với bạn và nhóm của bạn. Nâng cấp, hạ cấp hoặc hủy bất cứ lúc nào.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 cursor-pointer rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white'
                  : 'text-gray-700 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 cursor-pointer rounded-full font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white'
                  : 'text-gray-700 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600'
              }`}
            >
              Năm
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-orange-600' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${getPrice(plan.priceUsd)}
                    </span>
                    {plan.priceUsd > 0 && (
                      <span className="ml-2 text-gray-600">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  {getSavings(plan.priceUsd) && (
                    <p className="text-green-600 text-sm mt-1 font-medium">
                      {getSavings(plan.priceUsd)}
                    </p>
                  )}
                </div>

                {/* Key Stats */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center text-gray-700">
                    <HardDrive className="w-5 h-5 mr-3 text-orange-600" />
                    <span className="font-medium">{plan.storageLimitGb} GB Lưu trữ</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-orange-600" />
                    <span className="font-medium">
                      {plan.maxUsers} {plan.maxUsers === 1 ? 'User' : 'Users'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 mr-3 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.priceUsd !== 0 && (
                  <button
                    onClick={() => {
                      const planData = {
                        id: plan.id,
                        name: plan.name,
                        priceUsd: plan.priceUsd,
                        storageLimitGb: plan.storageLimitGb,
                        maxUsers: plan.maxUsers,
                        description: plan.description
                      };
                      localStorage.setItem('selectedPlan', JSON.stringify(planData));
                      console.log('Selected Plan:', plan);
                      router.push('/ReviewPlanPage');
                    }}
                    className={`w-full cursor-pointer py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                      ? 'bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white hover:from-red-600 hover:via-orange-600 hover:to-yellow-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Change Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <Shield className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h4 className="font-semibold text-gray-900 mb-2">Bảo mật & mã hóa</h4>
            <p className="text-gray-600 text-sm">
              Mã hóa đầu cuối cho tất cả các tệp của bạn
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <Zap className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h4 className="font-semibold text-gray-900 mb-2">Tốc độ tải nhanh</h4>
            <p className="text-gray-600 text-sm">
              Tải lên và đồng bộ hóa các tập tin với tốc độ cực nhanh
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <Users className="w-12 h-12 mx-auto mb-4 text-orange-600" />
            <h4 className="font-semibold text-gray-900 mb-2">Hợp tác nhóm</h4>
            <p className="text-gray-600 text-sm">
              Làm việc liền mạch với nhóm của bạn trên các tệp được chia sẻ
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Đặt câu hỏi cho chúng tôi?{' '}
            <a href="https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=CllgCKCBkQvLLMldpxWqMqxCfbSMWBTVnMfwcJpsqNxNShRLKqBHfvGbqPBRpNwWRFZgPmVdchg" className="text-orange-600 font-semibold hover:text-orange-700">
              Kết nối với bộ phận hỗ trợ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;