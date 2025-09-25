declare module '@cubone/react-file-manager' {
  export interface FileManagerItem {
    name: string;
    isDirectory: boolean;
    path: string;
    updatedAt?: string;
    size?: number;
    googleDriveId?: string;
  }

  export interface FileManagerProps {
    files: FileManagerItem[];
    filePreviewPath?: string;
    onFileSelect?: (selectedItems: FileManagerItem[]) => void;
    onFileDownload?: (file: FileManagerItem) => void;
    onFileDelete?: (file: FileManagerItem) => void;
    onFileRename?: (file: FileManagerItem, newName: string) => void;
    onFolderCreate?: (path: string, name: string) => void;
  }

  export const FileManager: React.FC<FileManagerProps>;
}
