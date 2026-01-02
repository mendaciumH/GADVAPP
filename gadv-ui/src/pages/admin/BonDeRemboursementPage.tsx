import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import FormField from '../../components/admin/FormField';
import { bonDeRemboursementService, BonDeRemboursement } from '../../services/admin.service';
import { Filter, X, FileText } from 'lucide-react';

const BonDeRemboursementPage: React.FC = () => {
    const navigate = useNavigate();
    const [bonsDeRemboursement, setBonsDeRemboursement] = useState<BonDeRemboursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        montantMin: '',
        montantMax: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await bonDeRemboursementService.getAll();
            setBonsDeRemboursement(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigate('/admin/bon-de-remboursement/new');
    };

    const handleEdit = (bonDeRemboursement: BonDeRemboursement) => {
        navigate(`/admin/bon-de-remboursement/${bonDeRemboursement.id}/edit`);
    };

    const handleDelete = async (bonDeRemboursement: BonDeRemboursement) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le bon de remboursement ${bonDeRemboursement.numero}?`)) {
            try {
                await bonDeRemboursementService.delete(bonDeRemboursement.id);
                toast.success('Bon de remboursement supprimé avec succès');
                loadData();
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const handlePrint = async (bonDeRemboursement: BonDeRemboursement) => {
        try {
            const blob = await bonDeRemboursementService.printPdf(bonDeRemboursement.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bon-de-remboursement-${bonDeRemboursement.numero}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF généré avec succès');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la génération du PDF');
        }
    };

    const filteredBons = bonsDeRemboursement.filter(br => {
        // Text search
        const matchesSearch = !searchValue ||
            br.numero?.toLowerCase().includes(searchValue.toLowerCase()) ||
            br.commande?.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
            br.commande?.client?.nom_entreprise?.toLowerCase().includes(searchValue.toLowerCase()) ||
            br.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
            br.client?.nom_entreprise?.toLowerCase().includes(searchValue.toLowerCase()) ||
            br.motif?.toLowerCase().includes(searchValue.toLowerCase());

        // Date range filter
        const remboursementDate = br.date_remboursement ? new Date(br.date_remboursement) : null;
        const matchesDateFrom = !filters.dateFrom || (remboursementDate && remboursementDate >= new Date(filters.dateFrom));
        const matchesDateTo = !filters.dateTo || (remboursementDate && remboursementDate <= new Date(filters.dateTo));

        // Amount range filter
        const montant = Number(br.montant) || 0;
        const matchesMontantMin = !filters.montantMin || montant >= Number(filters.montantMin);
        const matchesMontantMax = !filters.montantMax || montant <= Number(filters.montantMax);

        return matchesSearch && matchesDateFrom && matchesDateTo && matchesMontantMin && matchesMontantMax;
    });

    const resetFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            montantMin: '',
            montantMax: '',
        });
    };

    const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.montantMin || filters.montantMax;

    const columns = [
        {
            key: 'numero',
            header: 'Numéro',
            render: (br: BonDeRemboursement) => (
                <span className="font-mono font-semibold">{br.numero}</span>
            )
        },
        {
            key: 'client',
            header: 'Client',
            render: (br: BonDeRemboursement) => {
                const client = br.commande?.client || br.client;
                return client
                    ? (client.type_client === 'Entreprise'
                        ? client.nom_entreprise
                        : client.nom_complet)
                    : 'N/A';
            }
        },
        {
            key: 'commande',
            header: 'Commande',
            render: (br: BonDeRemboursement) => br.commande?.id
                ? `Commande #${br.commande.id}`
                : 'N/A'
        },
        {
            key: 'date_remboursement',
            header: 'Date de remboursement',
            render: (br: BonDeRemboursement) => br.date_remboursement
                ? new Date(br.date_remboursement).toLocaleDateString('fr-FR')
                : 'N/A'
        },
        {
            key: 'montant',
            header: 'Montant',
            render: (br: BonDeRemboursement) => br.montant
                ? `${Number(br.montant).toFixed(2)} DA`
                : 'N/A'
        },
        {
            key: 'motif',
            header: 'Motif',
            render: (br: BonDeRemboursement) => (
                <span className="text-sm text-gray-600 truncate max-w-xs block" title={br.motif || ''}>
                    {br.motif || 'N/A'}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestion des Bons de Remboursement</h1>
                    <p className="text-text-secondary mt-2">Voir et gérer les bons de remboursement</p>
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
                            {[filters.dateFrom, filters.dateTo, filters.montantMin, filters.montantMax].filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            {showFilters && (
                <div className="bg-surface border border-gray-30 rounded-lg p-4 space-y-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="Date de début">
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="input-field"
                            />
                        </FormField>
                        <FormField label="Date de fin">
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="input-field"
                            />
                        </FormField>
                        <FormField label="Montant minimum (DA)">
                            <input
                                type="number"
                                step="0.01"
                                value={filters.montantMin}
                                onChange={(e) => setFilters({ ...filters, montantMin: e.target.value })}
                                className="input-field"
                                placeholder="0.00"
                            />
                        </FormField>
                        <FormField label="Montant maximum (DA)">
                            <input
                                type="number"
                                step="0.01"
                                value={filters.montantMax}
                                onChange={(e) => setFilters({ ...filters, montantMax: e.target.value })}
                                className="input-field"
                                placeholder="0.00"
                            />
                        </FormField>
                    </div>
                </div>
            )}

            <DataTable
                data={filteredBons}
                columns={columns}
                loading={loading}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                customActions={(item: BonDeRemboursement) => (
                    <button
                        onClick={() => handlePrint(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Imprimer PDF"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                )}
            />
        </div>
    );
};

export default BonDeRemboursementPage;
