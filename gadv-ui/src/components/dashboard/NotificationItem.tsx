import React from 'react';

interface NotificationItemProps {
  id: number;
  type: 'message' | 'favorite' | 'view' | 'subscription';
  title: string;
  description: string;
  time: string;
  read: boolean;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  id,
  type, 
  title, 
  description, 
  time, 
  read,
  onClick 
}) => {
  const getNotificationIcon = (type: string) => {
    const icons = {
      message: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      favorite: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      subscription: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    };
    return icons[type as keyof typeof icons] || icons.message;
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      message: 'bg-blue-100 text-blue-600',
      favorite: 'bg-pink-100 text-pink-600',
      view: 'bg-purple-100 text-purple-600',
      subscription: 'bg-orange-100 text-orange-600'
    };
    return colors[type as keyof typeof colors] || colors.message;
  };

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
        read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${getNotificationColor(type)}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={getNotificationIcon(type)} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
        {!read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem; 