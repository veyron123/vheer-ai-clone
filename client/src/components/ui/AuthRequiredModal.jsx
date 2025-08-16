import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthRequiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sign In Required
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            You need to sign in to your account to generate AI images. Join thousands of creators already using our platform!
          </p>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-gray-900">Free Credits Included!</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 10 free generations on signup</li>
              <li>• Access to all AI models</li>
              <li>• Save your generated images</li>
              <li>• Track your generation history</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-yellow-400 text-black font-medium py-3 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Sign In to Your Account
            </button>
            
            <button
              onClick={handleRegister}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create Free Account
            </button>
          </div>

          {/* Small Note */}
          <p className="text-xs text-gray-500 mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthRequiredModal;