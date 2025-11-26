// components/SheetSetup.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';

interface SheetSetupProps {
  onComplete: () => void;
}

const SheetSetup: React.FC<SheetSetupProps> = ({ onComplete }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connectGoogleSheet, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetId.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = await connectGoogleSheet(spreadsheetId.trim());
      if (success) {
        onComplete();
      } else {
        setError('Failed to connect spreadsheet. Please check the ID and try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Error connecting spreadsheet: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">POS System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Google Sheet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To use this POS system, you need to connect a Google Sheet where your data will be stored.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="spreadsheetId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google Spreadsheet ID
              </label>
              <input
                type="text"
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="Enter your spreadsheet ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white dark:bg-gray-700"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                You can find this in your Google Sheets URL: 
                <code className="bg-gray-100 dark:bg-gray-600 px-1 mx-1">https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit</code>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !spreadsheetId.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect Spreadsheet'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">How to get started:</h3>
            <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
              <li>Create a new Google Sheet</li>
              <li>Copy the Spreadsheet ID from the URL</li>
              <li>Paste it above and click "Connect"</li>
              <li>The system will automatically create the necessary sheets</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetSetup;