export interface ConfigureSyncRequest {
  workspaceId: string;
  userId: string;
  integrationId: string;
  folderId: string;
  webhookUrl: string;
}

export interface ConfigureSyncResponse {
  syncId: string;
  status: string;
  message?: string;
}

export interface GenerateTokenResponse {
  token: string;
}

export class ParagonService {
  constructor(private baseUrl: string) {}

  async generateToken(userId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/paragon/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
      }

      const data: GenerateTokenResponse = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating Paragon token:', error);
      throw error;
    }
  }

  async configureSync(request: ConfigureSyncRequest): Promise<ConfigureSyncResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/webhooks/paragon/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to configure sync: ${response.status} ${response.statusText}`);
      }

      const data: ConfigureSyncResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error configuring Paragon sync:', error);
      throw error;
    }
  }
}
