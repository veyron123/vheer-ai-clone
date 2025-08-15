import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthData } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Set authentication data
          setAuthData(user, token);
          
          toast.success(`Welcome ${user.fullName || user.username}!`);
          navigate('/generate');
        } catch (error) {
          console.error('Error parsing OAuth response:', error);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
        }
      } else {
        toast.error('Invalid authentication response.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-800">Completing authentication...</h2>
        <p className="text-gray-600 mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;