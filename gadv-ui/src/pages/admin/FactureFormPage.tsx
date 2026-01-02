import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { facturesService, commandesService, numerotationsServiceExtended, Facture, FactureStatut, Commande } from '../../services/admin.service';

const FactureFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewNumero, setPreviewNumero] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Facture>>({
    commande_id: undefined,
    numero_facture: '',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    montant_ht: undefined,
    montant_tva: undefined,
    montant_ttc: undefined,
    reductions: undefined,
    autre_reductions: undefined,
    taxes: undefined,
    statut: 'en_attente',
    notes: '',
  });

  useEffect(() => {
    loadData();
    if (!isEditing) {
      loadPreviewNumero();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const commandesData = await commandesService.getAll();
      setCommandes(commandesData || []);

      if (isEditing && id) {
        const facture = await facturesService.getById(parseInt(id));
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
        setFormData({
          ...facture,
          date_facture: formatDate(facture.date_facture) || new Date().toISOString().split('T')[0],
          date_echeance: formatDate(facture.date_echeance),
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/factures');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewNumero = async () => {
    try {
      const preview = await numerotationsServiceExtended.getPreview('FACTURE');
      setPreviewNumero(preview);
    } catch (error) {
      console.error('Error loading preview numero:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await facturesService.update(parseInt(id), formData);
        toast.success('Facture mise à jour avec succès');
      } else {
        await facturesService.create(formData);
        toast.success('Facture créée avec succès');
      }
      navigate('/admin/factures');
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
      title={isEditing ? 'Modifier la facture' : 'Nouvelle facture'}
      subtitle={isEditing ? 'Modifiez les informations de la facture' : 'Créez une nouvelle facture'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/factures"
    >
      <FormField label="Commande" required>
        <select
          value={formData.commande_id || ''}
          onChange={(e) => setFormData({ ...formData, commande_id: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          disabled={!!isEditing}
        >
          <option value="">Sélectionner une commande</option>
          {commandes.map(commande => (
            <option key={commande.id} value={commande.id}>
              Commande #{commande.id} - {commande.client?.nom_complet || commande.client?.nom_entreprise || 'N/A'}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Numéro de facture">
          <input
            type="text"
            value={isEditing ? (formData.numero_facture || '') : previewNumero}
            onChange={(e) => setFormData({ ...formData, numero_facture: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono bg-gray-100 text-gray-500 cursor-not-allowed"
            placeholder="Chargement..."
            disabled={true}
          />
        </FormField>

        <FormField label="Statut" required>
          <select
            value={formData.statut || 'en_attente'}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value as FactureStatut })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          >
            <option value="en_attente">En attente</option>
            <option value="payee">Payée</option>
            <option value="impayee">Impayée</option>
            <option value="annulee">Annulée</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Date de facture" required>
          <input
            type="date"
            value={formData.date_facture || ''}
            onChange={(e) => setFormData({ ...formData, date_facture: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          />
        </FormField>

        <FormField label="Date d'échéance">
          <input
            type="date"
            value={formData.date_echeance || ''}
            onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Montant HT" required>
          <input
            type="number"
            step="0.01"
            value={formData.montant_ht || ''}
            onChange={(e) => setFormData({ ...formData, montant_ht: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Montant TVA" required>
          <input
            type="number"
            step="0.01"
            value={formData.montant_tva || ''}
            onChange={(e) => setFormData({ ...formData, montant_tva: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Montant TTC" required>
          <input
            type="number"
            step="0.01"
            value={formData.montant_ttc || ''}
            onChange={(e) => setFormData({ ...formData, montant_ttc: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
            placeholder="0.00"
          />
        </FormField>
      </div>

      <FormField label="Notes">
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          rows={3}
          placeholder="Notes supplémentaires"
        />
      </FormField>
    </FormPageLayout>
  );
};

export default FactureFormPage;

