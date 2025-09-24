import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Google APIs
declare global {
  interface Window {
    google?: {
      picker?: {
        api?: {
          load: (callback: () => void) => void;
        };
        PickerBuilder: new () => any;
        DocsView: new () => any;
        DocsUploadView: new () => any;
        ViewId: {
          DOCS: string;
          DOCS_IMAGES: string;
          FOLDERS: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        Document: {
          ID: string;
          NAME: string;
          TYPE: string;
        };
      };
      accounts?: {
        oauth2?: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

// Mock Google Picker API
window.google = {
  picker: {
    api: {
      load: vi.fn((callback) => callback()),
    },
    PickerBuilder: vi.fn().mockImplementation(() => ({
      addView: vi.fn().mockReturnThis(),
      setOAuthToken: vi.fn().mockReturnThis(),
      setDeveloperKey: vi.fn().mockReturnThis(),
      setCallback: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        setVisible: vi.fn(),
      }),
    })),
    DocsView: vi.fn().mockImplementation(() => ({
      setIncludeFolders: vi.fn().mockReturnThis(),
    })),
    DocsUploadView: vi.fn(),
    ViewId: {
      DOCS: 'docs',
      DOCS_IMAGES: 'docs_images',
      FOLDERS: 'folders',
    },
    Action: {
      PICKED: 'picked',
      CANCEL: 'cancel',
    },
    Document: {
      ID: 'id',
      NAME: 'name',
      TYPE: 'type',
    },
  },
  accounts: {
    oauth2: {
      initTokenClient: vi.fn().mockReturnValue({
        requestAccessToken: vi.fn(),
      }),
    },
  },
};

// Mock Paragon SDK - now handled by @useparagon/connect package
// No need for window.paragon anymore

// Mock environment variables
vi.mock('../config/env', () => ({
  GOOGLE_API_KEY: 'test-api-key',
  GOOGLE_CLIENT_ID: 'test-client-id',
  PARAGON_PROJECT_KEY: 'test-project-key',
  PARAGON_HOST: 'test-host',
  API_BASE_URL: 'http://localhost:3000',
}));
