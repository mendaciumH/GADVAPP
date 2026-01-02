import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Clock, Star, Heart, Share2,
  Users, Plane, Hotel, UtensilsCrossed, Camera, CheckCircle,
  Phone, Mail, MessageCircle
} from 'lucide-react';

// Sample travel data (same as HomePage)
const featuredTrips = [
  {
    id: 1,
    title: "Aventure Maroc - Circuit Impérial",
    description: "Découvrez les trésors du Maroc avec notre circuit impérial de 8 jours. Visitez les villes impériales, explorez les souks animés, et profitez de la cuisine locale authentique.",
    destination: "Maroc",
    price: 85000,
    duration: 8,
    image: require('../../assets/airplane.jpg'),
    rating: 4.8,
    featured: true,
    includes: [
      "Vol aller-retour",
      "Hébergement 4 étoiles",
      "Petit-déjeuner inclus",
      "Guide local francophone",
      "Transport privé",
      "Assurance voyage"
    ],
    itinerary: [
      { day: 1, title: "Arrivée à Casablanca", description: "Accueil à l'aéroport et transfert à l'hôtel" },
      { day: 2, title: "Casablanca - Rabat", description: "Visite de la mosquée Hassan II et départ pour Rabat" },
      { day: 3, title: "Rabat - Fès", description: "Découverte de la capitale et route vers Fès" },
      { day: 4, title: "Fès", description: "Visite guidée de la médina de Fès" },
      { day: 5, title: "Fès - Marrakech", description: "Traversée de l'Atlas vers Marrakech" },
      { day: 6, title: "Marrakech", description: "Visite de la place Jemaa el-Fnaa et des souks" },
      { day: 7, title: "Marrakech - Casablanca", description: "Retour à Casablanca avec arrêt à Rabat" },
      { day: 8, title: "Départ", description: "Transfert à l'aéroport et vol retour" }
    ]
  },
  {
    id: 2,
    title: "Escapade Tunisie - Désert & Côtes",
    description: "Une expérience unique entre désert et mer Méditerranée. Découvrez les contrastes de la Tunisie.",
    destination: "Tunisie",
    price: 65000,
    duration: 6,
    image: require('../../assets/airplane.jpg'),
    rating: 4.6,
    featured: true,
    includes: [
      "Vol aller-retour",
      "Hébergement 3-4 étoiles",
      "Petit-déjeuner",
      "Guide local",
      "Transport",
      "Assurance"
    ],
    itinerary: [
      { day: 1, title: "Arrivée à Tunis", description: "Accueil et installation à l'hôtel" },
      { day: 2, title: "Tunis - Sidi Bou Saïd", description: "Visite de la médina et du village bleu et blanc" },
      { day: 3, title: "Tunis - Désert", description: "Route vers le désert et nuit sous les étoiles" },
      { day: 4, title: "Désert - Hammamet", description: "Retour vers la côte et détente à Hammamet" },
      { day: 5, title: "Hammamet", description: "Journée libre à la plage" },
      { day: 6, title: "Départ", description: "Transfert à l'aéroport" }
    ]
  },
  {
    id: 3,
    title: "Pèlerinage à La Mecque",
    description: "Voyage spirituel complet avec guide religieux expérimenté. Accomplissez votre Omra dans les meilleures conditions.",
    destination: "Arabie Saoudite",
    price: 120000,
    duration: 10,
    image: require('../../assets/airplane.jpg'),
    rating: 4.9,
    featured: true,
    includes: [
      "Vol aller-retour",
      "Hébergement près de la Grande Mosquée",
      "Guide religieux certifié",
      "Transport privé",
      "Assistance complète",
      "Documentation religieuse"
    ],
    itinerary: [
      { day: 1, title: "Arrivée à Médine", description: "Accueil et installation" },
      { day: 2, title: "Visite de Médine", description: "Visite de la mosquée du Prophète" },
      { day: 3, title: "Médine - La Mecque", description: "Transfert vers La Mecque" },
      { day: 4, title: "Omra", description: "Accomplissement de l'Omra" },
      { day: 5, title: "La Mecque", description: "Visites et prières" },
      { day: 6, title: "La Mecque", description: "Journée spirituelle" },
      { day: 7, title: "La Mecque", description: "Temps libre pour les prières" },
      { day: 8, title: "La Mecque - Médine", description: "Retour à Médine" },
      { day: 9, title: "Médine", description: "Dernière journée à Médine" },
      { day: 10, title: "Départ", description: "Transfert à l'aéroport" }
    ]
  },
  {
    id: 4,
    title: "Découverte Turquie - Istanbul & Cappadoce",
    description: "Explorez l'histoire et la beauté naturelle de la Turquie. Un voyage entre tradition et modernité.",
    destination: "Turquie",
    price: 95000,
    duration: 7,
    image: require('../../assets/airplane.jpg'),
    rating: 4.7,
    featured: true,
    includes: [
      "Vol aller-retour",
      "Hébergement 4 étoiles",
      "Petit-déjeuner",
      "Guide local",
      "Transport",
      "Assurance"
    ],
    itinerary: [
      { day: 1, title: "Arrivée à Istanbul", description: "Accueil et installation" },
      { day: 2, title: "Istanbul", description: "Visite de Sainte-Sophie et du Palais Topkapi" },
      { day: 3, title: "Istanbul", description: "Découverte du Grand Bazar et du Bosphore" },
      { day: 4, title: "Istanbul - Cappadoce", description: "Vol vers la Cappadoce" },
      { day: 5, title: "Cappadoce", description: "Montgolfière et visite des vallées" },
      { day: 6, title: "Cappadoce", description: "Exploration des villes souterraines" },
      { day: 7, title: "Départ", description: "Transfert à l'aéroport" }
    ]
  }
];

const TripDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const trip = featuredTrips.find(t => t.id === parseInt(id || '0'));

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Voyage non trouvé</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{trip.title} - Yara Travel</title>
        <meta name="description" content={trip.description} />
      </Helmet>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
            <Link to="/" className="flex items-center space-x-3">
              <img
                src={require('../../assets/logo.png')}
                alt="Yara Travel"
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {/* Hero Image */}
        <div className="relative h-96 overflow-hidden">
          <motion.img
            src={trip.image}
            alt={trip.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">{trip.rating}</span>
                <span className="text-gray-300">({Math.floor(Math.random() * 100 + 50)} avis)</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center space-x-4 text-lg">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-5 h-5" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-5 h-5" />
                  <span>{trip.duration} jours</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos de ce voyage</h2>
                <p className="text-gray-600 leading-relaxed">{trip.description}</p>
              </motion.section>

              {/* Itinerary */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinéraire</h2>
                <div className="space-y-6">
                  {trip.itinerary?.map((item, idx) => (
                    <div key={idx} className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                          {item.day}
                        </div>
                        {idx < (trip.itinerary?.length || 0) - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* What's Included */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ce qui est inclus</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip.includes?.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-6 sticky top-24"
              >
                <div className="mb-6">
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {trip.price.toLocaleString()} DA
                    </span>
                    <span className="text-gray-500">/personne</span>
                  </div>
                  <p className="text-sm text-gray-600">À partir de</p>
                </div>

                <motion.button
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Réserver maintenant
                </motion.button>

                <button className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:border-yellow-400 hover:text-yellow-500 transition-all duration-300 mb-6">
                  Demander un devis
                </button>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">+213 XXX XXX XXX</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">contact@yaratravel.com</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Chat en direct</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TripDetailsPage;

