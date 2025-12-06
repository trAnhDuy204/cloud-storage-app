import { use, useState } from 'react';
import { 
  Cloud, Shield, Zap, Users, Globe, Lock, 
  CheckCircle, ArrowRight, Menu, X, Star,
  Smartphone, Monitor, Folder, Share2, Clock
} from 'lucide-react';
import test from 'node:test';

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = {
    vi: {
      button: "VN",
      Features: "Tính năng",
      Pricing: "Giá cả",
      About: "Về chúng tôi",
      Contact: "Liên hệ",
      SignIn: "Đăng nhập",
      GetStarted: "Bắt đầu",
      SecureCloudStorageforTeams: "Lưu trữ đám mây an toàn cho nhóm",
      solusion: "Giải pháp đồng bộ và chia sẻ tệp cấp doanh nghiệp với mã hóa đầu cuối. Cộng tác an toàn và truy cập tệp của bạn ở bất cứ đâu.",
      StartFreeTrial: "Bắt đầu dùng thử miễn phí",
      LearnMore: "Tìm hiểu thêm",
      NoCreditCardRequired: "Không cần thẻ tín dụng",
      Freetrial: "Dùng thử miễn phí",
      Desktop: "Máy tính để bàn",
      Mobile: "Di động",
      EverythingYouNeedForSecureFileManagement: "Mọi thứ bạn cần để quản lý tệp an toàn",
      PowerfulFeaturesDesignedForTeams: "Các tính năng mạnh mẽ được thiết kế cho các nhóm và doanh nghiệp coi trọng bảo mật và cộng tác",
      BuiltForYourWorkflow: "Xây dựng cho quy trình làm việc của bạn",
      FlexibleSolutionsForEveryWseCase: "Giải pháp linh hoạt cho mọi trường hợp sử dụng",
      TrustedByThousandsOfTeams: "Được hàng nghìn nhóm tin tưởng",
      SeeWhatOurCustomersHaveToSay: "Xem những gì khách hàng của chúng tôi nói",
      ReadyToGetStarted: "Sẵn sàng để bắt đầu?",
      Join: "Tham gia hàng nghìn nhóm sử dụng Seafile để lưu trữ đám mây an toàn",
      ContactSales: "Liên hệ bộ phận bán hàng",
      feature1: 'Bảo mật cấp doanh nghiệp',
      description1: 'Mã hóa đầu cuối đảm bảo dữ liệu của bạn luôn riêng tư và an toàn mọi lúc.',
      feature2: 'Đồng bộ nhanh như chớp',
      description2: 'Đồng bộ tệp tức thì trên tất cả các thiết bị của bạn với hiệu suất được tối ưu hóa.',
      feature3: 'Cộng tác nhóm',
      description3: 'Chia sẻ tệp và cộng tác liền mạch với các thành viên trong nhóm của bạn trong thời gian thực.',
      feature4: 'Truy cập ở bất cứ đâu',
      description4: 'Truy cập tệp của bạn từ bất kỳ thiết bị nào, bất cứ nơi nào trên thế giới, vào bất kỳ thời gian nào.',
      feature5: 'Ưu tiên quyền riêng tư',
      description5: 'Dữ liệu của bạn vẫn là của bạn. Chúng tôi không bao giờ truy cập hoặc quét tệp của bạn.',
      feature6: 'Lưu trữ không giới hạn',
      description6: 'Mở rộng lưu trữ của bạn khi doanh nghiệp của bạn phát triển mà không có giới hạn.',
      useCase1: 'Quản lý tệp',
      descriptionUseCase1: 'Tổ chức và quản lý tệp của bạn với giao diện trực quan',
      useCase2: 'Chia sẻ tệp',
      descriptionUseCase2: 'Chia sẻ tệp một cách an toàn với bảo vệ mật khẩu và ngày hết hạn',
      useCase3: 'Cộng tác nhóm',
      descriptionUseCase3: 'Làm việc cùng nhau trên tài liệu với kiểm soát phiên bản',
      useCase4: 'Lịch sử phiên bản',
      descriptionUseCase4: 'Không bao giờ mất công việc với theo dõi phiên bản tự động',
      content1: 'Hellfile đã thay đổi cách nhóm của chúng tôi cộng tác. Các tính năng bảo mật mang lại cho chúng tôi sự yên tâm.',
      content2: 'Giải pháp lưu trữ đám mây tốt nhất mà chúng tôi từng sử dụng. Nhanh, đáng tin cậy và đồng bộ hoàn hảo.',
      content3: 'Cách tiếp cận ưu tiên quyền riêng tư và mã hóa đầu cuối khiến nó trở nên hoàn hảo cho dữ liệu nhạy cảm.',
    },
    en: {
      button: "EN",
      Features: "Features",
      Pricing: "Pricing",
      About: "About",
      Contact: "Contact",
      SignIn: "Sign In",
      GetStarted: "Get Started",
      SecureCloudStorageforTeams: "Secure Cloud Storage for Teams",
      solusion: "Enterprise-grade file sync and share solution with end-to-end encryption. Collaborate securely and access your files anywhere.",
      StartFreeTrial: "Start Free Trial",
      LearnMore: "Learn More",
      NoCreditCardRequired: "No credit card required",
      Freetrial: "Free trial",
      Desktop: "Desktop",
      Mobile: "Mobile",
      EverythingYouNeedForSecureFileManagement: "Everything you need for secure file management",
      PowerfulFeaturesDesignedForTeams: "Powerful features designed for teams and enterprises who value security and collaboration",
      BuiltForYourWorkflow: "Built for your workflow",
      FlexibleSolutionsForEveryWseCase: "Flexible solutions for every use case",
      TrustedByThousandsOfTeams: "Trusted by thousands of teams",
      SeeWhatOurCustomersHaveToSay: "See what our customers have to say",
      ReadyToGetStarted: "Ready to get started?",
      Join: "Join thousands of teams using Seafile for secure cloud storage",
      ContactSales: "Contact Sales",
      feature1: 'Enterprise-Grade Security',
      description1: 'End-to-end encryption ensures your data remains private and secure at all times.',
      feature2: 'Lightning Fast Sync',
      description2: 'Instant file synchronization across all your devices with optimized performance.',
      feature3: 'Team Collaboration',
      description3: 'Share files and collaborate seamlessly with your team members in real-time.',
      feature4: 'Access Anywhere',
      description4: 'Access your files from any device, anywhere in the world, at any time.',
      feature5: 'Privacy First',
      description5: 'Your data stays yours. We never access or scan your files.',
      feature6: 'Unlimited Storage',
      description6: 'Scale your storage as your business grows without limitations.',
      useCase1: 'File Management',
      descriptionUseCase1: 'Organize and manage your files with an intuitive interface',
      useCase2: 'File Sharing',
      descriptionUseCase2: 'Share files securely with password protection and expiry dates',
      useCase3: 'Team Collaboration',
      descriptionUseCase3: 'Work together on documents with version control',
      useCase4: 'Version History',
      descriptionUseCase4: 'Never lose work with automatic version tracking',
      content1: 'Hellfile has transformed how our team collaborates. The security features give us peace of mind.',
      content2: 'Best cloud storage solution we\'ve used. Fast, reliable, and the sync is flawless.',
      content3: 'The privacy-first approach and end-to-end encryption make it perfect for sensitive data.',
    }
  };

  const current = t[lang];

  const features = [
    {
      icon: Shield,
      title: current.feature1,
      description: current.description1
    },
    {
      icon: Zap,
      title: current.feature2,
      description: current.description2
    },
    {
      icon: Users,
      title: current.feature3,
      description: current.description3
    },
    {
      icon: Globe,
      title: current.feature4,
      description: current.description4
    },
    {
      icon: Lock,
      title: current.feature5,
      description: current.description5
    },
    {
      icon: Cloud,
      title: current.feature6,
      description: current.description6
    }
  ];

  const useCases = [
    {
      icon: Folder,
      title: current.useCase1,
      description: current.descriptionUseCase1
    },
    {
      icon: Share2,
      title: current.useCase2,
      description: current.descriptionUseCase2
    },
    {
      icon: Users,
      title: current.useCase3,
      description: current.descriptionUseCase3
    },
    {
      icon: Clock,
      title: current.useCase4,
      description: current.descriptionUseCase4
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CTO at TechCorp',
      content: current.content1,
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      content: current.content2,
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Team Lead',
      content: current.content3,
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a href='/' className='cursor-pointer'>
              <div className="flex items-center gap-2">
                <img src="/Hellfile.ico" alt="Hellfile Logo" className='w-15 h-15' />
                <span className="text-2xl font-bold text-gray-900">Hellfile</span>
              </div>
            </a>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-orange-600 transition-colors">{current.Features}</a>
              <a href="#pricing" className="text-gray-700 hover:text-orange-600 transition-colors">{current.Pricing}</a>
              <a href="#about" className="text-gray-700 hover:text-orange-600 transition-colors">{current.About}</a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors">{current.Contact}</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setLang(lang === "vi" ? "en" : "vi")}
                className="px-4 py-2 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg"
              >
                {current.button}
              </button>
              
              <a href="/login" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                {current.SignIn}
              </a>
              <a 
                href="/pricing" 
                className="px-6 py-2 text-white rounded-lg font-medium bg-linear-to-r from-orange-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-colors">
                {current.GetStarted}
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-orange-600 py-2">{current.Features}</a>
              <a href="#pricing" className="block text-gray-700 hover:text-orange-600 py-2">{current.Pricing}</a>
              <a href="#about" className="block text-gray-700 hover:text-orange-600 py-2">{current.About}</a>
              <a href="#contact" className="block text-gray-700 hover:text-orange-600 py-2">{current.Contact}</a>
              <div className="pt-3 border-t border-gray-200">
                <a href="/login" className="block text-gray-700 hover:text-orange-600 py-2">{current.SignIn}</a>
                <a href="/pricing" className="block bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg py-2 text-center mt-2">
                  {current.GetStarted}
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {current.SecureCloudStorageforTeams}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {current.solusion}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/pricing" 
                  className="px-8 py-4 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 transition-all text-lg font-semibold flex items-center justify-center gap-2 group"
                >
                  {current.StartFreeTrial}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="#features" 
                  className="px-8 py-4 bg-white text-gray-900 rounded-lg border-2 border-gray-200 hover:border-orange-600 transition-all text-lg font-semibold"
                >
                  {current.LearnMore}
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{current.NoCreditCardRequired}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{current.Freetrial}</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative ">
              <div className="bg-linear-to-br from-blue-100 to-purple-100 rounded-3xl p-8 shadow-2xl hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Project Files</div>
                      <div className="text-sm text-gray-500">24 files, 1.2 GB</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <Monitor className="w-8 h-8 text-orange-500 mb-2" />
                    <div className="text-sm font-medium text-gray-900">{current.Desktop}</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <Smartphone className="w-8 h-8 text-yellow-500 mb-2" />
                    <div className="text-sm font-medium text-gray-900">{current.Mobile}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {current.EverythingYouNeedForSecureFileManagement}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {current.PowerfulFeaturesDesignedForTeams}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100"
                >
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {current.BuiltForYourWorkflow}
            </h2>
            <p className="text-xl text-gray-600">
              {current.FlexibleSolutionsForEveryWseCase}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100">
                  <div className="w-12 h-12 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {current.TrustedByThousandsOfTeams}
            </h2>
            <p className="text-xl text-gray-600">
              {current.SeeWhatOurCustomersHaveToSay}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {current.ReadyToGetStarted}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {current.Join}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/pricing" 
              className="px-8 py-4 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition-all text-lg font-semibold"
            >
              {current.Freetrial}
            </a>
            <a 
              href="https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=CllgCKCBkQvLLMldpxWqMqxCfbSMWBTVnMfwcJpsqNxNShRLKqBHfvGbqPBRpNwWRFZgPmVdchg" 
              className="px-8 py-4 bg-transparent text-white rounded-lg border-2 border-white hover:bg-white/10 transition-all text-lg font-semibold"
            >
              {current.ContactSales}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;