import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { SyncRequest, SyncResponse } from '../types';
import { API_BASE_URL } from '../config/env';

/**
 * API service for backend communication
 * Handles the integration with the artifact-service backend
 */

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication headers here if required
    // config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      throw new Error(data?.message || data?.error || `Server error: ${status}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Unable to reach the server');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

/**
 * Get JWT token for Paragon authentication
 * POST /paragon/token
 */
export const getParagonAuthToken = async (): Promise<{ token: string }> => {
  try {
    const response: AxiosResponse<{ token: string }> = await apiClient.post(
      '/paragon/token'
    );

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get auth token';
    throw new Error(`Authentication failed: ${message}`);
  }
};

/**
 * Configure Paragon sync with selected folder/drive
 * POST /integrations/paragon/sync
 */
export const configureParagonSync = async (
  syncRequest: SyncRequest
): Promise<SyncResponse> => {
  try {
    const response: AxiosResponse<SyncResponse> = await apiClient.post(
      '/integrations/paragon/sync',
      syncRequest
    );

    return response.data;
  } catch (error) {
    // Re-throw with more context
    const message = error instanceof Error ? error.message : 'Failed to configure sync';
    throw new Error(`Sync configuration failed: ${message}`);
  }
};

/**
 * Get current sync status (optional endpoint for checking existing syncs)
 * GET /integrations/paragon/sync/status
 */
export const getSyncStatus = async (): Promise<unknown> => {
  try {
    const response = await apiClient.get('/integrations/paragon/sync/status');
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get sync status';
    throw new Error(`Status check failed: ${message}`);
  }
};

/**
 * Health check endpoint to verify backend connectivity
 * GET /health
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch {
    throw new Error('Backend health check failed');
  }
};

export default apiClient;
