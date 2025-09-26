import { useState } from 'react';
import { paragon } from '@useparagon/connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, FileIcon, DownloadIcon, AlertCircleIcon, ListIcon, EyeIcon, EyeOffIcon, RefreshCwIcon } from 'lucide-react';
import { FileManager } from '@cubone/react-file-manager';
import { ParagonService } from '@/lib/paragon-service';
import { getAppConfig } from '@/lib/config';
import '@cubone/react-file-manager/dist/style.css';

interface SelectedFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailUrl?: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

interface GoogleDriveResponse {
  files: GoogleDriveFile[];
}

interface FileManagerItem {
  name: string;
  isDirectory: boolean;
  path: string;
  updatedAt?: string;
  size?: number;
  googleDriveId?: string;
}

export function GoogleDriveManager() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileManagerItems, setFileManagerItems] = useState<FileManagerItem[]>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [originalGoogleDriveFiles, setOriginalGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isConfiguringSync, setIsConfiguringSync] = useState(false);

  const buildFilePath = (file: GoogleDriveFile, allFiles: GoogleDriveFile[]): string => {
    // Función recursiva para construir el path completo
    const buildPath = (currentFile: GoogleDriveFile, visited: Set<string> = new Set()): string => {
      // Evitar loops infinitos
      if (visited.has(currentFile.id)) {
        return currentFile.name;
      }
      visited.add(currentFile.id);
      
      // Si no tiene padres o el padre es 'root', está en la raíz
      if (!currentFile.parents || currentFile.parents.length === 0 || currentFile.parents.includes('root')) {
        return `/${currentFile.name}`;
      }
      
      // Buscar el archivo padre
      const parentId = currentFile.parents[0];
      const parentFile = allFiles.find(f => f.id === parentId);
      
      if (parentFile) {
        const parentPath = buildPath(parentFile, visited);
        return `${parentPath}/${currentFile.name}`;
      }
      
      // Si no encontramos el padre, asumir que está en la raíz
      return `/${currentFile.name}`;
    };
    
    return buildPath(file);
  };

  const transformToFileManagerFormat = (files: GoogleDriveFile[]): FileManagerItem[] => {
    return files.map((file) => ({
      name: file.name,
      isDirectory: file.mimeType === 'application/vnd.google-apps.folder',
      path: buildFilePath(file, files), // Construir path jerárquico
      updatedAt: file.modifiedTime,
      size: file.size ? parseInt(file.size) : undefined,
      googleDriveId: file.id, // Guardar el ID original de Google Drive
    }));
  };

  const fetchGoogleDriveFiles = async () => {
    try {
      setIsFetchingFiles(true);
      setError(null);

      console.log('🔍 Fetching Google Drive files and folders...');

      // Fetch files from Google Drive API
      // Get ALL files and folders (not just from root)
      const response = await paragon.request('googledrive', '/files?q=trashed=false&pageSize=1000&fields=files(id,name,mimeType,size,parents,createdTime,modifiedTime,thumbnailLink)', {
        method: 'GET',
        body: undefined,
        headers: undefined
      });

      const driveResponse = response as GoogleDriveResponse;
      console.log('📁 Google Drive Files and Folders Array:', driveResponse);
      console.log('📊 Total items foundasdadsdas:', driveResponse?.files?.length || 0);

      // Also log each file/folder individually for better readability
      if (driveResponse?.files) {
        driveResponse.files.forEach((item: GoogleDriveFile, index: number) => {
          const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
          console.log(`${index + 1}. ${isFolder ? '📁' : '📄'} ${item.name} (${item.mimeType})`);
        });

        // Store original Google Drive files for reference
        setOriginalGoogleDriveFiles(driveResponse.files);
        
        // Transform data for file manager
        const transformedFiles = transformToFileManagerFormat(driveResponse.files);
        setFileManagerItems(transformedFiles);
        setShowFileManager(true);
        console.log('📋 File Manager Items:', transformedFiles);
        
        // Also store original Google Drive data for reference
        console.log('📊 Original Google Drive Response:', driveResponse.files);
      }

      return response;

    } catch (err) {
      console.error('❌ Error fetching Google Drive files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setIsFetchingFiles(false);
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
        body: undefined,
        headers: undefined
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

  const configureFolderSync = async (folderId: string) => {
    try {
      setIsConfiguringSync(true);
      setSyncStatus(null);
      setError(null);

      const config = getAppConfig();
      if (!config.success) {
        throw new Error('Configuration error');
      }

      const paragonService = new ParagonService(config.data.VITE_API_BASE_URL);
      const result = await paragonService.configureSync({
        workspaceId: "uuid-workspace",
        userId: "user-id",
        integrationId: "google-drive-integration",
        folderId: folderId,
        webhookUrl: `${config.data.VITE_API_BASE_URL}/api/v1/webhooks/paragon/files`
      });
      
      setSyncStatus(`Sync configured: ${result.syncId}`);
    } catch (err) {
      console.error('Error configuring sync:', err);
      setError(err instanceof Error ? err.message : 'Failed to configure sync');
    } finally {
      setIsConfiguringSync(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Google Drive File Manager</h1>
        <p className="text-muted-foreground">
          Manage and browse your Google Drive files with an integrated file manager interface.
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5" />
            Google Drive Files
          </CardTitle>
          <CardDescription>
            Load and manage files from your connected Google Drive account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={fetchGoogleDriveFiles}
                disabled={isFetchingFiles}
                className="flex-1"
              >
                <ListIcon className="h-4 w-4 mr-2" />
                {isFetchingFiles ? 'Loading Files...' : 'Load Google Drive Files'}
              </Button>
            </div>
            
            {fileManagerItems.length > 0 && (
              <Button
                onClick={() => setShowFileManager(!showFileManager)}
                variant="secondary"
                className="w-full"
              >
                {showFileManager ? (
                  <>
                    <EyeOffIcon className="h-4 w-4 mr-2" />
                    Hide File Manager
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Show File Manager
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              <AlertCircleIcon className="h-4 w-4" />
              {error}
            </div>
          )}

          {syncStatus && (
            <div className="flex items-center gap-2 p-3 text-sm bg-green-50 border border-green-200 rounded-md text-green-800">
              <RefreshCwIcon className="h-4 w-4" />
              {syncStatus}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Selected Files:</h4>
                {selectedFiles.some(f => f.mimeType.includes('folder')) && (
                  <Button 
                    onClick={() => configureFolderSync(selectedFiles.find(f => f.mimeType.includes('folder'))!.id)}
                    disabled={isConfiguringSync}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    {isConfiguringSync ? 'Configuring...' : 'Configure Folder Sync'}
                  </Button>
                )}
              </div>
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

          {showFileManager && fileManagerItems.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-sm mb-3">File Manager Interface:</h4>
              <div className="border rounded-lg overflow-hidden min-h-[500px]">
                <FileManager 
                  files={fileManagerItems}
                  filePreviewPath="https://drive.google.com/file/d/" // URL base para preview de Google Drive
                  onFileSelect={(selectedItems: FileManagerItem[]) => {
                    console.log('File Manager Selection:', selectedItems);
                    // Convertir a formato SelectedFile usando datos originales de Google Drive
                    const convertedFiles: SelectedFile[] = selectedItems.map(item => {
                      // Buscar el archivo original para obtener el tipo MIME correcto
                      const originalFile = originalGoogleDriveFiles.find(f => f.id === item.googleDriveId);
                      return {
                        id: item.googleDriveId || item.path,
                        name: item.name,
                        mimeType: originalFile?.mimeType || (item.isDirectory ? 'application/vnd.google-apps.folder' : 'application/octet-stream'),
                        size: item.size,
                        thumbnailUrl: originalFile?.thumbnailLink
                      };
                    });
                    setSelectedFiles(convertedFiles);
                  }}
                  onFileDownload={async (file: FileManagerItem) => {
                    console.log('Download requested for:', file);
                    if (file.googleDriveId && !file.isDirectory) {
                      // Buscar el archivo original para obtener el tipo MIME correcto
                      const originalFile = originalGoogleDriveFiles.find(f => f.id === file.googleDriveId);
                      const tempFile: SelectedFile = {
                        id: file.googleDriveId,
                        name: file.name,
                        mimeType: originalFile?.mimeType || 'application/octet-stream',
                        size: file.size,
                        thumbnailUrl: originalFile?.thumbnailLink
                      };
                      await downloadFile(tempFile);
                    } else {
                      console.warn('Cannot download folder or file without Google Drive ID');
                    }
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
