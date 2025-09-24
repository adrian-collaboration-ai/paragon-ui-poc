/**
 * Type definitions for the Google Drive Paragon integration
 */

// Google Picker API types
export interface GooglePickerResponse {
  action: string;
  docs?: GooglePickerDocument[];
}

export interface GooglePickerDocument {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  parents?: GooglePickerParent[];
  driveId?: string;
}

export interface GooglePickerParent {
  id: string;
}

// Paragon authentication types
export interface ParagonAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email?: string;
  };
  error?: string;
}

export interface ParagonAuthConfig {
  integration: string;
  onSuccess?: (response: ParagonAuthResponse) => void;
  onError?: (error: string) => void;
}

// Backend sync types
export interface SyncRequest {
  folderId: string;
  driveId?: string;
}

export interface SyncResponse {
  success: boolean;
  syncId?: string;
  message?: string;
  error?: string;
}

// Integration state types
export interface IntegrationState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  syncedFolder?: {
    id: string;
    name: string;
    driveId?: string;
  };
}

// Script loading states
export interface ScriptLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

// Component props types
export interface GoogleDriveIntegrationProps {
  onSyncComplete?: (response: SyncResponse) => void;
  onError?: (error: string) => void;
}
