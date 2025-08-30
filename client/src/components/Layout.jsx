import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import { getLanguageFromPath } from '../i18n/config';
import '../styles/dropdown.css';
import ColorfulLogo from './ColorfulLogo';
import AnimatedLogo from './AnimatedLogo';
import MobileNav from './MobileNav';
import { 
  Menu, 
  X, 
  Sparkles, 
  Image, 
  Grid3x3, 
  User, 
  CreditCard,
  LogOut,
  Settings,
  Frame,
  Shield,
  ShoppingCart
} from 'lucide-react';
import Cart from './Cart';
import useCartStore from '../stores/cartStore';

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openCart, getItemCount } = useCartStore();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = getItemCount();

  // Get current language from path
  const currentLang = getLanguageFromPath(location.pathname) || 'en';

  // Helper function to create localized links
  const createLocalizedLink = (path) => {
    return `/${currentLang}${path}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm sticky top-0 z-50">
        <nav className="container-custom">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createLocalizedLink('/')} className="flex items-center space-x-2">
              <AnimatedLogo 
                className="w-10 h-10" 
                alt={t('site.name')}
                triggerAnimation={true}
              />
              <ColorfulLogo className="text-xl" />
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-8">
              <Link to={createLocalizedLink('/image-style-transfer')} className="flex items-center space-x-1 text-gray-700 hover:text-blue-500 transition group">
                <Sparkles className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                <span>{t('navigation.generate')}</span>
              </Link>
{/* Временно отключено
              <Link to="/gallery" className="flex items-center space-x-1 text-gray-700 hover:text-orange-500 transition group">
                <Grid3x3 className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
                <span>Gallery</span>
              </Link>
              */}
              <Link to={createLocalizedLink('/pricing')} className="flex items-center space-x-1 text-gray-700 hover:text-orange-500 transition group">
                <CreditCard className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
                <span>{t('navigation.pricing')}</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {/* Cart Icon - Only show when items exist */}
              {itemCount > 0 && (
                <button
                  onClick={openCart}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors animate-fadeIn"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                    {itemCount}
                  </span>
                </button>
              )}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                      {user?.totalCredits || 0} Credits
                    </div>
                  </div>
                  <div className="relative dropdown-trigger">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                    <div className="dropdown-menu">
                      <button 
                        onClick={() => {
                          navigate(createLocalizedLink('/profile'));
                        }} 
                        className="dropdown-item"
                      >
                        <User className="w-4 h-4" />
                        <span>{t('navigation.profile')}</span>
                      </button>
                      <button 
                        onClick={() => {
                          navigate(createLocalizedLink('/profile'));
                          // Можно добавить параметр для автоматического переключения на вкладку settings
                          setTimeout(() => {
                            const settingsTab = document.querySelector('[data-tab="settings"]');
                            if (settingsTab) settingsTab.click();
                          }, 100);
                        }} 
                        className="dropdown-item"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('navigation.settings')}</span>
                      </button>
                      {user?.email === 'unitradecargo@gmail.com' && (
                        <button 
                          onClick={() => {
                            navigate(createLocalizedLink('/admin'));
                          }} 
                          className="dropdown-item"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </button>
                      )}
                      <div className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-item text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span>{t('navigation.logout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to={createLocalizedLink('/login')} className="text-gray-700 hover:text-primary-500 transition">
                    {t('navigation.login')}
                  </Link>
                  <Link to={createLocalizedLink('/register')} className="btn btn-primary">
                    {t('navigation.register')}
                  </Link>
                </div>
              )}
            </div>

          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Cart Component */}
      <Cart />

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AnimatedLogo 
                  className="w-10 h-10" 
                  alt="СolibRRRi Logo"
                  triggerAnimation={false}
                />
                <ColorfulLogo className="text-xl" />
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {t('footer.description')}
              </p>
              <p className="text-gray-500 text-xs mb-4">{t('footer.copyright', { siteName: t('site.name') })}</p>
              {/* Social Icons */}
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.595 15.485c-.147.374-.634.505-.967.371-2.614-1.596-5.902-1.958-9.785-1.073-.371.084-.743-.147-.827-.518-.084-.374.147-.743.518-.827 4.237-.968 7.873-.551 10.804 1.241.334.134.459.593.257.806zm1.376-3.06c-.184.47-.795.644-1.241.459-2.997-1.845-7.566-2.376-11.105-1.301-.47.143-.966-.117-1.109-.587-.143-.47.117-.966.587-1.109 4.053-1.233 9.096-.634 12.549 1.487.446.273.594.802.319 1.251zm.121-3.184c-3.594-2.133-9.523-2.33-12.953-1.289-.553.167-1.139-.155-1.305-.709-.167-.553.155-1.139.709-1.305 3.935-1.195 10.482-.965 14.616 1.493.496.295.659.944.365 1.44-.295.497-.945.66-1.432.37z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">{t('footer.company.title')}</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to={createLocalizedLink('/terms')} className="hover:text-gray-900 transition">{t('footer.company.terms')}</Link></li>
                <li><Link to={createLocalizedLink('/privacy')} className="hover:text-gray-900 transition">{t('footer.company.privacy')}</Link></li>
                <li><Link to={createLocalizedLink('/cookies')} className="hover:text-gray-900 transition">{t('footer.company.cookies')}</Link></li>
                <li><Link to={createLocalizedLink('/contact')} className="hover:text-gray-900 transition">{t('footer.company.contact')}</Link></li>
              </ul>
            </div>
            
            {/* Image Generators */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">Image Generators</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to={createLocalizedLink('/anime-generator')} className="hover:text-gray-900 transition">{t('footer.tools.anime_portrait')}</Link></li>
                <li><Link to={createLocalizedLink('/image-to-image-generator')} className="hover:text-gray-900 transition">{t('footer.tools.image_to_image')}</Link></li>
                <li><Link to={createLocalizedLink('/image-style-transfer')} className="hover:text-gray-900 transition">{t('footer.tools.style_transfer')}</Link></li>
                <li><Link to={createLocalizedLink('/pet-portrait-generator')} className="hover:text-gray-900 transition">AI Pet Portrait Generator</Link></li>
                <li><Link to={createLocalizedLink('/text-to-image-generator')} className="hover:text-gray-900 transition">AI Text To Image Generator</Link></li>
              </ul>
            </div>

            {/* Video Generators */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">Video Generators</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to={createLocalizedLink('/ai-video-generator')} className="hover:text-gray-900 transition">AI Video Generator</Link></li>
                <li><Link to={createLocalizedLink('/video-modification-generator')} className="hover:text-gray-900 transition">AI Video Modification Generator</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;