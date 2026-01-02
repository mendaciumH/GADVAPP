import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../../components/admin/DataTable';
import { commandesService, Commande, facturesService } from '../../services/admin.service';
import { Printer, XCircle, FileText, Download, Key, UserRoundPen, Eye, X } from 'lucide-react';

const ReservationOmraPage: React.FC = () => {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Commande | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const commandesData = await commandesService.getAll();

      // Filter to only show Omra reservations (id_type_article === 1)
      const omraCommandes = (commandesData || []).filter((commande: any) => {
        const article = commande.article;
        if (!article) return false;

        // Check id_type_article - handle both string and number
        const typeId = typeof article.id_type_article === 'string'
          ? parseInt(article.id_type_article, 10)
          : article.id_type_article;

        return typeId === 1;
      });

      setCommandes(omraCommandes);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/reservation-omra/new');
  };

  const handleEdit = (commande: Commande) => {
    navigate(`/admin/reservation-omra/${commande.id}/edit`);
  };

  const handleDelete = async (commande: Commande) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la réservation Omra #${commande.id}?`)) {
      try {
        await commandesService.delete(commande.id);
        toast.success('Réservation supprimée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handlePrintContract = async (commande: Commande) => {
    try {
      const blob = await commandesService.printContract(commande.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat-omra-${commande.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Contrat Omra téléchargé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du contrat');
    }
  };

  const handleGenerateBonDeCommande = async (commande: Commande) => {
    try {
      const blob = await commandesService.generateBonDeCommande(commande.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-de-commande-omra-${commande.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Bon de commande téléchargé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération du bon de commande');
    }
  };

  const handleCancelCommande = async (commande: Commande) => {
    try {
      const factures = await facturesService.findByCommandeId(commande.id);
      const hasActiveFactures = factures.some(f => f.statut !== 'annulee');

      let confirmMessage = `Êtes-vous sûr de vouloir annuler la réservation Omra #${commande.id}?`;

      if (hasActiveFactures) {
        const activeCount = factures.filter(f => f.statut !== 'annulee').length;
        confirmMessage += `\n\n⚠️ Cette action annulera également ${activeCount} facture(s) et tous les versements associés.`;
      }

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setCancellingId(commande.id);
      await commandesService.cancelCommande(commande.id);
      toast.success('Réservation annulée avec succès');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancellingId(null);
    }
  };

  const handleGenerateFacture = async (commande: Commande) => {
    try {
      await facturesService.generateFromCommande(commande.id);
      toast.success('Facture générée avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération de la facture');
    }
  };

  const handleView = (commande: Commande) => {
    setSelectedReservation(commande);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedReservation(null);
  };

  const filteredCommandes = commandes.filter(c =>
    c.nom?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.prenom?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.article?.label?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'client', header: 'Client', render: (c: Commande) => c.client?.nom_complet || 'N/A' },
    { key: 'article', header: 'Omra', render: (c: Commande) => c.article?.label || 'N/A' },
    { key: 'prix', header: 'Prix', render: (c: Commande) => c.prix ? `${c.prix.toLocaleString('fr-FR')} DA` : 'N/A' },
    { key: 'date', header: 'Date', render: (c: Commande) => c.date ? new Date(c.date).toLocaleDateString('fr-FR') : 'N/A' },
    { key: 'beneficiaire', header: 'Beneficiaire', render: (c: Commande) => c.beneficiaire ? `${c.nom || ''} ${c.prenom || ''}`.trim() || 'Oui' : 'Non' },

  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Réservations Omra</h1>
        <p className="text-text-secondary mt-2">Gérer les réservations  Omra</p>
      </div>

      <DataTable
        data={filteredCommandes}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={(c: Commande) => c.statut !== 'annulee'}
        customActions={(item: Commande) => {
          if (item.statut === 'annulee') {
            return (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                  Annulé
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-help"
                  title={`Créé par: ${item.user?.username || 'Système'}\nLe: ${item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : 'Date inconnue'}`}
                >
                  <UserRoundPen className="w-4 h-4" />
                </motion.button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleView(item)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                aria-label="Voir détails"
                title="Voir tous les détails"
              >
                <Eye className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleGenerateBonDeCommande(item)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Générer bon de commande"
                title="Générer le bon de commande"
              >
                <FileText className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePrintContract(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Imprimer contrat"
                title="Imprimer contrat Omra"
              >
                <Printer className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCancelCommande(item)}
                disabled={cancellingId === item.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Annuler réservation"
                title="Annuler la réservation"
              >
                {cancellingId === item.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-help"
                title={`Créé par: ${item.user?.username || 'Système'}\nLe: ${item.created_at ? new Date(item.created_at).toLocaleString('fr-FR') : 'Date inconnue'}`}
              >
                <UserRoundPen className="w-4 h-4" />
              </motion.button>
            </div>
          );
        }}
      />

      {/* View Details Modal */}
      {viewModalOpen && selectedReservation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Réservation #{selectedReservation.id}</h2>
                {selectedReservation.statut === 'annulee' && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded">Annulée</span>
                )}
              </div>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-white/20 rounded" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
              {/* Client */}
              <section className="border-b pb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Client</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Nom" value={selectedReservation.client?.nom_complet || 'N/A'} />
                  <InfoItem label="Email" value={selectedReservation.client?.email || 'N/A'} />
                  <InfoItem label="Téléphone" value={selectedReservation.client?.numero_mobile || 'N/A'} />
                  <InfoItem label="Type" value={selectedReservation.client?.type_client || 'N/A'} />
                </div>
              </section>

              {/* Programme Omra */}
              <section className="border-b pb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Programme Omra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Programme" value={selectedReservation.article?.label || 'N/A'} />
                  <InfoItem
                    label="Session"
                    value={selectedReservation.session?.date
                      ? new Date(selectedReservation.session.date).toLocaleDateString('fr-FR')
                      : 'N/A'
                    }
                  />
                  <InfoItem label="Type chambre" value={selectedReservation.chambre?.type_chambre || selectedReservation.type_chambre || 'N/A'} />
                  <InfoItem label="Personnes" value={selectedReservation.nombre_personnes?.toString() || 'N/A'} />
                </div>
              </section>

              {/* Bénéficiaire */}
              <section className="border-b pb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bénéficiaire</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem label="Nom" value={selectedReservation.nom || 'N/A'} />
                  <InfoItem label="Prénom" value={selectedReservation.prenom || 'N/A'} />
                  <InfoItem
                    label="Date naissance"
                    value={selectedReservation.date_naissance
                      ? new Date(selectedReservation.date_naissance).toLocaleDateString('fr-FR')
                      : 'N/A'
                    }
                  />
                  <InfoItem label="Genre" value={selectedReservation.genre || 'N/A'} />
                  <InfoItem label="N° Passeport" value={selectedReservation.numero_passport || 'N/A'} />
                  <InfoItem
                    label="Exp. Passeport"
                    value={selectedReservation.date_expiration_passport
                      ? new Date(selectedReservation.date_expiration_passport).toLocaleDateString('fr-FR')
                      : 'N/A'
                    }
                  />
                  <InfoItem label="Mobile" value={selectedReservation.numero_mobile || 'N/A'} />
                </div>
              </section>

              {/* Financier */}
              <section className="border-b pb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Financier</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem
                    label="Prix"
                    value={selectedReservation.prix ? `${selectedReservation.prix.toLocaleString('fr-FR')} DA` : 'N/A'}
                    highlight
                  />
                  <InfoItem
                    label="Réductions"
                    value={selectedReservation.reductions ? `${selectedReservation.reductions.toLocaleString('fr-FR')} DA` : '0 DA'}
                  />
                  <InfoItem
                    label="Autres réductions"
                    value={selectedReservation.autre_reductions ? `${selectedReservation.autre_reductions.toLocaleString('fr-FR')} DA` : '0 DA'}
                  />
                  <InfoItem
                    label="Taxes"
                    value={selectedReservation.taxes ? `${selectedReservation.taxes.toLocaleString('fr-FR')} DA` : '0 DA'}
                  />
                </div>
              </section>

              {/* Autres */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Autres informations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <InfoItem
                    label="Date réservation"
                    value={selectedReservation.date ? new Date(selectedReservation.date).toLocaleDateString('fr-FR') : 'N/A'}
                  />
                  <InfoItem label="N° Bon commande" value={selectedReservation.numero_bon_commande || 'N/A'} />
                  <InfoItem label="Créé par" value={selectedReservation.user?.username || 'Système'} />
                  <InfoItem
                    label="Date création"
                    value={selectedReservation.created_at ? new Date(selectedReservation.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  />
                  <InfoItem
                    label="Statut"
                    value={selectedReservation.statut === 'annulee' ? 'Annulée' : 'Active'}
                    highlight={selectedReservation.statut === 'annulee'}
                    isStatus
                  />
                </div>
                {selectedReservation.remarques && (
                  <div className="mt-2">
                    <InfoItem label="Remarques" value={selectedReservation.remarques} fullWidth />
                  </div>
                )}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium transition-colors"
              >
                Fermer
              </button>
              {selectedReservation.statut !== 'annulee' && (
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleEdit(selectedReservation);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Modifier
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Helper component for displaying information items
const InfoItem: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  isStatus?: boolean;
  fullWidth?: boolean;
}> = ({ label, value, highlight, isStatus, fullWidth }) => (
  <div className={fullWidth ? 'col-span-full' : ''}>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className={`text-sm font-medium ${highlight
      ? isStatus
        ? 'text-red-600'
        : 'text-indigo-600'
      : 'text-gray-900'
      }`}>
      {value}
    </p>
  </div>
);

export default ReservationOmraPage;

