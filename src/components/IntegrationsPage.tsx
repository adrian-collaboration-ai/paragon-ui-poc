import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { GoogleDriveIntegration } from './GoogleDriveIntegration';
import type { SyncResponse } from '../types';
import { Alert } from './ui/Alert';

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

  /**
   * Dismiss a notification
   */
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          </div>
          <p className="text-lg text-gray-600">
            Connect your favorite tools and services to sync and manage your data.
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <Alert
                key={notification.id}
                variant={notification.type}
                onDismiss={() => dismissNotification(notification.id)}
              >
                {notification.message}
              </Alert>
            ))}
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Google Drive Integration */}
          <GoogleDriveIntegration
            onSyncComplete={handleSyncComplete}
            onError={handleIntegrationError}
          />

          {/* Placeholder for future integrations */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
            <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">More Integrations</h3>
            <p className="text-sm text-gray-600">
              Additional integrations will be available soon.
            </p>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Paragon Integration POC
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              This is a proof of concept implementation for Google Drive integration 
              using Paragon's embedded SDK. The integration supports both My Drive 
              and Shared Drives folder selection.
            </p>
            <div className="mt-4 text-xs text-gray-500">
              <p>Story: NETOS-2900 | Epic: NETOS-2895</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
