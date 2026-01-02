import React from 'react';

interface WelcomeSectionProps {
  firstName?: string;
  lastLogin?: string;
  isOnline?: boolean;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  firstName = 'Utilisateur',
  lastLogin = 'Aujourd\'hui',
  isOnline = true 
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-emerald-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 to-blue-100/20"></div>
      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {firstName} ! 👋
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Voici un aperçu de votre activité
          </p>
          <div className="flex items-center space-x-4">
            
            <div className="flex items-center text-sm text-emerald-600 font-medium">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default WelcomeSection; 