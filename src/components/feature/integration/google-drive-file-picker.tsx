import { useState } from 'react';
import { paragon } from '@useparagon/connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, FileIcon, DownloadIcon, AlertCircleIcon } from 'lucide-react';

interface SelectedFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
}

interface GoogleDriveFilePickerProps {
  onFileSelect?: (files: SelectedFile[]) => void;
  onCloseModal?: () => void;
}

export function GoogleDriveFilePicker({ onFileSelect, onCloseModal }: GoogleDriveFilePickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFilePicker = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Close the modal when opening file picker
      onCloseModal?.();

      // Get environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const appId = import.meta.env.VITE_GOOGLE_APP_ID;

      if (!apiKey || !appId) {
        throw new Error('Google API Key or App ID not configured. Please check your environment variables.');
      }

      // Initialize the file picker
      const picker = new paragon.ExternalFilePicker("googledrive", {
        allowedTypes: ["application/pdf"],
        allowMultiSelect: true,
        onFileSelect: (files: unknown) => {
          console.log('Files selected:', files);
          // Handle the Paragon response structure: {viewToken: Array, docs: Array}
          let fileArray: unknown[] = [];
          if (files && typeof files === 'object' && 'docs' in files) {
            const paragonResponse = files as { docs?: unknown[] };
            fileArray = Array.isArray(paragonResponse.docs) ? paragonResponse.docs : [];
          } else if (Array.isArray(files)) {
            fileArray = files;
          }
          
          console.log('Extracted file array:', fileArray);
          
          // Transform the files to our expected format
          const transformedFiles: SelectedFile[] = fileArray.map((fileData: unknown) => {
            const file = fileData as {
              id: string;
              name: string;
              mimeType: string;
              sizeBytes?: string;
              thumbnailUrl?: string;
              isShared?: boolean;
              type?: string;
              url?: string;
            };
            
            return {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: file.sizeBytes ? parseInt(file.sizeBytes) : undefined,
              thumbnailUrl: file.thumbnailUrl,
              isShared: file.isShared,
              type: file.type,
              url: file.url,
            };
          });
          
          console.log('Transformed files:', transformedFiles);
          
          setSelectedFiles(transformedFiles);
          onFileSelect?.(transformedFiles);
        }
      });

      // Load external dependencies and user's access token
      await picker.init({ 
        developerKey: apiKey, 
        appId: appId 
      });

      // Open the File Picker
      picker.open();

    } catch (err) {
      console.error('Error opening file picker:', err);
      setError(err instanceof Error ? err.message : 'Failed to open file picker');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (file: SelectedFile) => {
    try {
      setError(null);
      
      // Check if it's a Google Workspace file or regular file
      const isGoogleWorkspaceFile = file.mimeType.includes('application/vnd.google-apps');
      
      let endpoint: string;
      if (isGoogleWorkspaceFile) {
        // For Google Workspace files, use export endpoint
        // Default to PDF export for most Google Workspace files
        let exportMimeType = 'application/pdf';
        if (file.mimeType.includes('spreadsheet')) {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (file.mimeType.includes('presentation')) {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else if (file.mimeType.includes('document')) {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
        
        endpoint = `/files/${file.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      } else {
        // For regular files, use the get endpoint with alt=media
        endpoint = `/files/${file.id}?alt=media`;
      }

      const response = await paragon.request('googledrive', endpoint, {
        method: 'GET',
        headers: {},
        body: undefined
      });

      // Create download link
      const blob = new Blob([response as BlobPart], { type: file.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download ${file.name}`);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) {
      return <FolderIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5" />
          Google Drive File Picker
        </CardTitle>
        <CardDescription>
          Select files from your connected Google Drive account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={openFilePicker} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Open File Picker'}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            <AlertCircleIcon className="h-4 w-4" />
            {error}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(file.mimeType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                    className="ml-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
