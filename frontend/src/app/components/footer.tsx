export default function Footer() {
  return (
    <footer className="bg-red-950 text-red-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/Hellfile.png" alt="Hellfile Logo" className='w-75 h-75' />
              </div>
              <p className="text-sm text-red-500">
                Secure cloud storage for teams and enterprises
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-red-500 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-500 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=CllgCKCBkQvLLMldpxWqMqxCfbSMWBTVnMfwcJpsqNxNShRLKqBHfvGbqPBRpNwWRFZgPmVdchg" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-500 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-red-800 pt-8 text-center text-sm text-red-400">
            <p>&copy; 2025 Seafile. All rights reserved.</p>
          </div>
        </div>
    </footer>
  );
}
