import React, { useState, useCallback } from 'react';
import { HardDrive, Folder, ExternalLink, CheckCircle } from 'lucide-react';
import { useParagon } from '../hooks/useParagon';
import { useGooglePicker } from '../hooks/useGooglePicker';
import { configureParagonSync } from '../services/api';
import type { GoogleDriveIntegrationProps, GooglePickerDocument, IntegrationState } from '../types';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Spinner } from './ui/spinner';

/**
 * Google Drive Integration Component
 * 
 * Handles the complete flow:
 * 1. Paragon authentication
 * 2. Google Picker for folder/drive selection
 * 3. Backend sync configuration
 * 4. State management and error handling
 * 
 * Note: Google OAuth client is in development mode.
 * Testers must be whitelisted until the app is published.
 */
export const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({
  onSyncComplete,
  onError,
}) => {
  const [integrationState, setIntegrationState] = useState<IntegrationState>({
    isConnected: false,
    isLoading: false,
    error: null,
    syncedFolder: undefined,
  });

  // Paragon authentication hook
  const {
    isAuthenticated,
    isAuthenticating,
    isParagonLoading,
    isParagonReady,
    paragonError,
    authenticate: authenticateParagon,
    resetAuth,
  } = useParagon();

  // Google Picker hook
  const {
    isLoading: isPickerLoading,
    isGoogleLoading,
    isGoogleReady,
    googleError,
    selectedFolder,
    openPicker,
    resetPicker,
  } = useGooglePicker();

  /**
   * Handle the complete integration flow
   */
  const handleConnect = useCallback(async () => {
    setIntegrationState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Authenticate with Paragon
      if (!isAuthenticated) {
        await new Promise<void>((resolve, reject) => {
          authenticateParagon({
            onSuccess: () => resolve(),
            onError: (error) => reject(new Error(error)),
          });
        });
      }

      // Step 2: Open Google Picker for folder selection
      await new Promise<GooglePickerDocument>((resolve, reject) => {
        openPicker(
          (folder) => resolve(folder),
          () => reject(new Error('User cancelled folder selection'))
        );
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setIntegrationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [isAuthenticated, authenticateParagon, openPicker, onError]);

  /**
   * Handle folder selection and backend sync configuration
   */
  const handleFolderSelected = useCallback(async (folder: GooglePickerDocument) => {
    if (!folder.id) {
      const error = 'Selected folder must have an ID';
      setIntegrationState(prev => ({ ...prev, error, isLoading: false }));
      onError?.(error);
      return;
    }

    try {
      // Configure sync with backend
      const syncResponse = await configureParagonSync({
        folderId: folder.id,
        driveId: folder.driveId, // May be undefined for My Drive
      });

      if (syncResponse.success) {
        setIntegrationState({
          isConnected: true,
          isLoading: false,
          error: null,
          syncedFolder: {
            id: folder.id,
            name: folder.name,
            driveId: folder.driveId,
          },
        });
        onSyncComplete?.(syncResponse);
      } else {
        const error = syncResponse.error || 'Sync configuration failed';
        setIntegrationState(prev => ({ ...prev, error, isLoading: false }));
        onError?.(error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync configuration failed';
      setIntegrationState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  }, [onSyncComplete, onError]);

  /**
   * Reset the entire integration state
   */
  const handleReset = useCallback(() => {
    resetAuth();
    resetPicker();
    setIntegrationState({
      isConnected: false,
      isLoading: false,
      error: null,
      syncedFolder: undefined,
    });
  }, [resetAuth, resetPicker]);

  // React to folder selection
  React.useEffect(() => {
    if (selectedFolder && isAuthenticated && !integrationState.isConnected) {
      handleFolderSelected(selectedFolder);
    }
  }, [selectedFolder, isAuthenticated, integrationState.isConnected, handleFolderSelected]);

  // Determine overall loading state
  const isLoading = integrationState.isLoading || isAuthenticating || isPickerLoading || isParagonLoading || isGoogleLoading;

  // Determine if we can connect (all dependencies loaded)
  const canConnect = isParagonReady && isGoogleReady && !isLoading;

  // Determine error state
  const error = integrationState.error || paragonError || googleError;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <HardDrive className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Google Drive</h3>
            <p className="text-blue-100 mt-1">
              Sync files from your Google Drive folders and shared drives
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <h4 className="font-semibold text-red-800">Error</h4>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading States */}
        {(isParagonLoading || isGoogleLoading) && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Spinner size="sm" className="text-blue-500" />
              <h4 className="font-semibold text-blue-800">Loading</h4>
            </div>
            <p className="text-blue-700 text-sm">Loading Google Drive integration dependencies...</p>
          </div>
        )}

        {/* Connected State */}
        {integrationState.isConnected && integrationState.syncedFolder && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-green-800">Successfully Connected</h4>
              </div>
              <p className="text-green-700 text-sm">Your Google Drive integration is now active and ready to sync files.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Folder className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {integrationState.syncedFolder.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge 
                      variant={integrationState.syncedFolder.driveId ? "secondary" : "outline"}
                      className={integrationState.syncedFolder.driveId 
                        ? "bg-purple-100 text-purple-700 border-purple-200" 
                        : "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    >
                      {integrationState.syncedFolder.driveId ? 'Shared Drive' : 'My Drive'}
                    </Badge>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">Active</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  Change Folder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connection Button */}
        {!integrationState.isConnected && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Connect?</h4>
              <p className="text-gray-600 mb-1">Connect your Google Drive to sync files and folders.</p>
              <p className="text-sm text-gray-500">
                <strong>Note:</strong> You can select folders from both My Drive and Shared Drives.
              </p>
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleConnect}
                disabled={!canConnect || isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <ExternalLink className="h-5 w-5 mr-2" />
                )}
                {isLoading ? 'Connecting...' : 'Connect Google Drive'}
              </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
