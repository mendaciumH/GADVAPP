// Types pour les données du dashboard
export interface Stat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: 'emerald' | 'blue' | 'pink' | 'purple' | 'orange';
}

export interface Property {
  id: number;
  title: string;
  type: string;
  price: string;
  location: string;
  status: 'active' | 'pending' | 'inactive';
  views: number;
  image: string;
}

export interface QuickAction {
  name: string;
  description: string;
  icon: string;
  color: 'emerald' | 'blue' | 'pink' | 'purple' | 'orange';
  action: () => void;
}

export interface Notification {
  id: number;
  type: 'message' | 'favorite' | 'view' | 'subscription';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export interface MarketTrend {
  area: string;
  trend: string;
  avgPrice: string;
  type: 'positive' | 'negative';
}

// Données par défaut
export const defaultStats: Stat[] = [
  { 
    name: 'Propriétés actives', 
    value: '12', 
    change: '+2',
    changeType: 'positive',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: 'emerald'
  },
  { 
    name: 'Favoris reçus', 
    value: '28', 
    change: '+8',
    changeType: 'positive',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: 'pink'
  },
  { 
    name: 'Vues totales', 
    value: '1,247', 
    change: '+156',
    changeType: 'positive',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    color: 'purple'
  }
];

export const defaultProperties: Property[] = [
  {
    id: 1,
    title: 'Appartement moderne au centre-ville',
    type: 'Vente',
    price: '45,000,000',
    location: 'Alger Centre',
    status: 'active',
    views: 156,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'
  },
  {
    id: 2,
    title: 'Villa avec jardin à Hydra',
    type: 'Location',
    price: '120,000',
    location: 'Hydra',
    status: 'pending',
    views: 89,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    title: 'Studio meublé près de l\'université',
    type: 'Location',
    price: '80,000',
    location: 'Bab Ezzouar',
    status: 'active',
    views: 234,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
  }
];

export const defaultNotifications: Notification[] = [
  {
    id: 1,
    type: 'message',
    title: 'Nouveau message de Ahmed B.',
    description: 'Intéressé par votre appartement au centre-ville',
    time: 'Il y a 5 minutes',
    read: false
  },
  {
    id: 2,
    type: 'favorite',
    title: 'Nouveau favori ajouté',
    description: 'Votre villa à Hydra a été ajoutée aux favoris',
    time: 'Il y a 1 heure',
    read: false
  },
  {
    id: 3,
    type: 'view',
    title: 'Pic de vues détecté',
    description: 'Votre studio a reçu 45 vues aujourd\'hui',
    time: 'Il y a 2 heures',
    read: true
  },
  {
    id: 4,
    type: 'subscription',
    title: 'Renouvellement d\'abonnement',
    description: 'Votre abonnement Premium expire dans 7 jours',
    time: 'Il y a 1 jour',
    read: true
  }
];

export const defaultMarketTrends: MarketTrend[] = [
  {
    area: 'Alger Centre',
    trend: '+12%',
    avgPrice: '35,000,000',
    type: 'positive'
  },
  {
    area: 'Hydra',
    trend: '+8%',
    avgPrice: '28,000,000',
    type: 'positive'
  },
  {
    area: 'Bab Ezzouar',
    trend: '-3%',
    avgPrice: '22,000,000',
    type: 'negative'
  },
  {
    area: 'Birkhadem',
    trend: '+15%',
    avgPrice: '18,000,000',
    type: 'positive'
  }
]; 