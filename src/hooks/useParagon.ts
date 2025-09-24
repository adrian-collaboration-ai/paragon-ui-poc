import { useState, useCallback, useEffect } from 'react';
import { paragon } from '@useparagon/connect';
import type { ParagonAuthConfig } from '../types';
import { PARAGON_HOST, PARAGON_PROJECT_KEY, API_BASE_URL, GOOGLE_API_KEY } from '../config/env';
import { getParagonAuthToken } from '../services/api';

/**
 * Extracts project ID from JWT token payload
 */
const extractProjectIdFromToken = (token: string): string => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload);
    const payloadObj = JSON.parse(decodedPayload);

    // Extract project_id from the payload
    const projectId = payloadObj.project_id;
    if (!projectId) {
      throw new Error('Project ID not found in JWT token');
    }

    return projectId;
  } catch (error) {
    throw new Error(`Failed to extract project ID from token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Custom hook to manage Paragon SDK integration
 * Handles script loading, authentication, and error states
 */
export const useParagon = () => {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    user: unknown;
    error: string | null;
  }>({
    isAuthenticated: false,
    isAuthenticating: false,
    user: null,
    error: null,
  });

  const [sdkState, setSdkState] = useState<{
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
  }>({
    isLoading: true,
    isReady: false,
    error: null,
  });

  // Configure Paragon SDK on mount
  useEffect(() => {
    const configureParagon = async () => {
      try {
        console.log('Environment variables:', {
          PARAGON_HOST,
          PARAGON_PROJECT_KEY,
          API_BASE_URL
        });
        
        await paragon.configureGlobal({
          host: PARAGON_HOST,
        });
        console.log('Paragon SDK configured with host:', PARAGON_HOST);
        setSdkState({ isLoading: false, isReady: true, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to configure Paragon SDK';
        setSdkState({ isLoading: false, isReady: false, error: errorMessage });
      }
    };

    configureParagon();
  }, []);

  /**
   * Authenticate user with Google Drive via Paragon
   * First gets a JWT token from backend, then authenticates with Paragon
   */
  const authenticate = useCallback(async (config?: Partial<ParagonAuthConfig>) => {
    if (!sdkState.isReady) {
      const error = 'Paragon SDK is not ready';
      setAuthState(prev => ({ ...prev, error }));
      config?.onError?.(error);
      return;
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      // Step 1: Get JWT token from backend
      const { token } = await getParagonAuthToken();

      // Step 2: Use project key from environment or extract from JWT token
      let projectId = PARAGON_PROJECT_KEY;
      if (!projectId) {
        try {
          projectId = extractProjectIdFromToken(token);
        } catch (error) {
          console.error('Failed to extract project ID from token:', error);
          throw new Error('Failed to extract project ID from token');
        }
      }

      // Debug logging
      console.log('Paragon authentication attempt:', {
        token: token,
        projectId,
        tokenLength: token.length,
        PARAGON_PROJECT_KEY,
        tokenValid: !!token,
        projectIdValid: !!projectId
      });

      const token2 ="eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoiZGFzaGJvYXJkLnVzZXBhcmFnb24uY29tL2RmMmIzMDQzLWRiM2EtNDlmNC1hMTQzLWU2MjQ3NzgzMzFkMCIsImlhdCI6MTc1ODcyOTkzMywiZXhwIjoxNzU4ODE2MzMzfQ.TXcSIOE_ZVhxHsKZWEC7hqwL85RFLmksLeMMfTNGorMDZFb0nc3REgNxc3u8QaLChXDVwj9CBZrcEM3QX9E2mRZL8zG_vFYGLXkIe7-7ToaqNQFSqYo6aotA5ERTTNJstsovxdqkof70QZHKvFWsBQen8_NXbrN9Uv-bfDxRNJtMB0CINNkMQGgzpSP5Ca3sQtTRTteKeuj1ActZ98XH-P2LR2dYAleDEFxbF-1fQo45jEC8KWZIFoBrDPTML3fX9jmyLojfRGgxnDPZWhFECcmgxvthG8mIXpfzUq-sDP8xeujQA29JDsO6BXpfhha2bT3vCVRq_Ckng-JBWGm4oCb1l8xkMFVqBVIK26t1FITst4UikykzywOQOvFi3jwYL9w_k6T3sf630aq7ZbdYCvH7CCmA9F3-1OG_XaGc6H3ER7uQHcC0NrjRyXZi8ZNCeZJsdExIdCM57BVzL9UnzC9dto0hXO-E6ruYn59SCun0tOVgDifQmslGOXyGj2Lb7Wp34TV4oyjlcdsFvtC0_ENMzBh6Lq_fqzZook_C7SAjUM6G6gOZpnIaJlVL-jOlKz4J3jQZ8yBLzR1LRMgQnz27-6dXjVqnt1pnZuLcel_5GMsqmpIvcLIFIHkZkJPSAiRdcpCIpySb6DOaXFoEuX0f2B28Zpge9rRd3lDaGjw"

      // Step 3: Authenticate with Paragon using the JWT token and project ID
      await paragon.authenticate(projectId, token2);

      // Step 3: Open Connect Portal for Google Drive integration
      // Note: Google OAuth client is in development mode
      // Testers must be whitelisted until the app is published

      // The connect method opens the portal and handles auth via callbacks
      // We'll simulate successful authentication for now
      setAuthState({
        isAuthenticated: true,
        isAuthenticating: false,
        user: { id: 'authenticated-user' },
        error: null,
      });

      config?.onSuccess?.({ success: true, user: { id: 'authenticated-user' } });

      // paragon.connect('googledrive');

      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key is not configured. Please set VITE_GOOGLE_API_KEY in your .env file.');
      }

      const picker = new paragon.ExternalFilePicker("googledrive", {
        onFileSelect: (files) => {
            // Handle file selection
            console.log(files);
          }
      });
      
      // Loads external dependencies and user's access token
      await picker.init({ developerKey: GOOGLE_API_KEY, "appId": "nos-ingestion-dev" });
      
      // Open the File Picker
      picker.open();

      // Note: In production, you would call paragon.connect('googledrive')
      // which opens the Connect Portal UI for the user to authenticate
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState({
        isAuthenticated: false,
        isAuthenticating: false,
        user: null,
        error: errorMessage,
      });
      config?.onError?.(errorMessage);
    }
  }, [sdkState.isReady]);

  /**
   * Reset authentication state
   */
  const resetAuth = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isAuthenticating: false,
      user: null,
      error: null,
    });
  }, []);

  return {
    ...authState,
    isParagonLoading: sdkState.isLoading,
    isParagonReady: sdkState.isReady,
    paragonError: sdkState.error,
    authenticate,
    resetAuth,
  };
};
