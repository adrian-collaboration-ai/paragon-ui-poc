import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { GoogleDriveIntegration } from './GoogleDriveIntegration';
import type { SyncResponse } from '../types';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

/**
 * Integrations Page Component
 * 
 * Main page that displays available integrations including Google Drive.
 * Can be extended to include other integrations in the future.
 */
export const IntegrationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }[]>([]);

  /**
   * Add a notification message
   */
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  /**
   * Handle successful sync configuration
   */
  const handleSyncComplete = (response: SyncResponse) => {
    addNotification('success', 
      `Google Drive sync configured successfully! ${response.message || ''}`
    );
  };

  /**
   * Handle integration errors
   */
  const handleIntegrationError = (error: string) => {
    addNotification('error', error);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Integrations
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Connect your favorite tools and services to sync and manage your data.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border-l-4 shadow-sm ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : notification.type === 'error' 
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-blue-50 border-blue-400 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <h4 className="font-semibold text-sm">
                    {notification.type === 'success' ? 'Success' : 
                     notification.type === 'error' ? 'Error' : 'Info'}
                  </h4>
                </div>
                <p className="text-sm">{notification.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Google Drive Integration */}
          <div className="lg:col-span-1">
            <GoogleDriveIntegration
              onSyncComplete={handleSyncComplete}
              onError={handleIntegrationError}
            />
          </div>

          {/* Placeholder for future integrations */}
          {/* <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 hover:shadow-lg transition-all duration-300 group">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
              <Plus className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">More Integrations</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Additional integrations will be available soon. We're working on connecting more tools and services.
            </p>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              Coming Soon
            </Badge>
          </div> */}
        </div>

      </div>
    </div>
  );
};
