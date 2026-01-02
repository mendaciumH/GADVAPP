import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../../components/admin/DataTable';
import FormField from '../../components/admin/FormField';
import {
    facturesService,
    commandesService,
    bonDeVersementService,
    bonDeRemboursementService,
    clientsService,
    Facture,
    Commande,
    BonDeVersement,
    BonDeRemboursement,
    Client,
} from '../../services/admin.service';
import { Filter, X, FileText, Download, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

// Types for unified receivables data
type DocumentType = 'facture' | 'commande' | 'bon_versement' | 'bon_remboursement';

interface ReceivableItem {
    id: number;
    type: DocumentType;
    numero: string;
    client: string;
    date: string;
    dateEcheance?: string;
    datePaiement?: string;
    montant: number;
    montantPaye: number;
    montantRestant: number;
    statut: string;
    original: Facture | Commande | BonDeVersement | BonDeRemboursement;
}

interface FilterState {
    type: DocumentType | '';
    statut: string;
    dateFrom: string;
    dateTo: string;
    datePaiementFrom: string;
    datePaiementTo: string;
    clientSearch: string;
    montantMin: string;
    montantMax: string;
}

const EtatCreancesPage: React.FC = () => {
    const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        type: '',
        statut: '',
        dateFrom: '',
        dateTo: '',
        datePaiementFrom: '',
        datePaiementTo: '',
        clientSearch: '',
        montantMin: '',
        montantMax: '',
    });

    useEffect(() => {
        loadData();
        loadClients();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [factures, commandes, bonsVersement, bonsRemboursement] = await Promise.all([
                facturesService.getAll().catch(() => []),
                commandesService.getAll().catch(() => []),
                bonDeVersementService.getAll().catch(() => []),
                bonDeRemboursementService.getAll().catch(() => []),
            ]);

            const items: ReceivableItem[] = [
                ...mapFacturesToReceivables(factures),
                ...mapCommandesToReceivables(commandes),
                ...mapBonsVersementToReceivables(bonsVersement),
                ...mapBonsRemboursementToReceivables(bonsRemboursement),
            ];

            setReceivables(items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    // Mapping functions
    const mapFacturesToReceivables = (factures: Facture[]): ReceivableItem[] => {
        return factures.map(f => ({
            id: f.id,
            type: 'facture' as DocumentType,
            numero: f.numero_facture || `F-${f.id}`,
            client: f.commande?.client?.nom_complet || f.commande?.client?.nom_entreprise || 'N/A',
            date: f.date_facture || f.created_at || '',
            dateEcheance: f.date_echeance,
            datePaiement: undefined, // Factures don't have a single payment date
            montant: Number(f.montant_ttc) || 0,
            montantPaye: Number(f.montant_paye) || 0,
            montantRestant: Number(f.montant_restant) || Number(f.montant_ttc) || 0,
            statut: getFactureStatutLabel(f.statut),
            original: f,
        }));
    };

    const mapCommandesToReceivables = (commandes: Commande[]): ReceivableItem[] => {
        return commandes.map(c => ({
            id: c.id,
            type: 'commande' as DocumentType,
            numero: c.numero_bon_commande || `C-${c.id}`,
            client: c.client?.nom_complet || c.client?.nom_entreprise || 'N/A',
            date: typeof c.date === 'string' ? c.date : c.date?.toISOString() || c.created_at?.toString() || '',
            dateEcheance: undefined,
            datePaiement: undefined,
            montant: Number(c.prix) || 0,
            montantPaye: 0, // Commandes don't track montant_paye directly
            montantRestant: Number(c.prix) || 0,
            statut: getCommandeStatutLabel(c.statut),
            original: c,
        }));
    };

    const mapBonsVersementToReceivables = (bons: BonDeVersement[]): ReceivableItem[] => {
        return bons.map(b => ({
            id: b.id,
            type: 'bon_versement' as DocumentType,
            numero: b.numero || `BV-${b.id}`,
            client: b.client?.nom_complet || b.client?.nom_entreprise || b.commande?.client?.nom_complet || b.commande?.client?.nom_entreprise || 'N/A',
            date: typeof b.date_versement === 'string' ? b.date_versement : b.date_versement?.toISOString() || b.created_at?.toString() || '',
            dateEcheance: undefined,
            datePaiement: typeof b.date_versement === 'string' ? b.date_versement : b.date_versement?.toISOString(),
            montant: Number(b.montant_verse) || 0,
            montantPaye: b.annule ? 0 : Number(b.montant_verse) || 0,
            montantRestant: 0,
            statut: b.annule ? 'Annulé' : 'Payé',
            original: b,
        }));
    };

    const mapBonsRemboursementToReceivables = (bons: BonDeRemboursement[]): ReceivableItem[] => {
        return bons.map(b => ({
            id: b.id,
            type: 'bon_remboursement' as DocumentType,
            numero: b.numero || `BR-${b.id}`,
            client: b.client?.nom_complet || b.client?.nom_entreprise || b.commande?.client?.nom_complet || b.commande?.client?.nom_entreprise || 'N/A',
            date: typeof b.date_remboursement === 'string' ? b.date_remboursement : b.date_remboursement?.toISOString() || b.created_at?.toString() || '',
            dateEcheance: undefined,
            datePaiement: typeof b.date_remboursement === 'string' ? b.date_remboursement : b.date_remboursement?.toISOString(),
            montant: Number(b.montant) || 0,
            montantPaye: Number(b.montant) || 0,
            montantRestant: 0,
            statut: 'Remboursé',
            original: b,
        }));
    };

    // Helper functions
    const getFactureStatutLabel = (statut: string | undefined): string => {
        switch (statut) {
            case 'payee': return 'Payée';
            case 'impayee': return 'Impayée';
            case 'annulee': return 'Annulée';
            default: return 'En attente';
        }
    };

    const getCommandeStatutLabel = (statut: string | undefined): string => {
        switch (statut) {
            case 'en_attente': return 'En attente';
            case 'confirmee': return 'Confirmée';
            case 'en_cours': return 'En cours';
            case 'terminee': return 'Terminée';
            case 'annulee': return 'Annulée';
            default: return 'En attente';
        }
    };

    const getTypeLabel = (type: DocumentType): string => {
        switch (type) {
            case 'facture': return 'Facture';
            case 'commande': return 'Commande';
            case 'bon_versement': return 'Bon de Versement';
            case 'bon_remboursement': return 'Bon de Remboursement';
        }
    };

    const getTypeBadgeClass = (type: DocumentType): string => {
        switch (type) {
            case 'facture': return 'bg-blue-100 text-blue-800';
            case 'commande': return 'bg-purple-100 text-purple-800';
            case 'bon_versement': return 'bg-green-100 text-green-800';
            case 'bon_remboursement': return 'bg-orange-100 text-orange-800';
        }
    };

    const getStatutBadgeClass = (statut: string): string => {
        if (statut.includes('Payée') || statut.includes('Payé') || statut.includes('Terminée')) {
            return 'bg-green-100 text-green-800';
        }
        if (statut.includes('Annulée') || statut.includes('Annulé')) {
            return 'bg-gray-100 text-gray-800';
        }
        if (statut.includes('Impayée')) {
            return 'bg-red-100 text-red-800';
        }
        return 'bg-yellow-100 text-yellow-800';
    };

    // Filtering logic
    const filteredReceivables = useMemo(() => {
        return receivables.filter(item => {
            // Text search
            const matchesSearch = !searchValue ||
                item.numero.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.client.toLowerCase().includes(searchValue.toLowerCase());

            // Type filter
            const matchesType = !filters.type || item.type === filters.type;

            // Status filter
            const matchesStatut = !filters.statut || item.statut.toLowerCase().includes(filters.statut.toLowerCase());

            // Date range filter
            const itemDate = item.date ? new Date(item.date) : null;
            const matchesDateFrom = !filters.dateFrom || (itemDate && itemDate >= new Date(filters.dateFrom));
            const matchesDateTo = !filters.dateTo || (itemDate && itemDate <= new Date(filters.dateTo));

            // Payment date range filter
            const paymentDate = item.datePaiement ? new Date(item.datePaiement) : null;
            const matchesPaymentDateFrom = !filters.datePaiementFrom || (paymentDate && paymentDate >= new Date(filters.datePaiementFrom));
            const matchesPaymentDateTo = !filters.datePaiementTo || (paymentDate && paymentDate <= new Date(filters.datePaiementTo));

            // Client search
            const matchesClient = !filters.clientSearch || item.client.toLowerCase().includes(filters.clientSearch.toLowerCase());

            // Amount range filter
            const matchesMontantMin = !filters.montantMin || item.montant >= Number(filters.montantMin);
            const matchesMontantMax = !filters.montantMax || item.montant <= Number(filters.montantMax);

            return matchesSearch && matchesType && matchesStatut && matchesDateFrom && matchesDateTo &&
                matchesPaymentDateFrom && matchesPaymentDateTo && matchesClient && matchesMontantMin && matchesMontantMax;
        });
    }, [receivables, searchValue, filters]);

    // Calculate summary statistics (only for factures)
    const statistics = useMemo(() => {
        // Filter only factures
        const factures = filteredReceivables.filter(item => item.type === 'facture');

        // Total Créances: sum of all factures (regardless of status)
        const total = factures.reduce((sum, item) => sum + item.montant, 0);

        // Total Payé: sum of montantPaye for factures with status "Payée"
        const paid = factures
            .filter(item => item.statut === 'Payée')
            .reduce((sum, item) => sum + item.montantPaye, 0);

        // Total En Attente: sum of montantRestant for unpaid factures only
        const pending = factures
            .filter(item => item.statut !== 'Payée')
            .reduce((sum, item) => sum + item.montantRestant, 0);

        return { total, paid, pending };
    }, [filteredReceivables]);

    const resetFilters = () => {
        setFilters({
            type: '',
            statut: '',
            dateFrom: '',
            dateTo: '',
            datePaiementFrom: '',
            datePaiementTo: '',
            clientSearch: '',
            montantMin: '',
            montantMax: '',
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    // Table columns
    const columns = [
        {
            key: 'type',
            header: 'Type',
            render: (item: ReceivableItem) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(item.type)}`}>
                    {getTypeLabel(item.type)}
                </span>
            )
        },
        {
            key: 'numero',
            header: 'Numéro',
            render: (item: ReceivableItem) => (
                <span className="font-mono font-semibold">{item.numero}</span>
            )
        },
        {
            key: 'client',
            header: 'Client',
            render: (item: ReceivableItem) => item.client
        },
        {
            key: 'date',
            header: 'Date',
            render: (item: ReceivableItem) => item.date
                ? new Date(item.date).toLocaleDateString('fr-FR')
                : 'N/A'
        },
        {
            key: 'montant',
            header: 'Montant',
            render: (item: ReceivableItem) => (
                <span className="font-medium">{item.montant.toFixed(2)} DA</span>
            )
        },
        {
            key: 'montantPaye',
            header: 'Payé',
            render: (item: ReceivableItem) => (
                <span className="text-green-600 font-medium">{item.montantPaye.toFixed(2)} DA</span>
            )
        },
        {
            key: 'montantRestant',
            header: 'Reste',
            render: (item: ReceivableItem) => (
                <span className={`font-medium ${item.montantRestant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {item.montantRestant.toFixed(2)} DA
                </span>
            )
        },
        {
            key: 'statut',
            header: 'Statut',
            render: (item: ReceivableItem) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutBadgeClass(item.statut)}`}>
                    {item.statut}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">État des Créances</h1>
                        <p className="text-text-secondary mt-2">Vue d'ensemble de tous les documents financiers</p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-primary text-white hover:bg-primary-hover'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filtres</span>
                        {hasActiveFilters && (
                            <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                                {Object.values(filters).filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Créances</p>
                                <p className="text-3xl font-bold mt-2">{statistics.total.toFixed(2)} DA</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-blue-200 opacity-50" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Payé</p>
                                <p className="text-3xl font-bold mt-2">{statistics.paid.toFixed(2)} DA</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-200 opacity-50" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Total En Attente</p>
                                <p className="text-3xl font-bold mt-2">{statistics.pending.toFixed(2)} DA</p>
                            </div>
                            <Clock className="w-12 h-12 text-orange-200 opacity-50" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-surface border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-text-primary">Filtres avancés</h3>
                        <div className="flex items-center space-x-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-primary hover:underline flex items-center space-x-1"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Réinitialiser</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <FormField label="Type de document">
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value as DocumentType | '' })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="">Tous les types</option>
                                <option value="facture">Facture</option>
                                <option value="commande">Commande</option>
                                <option value="bon_versement">Bon de Versement</option>
                                <option value="bon_remboursement">Bon de Remboursement</option>
                            </select>
                        </FormField>

                        <FormField label="Statut">
                            <select
                                value={filters.statut}
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="Payée">Payée</option>
                                <option value="Impayée">Impayée</option>
                                <option value="En attente">En attente</option>
                                <option value="Confirmée">Confirmée</option>
                                <option value="En cours">En cours</option>
                                <option value="Terminée">Terminée</option>
                                <option value="Annulée">Annulée</option>
                                <option value="Remboursé">Remboursé</option>
                            </select>
                        </FormField>

                        <FormField label="Client">
                            <select
                                value={filters.clientSearch}
                                onChange={(e) => setFilters({ ...filters, clientSearch: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="">Tous les clients</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.nom_complet || client.nom_entreprise || ''}>
                                        {client.nom_complet || client.nom_entreprise || `Client #${client.id}`}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Montant min (DA)">
                            <input
                                type="number"
                                step="0.01"
                                value={filters.montantMin}
                                onChange={(e) => setFilters({ ...filters, montantMin: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="0.00"
                            />
                        </FormField>

                        <FormField label="Montant max (DA)">
                            <input
                                type="number"
                                step="0.01"
                                value={filters.montantMax}
                                onChange={(e) => setFilters({ ...filters, montantMax: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="0.00"
                            />
                        </FormField>

                        <FormField label="Date de début">
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </FormField>

                        <FormField label="Date de fin">
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </FormField>

                        <FormField label="Paiement de">
                            <input
                                type="date"
                                value={filters.datePaiementFrom}
                                onChange={(e) => setFilters({ ...filters, datePaiementFrom: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </FormField>

                        <FormField label="Paiement à">
                            <input
                                type="date"
                                value={filters.datePaiementTo}
                                onChange={(e) => setFilters({ ...filters, datePaiementTo: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </FormField>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <DataTable
                data={filteredReceivables}
                columns={columns}
                loading={loading}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
            />
        </div>
    );
};

export default EtatCreancesPage;
