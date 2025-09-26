import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SyncStatus } from '@/lib/hooks';
import { CheckCircle, AlertCircle, Clock, Pause, XCircle } from 'lucide-react';

interface SyncStatusCardProps {
  syncStatus: SyncStatus;
}

export function SyncStatusCard({ syncStatus }: SyncStatusCardProps) {
  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'INITIALIZING':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ACTIVE':
        return <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />;
      case 'IDLE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DISABLED':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'ERRORED':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: SyncStatus['status']) => {
    switch (status) {
      case 'INITIALIZING':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'IDLE':
        return 'bg-green-100 text-green-800';
      case 'DISABLED':
        return 'bg-gray-100 text-gray-800';
      case 'ERRORED':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status: SyncStatus['status']) => {
    switch (status) {
      case 'INITIALIZING':
        return 'Initializing sync...';
      case 'ACTIVE':
        return 'Syncing files';
      case 'IDLE':
        return 'Sync complete';
      case 'DISABLED':
        return 'Sync paused';
      case 'ERRORED':
        return 'Sync error';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(syncStatus.status)}
          <div>
            <h3 className="font-medium text-sm">
              {syncStatus.integration.charAt(0).toUpperCase() + syncStatus.integration.slice(1)} Sync
            </h3>
            <p className="text-xs text-gray-500">
              Folder: {syncStatus.folderId}
            </p>
          </div>
        </div>
        
        <Badge className={getStatusColor(syncStatus.status)}>
          {getStatusText(syncStatus.status)}
        </Badge>
      </div>
      
      {syncStatus.message && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-600">{syncStatus.message}</p>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Sync ID: {syncStatus.syncId}
      </div>
    </Card>
  );
}
