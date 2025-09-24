import React, { useState, useCallback } from 'react';
import { HardDrive, Folder, ExternalLink, CheckCircle } from 'lucide-react';
import { useParagon } from '../hooks/useParagon';
import { useGooglePicker } from '../hooks/useGooglePicker';
import { configureParagonSync } from '../services/api';
import type { GoogleDriveIntegrationProps, GooglePickerDocument, IntegrationState } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Alert } from './ui/Alert';

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HardDrive className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Google Drive</CardTitle>
            <CardDescription>
              Sync files from your Google Drive folders and shared drives
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Error Display */}
        {error && (
          <Alert variant="error" className="mb-4" onDismiss={() => setIntegrationState(prev => ({ ...prev, error: null }))}>
            {error}
          </Alert>
        )}

        {/* Loading States */}
        {(isParagonLoading || isGoogleLoading) && (
          <Alert variant="info" className="mb-4">
            Loading Google Drive integration dependencies...
          </Alert>
        )}

        {/* Connected State */}
        {integrationState.isConnected && integrationState.syncedFolder && (
          <div className="space-y-4">
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully connected to Google Drive</span>
              </div>
            </Alert>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Folder className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {integrationState.syncedFolder.name}
                </p>
                <p className="text-sm text-gray-600">
                  {integrationState.syncedFolder.driveId ? 'Shared Drive' : 'My Drive'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
              >
                Change Folder
              </Button>
            </div>
          </div>
        )}

        {/* Connection Button */}
        {!integrationState.isConnected && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Connect your Google Drive to sync files and folders.</p>
              <p className="mt-1">
                <strong>Note:</strong> You can select folders from both My Drive and Shared Drives.
              </p>
            </div>
            
            <Button
              onClick={handleConnect}
              disabled={!canConnect}
              isLoading={isLoading}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Google Drive'}
            </Button>

            {/* Development Note */}
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <strong>Development Mode:</strong> Google OAuth is in development mode. 
              Testers must be whitelisted to use this integration.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
