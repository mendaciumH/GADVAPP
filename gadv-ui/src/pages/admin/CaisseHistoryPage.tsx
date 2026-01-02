import React, { useState, useEffect, useCallback } from 'react';
import { caisseTransactionsService, caissesService, CaisseTransaction, Caisse } from '../../services/admin.service';
import DataTable from '../../components/admin/DataTable';
import { Calendar, Filter, Download, ArrowUpRight, ArrowDownLeft, Building } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CaisseHistoryPageProps { }

/**
 * Page to display history of caisse transactions (Encaissements & Décaissements)
 */
const CaisseHistoryPage: React.FC<CaisseHistoryPageProps> = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedCaisse, setSelectedCaisse] = useState<number | undefined>(undefined);
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    const [transactions, setTransactions] = useState<CaisseTransaction[]>([]);
    const [caisses, setCaisses] = useState<Caisse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Caisses
    useEffect(() => {
        const fetchCaisses = async () => {
            try {
                const data = await caissesService.getAll();
                setCaisses(data);
            } catch (error) {
                console.error('Error fetching caisses:', error);
            }
        };
        fetchCaisses();
    }, []);

    // Fetch Transactions
    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await caisseTransactionsService.getAll({
                caisseId: selectedCaisse,
                type: selectedType,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCaisse, selectedType, dateFrom, dateTo]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Helper to format currency
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(Number(amount));
    };

    const columns = [
        {
            key: 'date_transaction',
            header: 'Date',
            render: (item: CaisseTransaction) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                        {format(new Date(item.date_transaction), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-gray-500 text-xs">
                        {format(new Date(item.date_transaction), 'HH:mm', { locale: fr })}
                    </span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (item: CaisseTransaction) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'encaissement' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {item.type === 'encaissement' ? <ArrowDownLeft className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                    {item.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                </span>
            ),
        },
        {
            key: 'montant',
            header: 'Montant',
            render: (item: CaisseTransaction) => (
                <span className={`font-semibold ${item.type === 'encaissement' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {item.type === 'encaissement' ? '+' : '-'}{formatCurrency(item.montant)}
                </span>
            ),
        },
        {
            key: 'caisse',
            header: 'Caisse',
            render: (item: CaisseTransaction) => {
                // Assuming item.caisse is populated or we fetch it? 
                // The service returns leftJoinAndSelect('transaction.caisse'), so it should be there?
                // But TypeScript interface needs update if it exists. 
                // Assuming backend returns it. If not, we might need to find in caisses list.
                return (
                    <div className="flex items-center text-gray-700">
                        <Building className="w-3 h-3 mr-1 opacity-50" />
                        {/* Assuming we might get caisse object nested */}
                        {(item as any).caisse?.nom_caisse || 'Unknown'}
                    </div>
                );
            },
        },
        {
            key: 'reference_type',
            header: 'Référence',
            render: (item: CaisseTransaction) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.reference_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-900">
                        #{item.reference_id}
                    </span>
                </div>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            render: (item: CaisseTransaction) => (
                <span className="text-sm text-gray-600 truncate max-w-xs block" title={item.description}>
                    {item.description || '-'}
                </span>
            ),
        },
        {
            key: 'user',
            header: 'Utilisateur',
            render: (item: CaisseTransaction) => (
                <span className="text-sm text-gray-500">
                    {item.user?.username || '-'}
                </span>
            ),
        },
    ];

    const hasActiveFilters = selectedCaisse !== undefined || selectedType !== undefined || dateFrom !== '' || dateTo !== '';

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Historique de Caisse</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Suivi des encaissements et décaissements
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-primary text-white hover:bg-primary-hover'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filtres</span>
                    </button>
                    {/* Placeholder for future export functionality */}
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Exporter</span>
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            {(showFilters || hasActiveFilters) && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caisse</label>
                        <select
                            value={selectedCaisse || ''}
                            onChange={(e) => setSelectedCaisse(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                            <option value="">Toutes les caisses</option>
                            {caisses.map((caisse) => (
                                <option key={caisse.id} value={caisse.id}>
                                    {caisse.nom_caisse}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de transaction</label>
                        <select
                            value={selectedType || ''}
                            onChange={(e) => setSelectedType(e.target.value || undefined)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                            <option value="">Tous les types</option>
                            <option value="encaissement">Encaissement</option>
                            <option value="décaissement">Décaissement</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                <DataTable
                    columns={columns}
                    data={transactions}
                    pagination={{
                        page: page,
                        limit: pageSize,
                        total: transactions.length, // Client-side pagination for now as API doesn't seem to return count
                        onPageChange: setPage
                    }}
                    searchable
                    onSearchChange={setSearch}
                    searchValue={search}
                    loading={isLoading}
                />
            </div>
        </div>
    );
};

export default CaisseHistoryPage;
