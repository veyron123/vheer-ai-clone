import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Menu, 
  X, 
  Sparkles, 
  Image, 
  Grid3x3, 
  User, 
  CreditCard,
  LogOut,
  Settings
} from 'lucide-react';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container-custom">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Vheer</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/generate" className="flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition">
                <Sparkles className="w-4 h-4" />
                <span>Generate</span>
              </Link>
              <Link to="/gallery" className="flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition">
                <Grid3x3 className="w-4 h-4" />
                <span>Gallery</span>
              </Link>
              <Link to="/pricing" className="flex items-center space-x-1 text-gray-700 hover:text-primary-500 transition">
                <CreditCard className="w-4 h-4" />
                <span>Pricing</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                      {user?.totalCredits || 0} Credits
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 invisible group-hover:visible">
                      <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link to="/settings" className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2" />
                      <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 w-full text-left text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-700 hover:text-primary-500 transition">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="space-y-4">
                <Link to="/generate" className="block py-2 text-gray-700">Generate</Link>
                <Link to="/gallery" className="block py-2 text-gray-700">Gallery</Link>
                <Link to="/pricing" className="block py-2 text-gray-700">Pricing</Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="block py-2 text-gray-700">Profile</Link>
                    <button onClick={handleLogout} className="block py-2 text-red-600 w-full text-left">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block py-2 text-gray-700">Sign In</Link>
                    <Link to="/register" className="btn btn-primary w-full">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <span className="text-xl font-bold">vheer</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Create stunning AI-generated images and artwork with our advanced AI tools. Transform your ideas into reality.
              </p>
              <p className="text-gray-500 text-xs mb-4">© 2025 VHEER. All rights reserved.</p>
              {/* Social Icons */}
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 transition">
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
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">COMPANY</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to="/terms" className="hover:text-gray-900 transition">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-gray-900 transition">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-gray-900 transition">Cookie Policy</Link></li>
                <li><Link to="/contact" className="hover:text-gray-900 transition">Contact Us</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">RESOURCES</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to="/affiliate" className="hover:text-gray-900 transition">Affiliate</Link></li>
                <li><Link to="/help" className="hover:text-gray-900 transition">Help & Support</Link></li>
                <li><Link to="/blog" className="hover:text-gray-900 transition">Blog</Link></li>
                <li><Link to="/reviews" className="hover:text-gray-900 transition">Reviews</Link></li>
              </ul>
            </div>
            
            {/* Popular Tools */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 uppercase text-sm">POPULAR TOOLS</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link to="/generate" className="hover:text-gray-900 transition">AI Text to Image Generator</Link></li>
                <li><Link to="/generate" className="hover:text-gray-900 transition">Image to Image Generator</Link></li>
                <li><Link to="/generate" className="hover:text-gray-900 transition">Image to Video Generator</Link></li>
                <li><Link to="/generate" className="hover:text-gray-900 transition">Realistic Headshot Generator</Link></li>
                <li><Link to="/generate" className="hover:text-gray-900 transition">Anime Portrait Generator</Link></li>
                <li><Link to="/generate" className="hover:text-gray-900 transition">AI Pet Portrait Generator</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;