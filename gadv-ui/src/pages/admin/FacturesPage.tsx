import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../../components/admin/DataTable';
import FormField from '../../components/admin/FormField';
import PaymentModal from '../../components/admin/PaymentModal';
import { facturesService, Facture, FactureStatut } from '../../services/admin.service';
import { Filter, X, CreditCard, Ban, Printer, UserRoundPen } from 'lucide-react';

const FacturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filters, setFilters] = useState({
    statut: '' as FactureStatut | '',
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
      const facturesData = await facturesService.getAll();
      setFactures(facturesData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/factures/new');
  };

  const handleEdit = (facture: Facture) => {
    navigate(`/admin/factures/${facture.id}/edit`);
  };

  const handleDelete = async (facture: Facture) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${facture.numero_facture}?`)) {
      try {
        await facturesService.delete(facture.id);
        toast.success('Facture supprimée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleGenerateFromCommande = async (commandeId: number) => {
    try {
      await facturesService.generateFromCommande(commandeId);
      toast.success('Facture générée avec succès');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération de la facture');
    }
  };

  const handlePay = (facture: Facture) => {
    setSelectedFacture(facture);
    setShowPaymentModal(true);
  };

  const handleCancelFacture = async (facture: Facture) => {
    if (window.confirm(`Êtes-vous sûr de vouloir annuler la facture ${facture.numero_facture}? Cette action est irréversible.`)) {
      try {
        await facturesService.cancelFacture(facture.id);
        toast.success('Facture annulée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
      }
    }
  };

  const handlePrintFacture = async (facture: Facture) => {
    try {
      const blob = await facturesService.generatePdf(facture.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${facture.numero_facture}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du PDF');
    }
  };

  const handlePaymentSuccess = () => {
    loadData();
    setShowPaymentModal(false);
    setSelectedFacture(null);
  };

  const getStatutBadgeClass = (statut: FactureStatut | undefined) => {
    switch (statut) {
      case 'payee':
        return 'bg-green-100 text-green-800';
      case 'impayee':
        return 'bg-red-100 text-red-800';
      case 'annulee':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatutLabel = (statut: FactureStatut | undefined) => {
    switch (statut) {
      case 'payee':
        return 'Payée';
      case 'impayee':
        return 'Impayée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'En attente';
    }
  };

  const filteredFactures = factures.filter(f => {
    // Text search
    const matchesSearch = !searchValue ||
      f.numero_facture?.toLowerCase().includes(searchValue.toLowerCase()) ||
      f.commande?.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
      f.commande?.client?.nom_entreprise?.toLowerCase().includes(searchValue.toLowerCase());

    // Status filter
    const matchesStatut = !filters.statut || f.statut === filters.statut;

    // Date range filter
    const factureDate = f.date_facture ? new Date(f.date_facture) : null;
    const matchesDateFrom = !filters.dateFrom || (factureDate && factureDate >= new Date(filters.dateFrom));
    const matchesDateTo = !filters.dateTo || (factureDate && factureDate <= new Date(filters.dateTo));

    // Amount range filter
    const montantTTC = Number(f.montant_ttc) || 0;
    const matchesMontantMin = !filters.montantMin || montantTTC >= Number(filters.montantMin);
    const matchesMontantMax = !filters.montantMax || montantTTC <= Number(filters.montantMax);

    return matchesSearch && matchesStatut && matchesDateFrom && matchesDateTo && matchesMontantMin && matchesMontantMax;
  });

  const resetFilters = () => {
    setFilters({
      statut: '' as FactureStatut | '',
      dateFrom: '',
      dateTo: '',
      montantMin: '',
      montantMax: '',
    });
  };

  const hasActiveFilters = filters.statut || filters.dateFrom || filters.dateTo || filters.montantMin || filters.montantMax;

  const columns = [
    {
      key: 'numero_facture',
      header: 'Numéro',
      render: (f: Facture) => (
        <span className="font-mono font-semibold">{f.numero_facture}</span>
      )
    },
    {
      key: 'commande',
      header: 'Client',
      render: (f: Facture) => f.commande?.client
        ? (f.commande.client.type_client === 'Entreprise'
          ? f.commande.client.nom_entreprise
          : f.commande.client.nom_complet)
        : 'N/A'
    },
    {
      key: 'numero_bon_commande',
      header: 'Bon de Commande',
      render: (f: Facture) => (
        <span className="font-mono text-sm text-gray-600">
          {f.commande?.numero_bon_commande || '-'}
        </span>
      )
    },
    {
      key: 'date_facture',
      header: 'Date',
      render: (f: Facture) => f.date_facture
        ? new Date(f.date_facture).toLocaleDateString()
        : 'N/A'
    },
    {
      key: 'montant_ttc',
      header: 'Montant TTC',
      render: (f: Facture) => f.montant_ttc
        ? `${Number(f.montant_ttc).toFixed(2)} DA`
        : 'N/A'
    },
    {
      key: 'montant_paye',
      header: 'Payé',
      render: (f: Facture) => (
        <span className="text-green-600 font-medium">
          {(f.montant_paye ?? 0).toFixed(2)} DA
        </span>
      )
    },
    {
      key: 'montant_restant',
      header: 'Reste',
      render: (f: Facture) => {
        const restant = f.montant_restant ?? Number(f.montant_ttc) ?? 0;
        return (
          <span className={`font-medium ${restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {restant.toFixed(2)} DA
          </span>
        );
      }
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (f: Facture) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutBadgeClass(f.statut)}`}>
          {getStatutLabel(f.statut)}
        </span>
      )
    },
  ];

  const renderCustomActions = (facture: Facture) => {
    const canPay = facture.statut !== 'payee' && facture.statut !== 'annulee';
    const canCancel = facture.statut !== 'annulee';

    return (
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handlePrintFacture(facture)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Imprimer la facture"
        >
          <Printer className="w-4 h-4" />
        </motion.button>
        {canPay && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePay(facture)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Payer"
          >
            <CreditCard className="w-4 h-4" />
          </motion.button>
        )}
        {canCancel && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCancelFacture(facture)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            title="Annuler la facture"
          >
            <Ban className="w-4 h-4" />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-help"
          title={`Créé par: ${facture.user?.username || 'Système'}\nLe: ${facture.created_at ? new Date(facture.created_at).toLocaleString('fr-FR') : 'Date inconnue'}`}
        >
          <UserRoundPen className="w-4 h-4" />
        </motion.button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestion des Factures</h1>
          <p className="text-text-secondary mt-2">Voir et gérer les factures</p>
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
              {[filters.statut, filters.dateFrom, filters.dateTo, filters.montantMin, filters.montantMax].filter(Boolean).length}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Statut">
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value as FactureStatut | '' })}
                className="input-field"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="payee">Payée</option>
                <option value="impayee">Impayée</option>
                <option value="annulee">Annulée</option>
              </select>
            </FormField>
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
        data={filteredFactures}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={renderCustomActions}
      />

      {/* Payment Modal */}
      {selectedFacture && (
        <PaymentModal
          facture={selectedFacture}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedFacture(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default FacturesPage;

