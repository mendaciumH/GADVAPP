import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, Star, Plane, Globe, ChevronRight, 
  CheckCircle, ArrowRight, Menu, X, Heart,
  TrendingUp, Sparkles, Zap, Mail, Phone, MessageSquare, ChevronDown
} from 'lucide-react';
import { publicService, PublishedArticle } from '../../services/public.service';

const destinations = [
  { name: "Londres", flag: "🇬🇧", trips: 12, image: require('../../assets/airplane.jpg') },
  { name: "Istanbul", flag: "🇹🇷", trips: 15, image: require('../../assets/airplane.jpg') },
  { name: "Maroc", flag: "🇲🇦", trips: 18, image: require('../../assets/airplane.jpg') },
  { name: "Omra", flag: "🇸🇦", trips: 20, image: require('../../assets/airplane.jpg') }
];

const partnerAirlines = [
  { name: "Air Algérie", code: "AH" },
  { name: "Aigle Azur", code: "ZI" },
  { name: "Air France", code: "AF" },
  { name: "Alitalia", code: "AZ" },
  { name: "British Airways", code: "BA" },
  { name: "Emirates", code: "EK" },
  { name: "Tunisair", code: "TU" }
];


// Animated Counter
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2 }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  useEffect(() => {
    loadPublishedArticles();
  }, []);

  const loadPublishedArticles = async () => {
    try {
      setLoadingArticles(true);
      const articles = await publicService.getPublishedArticles();
      setPublishedArticles(articles);
    } catch (error) {
      console.error('Error loading published articles:', error);
      // Fallback to empty array if API fails
      setPublishedArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>Yara Voyage - Agence de Voyage et de Tourisme</title>
        <meta name="description" content="Yara Voyage - Agence de Voyage et de Tourisme. Découvrez le monde avec nos circuits organisés, pèlerinages et voyages d'aventure." />
      </Helmet>
      
      {/* Navigation - Tripzo Style */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={require('../../assets/logo.png')} 
                alt="Yara Voyage" 
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-1">
                <Link 
                  to="/" 
                  className="relative px-4 py-2 font-medium text-sm transition-colors"
                >
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  <span className="text-yellow-500 ml-3">Accueil</span>
                </Link>
                <Link 
                  to="/about" 
                  className="px-4 py-2 font-medium text-sm text-gray-900 hover:text-yellow-500 transition-colors"
                >
                  À propos
                </Link>
                <Link 
                  to="/trips" 
                  className="px-4 py-2 font-medium text-sm text-gray-900 hover:text-yellow-500 transition-colors"
                >
                  Forfaits
                </Link>
                <div className="relative group">
                  <button className="px-4 py-2 font-medium text-sm text-gray-900 hover:text-yellow-500 transition-colors flex items-center space-x-1">
                    <span>Services</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {/* Dropdown menu can be added here */}
                </div>
                <Link 
                  to="/blog" 
                  className="px-4 py-2 font-medium text-sm text-gray-900 hover:text-yellow-500 transition-colors"
                >
                  Blog
                </Link>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-900 font-medium hover:border-gray-400 transition-colors text-sm">
                S'inscrire
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="px-6 py-2.5 rounded-lg bg-yellow-400 text-white font-medium hover:bg-yellow-500 transition-colors text-sm flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language.toUpperCase()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setLanguage('fr');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'fr' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      Français
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'ar' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      العربية
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        language === 'en' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden bg-white border-t"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-4 space-y-3">
                <Link to="/" className="block text-gray-900 font-medium">Accueil</Link>
                <Link to="/about" className="block text-gray-700 font-medium">À propos</Link>
                <Link to="/trips" className="block text-gray-700 font-medium">Forfaits</Link>
                <Link to="/blog" className="block text-gray-700 font-medium">Blog</Link>
                <button className="block w-full text-left text-gray-700 font-medium">Services</button>
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button className="block w-full text-center px-6 py-2.5 border border-gray-300 text-gray-900 rounded-lg font-medium">
                    S'inscrire
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                      className="w-full px-6 py-2.5 bg-yellow-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{language.toUpperCase()}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {isLanguageDropdownOpen && (
                      <div className="mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <button
                          onClick={() => {
                            setLanguage('fr');
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            language === 'fr' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          Français
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('ar');
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            language === 'ar' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          العربية
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('en');
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            language === 'en' ? 'text-yellow-500 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section - Tripzo Style */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen bg-white pt-32 pb-20"
        style={{ opacity, y }}
      >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left Column - Main Content (2/3) */}
            <div className="lg:col-span-2">
              {/* Top Banner */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-2 border-2 border-yellow-400 rounded-full bg-yellow-50">
                  <Plane className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-yellow-600 font-semibold text-sm">Il est temps de partir</span>
                </div>
              </motion.div>

              {/* Main Heading with Overlay Image */}
              <motion.div
                className="mb-6 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-tight">
                  <span className="relative inline-block">
                    Explorez
                    <motion.img
                      src={require('../../assets/airplane.jpg')}
                      alt="Travel"
                      className="absolute -top-4 -right-8 w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg z-10"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                    />
                  </span>
                  <br />
                  Le Monde,
                  <br />
                  Une Aventure
                  <br />
                  à la Fois !
                </h1>
              </motion.div>

              {/* Descriptive Text */}
              <motion.p
                className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Trouvez les meilleures offres de voyage et des forfaits économiques pour vos vacances de rêve.
              </motion.p>

              {/* Search Form - Horizontal */}
              <motion.div
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  {/* Location Input */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Destination</label>
                        <select
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full text-gray-600 text-sm border-none outline-none bg-transparent"
                        >
                          <option value="">Où allez-vous ?</option>
                          {destinations.map((dest) => (
                            <option key={dest.name} value={dest.name}>
                              {dest.flag} {dest.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                  </div>

                  {/* Date Input */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Sélectionner une date</label>
                        <input
                          type="date"
                          value={departureDate}
                          onChange={(e) => setDepartureDate(e.target.value)}
                          className="w-full text-gray-600 text-sm border-none outline-none bg-transparent"
                          placeholder="03 Août 2024"
                        />
                      </div>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                  </div>

                  {/* Get Started Button */}
                  <motion.button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (destination) params.append('destination', destination);
                      if (departureDate) params.append('date', departureDate);
                      navigate(`/trips?${params.toString()}`);
                    }}
                    className="w-full md:w-auto px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Commencer
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Image Grid (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Notification Card */}
            <motion.div
                className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      12+
                    </div>
              </div>
                  <p className="text-sm text-gray-700 font-medium">
                    12 personnes ont réservé une visite dans les dernières 24 heures
                  </p>
                </div>
            </motion.div>
            
              {/* Image Grid */}
              <div className="space-y-4">
                {/* Top Image */}
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={require('../../assets/airplane.jpg')}
                    alt="Mountain adventure"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-yellow-400 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-900 rotate-45" />
                  </div>
                </motion.div>

                {/* Middle Right Image */}
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={require('../../assets/airplane.jpg')}
                    alt="Ocean view"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-yellow-400 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-900 rotate-45" />
                      </div>
                </motion.div>

                {/* Bottom Left Image */}
                <motion.div
                  className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={require('../../assets/airplane.jpg')}
                    alt="Bridge adventure"
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-yellow-400 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-900 rotate-45" />
                  </div>
                </motion.div>
            </div>

              {/* Explore Best Packages Link */}
            <motion.div
                className="pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link
                  to="/trips"
                  className="inline-flex items-center text-yellow-500 hover:text-yellow-600 font-semibold transition-colors group"
                >
                  <span>Explorer les meilleurs forfaits</span>
                  <ArrowRight className="w-4 h-4 ml-2 rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
            </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Featured Trips Section - Tripzo Style */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loadingArticles ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Chargement des services...</p>
              </div>
            ) : publishedArticles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun service publié pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {publishedArticles.slice(0, 3).map((article, idx) => (
                  <motion.div
                    key={article.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      {article.image_banner ? (
                        <motion.img
                          src={article.image_banner}
                          alt={article.label}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = require('../../assets/airplane.jpg');
                          }}
                        />
                      ) : (
                        <img
                          src={require('../../assets/airplane.jpg')}
                          alt={article.label}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Price and Heart */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          {article.prix_offre ? `À partir de ${article.prix_offre.toLocaleString()} DA` : 'Prix sur demande'}
                        </p>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {article.label}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                        {article.description || article.destination || 'Découvrez cette offre exceptionnelle'}
                      </p>

                      {/* View Details Button */}
                      <motion.button
                        className="w-full py-3 border-2 border-gray-300 rounded-lg text-gray-900 font-semibold hover:border-yellow-400 hover:text-yellow-500 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/trips/${article.id}`)}
                      >
                        Voir détails
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>


      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${require('../../assets/airplane.jpg')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 5000, label: "Voyageurs Satisfaits", icon: Users },
              { value: 150, label: "Destinations", icon: Globe },
              { value: 500, label: "Voyages Organisés", icon: Plane },
              { value: 98, label: "Taux de Satisfaction", icon: Star },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <stat.icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stat.value} />
                  {stat.label.includes('Taux') && '%'}
                  {!stat.label.includes('Taux') && '+'}
                </div>
                <p className="text-white/90 text-sm font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      {/* Partner Airlines Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos Compagnies Aériennes Partenaires
            </h2>
            <p className="text-lg text-gray-600">
              Nous travaillons avec les meilleures compagnies aériennes pour vous offrir des vols de qualité
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {partnerAirlines.map((airline, idx) => (
              <motion.div
                key={idx}
                className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-yellow-50 hover:shadow-lg transition-all duration-300 border border-gray-200"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Plane className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 text-center mb-1">
                  {airline.name}
                </h3>
                <span className="text-xs text-gray-500">{airline.code}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Your Journey Awaits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Images */}
            <div className="relative h-[600px] hidden lg:block">
              {/* Overlapping Images */}
              <motion.div
                className="absolute top-0 left-0 w-64 h-80 rounded-2xl overflow-hidden shadow-2xl z-10"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={require('../../assets/airplane.jpg')}
                  alt="Airplane"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                className="absolute top-20 right-0 w-64 h-80 rounded-2xl overflow-hidden shadow-2xl z-20"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <img
                  src={require('../../assets/airplane.jpg')}
                  alt="Sailboat"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                className="absolute bottom-0 left-20 w-64 h-80 rounded-2xl overflow-hidden shadow-2xl z-30"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <img
                  src={require('../../assets/airplane.jpg')}
                  alt="Resort"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Have a Question Card */}
              <motion.div
                className="absolute bottom-10 left-10 bg-white rounded-2xl shadow-xl p-4 flex items-center space-x-3 z-40"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Une<br />Question ?
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <button className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Contact Form Card */}
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Votre Voyage Vous Attend
              </h2>
                <p className="text-lg text-gray-600">
                  Laissez-nous créer une expérience de voyage extraordinaire sur mesure pour vous.
                </p>
              </div>

              {/* Contact Form */}
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission
                alert('Formulaire envoyé avec succès !');
              }}>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all"
                    placeholder="+213 (0) 561 66 20 04"
                  />
                </div>

            
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 outline-none transition-all resize-none"
                    placeholder="Dites-nous ce que vous recherchez..."
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Commencer la planification maintenant</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Phone className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-sm text-gray-600">+213 (0) 561 66 20 04</span>
                    <span className="text-xs text-gray-500 mt-1">+213 (0) 561 62 97 75</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Mail className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-sm text-gray-600">yaravoyage@gmail.com</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MessageSquare className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-sm text-gray-600">Chat en direct</span>
                  </div>
                </div>
              </div>
                </motion.div>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src={require('../../assets/logo.png')} 
                alt="Yara Voyage" 
                className="h-10 w-auto mb-4"
              />
              <p className="text-gray-400 text-sm leading-relaxed">
                Yara Voyage - Agence de Voyage et de Tourisme. Votre partenaire de confiance pour tous vos voyages.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Liens rapides</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/trips" className="hover:text-yellow-400 transition-colors">Voyages</Link></li>
                <li><Link to="/about" className="hover:text-yellow-400 transition-colors">À propos</Link></li>
                <li><Link to="/contact" className="hover:text-yellow-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/trips?type=circuit" className="hover:text-yellow-400 transition-colors">Circuits</Link></li>
                <li><Link to="/trips?type=pilgrimage" className="hover:text-yellow-400 transition-colors">Pèlerinages</Link></li>
                <li><Link to="/trips?type=adventure" className="hover:text-yellow-400 transition-colors">Aventures</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: yaravoyage@gmail.com</li>
                <li>Téléphone: +213 (0) 561 66 20 04</li>
                <li>Téléphone: +213 (0) 561 62 97 75</li>
                <li>Téléphone: +213 (0) 31 74 64 99</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Yara Voyage. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
      </div>
  );
};

export default HomePage;
