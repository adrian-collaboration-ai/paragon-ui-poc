import React, { useEffect } from 'react';
import { IntegrationsPage } from './components/IntegrationsPage';
import { validateEnvironment } from './config/env';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import './App.css'

function App() {
  const [envError, setEnvError] = React.useState<string | null>(null);

  useEffect(() => {
    // Validate environment variables on app start
    const missingVars = validateEnvironment();
    if (missingVars.length > 0) {
      setEnvError(
        `Missing required environment variables: ${missingVars.join(', ')}. 
         Please check your .env file and ensure all variables from .env.example are configured.`
      );
    }
  }, []);

  if (envError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{envError}</p>
              <p>
                Copy <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.example</code> to <code className="bg-muted px-1 py-0.5 rounded text-xs">.env</code> and fill in your API keys.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <IntegrationsPage />;
}

export default App
