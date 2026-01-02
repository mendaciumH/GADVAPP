import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import FormField from '../../components/admin/FormField';
import { bonDeVersementService, BonDeVersement } from '../../services/admin.service';
import { Filter, X, FileText } from 'lucide-react';

const BonDeVersementPage: React.FC = () => {
  const navigate = useNavigate();
  const [bonsDeVersement, setBonsDeVersement] = useState<BonDeVersement[]>([]);
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
      const data = await bonDeVersementService.getAll();
      setBonsDeVersement(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/bon-de-versement/new');
  };

  const handleEdit = (bonDeVersement: BonDeVersement) => {
    navigate(`/admin/bon-de-versement/${bonDeVersement.id}/edit`);
  };

  const handleDelete = async (bonDeVersement: BonDeVersement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le bon de versement ${bonDeVersement.numero}?`)) {
      try {
        await bonDeVersementService.delete(bonDeVersement.id);
        toast.success('Bon de versement supprimé avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handlePrint = async (bonDeVersement: BonDeVersement) => {
    try {
      const blob = await bonDeVersementService.printPdf(bonDeVersement.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-de-versement-${bonDeVersement.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du PDF');
    }
  };

  const filteredBons = bonsDeVersement.filter(bv => {
    // Text search
    const matchesSearch = !searchValue || 
      bv.numero?.toLowerCase().includes(searchValue.toLowerCase()) ||
      bv.commande?.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
      bv.commande?.client?.nom_entreprise?.toLowerCase().includes(searchValue.toLowerCase()) ||
      bv.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
      bv.client?.nom_entreprise?.toLowerCase().includes(searchValue.toLowerCase());

    // Date range filter
    const versementDate = bv.date_versement ? new Date(bv.date_versement) : null;
    const matchesDateFrom = !filters.dateFrom || (versementDate && versementDate >= new Date(filters.dateFrom));
    const matchesDateTo = !filters.dateTo || (versementDate && versementDate <= new Date(filters.dateTo));

    // Amount range filter
    const montantVerse = Number(bv.montant_verse) || 0;
    const matchesMontantMin = !filters.montantMin || montantVerse >= Number(filters.montantMin);
    const matchesMontantMax = !filters.montantMax || montantVerse <= Number(filters.montantMax);

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
      render: (bv: BonDeVersement) => (
        <span className="font-mono font-semibold">{bv.numero}</span>
      )
    },
    { 
      key: 'client', 
      header: 'Client', 
      render: (bv: BonDeVersement) => {
        const client = bv.commande?.client || bv.client;
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
      render: (bv: BonDeVersement) => bv.commande?.id 
        ? `Commande #${bv.commande.id}` 
        : 'N/A' 
    },
    { 
      key: 'date_versement', 
      header: 'Date de versement', 
      render: (bv: BonDeVersement) => bv.date_versement 
        ? new Date(bv.date_versement).toLocaleDateString() 
        : 'N/A' 
    },
    { 
      key: 'montant_verse', 
      header: 'Montant versé', 
      render: (bv: BonDeVersement) => bv.montant_verse 
        ? `${Number(bv.montant_verse).toFixed(2)} DA` 
        : 'N/A' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestion des Bons de Versement</h1>
          <p className="text-text-secondary mt-2">Voir et gérer les bons de versement</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            showFilters || hasActiveFilters
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
        customActions={(item: BonDeVersement) => (
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

export default BonDeVersementPage;

