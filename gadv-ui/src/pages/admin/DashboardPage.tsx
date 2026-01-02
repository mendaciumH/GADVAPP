import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Activity,
  Receipt,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import {
  usersService,
  articlesService,
  facturesService,
  commandesService,
  bonDeRemboursementService,
  User,
  Article,
  Facture,
  Commande,
  BonDeRemboursement,
} from '../../services/admin.service';
import { format } from 'date-fns';
import LineChart from '../../components/charts/LineChart';

// ... (Helper components remain unchanged) ...

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [bonsRemboursement, setBonsRemboursement] = useState<BonDeRemboursement[]>([]);

  // Use auth context to check permissions
  const { user, hasAnyPermission } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const isAdmin = user?.roles?.some(r => r.toLowerCase().includes('admin'));
      const canViewUsers = isAdmin || hasAnyPermission(['view_users', 'manage_users']);
      const canViewCommandes = isAdmin || hasAnyPermission(['view_commandes', 'manage_commandes']);
      const canViewFactures = isAdmin || hasAnyPermission(['view_factures', 'manage_factures']);
      const canViewRemboursements = isAdmin || hasAnyPermission(['view_factures', 'manage_factures']); // Usually same permission as finance/factures

      // Execute promises concurrently but conditionally
      const [usersData, articlesData, facturesData, commandesData, refundsData] = await Promise.all([
        canViewUsers ? usersService.getAll().catch(err => {
          console.warn('Failed to load users', err);
          return [];
        }) : Promise.resolve([]),

        articlesService.getAll().catch(() => []),

        canViewFactures ? facturesService.getAll().catch(() => []) : Promise.resolve([]),
        canViewCommandes ? commandesService.getAll().catch(() => []) : Promise.resolve([]),
        canViewRemboursements ? bonDeRemboursementService.getAll().catch(() => []) : Promise.resolve([]),
      ]);

      setUsers(usersData);
      setArticles(articlesData);
      setFactures(facturesData);
      setCommandes(commandesData);
      setBonsRemboursement(refundsData);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const usersByRole = users.reduce((acc, user) => {
    const roleName = user.role?.name || 'Sans rôle';
    acc[roleName] = (acc[roleName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalOffers = articles.length;
  const publishedArticles = articles.filter((a) => a.is_published).length;

  const paidInvoices = factures.filter((f) => f.statut === 'payee').length;
  const unpaidInvoices = factures.filter((f) => f.statut === 'impayee' || f.statut === 'en_attente').length;

  // Monthly revenue (Net Revenue = Paid Invoices - Refunds)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyGrossRevenue = factures
    .filter((f) => {
      if (!f.date_facture) return false;
      const date = new Date(f.date_facture);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && f.statut === 'payee';
    })
    .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

  const monthlyRefunds = bonsRemboursement
    .filter((br) => {
      if (!br.date_remboursement) return false;
      const date = new Date(br.date_remboursement);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, br) => sum + (Number(br.montant) || 0), 0);

  const monthlyRevenue = monthlyGrossRevenue - monthlyRefunds;

  // Top destinations
  const articleCounts = commandes.reduce((acc, cmd) => {
    const articleId = cmd.article_id;
    if (articleId) {
      acc[articleId] = (acc[articleId] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const topDestinations = Object.entries(articleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([articleId, count]) => {
      const article = articles.find((a) => a.id === parseInt(articleId));
      return {
        label: article?.label || `Service #${articleId}`,
        count,
        destination: article?.destination || article?.pays_destination || 'N/A',
      };
    });

  // Sales data (Net Daily Revenue)
  const salesData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));

    // Daily Gross Sales
    const daySales = factures
      .filter((f) => {
        if (!f.date_facture || f.statut !== 'payee') return false;
        const fDate = new Date(f.date_facture);
        return (
          fDate.getDate() === date.getDate() &&
          fDate.getMonth() === date.getMonth() &&
          fDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

    // Daily Refunds
    const dayRefunds = bonsRemboursement
      .filter((br) => {
        if (!br.date_remboursement) return false;
        const rDate = new Date(br.date_remboursement);
        return (
          rDate.getDate() === date.getDate() &&
          rDate.getMonth() === date.getMonth() &&
          rDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, br) => sum + (Number(br.montant) || 0), 0);

    return { date, sales: Math.max(0, daySales - dayRefunds) }; // Prevent negative if refund > sales for the day (optional, depending on preference)
  });

  // Recent activity
  const recentActivity = [
    ...commandes
      .slice(0, 5)
      .map((cmd) => ({
        type: 'commande' as const,
        id: cmd.id,
        title: `Commande #${cmd.id}`,
        description: cmd.client?.nom_complet || `Client #${cmd.client_id}`,
        amount: cmd.prix || 0,
        date: cmd.date ? new Date(cmd.date) : new Date(),
        icon: ShoppingCart,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
      })),
    ...factures
      .slice(0, 5)
      .map((fact) => ({
        type: 'facture' as const,
        id: fact.id,
        title: `Facture ${fact.numero_facture}`,
        description: fact.commande?.client?.nom_complet || 'Client',
        amount: fact.montant_ttc || 0,
        date: fact.date_facture ? new Date(fact.date_facture) : new Date(),
        icon: Receipt,
        colorClass: fact.statut === 'payee' ? 'text-green-600' : 'text-amber-600',
        bgClass: fact.statut === 'payee' ? 'bg-green-50' : 'bg-amber-50',
      })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const roleChartData = Object.entries(usersByRole).map(([role, count], index) => {
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    return {
      label: role,
      value: count,
      color: colors[index % colors.length],
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-500 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header & Actions */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tableau de Bord
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Vue d'ensemble de vos performances et activités en temps réel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadDashboardData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-primary hover:border-primary/30"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 auto-rows-[240px]">

          {/* 1. Recent Activity (Tall: 1 col × 2 rows) */}
          <motion.div
            className="col-span-1 row-span-2 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Activités</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar relative z-10">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-[1.25rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group/item">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-sm ${item.type === 'commande' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover/item:text-primary transition-colors">{item.title}</p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{format(item.date, 'HH:mm')}</span>
                      {item.amount > 0 && (
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.amount.toLocaleString()} <span className="text-[10px] text-slate-500 ml-0.5">DZD</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 2. Total Users (1×1) */}
          <motion.div
            className="col-span-1 row-span-1 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-slate-900 -tracking-wide">{users.length}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Utilisateurs</span>
              </div>
            </div>

            <div className="relative z-10 space-y-2 mt-2 border-t border-slate-50 pt-4">
              {roleChartData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 font-bold truncate max-w-[90px]">{item.label}</span>
                  </div>
                  <span className="font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md min-w-[24px] text-center">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3. Monthly Revenue (Wide: 2 cols × 1 row) */}
          <motion.div
            className="col-span-1 md:col-span-2 row-span-1 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Revenus</h3>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Performance mensuelle</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-900 leading-none">
                  {monthlyRevenue.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-green-600 mt-2 bg-green-50 w-fit ml-auto px-2 py-0.5 rounded-full border border-green-100">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>MAINTENANCE STABLE</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative z-10">
              {salesData.some(d => d.sales > 0) ? (
                <LineChart
                  data={salesData.map((d) => d.sales)}
                  labels={salesData.map((d) => format(d.date, 'dd/MM'))}
                  color="#6366F1"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  AUCUNE TRANSACTION
                </div>
              )}
            </div>
          </motion.div>

          {/* 4. Offers count (1x1) */}
          <motion.div
            className="col-span-1 row-span-1 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 shadow-sm">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-4xl font-black text-slate-900 leading-none">{totalOffers}</h3>
                <span className="text-sm font-black text-teal-600 uppercase tracking-widest leading-none">Offres</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
                <div
                  className="bg-teal-500 h-full rounded-full shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                  style={{ width: `${totalOffers ? (publishedArticles / totalOffers) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wide">{publishedArticles} SERVICES PUBLIÉS</p>
            </div>
          </motion.div>

          {/* Row 2 */}

          {/* 5. Top Destinations (Wide: 2 cols × 1 row) */}
          <motion.div
            className="col-span-1 md:col-span-2 row-span-1 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Top Destinations</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              {topDestinations.slice(0, 4).map((dest, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group/dest">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-400 group-hover/dest:text-emerald-600 group-hover/dest:border-emerald-100 transition-all shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-slate-800 truncate uppercase">{dest.label}</span>
                      <span className="text-[10px] text-slate-500 font-bold truncate leading-none mt-1">{dest.destination}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg ml-2">{dest.count}</span>
                </div>
              ))}
              {topDestinations.length === 0 && (
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest col-span-2 text-center py-8">Aucun résultat</p>
              )}
            </div>
          </motion.div>

          {/* 6. Stats card (Medium: 1x1) - Small summary of key stats to fill grid */}
          <motion.div
            className="col-span-1 row-span-1 rounded-[2rem] bg-slate-900 p-7 shadow-2xl hover:shadow-primary/20 transition-all flex flex-col justify-between relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
              <TrendingUp className="w-32 h-32 text-white" />
            </div>
            <div>
              <CheckCircle className="w-6 h-6 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Performance</h3>
              <p className="text-xs text-slate-400 font-medium">Statistiques clés</p>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Payées</p>
                <p className="text-lg font-black text-white">{paidInvoices}</p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">En attente</p>
                <p className="text-lg font-black text-amber-400">{unpaidInvoices}</p>
              </div>
            </div>
          </motion.div>

          {/* 7. Omra Info (Tall: 1 col × 2 rows) - Repositioned to fill col 5 */}
          <motion.div
            className="col-span-1 row-span-2 rounded-[2rem] bg-amber-50 p-7 border border-amber-100 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white shadow-sm border border-amber-200">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Omra</h3>
            </div>

            <div className="flex-1 flex flex-col gap-5 relative z-10">
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm group-hover:scale-[1.02] transition-transform">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Offres Actives</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 leading-none">
                    {articles.filter(a => a.label?.toLowerCase().includes('omra') || a.type_article?.description?.toLowerCase().includes('omra')).length}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">disponibles</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm group-hover:scale-[1.02] transition-transform delay-75">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Réservations</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 leading-none">
                    {commandes.filter(c => c.article?.label?.toLowerCase().includes('omra') || c.type_chambre).length}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">en cours</span>
                </div>
              </div>

              <div className="mt-auto">
                <button className="w-full py-4 bg-slate-900 hover:bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/30 transition-all">
                  Voir Planning
                </button>
              </div>
            </div>
          </motion.div>

          {/* 8. Final Stats Fill (Wide: 3 cols × 1 row) - To ensure Row 3 is filled if needed or expand items */}
          {/* Note: In a 5-col grid, R1 and R2 are filled now. R1=1+1+2+1=5. R2=1+2+1+1=5. (Wait, Omra takes C5 of R2 and R3).
              So R2 is: Act(C1), Dest(C2-3), Stats(C4), Omra(C5). Total 5. Correct.
              Row 3: Act(C1), Stats 8(C2-4), Omra(C5 continues).
          */}
          <motion.div
            className="col-span-1 md:col-span-3 row-span-1 rounded-[2rem] bg-white p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex items-center relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-8">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payées</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{paidInvoices}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <ShoppingCart className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commandes</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{commandes.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <XCircle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attente</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{unpaidInvoices}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                  <Settings className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Système</p>
                  <p className="text-xs font-black text-primary uppercase">v1.2 Stable</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
