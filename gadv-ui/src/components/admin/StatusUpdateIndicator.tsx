import React from 'react';

interface StatusUpdateIndicatorProps {
  isUpdating: boolean;
  lastUpdateTime?: Date;
  updateType?: 'approve' | 'reject' | 'feature' | 'general';
}

const StatusUpdateIndicator: React.FC<StatusUpdateIndicatorProps> = ({ 
  isUpdating, 
  lastUpdateTime, 
  updateType = 'general' 
}) => {
  const getIcon = () => {
    if (isUpdating) {
      return (
        <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }

    switch (updateType) {
      case 'approve':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'reject':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'feature':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  const getMessage = () => {
    if (isUpdating) {
      switch (updateType) {
        case 'approve':
          return 'Approbation en cours...';
        case 'reject':
          return 'Rejet en cours...';
        case 'feature':
          return 'Mise à jour des vedettes...';
        default:
          return 'Mise à jour en cours...';
      }
    }

    return 'Liste mise à jour automatiquement';
  };

  const getTimeAgo = () => {
    if (!lastUpdateTime) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `Il y a ${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}min`;
    return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isUpdating || lastUpdateTime ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${
        isUpdating 
          ? 'bg-blue-50/90 border-blue-200 text-blue-800' 
          : 'bg-green-50/90 border-green-200 text-green-800'
      }`}>
        {getIcon()}
        <span className="text-sm font-medium">{getMessage()}</span>
        {!isUpdating && lastUpdateTime && (
          <span className="text-xs opacity-75">• {getTimeAgo()}</span>
        )}
      </div>
    </div>
  );
};

export default StatusUpdateIndicator; 