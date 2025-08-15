import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const OAuthTest = () => {
  const { loginWithGoogle, loginWithFacebook, user, isAuthenticated } = useAuthStore();
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, result, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { test, result, details, timestamp }]);
  };

  const testGoogleOAuth = () => {
    try {
      addTestResult('Google OAuth Redirect', 'INITIATED', 'Redirecting to Google...');
      loginWithGoogle();
    } catch (error) {
      addTestResult('Google OAuth Redirect', 'FAILED', error.message);
      toast.error('Failed to initiate Google OAuth');
    }
  };

  const testFacebookOAuth = () => {
    try {
      addTestResult('Facebook OAuth Redirect', 'INITIATED', 'Redirecting to Facebook...');
      loginWithFacebook();
    } catch (error) {
      addTestResult('Facebook OAuth Redirect', 'FAILED', error.message);
      toast.error('Failed to initiate Facebook OAuth');
    }
  };

  const testAPIConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      if (data.status === 'OK') {
        addTestResult('API Connection', 'SUCCESS', 'Server is running');
        toast.success('API connection successful');
      } else {
        addTestResult('API Connection', 'FAILED', 'Unexpected response');
      }
    } catch (error) {
      addTestResult('API Connection', 'FAILED', error.message);
      toast.error('API connection failed');
    }
  };

  const testOAuthEndpoints = async () => {
    try {
      // Test Google endpoint
      const googleResponse = await fetch('http://localhost:5000/auth/google', {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (googleResponse.status === 302) {
        addTestResult('Google OAuth Endpoint', 'SUCCESS', 'Endpoint returns redirect');
      } else {
        addTestResult('Google OAuth Endpoint', 'FAILED', `Status: ${googleResponse.status}`);
      }

      // Test Facebook endpoint
      const facebookResponse = await fetch('http://localhost:5000/auth/facebook', {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (facebookResponse.status === 302) {
        addTestResult('Facebook OAuth Endpoint', 'SUCCESS', 'Endpoint returns redirect');
      } else {
        addTestResult('Facebook OAuth Endpoint', 'FAILED', `Status: ${facebookResponse.status}`);
      }
    } catch (error) {
      addTestResult('OAuth Endpoints', 'FAILED', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Testing Dashboard</h1>
        
        {/* Current Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Authenticated:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User:</span>
              <span className="ml-2 text-gray-600">
                {user ? user.email || user.username : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">OAuth Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testAPIConnection}
              className="btn btn-outline"
            >
              Test API Connection
            </button>
            <button
              onClick={testOAuthEndpoints}
              className="btn btn-outline"
            >
              Test OAuth Endpoints
            </button>
            <button
              onClick={testGoogleOAuth}
              className="btn btn-primary"
            >
              Test Google OAuth
            </button>
            {/* Facebook OAuth временно отключен
            <button
              onClick={testFacebookOAuth}
              className="btn btn-secondary"
            >
              Test Facebook OAuth
            </button>
            */}
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click a test button to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{result.test}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.result === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      result.result === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.result}
                    </span>
                    {result.details && (
                      <span className="text-gray-600 text-sm">{result.details}</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{result.timestamp}</span>
                </div>
              ))
            )}
          </div>
          {testResults.length > 0 && (
            <button
              onClick={() => setTestResults([])}
              className="mt-4 btn btn-outline btn-sm"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Configuration Info</h3>
          <div className="text-blue-800 space-y-1">
            <p><strong>Frontend:</strong> http://localhost:5174</p>
            <p><strong>Backend:</strong> http://localhost:5000</p>
            <p><strong>Google OAuth Callback:</strong> http://localhost:5000/auth/google/callback</p>
            <p><strong>Facebook OAuth Callback:</strong> http://localhost:5000/auth/facebook/callback</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthTest;