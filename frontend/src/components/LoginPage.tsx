// Create frontend/src/components/LoginPage.tsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckSquare, 
  BookOpen, 
  Scroll, 
  Calendar,
  Activity,
  Chrome,
  Loader2,
  AlertCircle
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-6">
            <CheckSquare className="w-8 h-8 text-blue-400" />
            <BookOpen className="w-8 h-8 text-purple-400" />
            <Scroll className="w-8 h-8 text-orange-400" />
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Todo App
          </h1>
          <p className="text-gray-300 text-lg">
            Organize your tasks, diary, and quests
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-300">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <span>Hierarchical task management</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Personal diary with scheduling</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Scroll className="w-5 h-5 text-orange-400" />
              <span>Quest tracking and planning</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Calendar className="w-5 h-5 text-green-400" />
              <span>Calendar view and Google Calendar sync</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Activity feed and organization</span>
            </div>
          </div>
        </div>

        {/* Login Section */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Get Started
          </h2>
          
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-md flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            <span>
              {isLoading 
                ? 'Signing in...' 
                : isDevelopment 
                  ? 'Continue as Test User'
                  : 'Sign in with Google'
              }
            </span>
          </button>

          {isDevelopment && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Development mode - no Google account required
            </p>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              By signing in, you agree to sync your data securely
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>
            Secure authentication • Privacy focused • Cross-device sync
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;