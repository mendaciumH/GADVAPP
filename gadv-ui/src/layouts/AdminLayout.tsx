import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getPagePermissions } from '../utils/permissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { infoAgenceService, InfoAgence } from '../services/admin.service';

import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingCart,
  Package,
  FileText,
  CreditCard,
  Tag,
  Receipt,
  Settings,
  Globe,
  UserCircle,
  Warehouse,
  Percent,
  ReceiptText,
  Info,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  X,
  Banknote,
  Search,
  Calendar,
  TicketsPlane,
  Image,
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasAnyPermission } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyInfo, setAgencyInfo] = useState<InfoAgence | null>(null);

  const getUserName = () => {
    if (user?.username && user.username !== user.email) {
      return user.username;
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Utilisateur';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Helper function to format dates with French locale
  const formatDate = (date: Date, formatString: string) => {
    return (format as any)(date, formatString, { locale: fr });
  };

  const currentDate = new Date();
  const dayOfMonth = currentDate.getDate();
  const dayName = formatDate(currentDate, 'EEE');
  const monthName = formatDate(currentDate, 'MMMM');
  const dateRange = `${formatDate(currentDate, 'dd MMM')} - ${formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()), 'dd MMM')}`;

  // Load agency info for logo
  useEffect(() => {
    const loadAgencyInfo = async () => {
      try {
        const data = await infoAgenceService.getAll();
        if (data && data.length > 0) {
          setAgencyInfo(data[0]);
        }
      } catch (error) {
        console.error('Failed to load agency info:', error);
      }
    };
    loadAgencyInfo();
  }, []);

  // Helper function to construct logo URL
  const getLogoUrl = (filename: string | null): string | null => {
    if (!filename) return null;
    const isDevelopment = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') ||
      (isDevelopment ? 'http://localhost:5000' : window.location.origin);
    const uploadsPrefix = isDevelopment ? '/uploads/' : '/api/uploads/';
    return `${apiUrl}${uploadsPrefix}${filename}`;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  // Authentication and role-based access are handled by AuthGuard and RoleGuard
  // No need to check here to avoid unnecessary redirects

  const isActiveRoute = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Map menu paths to permission keys
  const getPermissionKeyFromPath = (path: string): string | null => {
    if (path === '/') return null; // Public route
    if (path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/publish') return 'publish';
    if (path.startsWith('/admin/users')) return 'users';
    if (path.startsWith('/admin/roles')) return 'roles';
    if (path.startsWith('/admin/permissions')) return 'permissions';
    if (path.startsWith('/admin/clients')) return 'clients';
    if (path.startsWith('/admin/fournisseurs')) return 'fournisseurs';
    if (path.startsWith('/admin/articles')) return 'articles';
    if (path.startsWith('/admin/omra')) return 'articles';
    if (path.startsWith('/admin/type-article')) return 'type_article';
    if (path.startsWith('/admin/commandes')) return 'commandes';
    if (path.startsWith('/admin/reservation-omra')) return 'commandes';
    if (path.startsWith('/admin/reductions')) return 'reductions';
    if (path.startsWith('/admin/taxes')) return 'taxes';
    if (path.startsWith('/admin/caisses')) return 'caisses';
    if (path.startsWith('/admin/factures')) return 'factures';
    if (path.startsWith('/admin/bon-de-versement')) return 'bon_de_versement';
    if (path.startsWith('/admin/etat-creances')) return 'etat_creances';
    if (path.startsWith('/admin/info-agence')) return 'info_agence';
    if (path.startsWith('/admin/settings')) return 'info_agence'; // Reuse info_agence permission for now
    if (path === '/admin/pdf-logo-replacement') return 'info_agence';
    return null;
  };

  // Check if user has access to a menu item
  const hasAccessToMenuItem = (path: string): boolean => {
    // Admin has access to everything
    const isAdmin = user?.roles?.some(role =>
      role.toLowerCase() === 'admin' || role.toLowerCase().includes('admin')
    );
    if (isAdmin) return true;

    // Public routes are always accessible
    if (path === '/') return true;

    // Get permission key for this path
    const permissionKey = getPermissionKeyFromPath(path);
    if (!permissionKey) return true; // If no permission key, allow access

    // Get required permissions for this page
    const requiredPermissions = getPagePermissions(permissionKey as any);
    if (requiredPermissions.length === 0) return true; // No permissions required

    // Check if user has any of the required permissions
    return hasAnyPermission(requiredPermissions);
  };

  const allMenuItems = [
    {
      category: 'Principal',
      items: [
        {
          name: 'Tableau de bord',
          path: '/admin/dashboard',
          icon: LayoutDashboard,
          gradient: 'from-blue-500 to-cyan-500',
          color: 'text-blue-600',
        },
        // {
        //   name: 'Voir le site',
        //   path: '/',
        //   icon: Globe,
        //   external: true,
        //   gradient: 'from-emerald-500 to-teal-500',
        //   color: 'text-emerald-600',
        // },
        // {
        //   name: 'Publier sur le site',
        //   path: '/admin/publish',
        //   icon: Upload,
        //   gradient: 'from-purple-500 to-pink-500',
        //   color: 'text-purple-600',
        // },
      ],
    },

    {
      category: 'Gestion Commerciale',
      items: [
        {
          name: 'Clients',
          path: '/admin/clients',
          icon: Users,
          gradient: 'from-cyan-500 to-blue-500',
          color: 'text-cyan-600',
        },
        {
          name: 'Fournisseurs',
          path: '/admin/fournisseurs',
          icon: Building2,
          gradient: 'from-orange-500 to-red-500',
          color: 'text-orange-600',
        },
        // {
        //   name: 'Réductions',
        //   path: '/admin/reductions',
        //   icon: Percent,
        //   gradient: 'from-red-500 to-orange-500',
        //   color: 'text-red-600',
        // },
        // {
        //   name: 'Taxes',
        //   path: '/admin/taxes',
        //   icon: ReceiptText,
        //   gradient: 'from-amber-500 to-yellow-500',
        //   color: 'text-amber-600',
        // },

      ],
    },
    {
      category: 'Programmes et Offres ',
      items: [

        {
          name: 'Services ',
          path: '/admin/articles',
          icon: Package,
          gradient: 'from-green-500 to-emerald-500',
          color: 'text-green-600',
        },
        {
          name: 'Types de Services',
          path: '/admin/type-article',
          icon: Tag,
          gradient: 'from-yellow-500 to-amber-500',
          color: 'text-yellow-600',
        },
        {
          name: 'Omra',
          path: '/admin/omra',
          icon: ShoppingCart,
          gradient: 'from-pink-500 to-rose-500',
          color: 'text-pink-600',
        },

      ],
    },
    {
      category: 'Commandes & Ventes',
      items: [
        {
          name: 'Tourisme',
          path: '/admin/commandes',
          icon: TicketsPlane,
          gradient: 'from-pink-500 to-rose-500',
          color: 'text-pink-600',
        },
        {
          name: ' Réservation Omra',
          path: '/admin/reservation-omra',
          icon: ShoppingCart,
          gradient: 'from-pink-500 to-rose-500',
          color: 'text-pink-600',
        },


      ],
    },
    {
      category: 'Finances',
      items: [
        {
          name: 'Factures',
          path: '/admin/factures',
          icon: FileText,
          gradient: 'from-blue-600 to-indigo-600',
          color: 'text-blue-600',
        },
        {
          name: 'Bon de Versement',
          path: '/admin/bon-de-versement',
          icon: Banknote,
          gradient: 'from-green-600 to-emerald-600',
          color: 'text-green-600',
        },
        {
          name: 'Bon de Remboursement',
          path: '/admin/bon-de-remboursement',
          icon: Banknote,
          gradient: 'from-green-600 to-emerald-600',
          color: 'text-green-600',
        },
        {
          name: 'Caisses',
          path: '/admin/caisses',
          icon: CreditCard,
          gradient: 'from-teal-500 to-cyan-500',
          color: 'text-teal-600',
        },
        {
          name: 'État des Créances',
          path: '/admin/etat-creances',
          icon: Receipt,
          gradient: 'from-indigo-500 to-purple-500',
          color: 'text-indigo-600',
        },

      ],
    },
    {
      category: 'Gestion des Utilisateurs',
      items: [
        {
          name: 'Utilisateurs',
          path: '/admin/users',
          icon: Users,
          gradient: 'from-indigo-500 to-blue-500',
          color: 'text-indigo-600',
        },
        {
          name: 'Rôles',
          path: '/admin/roles',
          icon: UserCircle,
          gradient: 'from-violet-500 to-purple-500',
          color: 'text-violet-600',
        },
        {
          name: 'Permissions',
          path: '/admin/permissions',
          icon: Settings,
          gradient: 'from-slate-500 to-gray-500',
          color: 'text-slate-600',
        },
      ],
    },

    {
      category: 'Configuration',
      items: [
        {
          name: 'Info Agence',
          path: '/admin/info-agence',
          icon: Info,
          gradient: 'from-sky-500 to-blue-500',
          color: 'text-sky-600',
        },
        {
          name: 'Paramètres',
          path: '/admin/settings',
          icon: Settings,
          gradient: 'from-gray-600 to-slate-600',
          color: 'text-gray-600',
        },
        {
          name: 'Changeur de Logo',
          path: '/admin/pdf-logo-replacement',
          icon: Image,
          gradient: 'from-purple-500 to-indigo-500',
          color: 'text-purple-600',
        },
      ],
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return allMenuItems
      .map(section => ({
        ...section,
        items: section.items.filter(item => hasAccessToMenuItem(item.path))
      }))
      .filter(section => section.items.length > 0); // Remove empty categories
  }, [user, hasAnyPermission]);

  // Auto-expand categories containing the active route
  useEffect(() => {
    const activeCategory = menuItems.find(section =>
      section.items.some(item => isActiveRoute(item.path))
    );
    if (activeCategory) {
      setExpandedCategories(prev => new Set(prev).add(activeCategory.category));
    }
  }, [location.pathname, menuItems]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const SidebarContent = () => (
    <>
      {/* Logo & Brand */}
      <div className="p-3 sm:p-4 lg:p-4 border-b border-gray-200 h-[60px] sm:h-[72px] lg:h-[72px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {agencyInfo?.logo && typeof agencyInfo.logo === 'string' ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-gray-200">
                <img
                  src={getLogoUrl(agencyInfo.logo) || ''}
                  alt={agencyInfo.nom_agence || 'Logo'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                  {agencyInfo?.nom_agence || 'GestionADV'}
                </h1>
                <p className="text-xs text-gray-500 truncate">Agence de Voyage</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 sm:py-3">
        <nav className="px-2 sm:px-3 space-y-1">
          {menuItems.map((section, sectionIndex) => {
            const isExpanded = expandedCategories.has(section.category);
            const hasActiveItem = section.items.some(item => isActiveRoute(item.path));

            return (
              <div key={sectionIndex} className="space-y-1">
                {!sidebarCollapsed ? (
                  <>
                    {/* Collapsible Category Header */}
                    <button
                      onClick={() => toggleCategory(section.category)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100 touch-manipulation ${hasActiveItem ? 'text-indigo-600' : ''
                        }`}
                    >
                      <span className="truncate">{section.category}</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="flex-shrink-0 ml-2"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* Category Items with Animation */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 pt-1 ml-4">
                            {section.items.map((item) => {
                              const isActive = isActiveRoute(item.path);
                              const Icon = item.icon;

                              return (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`flex items-center px-3 py-1.5 sm:py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-[0.98] ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-700 hover:bg-indigo-50 active:bg-indigo-100'
                                    }`}
                                >
                                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color
                                    }`} />
                                  <span className="ml-3 truncate">
                                    {item.name}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* Collapsed Sidebar: Show only icons */
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = isActiveRoute(item.path);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-indigo-50'
                            }`}
                          title={item.name}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color
                            }`} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout Button 
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="ml-3">Déconnexion</span>
          )}
        </button>
      </div>*/}
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? '80px' : '256px',
        }}
        className="hidden lg:flex bg-white border-r border-gray-200 relative z-30"
      >
        <div className="flex flex-col w-full h-full">
          <SidebarContent />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-4 top-20 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 z-40"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-[70] w-72 sm:w-80 bg-white shadow-2xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Custom Header */}
        <header className="bg-white border-b border-gray-200 px-4 h-[60px] sm:h-[72px] sticky top-0 z-30 shadow-sm flex items-center">
          <div className="w-full flex items-center justify-between gap-4">
            {/* Left Section: Menu & Greeting */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button */}
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation flex-shrink-0 z-50 relative"
                aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              {/* Greeting */}
              <div className="flex items-center">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  <span className="hidden sm:inline">{getGreeting()}, </span>
                  {getUserName()}
                  <span className="sm:hidden">!</span>
                </h1>
              </div>
            </div>

            {/* Center Section: Search Bar (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-gray-50 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Right Section: Date Widget and Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Date Widget */}
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-indigo-600 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">{dayOfMonth}</div>
                  </div>
                  <div className="border-l border-indigo-400/30 pl-2 sm:pl-3">
                    <div className="text-xs sm:text-sm font-medium">{dayName}</div>
                    <div className="text-[10px] sm:text-xs opacity-90">{monthName}</div>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{dateRange}</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                  aria-label="Menu utilisateur"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                      {getUserName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                      {user?.roles?.[0] || 'Rôle'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: isUserDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:block"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </motion.div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">{user?.email || 'Utilisateur'}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{user?.roles?.[0] || 'Rôle'}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span>Déconnexion</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
