import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing anything else
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

import axios from 'axios';
import { getParagonAuthToken, configureParagonSync, getSyncStatus, healthCheck } from '../api';

const mockedAxios = vi.mocked(axios, true);

describe('API Service', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the axios create mock to return a fresh instance each time
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    (mockedAxios.create as any).mockReturnValue(mockAxiosInstance);
  });

  describe('getParagonAuthToken', () => {
    it('successfully gets authentication token', async () => {
      const mockResponse = {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await getParagonAuthToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/paragon/token');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles token fetch errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: 'Unauthorized',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(getParagonAuthToken()).rejects.toThrow(
        'Authentication failed: Unauthorized'
      );
    });

    it('handles network errors during token fetch', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(getParagonAuthToken()).rejects.toThrow(
        'Authentication failed: Network error: Unable to reach the server'
      );
    });
  });

  describe('configureParagonSync', () => {
    it('successfully configures sync with folder and drive ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          syncId: 'sync-123',
          message: 'Sync configured successfully',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const syncRequest = {
        folderId: 'folder-123',
        driveId: 'drive-456',
      };

      const result = await configureParagonSync(syncRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/integrations/paragon/sync', syncRequest);
      expect(result).toEqual(mockResponse.data);
    });

    it('successfully configures sync with folder ID only', async () => {
      const mockResponse = {
        data: {
          success: true,
          syncId: 'sync-123',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const syncRequest = {
        folderId: 'folder-123',
      };

      const result = await configureParagonSync(syncRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/integrations/paragon/sync', syncRequest);
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error responses', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'Invalid folder ID',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const syncRequest = {
        folderId: 'invalid-folder',
      };

      await expect(configureParagonSync(syncRequest)).rejects.toThrow(
        'Sync configuration failed: Invalid folder ID'
      );
    });

    it('handles network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      const syncRequest = {
        folderId: 'folder-123',
      };

      await expect(configureParagonSync(syncRequest)).rejects.toThrow(
        'Sync configuration failed: Network error: Unable to reach the server'
      );
    });
  });

  describe('getSyncStatus', () => {
    it('successfully gets sync status', async () => {
      const mockResponse = {
        data: {
          syncs: [
            { id: 'sync-123', folderId: 'folder-123', status: 'active' },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getSyncStatus();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/integrations/paragon/sync/status');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles sync status errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(getSyncStatus()).rejects.toThrow(
        'Status check failed: Internal server error'
      );
    });
  });

  describe('healthCheck', () => {
    it('successfully performs health check', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles health check failures', async () => {
      const mockError = {
        request: {},
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(healthCheck()).rejects.toThrow('Backend health check failed');
    });
  });
});
