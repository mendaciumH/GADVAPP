import React from 'react';

interface PropertyCardProps {
  id: number;
  title: string;
  type: string;
  price: string;
  location: string;
  status: 'active' | 'pending' | 'inactive';
  views: number;
  image: string;
  onEdit?: (id: number) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  id,
  title, 
  type, 
  price, 
  location, 
  status, 
  views, 
  image,
  onEdit 
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getStatusText = (status: string) => {
    const texts = {
      active: 'Active',
      pending: 'En attente',
      inactive: 'Inactive'
    };
    return texts[status as keyof typeof texts] || 'Inconnu';
  };

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
          {views} vues
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location}
          </span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-medium">
            {type}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {price} DA
          </span>
          {onEdit && (
            <button 
              onClick={() => onEdit(id)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 