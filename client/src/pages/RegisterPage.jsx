import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, loginWithGoogle, loginWithFacebook } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        fullName: data.fullName
      });
      toast.success('Account created successfully!');
      navigate('/generate');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <img 
              src="/colibrrri-logo.png" 
              alt="СolibRRRi Logo" 
              className="w-12 h-12"
            />
            <span className="text-2xl font-bold">СolibRRRi</span>
          </Link>

          <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
          <p className="text-gray-600 text-center mb-8">Start your creative journey today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('fullName', {
                    required: 'Full name is required'
                  })}
                  className="input pl-10"
                  placeholder="Enter your full name"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Username Input */}
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores'
                    }
                  })}
                  className="input pl-10"
                  placeholder="Choose a username"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="input pl-10 pr-10"
                  placeholder="Create a password"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="input pl-10"
                  placeholder="Confirm your password"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                {...register('terms', {
                  required: 'You must accept the terms and conditions'
                })}
                className="mr-2 mt-1"
              />
              <label className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm">{errors.terms.message}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex justify-center">
            <button 
              type="button"
              onClick={loginWithGoogle}
              className="btn btn-outline hover:bg-gray-50 w-full max-w-xs"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign up with Google
            </button>
            {/* Facebook OAuth временно отключен
            <button 
              type="button"
              onClick={loginWithFacebook}
              className="btn btn-outline hover:bg-gray-50"
            >
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5 mr-2" />
              Facebook
            </button>
            */}
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-8 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;