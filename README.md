# Google Drive Paragon Integration

A React TypeScript application implementing Google Drive integration using Paragon's embedded SDK. This project demonstrates the complete user flow for authenticating with Google Drive, selecting folders/drives, and configuring backend synchronization.

## 🎯 Project Overview

**Story**: NETOS-2900 - Implement UI for Google Drive Sync Setup with Paragon  
**Epic**: NETOS-2895  
**Component**: Frontend UI for Paragon POC

This implementation provides:
- Paragon Connect SDK integration with JWT authentication
- Google Picker API integration for folder/drive selection
- Support for both My Drive and Shared Drives
- Backend synchronization configuration with secure token handling
- Comprehensive error handling and loading states
- Responsive UI with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project with Drive API enabled
- Paragon project configured for Google Drive integration
- Backend service with `/integrations/paragon/sync` endpoint

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd google-drive-paragon-integration
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys in `.env`:
   ```env
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here.apps.googleusercontent.com
   # Get your Project ID by clicking "Copy Project ID" in the Paragon dashboard
   VITE_PARAGON_PROJECT_KEY=your_paragon_project_id_here
   # Use the standard Paragon host (don't include https://)
   VITE_PARAGON_HOST=useparagon.com
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔧 Configuration Guide

### Google Cloud Setup

1. **Create a Google Cloud Project**
2. **Enable Google Drive API**
3. **Create OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173` (for development)
   - **Note**: OAuth client is in development mode - testers must be whitelisted

4. **Create API Key** for Google Picker API

### Paragon Setup

1. **Configure Paragon project** for Google Drive integration
2. **Get Project ID** by clicking "Copy Project ID" in the Paragon dashboard
3. **Configure Signing Key** in your backend environment (never expose to frontend)
4. **Ensure backend endpoints** are available:
   - `/paragon/token` - for JWT token generation
   - `/integrations/paragon/sync` - for sync configuration

### Backend Requirements

The application expects these backend endpoints:

**1. JWT Token Generation**
```typescript
POST /paragon/token

Response:
{
  "token": "string" // JWT signed with your Paragon Signing Key
}
```

**2. Sync Configuration**
```typescript
POST /integrations/paragon/sync
{
  "folderId": "string",
  "driveId": "string" // optional, for Shared Drives
}

Response:
{
  "success": boolean,
  "syncId": "string",
  "message": "string",
  "error": "string" // if success is false
}
```

**Important**: The JWT token must be signed with your Paragon Signing Key on the backend. Never expose the Signing Key to the frontend.

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── GoogleDriveIntegration.tsx
│   ├── IntegrationsPage.tsx
│   └── __tests__/       # Component tests
├── hooks/               # Custom React hooks
│   ├── useParagon.ts    # Paragon Connect SDK integration
│   ├── useGooglePicker.ts # Google Picker API
│   ├── useScriptLoader.ts # Dynamic script loading (legacy)
│   └── __tests__/       # Hook tests
├── services/            # API services
│   ├── api.ts           # Backend API calls
│   └── __tests__/       # Service tests
├── types/               # TypeScript type definitions
├── config/              # Configuration and environment
├── utils/               # Utility functions
└── test/                # Test setup and utilities
```

## 🧪 Testing

The project includes comprehensive unit tests using Vitest and React Testing Library:

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- ✅ Component rendering and interactions
- ✅ Hook functionality and state management
- ✅ API service calls and error handling
- ✅ Authentication flows
- ✅ Folder selection and sync configuration

## 🔄 User Flow

1. **Initial State**: User sees Google Drive integration card with "Connect" button
2. **JWT Authentication**: Click "Connect" → Backend generates JWT token using Signing Key
3. **Paragon Authentication**: Frontend authenticates with Paragon using JWT token
4. **Integration Portal**: Paragon Connect Portal opens for Google Drive authorization
5. **Folder Selection**: Google Picker opens showing My Drive and Shared Drives
6. **Confirmation**: User selects folder/drive → Backend sync is configured
7. **Success State**: UI shows connected state with selected folder details

## 🚨 Error Handling

The application handles various error scenarios:

- **JWT token errors**: Backend authentication failures with clear messages
- **Paragon SDK errors**: Configuration and authentication error handling
- **Integration cancellation**: Graceful handling when user cancels Connect Portal
- **Picker cancellation**: Graceful handling without backend calls
- **Backend errors**: Network and server error handling
- **Missing environment variables**: Configuration validation on startup
- **SDK loading failures**: Fallback states and error messages

## 🎨 UI Components

Built with reusable components and Tailwind CSS:

- **Button**: Loading states, variants (primary, secondary, danger)
- **Card**: Integration containers with headers and content sections
- **Alert**: Success, error, warning, and info messages
- **Icons**: Lucide React icons for consistent visual language

## 📋 Development Notes

### Important Considerations

- **Development Mode**: Google OAuth client is in development mode. Testers must be whitelisted until published to production.
- **Shared Drives**: Full support for both My Drive and Shared Drives folder selection.
- **Security**: All API keys are properly configured as environment variables.
- **Accessibility**: Components follow accessibility best practices.

### Browser Compatibility

- Modern browsers with ES2018+ support
- Chrome 70+, Firefox 65+, Safari 12+, Edge 79+

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Ensure all production environment variables are configured:

```env
VITE_GOOGLE_API_KEY=prod_google_api_key
VITE_GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
VITE_PARAGON_PROJECT_KEY=prod_paragon_project_id
VITE_PARAGON_HOST=useparagon.com
VITE_API_BASE_URL=https://api.yourbackend.com
```

**Security Note**: Remember to configure your Paragon Signing Key in your backend environment variables, never in the frontend.

## 📚 API Documentation

### Paragon Connect SDK Methods

```typescript
import { paragon } from '@useparagon/connect';

// Configure the SDK
await paragon.configureGlobal({
  projectId: string,
  host: string
});

// Authenticate with JWT token
await paragon.authenticate(jwtToken);

// Open Connect Portal
paragon.connect('googledrive');
```

### Google Picker API Integration

```typescript
// Picker configuration supports:
- My Drive folder selection
- Shared Drives folder selection  
- Folder-only filtering
- OAuth token authentication
```

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Write tests for new features
3. Use functional components with hooks
4. Follow existing code style and naming conventions
5. Update documentation for new features

## 📄 License

This project is part of the Paragon integration POC for NETOS-2900.

---

**Need help?** Check the environment setup, ensure all API keys are configured, and verify the backend endpoint is accessible.
