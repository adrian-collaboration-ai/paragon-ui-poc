import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParagon } from '../useParagon';
import * as api from '../../services/api';

// Mock the Paragon SDK
vi.mock('@useparagon/connect', () => ({
  paragon: {
    configureGlobal: vi.fn(),
    authenticate: vi.fn(),
    connect: vi.fn(),
  },
}));

// Mock the API service
vi.mock('../../services/api');
const mockGetParagonAuthToken = vi.mocked(api.getParagonAuthToken);

describe('useParagon', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful configuration by default
    const { paragon } = require('@useparagon/connect');
    paragon.configureGlobal.mockResolvedValue(undefined);
    paragon.authenticate.mockResolvedValue(undefined);

    // Mock successful token fetch by default
    mockGetParagonAuthToken.mockResolvedValue({ token: 'test-jwt-token' });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useParagon());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthenticating).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.isParagonLoading).toBe(true); // Starts loading
  });

  it('configures Paragon SDK on mount', async () => {
    const { paragon } = require('@useparagon/connect');

    renderHook(() => useParagon());

    await waitFor(() => {
      expect(paragon.configureGlobal).toHaveBeenCalledWith({
        projectId: expect.any(String),
        host: expect.any(String),
      });
    });
  });

  it('reports ready state after successful configuration', async () => {
    const { result } = renderHook(() => useParagon());

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
      expect(result.current.isParagonLoading).toBe(false);
      expect(result.current.paragonError).toBe(null);
    });
  });

  it('handles configuration errors', async () => {
    const { paragon } = require('@useparagon/connect');
    paragon.configureGlobal.mockRejectedValue(new Error('Configuration failed'));

    const { result } = renderHook(() => useParagon());

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(false);
      expect(result.current.isParagonLoading).toBe(false);
      expect(result.current.paragonError).toBe('Configuration failed');
    });
  });

  it('handles successful authentication flow', async () => {
    const { result } = renderHook(() => useParagon());

    // Wait for SDK to be ready
    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
    });

    const onSuccess = vi.fn();

    await act(async () => {
      await result.current.authenticate({ onSuccess });
    });

    expect(mockGetParagonAuthToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'authenticated-user' });
    expect(result.current.error).toBe(null);
    expect(onSuccess).toHaveBeenCalledWith({
      success: true,
      user: { id: 'authenticated-user' },
    });
  });

  it('handles authentication when SDK is not ready', async () => {
    const { paragon } = require('@useparagon/connect');
    paragon.configureGlobal.mockRejectedValue(new Error('Config failed'));

    const { result } = renderHook(() => useParagon());
    const onError = vi.fn();

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(false);
    });

    await act(async () => {
      await result.current.authenticate({ onError });
    });

    expect(result.current.error).toBe('Paragon SDK is not ready');
    expect(onError).toHaveBeenCalledWith('Paragon SDK is not ready');
  });

  it('handles token fetch errors', async () => {
    mockGetParagonAuthToken.mockRejectedValue(new Error('Token fetch failed'));

    const { result } = renderHook(() => useParagon());
    const onError = vi.fn();

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
    });

    await act(async () => {
      await result.current.authenticate({ onError });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Authentication failed: Token fetch failed');
    expect(onError).toHaveBeenCalledWith('Authentication failed: Token fetch failed');
  });

  it('handles Paragon authentication errors', async () => {
    const { paragon } = require('@useparagon/connect');
    paragon.authenticate.mockRejectedValue(new Error('Paragon auth failed'));

    const { result } = renderHook(() => useParagon());
    const onError = vi.fn();

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
    });

    await act(async () => {
      await result.current.authenticate({ onError });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Paragon auth failed');
    expect(onError).toHaveBeenCalledWith('Paragon auth failed');
  });

  it('resets authentication state', async () => {
    const { result } = renderHook(() => useParagon());

    // Wait for SDK to be ready and authenticate
    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
    });

    await act(async () => {
      await result.current.authenticate();
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Reset the state
    act(() => {
      result.current.resetAuth();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('prevents authentication when already authenticating', async () => {
    const { result } = renderHook(() => useParagon());

    await waitFor(() => {
      expect(result.current.isParagonReady).toBe(true);
    });

    // Start first authentication
    const firstCall = act(async () => {
      await result.current.authenticate();
    });

    // Try to start second authentication while first is in progress
    await act(async () => {
      await result.current.authenticate();
    });

    await firstCall;

    // Token should only be fetched once
    expect(mockGetParagonAuthToken).toHaveBeenCalledTimes(1);
  });
});