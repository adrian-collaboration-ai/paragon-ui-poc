# Connect Headless Example

The Headless Connect Portal can be used with your own UI components or design system to make your integrations feel native to the design of your app, while leveraging the Paragon SDK for all of the backend details of connecting and configuring your users’ integrations.

Headless mode still provides fully managed authentication, so you don’t need to worry about managing, storing, or refreshing your customers’ credentials.


## Configuration

To use the features of this demo, you will need a Paragon account. [Start for free](https://dashboard.useparagon.com/signup) today

1. Create a `.env` file at the root of the repository
2. Configure the following environment variables:

```
VITE_PARAGON_PROJECT_ID="your-paragon-project-id"
VITE_API_BASE_URL="http://localhost:8888"
VITE_GOOGLE_API_KEY="your-google-api-key" # Optional
VITE_GOOGLE_APP_ID="your-google-app-id"   # Optional
```

**Note**: This application now uses dynamic JWT token generation from your backend instead of static tokens. Make sure your backend is running and accessible at the configured `VITE_API_BASE_URL`.

### Backend Requirements

Your backend should provide the following endpoints:

- `POST /api/v1/paragon/token` - Generate JWT tokens
- `POST /api/v1/webhooks/paragon/sync` - Configure folder syncs

## Installation

Install dependencies:

```
npm install
```

Start the application dev server:

```
npm run dev
```

After the demo has started, you can visit:

```
http://localhost:5173
```
