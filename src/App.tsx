import { Header } from '@/components/layout/header';
import { paragon } from '@useparagon/connect';
import { useQuery } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { getAppConfig } from '@/lib/config';
import { ParagonService } from '@/lib/paragon-service';
import { ThemeProvider } from '@/lib/themes/theme-provider';
import { IntegrationList } from '@/components/feature/integration/integration-list';
import { IntegrationCard } from '@/components/feature/integration/integration-card';
import { ErrorCard } from '@/components/ui/error-card';
// import { GoogleDriveManager } from '@/components/pages/custom-file-manager';

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <div>
          <Header />
          <Routes>
            <Route path="/" element={
              <div className="container mx-auto py-4 px-8">
                <AuthenticatedApp />
              </div>
            } />
            {/* <Route path="/google-drive" element={<GoogleDriveManager />} /> */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

async function authenticate() {
  const config = getAppConfig();

  if (!config.success) {
    throw config.error;
  }

  // Generate token dynamically from backend
  const paragonService = new ParagonService(config.data.VITE_API_BASE_URL);
  const token = await paragonService.generateToken(config.data.VITE_PARAGON_USER_ID);

  await paragon.authenticate(
    config.data.VITE_PARAGON_PROJECT_ID,
    token,
  );
  paragon.setHeadless(true);

  return null;
}

function AuthenticatedApp() {
  const {
    isLoading,
    error,
    refetch: reauthenticate,
  } = useQuery({
    queryKey: ['authentication'],
    queryFn: authenticate,
  });

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-medium mb-4">Integrations</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          <IntegrationCard.Skeleton />
          <IntegrationCard.Skeleton />
          <IntegrationCard.Skeleton />
          <IntegrationCard.Skeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorCard error={error} onRetry={reauthenticate} />;
  }

  return <IntegrationList />;
}