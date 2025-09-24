import { useState, useCallback } from 'react';
import { useScriptLoader } from './useScriptLoader';
import type { GooglePickerResponse, GooglePickerDocument } from '../types';
import { GOOGLE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_DRIVE_SCOPES } from '../config/env';

/**
 * Custom hook to manage Google Picker API integration
 * Handles script loading, OAuth token management, and folder/drive selection
 */
export const useGooglePicker = () => {
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    selectedFolder: GooglePickerDocument | null;
    error: string | null;
    accessToken: string | null;
  }>({
    isOpen: false,
    isLoading: false,
    selectedFolder: null,
    error: null,
    accessToken: null,
  });

  // Load Google APIs script
  const googleScript = useScriptLoader(
    'https://apis.google.com/js/api.js',
    'google-apis'
  );

  // Load Google Accounts script for OAuth
  const googleAccountsScript = useScriptLoader(
    'https://accounts.google.com/gsi/client',
    'google-accounts'
  );

  const isGoogleReady = googleScript.isLoaded && googleAccountsScript.isLoaded && window.google;

  /**
   * Initialize Google APIs and get OAuth token
   */
  const initializeGoogleAPIs = useCallback(async (): Promise<string | null> => {
    if (!isGoogleReady) {
      setPickerState(prev => ({ ...prev, error: 'Google APIs are not ready' }));
      return null;
    }

    return new Promise((resolve, reject) => {
      // Initialize Google API client
      window.google!.accounts!.oauth2!.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            setPickerState(prev => ({ ...prev, accessToken: response.access_token }));
            resolve(response.access_token);
          } else {
            const error = 'Failed to get access token';
            setPickerState(prev => ({ ...prev, error }));
            reject(new Error(error));
          }
        },
      }).requestAccessToken();
    });
  }, [isGoogleReady]);

  /**
   * Open Google Picker for folder/drive selection
   * Supports both My Drive and Shared Drives
   */
  const openPicker = useCallback(async (
    onSelect?: (folder: GooglePickerDocument) => void,
    onCancel?: () => void
  ) => {
    if (!isGoogleReady) {
      setPickerState(prev => ({ ...prev, error: 'Google APIs are not ready' }));
      return;
    }

    setPickerState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get access token if we don't have one
      let token = pickerState.accessToken;
      if (!token) {
        token = await initializeGoogleAPIs();
        if (!token) return;
      }

      // Load the Picker API
      await new Promise<void>((resolve) => {
        window.google!.picker!.api!.load(() => resolve());
      });

      // Create picker views for both My Drive and Shared Drives
      const docsView = new window.google!.picker!.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const picker = new window.google!.picker!.PickerBuilder()
        .addView(docsView)
        .addView(window.google!.picker!.ViewId.FOLDERS)
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setCallback((data: GooglePickerResponse) => {
          setPickerState(prev => ({ ...prev, isOpen: false, isLoading: false }));

          if (data.action === window.google!.picker!.Action.PICKED) {
            const folder = data.docs?.[0];
            if (folder) {
              // Validate that we have at least a folderId
              if (!folder.id) {
                const error = 'Selected folder must have an ID';
                setPickerState(prev => ({ ...prev, error }));
                return;
              }

              setPickerState(prev => ({ 
                ...prev, 
                selectedFolder: folder,
                error: null 
              }));
              onSelect?.(folder);
            }
          } else if (data.action === window.google!.picker!.Action.CANCEL) {
            setPickerState(prev => ({ ...prev, error: null }));
            onCancel?.();
          }
        })
        .build();

      setPickerState(prev => ({ ...prev, isOpen: true, isLoading: false }));
      picker.setVisible(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open picker';
      setPickerState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isOpen: false, 
        error: errorMessage 
      }));
    }
  }, [isGoogleReady, pickerState.accessToken, initializeGoogleAPIs]);

  /**
   * Reset picker state
   */
  const resetPicker = useCallback(() => {
    setPickerState({
      isOpen: false,
      isLoading: false,
      selectedFolder: null,
      error: null,
      accessToken: null,
    });
  }, []);

  return {
    ...pickerState,
    isGoogleLoading: googleScript.isLoading || googleAccountsScript.isLoading,
    isGoogleReady,
    googleError: googleScript.error || googleAccountsScript.error,
    openPicker,
    resetPicker,
    initializeGoogleAPIs,
  };
};
