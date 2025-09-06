import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScrollToTop from '../hooks/useScrollToTop';
import { 
  Menu, 
  X, 
  Home,
  Sparkles,
  Image,
  Palette,
  Grid3x3,
  CreditCard,
  User,
  LogOut,
  Settings,
  ChevronRight,
  Frame,
  ShoppingCart
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import ColorfulLogo from './ColorfulLogo';
import useCartStore from '../stores/cartStore';

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  // Use scroll to top hook
  useScrollToTop();

  // Function to handle menu link clicks with scroll to top
  const handleMenuLinkClick = () => {
    setIsOpen(false);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/image-style-transfer', label: 'Generate', icon: Sparkles },
    { path: '/anime-generator', label: 'Anime', icon: Image },
    { path: '/image-to-image-generator', label: 'Image to Image', icon: Palette },
    { path: '/pet-portrait-generator', label: 'Pet Portraits', icon: Image },
    { path: '/text-to-image-generator', label: 'Text to Image', icon: Sparkles },
    // Video generator moved to .ignore folder
    // { path: '/video-modification-generator', label: 'Video Modification', icon: Image },
    { path: '/ai-video-generator', label: 'AI Video Generator', icon: Image },
    { path: '/gallery', label: 'Gallery', icon: Grid3x3 },
    { path: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  const userMenuItems = [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/profile#settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/colibrrri-logo.png" alt="Logo" className="h-8 w-8" />
            <ColorfulLogo />
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Credits Badge */}
            {isAuthenticated && (
              <div className="flex items-center bg-primary-50 px-3 py-2 rounded-full">
                <CreditCard className="w-4 h-4 text-primary-600 mr-1" />
                <span className="text-sm font-medium text-primary-700">
                  {user?.totalCredits || 0}
                </span>
              </div>
            )}

            {/* Cart Icon - Only show when items exist */}
            {itemCount > 0 && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  openCart();
                }}
                className="relative p-2 animate-fadeIn"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                  {itemCount}
                </span>
              </button>
            )}

            {/* Menu Toggle Button - Optimized for touch (48x48px) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 -mr-2 touch-manipulation"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-xl"
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 -mr-2 touch-manipulation"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* User Info */}
                {isAuthenticated && user && (
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto">
                <div className="py-2">
                  {/* Main Navigation */}
                  <div className="px-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`
                            flex items-center justify-between px-4 py-3 rounded-lg
                            transition-colors touch-manipulation
                            ${isActive 
                              ? 'bg-primary-50 text-primary-700' 
                              : 'hover:bg-gray-50 text-gray-700'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      );
                    })}
                  </div>

                  {/* User Menu */}
                  {isAuthenticated && (
                    <>
                      <div className="my-2 px-6">
                        <div className="border-t border-gray-200" />
                      </div>
                      <div className="px-2">
                        {userMenuItems.map((item) => {
                          const Icon = item.icon;
                          
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="
                                flex items-center justify-between px-4 py-3 rounded-lg
                                hover:bg-gray-50 text-gray-700 transition-colors
                                touch-manipulation
                              "
                            >
                              <div className="flex items-center space-x-3">
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                          );
                        })}
                        
                        {/* Logout Button */}
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                          className="
                            w-full flex items-center justify-between px-4 py-3 rounded-lg
                            hover:bg-red-50 text-red-600 transition-colors
                            touch-manipulation
                          "
                        >
                          <div className="flex items-center space-x-3">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign Out</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Auth Buttons for Non-Authenticated Users */}
                  {!isAuthenticated && (
                    <div className="px-4 py-4 space-y-3">
                      <Link
                        to="/login"
                        className="
                          block w-full py-3 px-4 bg-primary-600 text-white text-center
                          font-medium rounded-lg hover:bg-primary-700 transition-colors
                          touch-manipulation
                        "
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="
                          block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center
                          font-medium rounded-lg hover:bg-gray-200 transition-colors
                          touch-manipulation
                        "
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-center text-sm text-gray-500">
                  © 2024 СolibRRRi. All rights reserved.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default MobileNav;