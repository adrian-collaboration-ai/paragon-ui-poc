export interface ConfigureSyncRequest {
  workspaceId: string;
  userId: string;
  integrationId: string;
  folderId: string;
  webhookUrl: string;
  userToken: string;
}

export interface ConfigureSyncResponse {
  syncId: string;
  status: string;
  message?: string;
}

export interface GenerateTokenResponse {
  token: string;
}

export interface IngestFileRequest {
  workspaceId: string;
  userId: string;
  artifactType?: string;
  metadata?: Record<string, string | number | boolean>;
  tags?: string[];
  processingIntent?: string;
}

export interface IngestFileResponse {
  artifactId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  processingStatus: string;
  createdAt: string;
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
      console.log('Configuring sync with payload:', JSON.stringify(request, null, 2));
      
      const response = await fetch(`${this.baseUrl}/api/v1/webhooks/paragon/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync configuration failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to configure sync: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: ConfigureSyncResponse = await response.json();
      console.log('Sync configuration successful:', data);
      return data;
    } catch (error) {
      console.error('Error configuring Paragon sync:', error);
      throw error;
    }
  }

  async ingestFile(file: File, request: IngestFileRequest): Promise<IngestFileResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('request', JSON.stringify(request));

      const response = await fetch(`${this.baseUrl}/api/v1/ingest`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to ingest file: ${response.status} ${response.statusText}`);
      }

      const data: IngestFileResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error ingesting file:', error);
      throw error;
    }
  }
}
