import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paragon } from '@useparagon/connect';
import { useState, useEffect, useRef } from 'react';
import { ParagonService, ConfigureSyncRequest, ConfigureSyncResponse } from './paragon-service';
import { getAppConfig } from './config';
import { v4 as uuidv4 } from 'uuid';

export function useIntegrationMetadata() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => {
      return paragon.getIntegrationMetadata();
    },
  });
}

export function useIntegrationConfig(type: string) {
  return useQuery({
    queryKey: ['integrationConfig', type],
    queryFn: () => {
      return paragon.getIntegrationConfig(type);
    },
  });
}

export function useAuthenticatedUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => {
      const user = paragon.getUser();
      if (!user.authenticated) {
        throw new Error('User is not authenticated');
      }

      return user;
    },
  });
}

export function useUserContext() {
  const { data: user } = useAuthenticatedUser();
  
  // Use a consistent workspace UUID - in production this should come from user data
  const getWorkspaceId = () => {
    // Get or create workspace ID from localStorage
    let workspaceId = localStorage.getItem('paragon-workspace-id');
    if (!workspaceId) {
      workspaceId = uuidv4();
      localStorage.setItem('paragon-workspace-id', workspaceId);
    }
    return workspaceId;
  };
  
  return {
    userId: user?.userId || '',
    workspaceId: getWorkspaceId(),
    isAuthenticated: user?.authenticated || false
  };
}

type FieldOptionsResponse = Awaited<ReturnType<typeof paragon.getFieldOptions>>;

const fieldOptionsInitialData: FieldOptionsResponse = {
  data: [],
  nestedData: [],
  nextPageCursor: null,
};

export function useFieldOptions({
  integration,
  sourceType,
  search,
  cursor,
  parameters = [],
  enabled = true,
}: {
  integration: string;
  sourceType: string;
  search?: string;
  cursor?: string | number | false;
  parameters?: { cacheKey: string; value: string | undefined }[];
  enabled?: boolean;
}) {
  return useQuery({
    enabled: enabled,
    queryKey: ['fieldOptions', integration, sourceType, search, parameters],
    queryFn: () => {
      if (sourceType) {
        return paragon.getFieldOptions({
          integration,
          action: sourceType,
          search,
          cursor,
          parameters: parameters.map((parameter) => {
            return {
              key: parameter.cacheKey,
              source: {
                type: 'VALUE',
                value: parameter.value,
              },
            };
          }),
        });
      }
      return fieldOptionsInitialData;
    },
    initialData: fieldOptionsInitialData,
  });
}

export function useDataSourceOptions<T>(
  integration: string,
  sourceType: string,
) {
  return useQuery({
    queryKey: ['comboInputOptions', integration, sourceType],
    queryFn: () => {
      return paragon.getDataSourceOptions(integration, sourceType) as T;
    },
  });
}

export interface SyncStatus {
  syncId: string;
  status: 'INITIALIZING' | 'ACTIVE' | 'IDLE' | 'DISABLED' | 'ERRORED';
  integration: string;
  folderId: string;
  message?: string;
}

export function useParagonSync() {
  const [syncs, setSyncs] = useState<SyncStatus[]>([]);
  const [userTokens, setUserTokens] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  
  // Use refs to avoid stale closures in the polling interval
  const syncsRef = useRef<SyncStatus[]>([]);
  const userTokensRef = useRef<Record<string, string>>({});
  
  // Update refs when state changes
  syncsRef.current = syncs;
  userTokensRef.current = userTokens;

  const configureSync = useMutation({
    mutationFn: async (request: ConfigureSyncRequest): Promise<ConfigureSyncResponse> => {
      const config = getAppConfig();
      if (!config.success) {
        throw new Error('Configuration error');
      }

      const paragonService = new ParagonService(config.data.VITE_API_BASE_URL);
      return await paragonService.configureSync(request);
    },
    onSuccess: (response, request) => {
      // Add the new sync to local state
      const newSync: SyncStatus = {
        syncId: response.syncId,
        status: 'INITIALIZING',
        integration: request.integrationId,
        folderId: request.folderId,
        message: response.message
      };
      
      setSyncs(prev => [...prev, newSync]);
      
      // Store user token for polling
      setUserTokens(prev => ({
        ...prev,
        [response.syncId]: request.userToken
      }));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Failed to configure sync:', error);
    }
  });

  const getSyncStatus = (syncId: string): SyncStatus | undefined => {
    return syncs.find(sync => sync.syncId === syncId);
  };

  const updateSyncStatus = (syncId: string, status: SyncStatus['status'], message?: string) => {
    setSyncs(prev => prev.map(sync => 
      sync.syncId === syncId 
        ? { ...sync, status, message }
        : sync
    ));
  };

  // Poll sync status every 30 seconds
  useEffect(() => {
    const pollSyncStatus = async () => {
      const currentSyncs = syncsRef.current;
      const currentTokens = userTokensRef.current;
      
      if (currentSyncs.length === 0) return;

      try {
        // Poll status for all active syncs using the dedicated Paragon Sync API
        // https://docs.useparagon.com/managed-sync/api/get-sync-status
        const statusPromises = currentSyncs.map(async (sync) => {
          const userToken = currentTokens[sync.syncId];
          if (!userToken) return null;

          try {
            const statusResponse = await ParagonService.getSyncStatus(sync.syncId, userToken);
            return {
              syncId: sync.syncId,
              status: statusResponse.status,
              message: `Last synced: ${statusResponse.summary.lastSyncedAt ? new Date(statusResponse.summary.lastSyncedAt).toLocaleString() : 'Never'} | Records: ${statusResponse.summary.syncedRecordsCount}/${statusResponse.summary.totalRecords}`
            };
          } catch (error) {
            console.error(`Failed to get status for sync ${sync.syncId}:`, error);
            return {
              syncId: sync.syncId,
              status: 'ERRORED' as const,
              message: 'Failed to fetch status'
            };
          }
        });

        const statusUpdates = await Promise.all(statusPromises);
        
        // Update sync statuses
        statusUpdates.forEach(update => {
          if (update) {
            updateSyncStatus(update.syncId, update.status, update.message);
          }
        });

      } catch (error) {
        console.error('Error polling sync status:', error);
      }
    };

    // Start polling every 30 seconds
    const interval = setInterval(pollSyncStatus, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - polling runs independently

  return {
    syncs,
    configureSync: configureSync.mutate,
    configureSyncAsync: configureSync.mutateAsync,
    isConfiguring: configureSync.isLoading,
    configureError: configureSync.error,
    getSyncStatus,
    updateSyncStatus
  };
}
