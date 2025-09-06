import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { Coins, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CreditDisplay = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const fetchCredits = async () => {
    try {
      // Добавляем таймаут для предотвращения зависших запросов
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
      
      const response = await api.get('/credits', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setCreditInfo(response.data);
      // Update user store with current credits
      if (response.data.currentCredits !== user?.totalCredits) {
        updateUser({ totalCredits: response.data.currentCredits });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Credits request timed out');
      } else {
        console.error('Error fetching credits:', error);
      }
    }
  };

  const updateToNewSystem = async () => {
    setLoading(true);
    try {
      const response = await api.post('/credits/update-existing-users');
      toast.success(response.data.message);
      // Refresh credits
      await fetchCredits();
      // Refresh user data
      const userResponse = await api.get('/auth/me');
      updateUser(userResponse.data);
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Failed to update credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Дебаунсинг для предотвращения частых запросов
      const timeoutId = setTimeout(() => {
        fetchCredits();
      }, 500); // 500ms задержка
      
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Coins className="w-6 h-6 text-primary-600" />
          <div>
            <p className="text-sm text-gray-600">Your Credits</p>
            <p className="text-2xl font-bold text-gray-900">
              {user.totalCredits || 0}
            </p>
          </div>
        </div>
        
        {creditInfo && (
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Next daily credits in
            </p>
            <p className="text-sm font-medium text-gray-700">
              {Math.round(creditInfo.hoursUntilNext || 0)}h
            </p>
          </div>
        )}
      </div>

      {/* Temporary update button for existing users */}
      {user.totalCredits === 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">
            It looks like you have 0 credits. Click below to update to the new credit system.
          </p>
          <button
            onClick={updateToNewSystem}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update to 100 Daily Credits
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;