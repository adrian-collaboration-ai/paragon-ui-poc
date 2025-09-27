import { useAuthenticatedUser, useIntegrationMetadata, useParagonSync, useUserContext } from '@/lib/hooks';
import {
  AuthenticatedConnectUser,
  IntegrationMetadata,
  SDK_EVENT,
  paragon,
} from '@useparagon/connect';

import { IntegrationCard } from './integration-card';
import { GoogleDriveFilePicker } from './google-drive-file-picker';
import { getAppConfig } from '@/lib/config';
import { ParagonService } from '@/lib/paragon-service';
import { useEffect, useState } from 'react';
import type { SyncStatus } from '@/lib/hooks';

interface SelectedFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
  isShared?: boolean;
  type?: string;
  url?: string;
}

export function IntegrationList() {
  const { data: user, refetch: refetchUser } = useAuthenticatedUser();
  const {
    data: integrations,
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations,
  } = useIntegrationMetadata();
  
  const { userId, workspaceId } = useUserContext();
  const { syncs, configureSync, isConfiguring, configureError } = useParagonSync();
  
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // Debug log to see current state
  console.log('Current selectedFiles state:', selectedFiles);

  useEffect(() => {
    const updateUser = () => {
      refetchUser();
      refetchIntegrations();
    };

    paragon.subscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, updateUser);
    paragon.subscribe(SDK_EVENT.ON_INTEGRATION_UNINSTALL, updateUser);

    return () => {
      paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, updateUser);
      paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_UNINSTALL, updateUser);
    };
  }, [refetchUser, refetchIntegrations]);

  if (!user || isLoadingIntegrations || !integrations) {
    return <div>Loading...</div>;
  }

  const sortedIntegrations = integrations.sort(byEnabledOnTop(user));
  
  const googleDriveSyncs = (syncs as SyncStatus[]).filter((sync: SyncStatus) => sync.integration === 'googledrive');


  const handleFileSelect = async (files: SelectedFile[]) => {
    console.log('Files received in IntegrationList:', files);
    setSelectedFiles(files);
    
    // Configure sync for Google Drive files
    try {
      const config = getAppConfig();
      if (!config.success) {
        console.error('Configuration error:', config.error);
        return;
      }

      // Generate a user token for this sync operation
      const paragonService = new ParagonService(config.data.VITE_API_BASE_URL);
      const userToken = await paragonService.generateToken(config.data.VITE_PARAGON_USER_ID);

      console.log('User context:', { userId, workspaceId });
      console.log('Selected files:', files);

      // Configure sync for the selected folder/files
      const syncRequest = {
        workspaceId: workspaceId,
        userId: userId || config.data.VITE_PARAGON_USER_ID,
        integrationId: "googledrive",
        folderId: files[0]?.id || "root",
        webhookUrl: `${config.data.VITE_API_BASE_URL}/api/v1/webhooks/paragon/files`,
        userToken: userToken
      };
      
      console.log('Sync request:', syncRequest);
      configureSync(syncRequest);
    } catch (error) {
      console.error('Error configuring sync:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-medium mb-4">Integrations</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {sortedIntegrations.map((integration) => {
            const integrationInfo = user.integrations[integration.type];

            if (!integrationInfo) {
              return null;
            }

            return (
              <li key={integration.type}>
                <IntegrationCard
                  integration={integration.type}
                  name={integration.name}
                  icon={integration.icon}
                  status={integrationInfo.credentialStatus}
                />
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="space-y-4">
        <GoogleDriveFilePicker onFileSelect={handleFileSelect} />
        
        <SyncStatusDisplay syncs={googleDriveSyncs} />
        
        {/* Show configuration error */}
        {configureError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Error configuring sync: {configureError instanceof Error ? configureError.message : 'Unknown error'}
            </p>
          </div>
        )}
        
        {/* Show loading state */}
        {isConfiguring && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Configuring sync with Paragon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SyncStatusDisplay({ syncs }: { syncs: SyncStatus[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500 animate-pulse';
      case 'INITIALIZING': return 'bg-blue-500 animate-pulse';
      case 'IDLE': return 'bg-green-400';
      case 'ERRORED': return 'bg-red-500';
      case 'DISABLED': return 'bg-gray-400';
      default: return 'bg-blue-500';
    }
  };

  const hasActiveSync = syncs.some(sync => sync.status === 'ACTIVE');
  const hasErrorSync = syncs.some(sync => sync.status === 'ERRORED');
  
  return (
    <div className={`p-4 border rounded-lg ${
      hasErrorSync ? 'bg-red-50 border-red-200' : 
      hasActiveSync ? 'bg-green-50 border-green-200' : 
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${
          hasErrorSync ? 'bg-red-500' :
          hasActiveSync ? 'bg-green-500 animate-pulse' :
          syncs.length > 0 ? getStatusColor(syncs[0].status) :
          'bg-blue-500 animate-pulse'
        }`}></div>
        <h3 className={`text-sm font-medium ${
          hasErrorSync ? 'text-red-900' :
          hasActiveSync ? 'text-green-900' :
          'text-blue-900'
        }`}>
          Google Drive Sync Status
          <span className="ml-2 text-xs font-normal">
            (Updates every 30 seconds)
          </span>
        </h3>
      </div>
      <div className={`mt-2 text-xs ${
        hasErrorSync ? 'text-red-700' :
        hasActiveSync ? 'text-green-700' :
        'text-blue-700'
      }`}>
        {syncs.length > 0 ? (
          <span>
            {syncs.length} sync{syncs.length !== 1 ? 's' : ''} configured - 
            {syncs.map(sync => ` ${sync.status}`).join(', ')}
          </span>
        ) : (
          <span>Ready to sync - Select files to start syncing</span>
        )}
      </div>
      {syncs.length > 0 && (
        <div className="mt-3 space-y-2">
          {syncs.map((sync: SyncStatus) => (
            <div key={sync.syncId} className={`p-2 rounded border-l-4 ${
              sync.status === 'ERRORED' ? 'border-l-red-400 bg-red-25' :
              sync.status === 'ACTIVE' ? 'border-l-green-400 bg-green-25' :
              sync.status === 'IDLE' ? 'border-l-blue-400 bg-blue-25' :
              'border-l-gray-400 bg-gray-25'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(sync.status)}`}></div>
                <span className="text-xs font-medium">
                  {sync.integration.toUpperCase()} - {sync.folderId}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  sync.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  sync.status === 'INITIALIZING' ? 'bg-blue-100 text-blue-800' :
                  sync.status === 'IDLE' ? 'bg-gray-100 text-gray-800' :
                  sync.status === 'ERRORED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sync.status}
                </span>
              </div>
              {sync.message && (
                <div className="mt-1 text-xs text-gray-600 pl-4">
                  {sync.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function byEnabledOnTop(user: AuthenticatedConnectUser) {
  return function (a: IntegrationMetadata, b: IntegrationMetadata) {
    const aEnabled = user.integrations[a.type]?.enabled;
    const bEnabled = user.integrations[b.type]?.enabled;
    return aEnabled ? -1 : bEnabled ? 1 : 0;
  };
}
