import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { caissesService, Caisse } from '../../services/admin.service';
import { Star, Wallet } from 'lucide-react';

const CaisseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Caisse>>({
    nom_caisse: '',
    montant_depart: 0,
    devise: 'DZD',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        const caisse = await caissesService.getById(parseInt(id));
        setFormData(caisse);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/caisses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await caissesService.update(parseInt(id), formData);
        toast.success('Caisse mise à jour avec succès');
      } else {
        await caissesService.create(formData);
        toast.success('Caisse créée avec succès');
      }
      navigate('/admin/caisses');
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
      title={isEditing ? 'Modifier la caisse' : 'Nouvelle caisse'}
      subtitle={isEditing ? 'Modifiez les informations de la caisse' : 'Créez une nouvelle caisse'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/caisses"
    >
      {/* Show badge if caisse principale */}
      {formData.is_principale && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <Star className="w-5 h-5 fill-amber-500" />
            <span className="font-medium">Cette caisse est la caisse principale</span>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            Tous les paiements des factures sont automatiquement ajoutés à cette caisse.
          </p>
        </div>
      )}

      {/* Show current balance in edit mode */}
      {isEditing && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">Solde actuel</p>
              <p className="text-xl font-bold text-green-600">
                {(formData.solde_actuel ?? 0).toFixed(2)} {formData.devise || 'DZD'}
              </p>
            </div>
          </div>
        </div>
      )}

      <FormField label="Nom de la caisse" required>
        <input
          type="text"
          value={formData.nom_caisse || ''}
          onChange={(e) => setFormData({ ...formData, nom_caisse: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          disabled={formData.is_principale}
        />
        {formData.is_principale && (
          <p className="text-xs text-gray-500 mt-1">Le nom de la caisse principale ne peut pas être modifié</p>
        )}
      </FormField>

      <FormField label="Montant de départ">
        <input
          type="number"
          step="0.01"
          value={formData.montant_depart ?? 0}
          onChange={(e) => setFormData({ ...formData, montant_depart: e.target.value ? parseFloat(e.target.value) : 0 })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Le montant initial de la caisse (utilisé pour calculer le solde)
        </p>
      </FormField>

      <FormField label="Devise">
        <select
          value={formData.devise || 'DZD'}
          onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="DZD">DZD - Dinar Algérien</option>
          <option value="EUR">EUR - Euro</option>
          <option value="USD">USD - Dollar Américain</option>
        </select>
      </FormField>
    </FormPageLayout>
  );
};

export default CaisseFormPage;

