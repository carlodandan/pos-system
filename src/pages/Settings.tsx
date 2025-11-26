import React, { useState, useEffect } from 'react';
import { Save, Building, Receipt, Percent } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    businessName: 'My Business',
    taxRate: 0.12,
    receiptHeader: 'Thank you for your purchase!',
    receiptFooter: 'We hope to see you again soon!'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      localStorage.setItem('posSettings', JSON.stringify(settings));
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-blue-600 text-white dark:text-black px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto order-first sm:order-last"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className={`p-3 sm:p-4 rounded-lg ${
          saveMessage.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        } text-sm sm:text-base`}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <Building className="text-blue-600 flex-shrink-0" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Business Information</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 sm:mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 sm:mb-2">
                Tax Rate (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(settings.taxRate * 100).toString()}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setSettings(prev => ({ ...prev, taxRate: value / 100 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base"
                  placeholder="12.0"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white mt-1">
                Current rate: {(settings.taxRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-white-100">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <Receipt className="text-green-600 flex-shrink-0" size={20} />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Receipt Settings</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 sm:mb-2">
                Receipt Header
              </label>
              <textarea
                value={settings.receiptHeader}
                onChange={(e) => setSettings(prev => ({ ...prev, receiptHeader: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base resize-vertical"
                placeholder="Enter receipt header message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1 sm:mb-2">
                Receipt Footer
              </label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => setSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-white text-sm sm:text-base resize-vertical"
                placeholder="Enter receipt footer message"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="block sm:hidden bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-white-100">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSettings({
                businessName: 'My Business',
                taxRate: 0.12,
                receiptHeader: 'Thank you for your purchase!',
                receiptFooter: 'We hope to see you again soon!'
              });
            }}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-xs"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-xs flex items-center justify-center space-x-1"
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;