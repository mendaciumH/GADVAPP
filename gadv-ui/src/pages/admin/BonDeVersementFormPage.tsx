import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { bonDeVersementService, commandesService, clientsService, numerotationsServiceExtended, BonDeVersement, Commande, Client } from '../../services/admin.service';

interface PaymentHistory {
  totalPaid: number;
  remaining: number;
  commandePrice: number;
  versements: BonDeVersement[];
}

const BonDeVersementFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewNumero, setPreviewNumero] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState<Partial<BonDeVersement>>({
    client_id: undefined,
    commande_id: undefined,
    numero: '',
    date_versement: new Date().toISOString().split('T')[0],
    montant_verse: undefined,
  });

  useEffect(() => {
    loadData();
    if (!isEditing) {
      loadPreviewNumero();
    }
  }, [id]);

  useEffect(() => {
    // Filter commandes when client changes
    if (formData.client_id) {
      const filtered = commandes.filter(c => Number(c.client_id) === Number(formData.client_id));
      setFilteredCommandes(filtered);
      // Reset commande_id if it doesn't belong to selected client
      if (formData.commande_id && !filtered.find(c => Number(c.id) === Number(formData.commande_id))) {
        setFormData(prev => ({ ...prev, commande_id: undefined }));
      }
    } else {
      setFilteredCommandes([]);
    }
  }, [formData.client_id, commandes]);

  useEffect(() => {
    // Load payment history when commande changes
    if (formData.commande_id && !isEditing) {
      loadPaymentHistory(formData.commande_id);
    } else {
      setPaymentHistory(null);
    }
  }, [formData.commande_id, isEditing]);

  const loadPaymentHistory = async (commandeId: number) => {
    try {
      setLoadingHistory(true);
      const versements = await bonDeVersementService.findByCommandeId(commandeId);
      const selectedCommande = commandes.find(c => Number(c.id) === Number(commandeId));

      if (selectedCommande) {
        const commandePrice = Number(selectedCommande.prix) || 0;
        // Filter out cancelled versements
        const activeVersements = versements.filter(v => !v.annule);
        const totalPaid = activeVersements.reduce((sum, v) => sum + Number(v.montant_verse || 0), 0);
        const remaining = Math.max(0, commandePrice - totalPaid);

        setPaymentHistory({
          totalPaid,
          remaining,
          commandePrice,
          versements: activeVersements,
        });
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);


      const commandesData = await commandesService.getAll().catch((error: any) => {
        if (error.response?.status === 403) {
          console.warn('User does not have permission to view commandes');
          return [] as Commande[];
        }
        throw error;
      });

      const clientsData = await clientsService.getAll().catch((error: any) => {
        if (error.response?.status === 403) {
          console.warn('User does not have permission to view clients');
          return [] as Client[];
        }
        throw error;
      });

      setCommandes(commandesData || []);
      setClients(clientsData || []);
      // Don't set filteredCommandes here - let useEffect handle it based on client_id

      if (isEditing && id) {
        const bonDeVersement = await bonDeVersementService.getById(parseInt(id));
        const formatDate = (dateStr: string | Date | undefined): string => {
          if (!dateStr) return '';
          if (typeof dateStr === 'string') {
            try {
              return new Date(dateStr).toISOString().split('T')[0];
            } catch {
              return '';
            }
          }
          if (dateStr instanceof Date) {
            return dateStr.toISOString().split('T')[0];
          }
          return '';
        };
        const updatedFormData = {
          ...bonDeVersement,
          date_versement: formatDate(bonDeVersement.date_versement) || new Date().toISOString().split('T')[0],
        };
        setFormData(updatedFormData);
        // Trigger filtering for the loaded client_id
        if (updatedFormData.client_id) {
          const filtered = (commandesData || []).filter(c => Number(c.client_id) === Number(updatedFormData.client_id));
          setFilteredCommandes(filtered);
        }
      }
    } catch (error: any) {
      // Don't show error toast for 403 errors on clients/commandes - these are expected if user doesn't have permissions
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      }
      // Only navigate away if it's a critical error (not a permission issue)
      if (error.response?.status === 403 && error.config?.url?.includes('/admin/bon-de-versement')) {
        // User doesn't have permission for bon-de-versement itself
        navigate('/admin/dashboard');
      } else if (error.response?.status !== 403) {
        navigate('/admin/bon-de-versement');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewNumero = async () => {
    try {
      const preview = await numerotationsServiceExtended.getPreview('BON_VERSEMENT');
      setPreviewNumero(preview);
    } catch (error) {
      console.error('Error loading preview numero:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that commande belongs to selected client
    if (formData.commande_id && formData.client_id) {
      const selectedCommande = commandes.find(c => Number(c.id) === Number(formData.commande_id));
      if (selectedCommande && Number(selectedCommande.client_id) !== Number(formData.client_id)) {
        toast.error('La commande sélectionnée n\'appartient pas au client sélectionné');
        return;
      }
    }

    // Validate payment amount doesn't exceed remaining balance
    if (paymentHistory && formData.montant_verse) {
      const montantVerse = Number(formData.montant_verse);
      if (montantVerse > paymentHistory.remaining) {
        toast.error(`Le montant versé (${montantVerse.toFixed(2)} DA) dépasse le montant restant à payer (${paymentHistory.remaining.toFixed(2)} DA)`);
        return;
      }
      if (montantVerse <= 0) {
        toast.error('Le montant versé doit être supérieur à 0');
        return;
      }
    }

    // Ensure client_id matches commande's client_id if commande is selected
    if (formData.commande_id && !formData.client_id) {
      const selectedCommande = commandes.find(c => Number(c.id) === Number(formData.commande_id));
      if (selectedCommande && selectedCommande.client_id) {
        formData.client_id = selectedCommande.client_id;
      }
    }

    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await bonDeVersementService.update(parseInt(id), formData);
        toast.success('Bon de versement mis à jour avec succès');
      } else {
        await bonDeVersementService.create(formData);
        toast.success('Bon de versement créé avec succès');
      }
      navigate('/admin/bon-de-versement');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      title={isEditing ? 'Modifier le bon de versement' : 'Nouveau bon de versement'}
      subtitle={isEditing ? 'Modifiez les informations du bon de versement' : 'Créez un nouveau bon de versement'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/bon-de-versement"
    >
      <FormField label="Client" required>
        <select
          value={formData.client_id ? String(formData.client_id) : ''}
          onChange={(e) => {
            const clientId = e.target.value ? parseInt(e.target.value, 10) : undefined;
            setFormData({ ...formData, client_id: clientId, commande_id: undefined });
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          disabled={!!isEditing}
        >
          <option value="">Sélectionner un client</option>
          {clients.map(client => (
            <option key={client.id} value={String(client.id)}>
              {client.type_client === 'Entreprise'
                ? `${client.nom_entreprise || 'N/A'} (Entreprise)`
                : `${client.nom_complet || 'N/A'} (Particulier)`}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Commande" required>
        <select
          value={formData.commande_id ? String(formData.commande_id) : ''}
          onChange={(e) => {
            const commandeId = e.target.value ? parseInt(e.target.value, 10) : undefined;
            if (commandeId) {
              // Find the selected commande and ensure client_id matches
              const selectedCommande = commandes.find(c => Number(c.id) === Number(commandeId));
              if (selectedCommande && selectedCommande.client_id) {
                // Update client_id to match the commande's client_id
                setFormData({
                  ...formData,
                  commande_id: commandeId,
                  client_id: Number(selectedCommande.client_id)
                });
              } else {
                setFormData({ ...formData, commande_id: commandeId });
              }
            } else {
              setFormData({ ...formData, commande_id: undefined });
            }
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          disabled={!!isEditing || !formData.client_id}
        >
          <option value="">
            {!formData.client_id
              ? 'Sélectionnez d\'abord un client'
              : filteredCommandes.length === 0
                ? 'Aucune commande disponible pour ce client'
                : 'Sélectionner une commande'}
          </option>
          {filteredCommandes.map(commande => (
            <option key={commande.id} value={String(commande.id)}>
              Commande #{commande.id} - {commande.article?.label || 'N/A'} - {commande.prix ? `${Number(commande.prix).toFixed(2)} DA` : 'N/A'}
            </option>
          ))}
        </select>
        {formData.client_id && filteredCommandes.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            Aucune commande trouvée pour ce client
          </p>
        )}
      </FormField>

      {/* Payment History Card */}
      {!isEditing && paymentHistory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">Historique des paiements</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Montant total</p>
              <p className="text-lg font-bold text-gray-900">{paymentHistory.commandePrice.toFixed(2)} DA</p>
            </div>

            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Déjà payé</p>
              <p className="text-lg font-bold text-green-600">{paymentHistory.totalPaid.toFixed(2)} DA</p>
            </div>

            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Reste à payer</p>
              <p className="text-lg font-bold text-orange-600">{paymentHistory.remaining.toFixed(2)} DA</p>
            </div>
          </div>

          {paymentHistory.versements.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Versements précédents ({paymentHistory.versements.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {paymentHistory.versements.map((versement) => (
                  <div key={versement.id} className="flex justify-between items-center bg-white rounded px-3 py-2 text-xs border border-gray-100">
                    <span className="text-gray-600">
                      {versement.numero} - {new Date(versement.date_versement).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-semibold text-green-700">{Number(versement.montant_verse).toFixed(2)} DA</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paymentHistory.remaining === 0 && (
            <div className="bg-green-100 border border-green-300 rounded-md p-2 mt-2">
              <p className="text-xs text-green-800 font-medium text-center">✓ Cette commande est entièrement payée</p>
            </div>
          )}
        </div>
      )}

      {loadingHistory && !isEditing && formData.commande_id && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
            <p className="text-sm text-gray-600">Chargement de l'historique...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Numéro">
          <input
            type="text"
            value={isEditing ? (formData.numero || '') : previewNumero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono bg-gray-100 text-gray-500 cursor-not-allowed"
            placeholder="Chargement..."
            disabled={true}
          />
        </FormField>

        <FormField label="Date de versement" required>
          <input
            type="date"
            value={
              typeof formData.date_versement === 'string'
                ? formData.date_versement
                : formData.date_versement instanceof Date
                  ? formData.date_versement.toISOString().split('T')[0]
                  : ''
            }
            onChange={(e) => setFormData({ ...formData, date_versement: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          />
        </FormField>
      </div>

      <FormField label="Montant versé (DA)" required>
        <input
          type="number"
          step="0.01"
          min="0"
          max={paymentHistory ? paymentHistory.remaining : undefined}
          value={formData.montant_verse || ''}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            setFormData({ ...formData, montant_verse: value });
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          placeholder="0.00"
          disabled={paymentHistory?.remaining === 0}
        />
        {paymentHistory && paymentHistory.remaining > 0 && (
          <p className="mt-1 text-xs text-gray-600">
            Maximum: {paymentHistory.remaining.toFixed(2)} DA
          </p>
        )}
        {paymentHistory && formData.montant_verse && Number(formData.montant_verse) > paymentHistory.remaining && (
          <p className="mt-1 text-xs text-red-600">
            ⚠ Le montant dépasse le reste à payer ({paymentHistory.remaining.toFixed(2)} DA)
          </p>
        )}
      </FormField>
    </FormPageLayout>
  );
};

export default BonDeVersementFormPage;

