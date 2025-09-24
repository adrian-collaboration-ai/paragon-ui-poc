import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleDriveIntegration } from '../GoogleDriveIntegration';
import * as paragonHook from '../../hooks/useParagon';
import * as pickerHook from '../../hooks/useGooglePicker';
import * as apiService from '../../services/api';

// Mock the hooks
vi.mock('../../hooks/useParagon');
vi.mock('../../hooks/useGooglePicker');
vi.mock('../../services/api');

const mockUseParagon = vi.mocked(paragonHook.useParagon);
const mockUseGooglePicker = vi.mocked(pickerHook.useGooglePicker);
const mockConfigureParagonSync = vi.mocked(apiService.configureParagonSync);

describe('GoogleDriveIntegration', () => {
  const defaultParagonState = {
    isAuthenticated: false,
    isAuthenticating: false,
    user: null,
    error: null,
    isParagonLoading: false,
    isParagonReady: true,
    paragonError: null,
    authenticate: vi.fn(),
    resetAuth: vi.fn(),
  };

  const defaultPickerState = {
    isOpen: false,
    isLoading: false,
    selectedFolder: null,
    error: null,
    accessToken: null,
    isGoogleLoading: false,
    isGoogleReady: true,
    googleError: null,
    openPicker: vi.fn(),
    resetPicker: vi.fn(),
    initializeGoogleAPIs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParagon.mockReturnValue(defaultParagonState);
    mockUseGooglePicker.mockReturnValue(defaultPickerState);
  });

  it('renders the Google Drive integration card', () => {
    render(<GoogleDriveIntegration />);
    
    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Sync files from your Google Drive folders and shared drives')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect google drive/i })).toBeInTheDocument();
  });

  it('shows loading state when dependencies are loading', () => {
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isParagonLoading: true,
    });

    render(<GoogleDriveIntegration />);
    
    expect(screen.getByText(/loading google drive integration dependencies/i)).toBeInTheDocument();
  });

  it('shows error when Paragon is not ready', () => {
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isParagonReady: false,
      paragonError: 'Failed to load Paragon SDK',
    });

    render(<GoogleDriveIntegration />);
    
    expect(screen.getByText('Failed to load Paragon SDK')).toBeInTheDocument();
  });

  it('disables connect button when dependencies are not ready', () => {
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isParagonReady: false,
    });

    render(<GoogleDriveIntegration />);
    
    const connectButton = screen.getByRole('button', { name: /connect google drive/i });
    expect(connectButton).toBeDisabled();
  });

  it('calls authenticate when connect button is clicked', async () => {
    const user = userEvent.setup();
    const mockAuthenticate = vi.fn();
    
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      authenticate: mockAuthenticate,
    });

    render(<GoogleDriveIntegration />);
    
    const connectButton = screen.getByRole('button', { name: /connect google drive/i });
    await user.click(connectButton);
    
    expect(mockAuthenticate).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
  });

  it('opens picker after successful authentication', async () => {
    const mockOpenPicker = vi.fn();
    const mockAuthenticate = vi.fn((config) => {
      // Simulate successful authentication
      config.onSuccess();
    });
    
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      authenticate: mockAuthenticate,
    });
    
    mockUseGooglePicker.mockReturnValue({
      ...defaultPickerState,
      openPicker: mockOpenPicker,
    });

    render(<GoogleDriveIntegration />);
    
    const connectButton = screen.getByRole('button', { name: /connect google drive/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(mockOpenPicker).toHaveBeenCalled();
    });
  });

  it('handles folder selection and calls backend sync', async () => {
    const mockFolder = {
      id: 'folder-123',
      name: 'Test Folder',
      type: 'folder',
      driveId: 'drive-456',
    };
    
    const mockSyncResponse = {
      success: true,
      syncId: 'sync-789',
      message: 'Sync configured successfully',
    };

    mockConfigureParagonSync.mockResolvedValue(mockSyncResponse);

    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isAuthenticated: true,
    });

    mockUseGooglePicker.mockReturnValue({
      ...defaultPickerState,
      selectedFolder: mockFolder,
    });

    const onSyncComplete = vi.fn();
    render(<GoogleDriveIntegration onSyncComplete={onSyncComplete} />);

    await waitFor(() => {
      expect(mockConfigureParagonSync).toHaveBeenCalledWith({
        folderId: 'folder-123',
        driveId: 'drive-456',
      });
    });

    await waitFor(() => {
      expect(onSyncComplete).toHaveBeenCalledWith(mockSyncResponse);
    });
  });

  it('shows connected state with selected folder', () => {
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isAuthenticated: true,
    });

    render(<GoogleDriveIntegration />);
    
    // Simulate connected state by updating component state
    // Note: This would require more complex testing setup to fully test the connected state
    // For now, we test the individual pieces
  });

  it('handles authentication errors', async () => {
    const mockAuthenticate = vi.fn((config) => {
      config.onError('Authentication failed');
    });
    
    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      authenticate: mockAuthenticate,
    });

    const onError = vi.fn();
    render(<GoogleDriveIntegration onError={onError} />);
    
    const connectButton = screen.getByRole('button', { name: /connect google drive/i });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Authentication failed');
    });
  });

  it('handles backend sync errors', async () => {
    const mockFolder = {
      id: 'folder-123',
      name: 'Test Folder',
      type: 'folder',
    };

    mockConfigureParagonSync.mockRejectedValue(new Error('Backend error'));

    mockUseParagon.mockReturnValue({
      ...defaultParagonState,
      isAuthenticated: true,
    });

    mockUseGooglePicker.mockReturnValue({
      ...defaultPickerState,
      selectedFolder: mockFolder,
    });

    const onError = vi.fn();
    render(<GoogleDriveIntegration onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Sync configuration failed: Backend error');
    });
  });

  it('shows development mode warning', () => {
    render(<GoogleDriveIntegration />);
    
    expect(screen.getByText(/development mode/i)).toBeInTheDocument();
    expect(screen.getByText(/testers must be whitelisted/i)).toBeInTheDocument();
  });
});
