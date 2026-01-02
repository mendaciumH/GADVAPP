import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../../components/admin/DataTable';
import { commandesService, Commande, facturesService, Facture } from '../../services/admin.service';
import { Printer, XCircle, FileText, AlertTriangle, Download } from 'lucide-react';

const CommandesPage: React.FC = () => {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const commandesData = await commandesService.getAllTourisme();
      setCommandes(commandesData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/commandes/new');
  };

  const handleEdit = (commande: Commande) => {
    navigate(`/admin/commandes/${commande.id}/edit`);
  };

  const handleDelete = async (commande: Commande) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${commande.id}?`)) {
      try {
        await commandesService.delete(commande.id);
        toast.success('Commande supprimée avec succès');
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
      link.download = `contrat-voyage-${commande.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Contrat de voyage téléchargé avec succès');
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
      link.download = `bon-de-commande-${commande.id}.pdf`;
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
    // First check if there are any factures
    try {
      const factures = await facturesService.findByCommandeId(commande.id);
      const hasActiveFactures = factures.some(f => f.statut !== 'annulee');

      let confirmMessage = `Êtes-vous sûr de vouloir annuler la commande #${commande.id}?`;

      if (hasActiveFactures) {
        const activeCount = factures.filter(f => f.statut !== 'annulee').length;
        confirmMessage += `\n\n⚠️ Cette action annulera également ${activeCount} facture(s) et tous les versements associés.`;
      }

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setCancellingId(commande.id);
      await commandesService.cancelCommande(commande.id);
      toast.success('Commande annulée avec succès');
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

  const filteredCommandes = commandes.filter(c =>
    c.nom?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.prenom?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.client?.nom_complet?.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.article?.label?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'client', header: 'Client', render: (c: Commande) => c.client?.nom_complet || 'N/A' },
    { key: 'article', header: 'Article', render: (c: Commande) => c.article?.label || 'N/A' },
    { key: 'prix', header: 'Prix', render: (c: Commande) => c.prix ? `${c.prix} DA` : 'N/A' },
    { key: 'date', header: 'Date', render: (c: Commande) => c.date ? new Date(c.date).toLocaleDateString() : 'N/A' },
    { key: 'beneficiaire', header: 'Bénéficiaire', render: (c: Commande) => c.beneficiaire ? `${c.nom || ''} ${c.prenom || ''}`.trim() || 'Oui' : 'Non' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Gestion des Commandes</h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Voir et gérer les commandes</p>
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
        customActions={(item: Commande) => (
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleGenerateBonDeCommande(item)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              aria-label="Générer bon de commande"
              title="Générer le bon de commande"
            >
              <Download className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePrintContract(item)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Imprimer contrat"
              title="Imprimer contrat de voyage"
            >
              <Printer className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleGenerateFacture(item)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              aria-label="Générer facture"
              title="Générer une facture"
            >
              <FileText className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCancelCommande(item)}
              disabled={cancellingId === item.id}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Annuler commande"
              title="Annuler la commande"
            >
              {cancellingId === item.id ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        )}
      />
    </div>
  );
};

export default CommandesPage;
