import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import SheetSetup from './components/SheetSetup';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        setIsCheckingBackend(true);
        setConnectionError(null);
        console.log('Testing backend connection...');
        
        const healthResponse = await fetch('https://pos-backend-red.vercel.app/health');
        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }
        
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
        
        const response = await fetch('https://pos-backend-red.vercel.app/api/products');
        if (!response.ok) {
          throw new Error(`API test failed: ${response.status}`);
        }
        
        console.log('✅ Backend connection successful');
        setIsBackendConnected(true);
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        setIsBackendConnected(false);
        if (error instanceof Error) {
          setConnectionError(error.message);
        } else {
          setConnectionError('An unknown error occurred');
        }
      } finally {
        setIsCheckingBackend(false);
      }
    };

    if (user) {
      checkBackendConnection();
    } else {
      setIsCheckingBackend(false);
    }
  }, [user]);

  const showSheetSetup = user && !user.spreadsheetId;

  if (isLoading || isCheckingBackend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isCheckingBackend ? 'Connecting to server...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (showSheetSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SheetSetup onComplete={() => window.location.reload()} />
      </div>
    );
  }

  if (!isBackendConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-700">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-red-100 p-4 rounded-2xl inline-flex mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Server Connection Failed</h1>
          <p className="text-gray-600 mb-6">
            Unable to connect to the server. 
            {connectionError && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                Error: {connectionError}
              </div>
            )}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">To fix this:</h3>
            <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
              <li>Make sure you have internet connection.</li>
              <li>Make sure you Google Spreadsheet (database) is properly setup.</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 text-white dark:text-black px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;