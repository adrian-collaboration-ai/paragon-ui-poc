import React, { useEffect } from 'react';
import { IntegrationsPage } from './components/IntegrationsPage';
import { validateEnvironment } from './config/env';
import { Alert } from './components/ui/Alert';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="error">
            <div>
              <h3 className="font-semibold mb-2">Configuration Error</h3>
              <p className="text-sm">{envError}</p>
              <p className="text-sm mt-2">
                Copy <code>.env.example</code> to <code>.env</code> and fill in your API keys.
              </p>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return <IntegrationsPage />;
}

export default App
