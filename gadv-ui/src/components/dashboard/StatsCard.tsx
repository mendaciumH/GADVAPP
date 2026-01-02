import React from 'react';

interface StatCardProps {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: string;
  color: 'emerald' | 'blue' | 'pink' | 'purple' | 'orange';
}

const StatsCard: React.FC<StatCardProps> = ({ 
  name, 
  value, 
  change, 
  changeType, 
  icon, 
  color 
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${getColorClasses(color)} group-hover:scale-110 transition-transform duration-200`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
        </div>
        {change && (
          <div className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{name}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard; 