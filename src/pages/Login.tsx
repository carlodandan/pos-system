import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, isLoading, googleError } = useAuth();
  const navigate = useNavigate();

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(username, password, remember)) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  const togglePasswordVisibilityLocal = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSignIn = () => {
    setError('');
    loginWithGoogle();
  };

  const displayError = googleError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-blue-600 p-2 sm:p-3 rounded-2xl">
              <ShoppingCart className="text-white dark:text-black" size={28} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">POS System</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Sign in to your account</p>
        </div>

        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6 flex items-start space-x-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Sign-in Error</p>
              <p className="text-xs sm:text-sm mt-1">{displayError}</p>
              {googleError && (
                <p className="text-xs mt-1">
                  Please check your Google Cloud Console configuration and ensure this domain is authorized.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 rounded-lg py-2 sm:py-3 px-4 flex items-center justify-center space-x-2 sm:space-x-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader size={18} className="animate-spin text-gray-500" />
            ) : (
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-4 h-4 sm:w-5 sm:h-5" 
              />
            )}
            <span className="text-gray-700 font-medium text-sm sm:text-base">
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </button>
        </div>

        <div className="relative my-4 sm:my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 text-xs sm:text-sm">Or continue with demo</span>
          </div>
        </div>

        <form onSubmit={handleDemoSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black dark:text-white dark:bg-gray-800 text-sm sm:text-base"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black dark:text-white dark:bg-gray-800 text-sm sm:text-base"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibilityLocal}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember this device
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader size={18} className="animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Demo Sign in'
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <div className="space-y-1">
            <p>Admin: admin / admin123</p>
            <p>Cashier: cashier / cashier123</p>
          </div>
          <p className="mt-3 sm:mt-4 text-xs">
            Google Sign-in required for real Google Sheets integration
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;