import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { taxesService, typeArticleService, Taxe, TypeArticle } from '../../services/admin.service';

const TaxeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [types, setTypes] = useState<TypeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Taxe>>({
    id_type_article: undefined,
    reference: '',
    taxe_fixe: false,
    montant_taxe_fixe: undefined,
    taxe_pourcentage: undefined,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const typesData = await typeArticleService.getAll();
      setTypes(typesData || []);

      if (isEditing && id) {
        const taxe = await taxesService.getById(parseInt(id));
        setFormData(taxe);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/taxes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await taxesService.update(parseInt(id), formData);
        toast.success('Taxe mise à jour avec succès');
      } else {
        await taxesService.create(formData);
        toast.success('Taxe créée avec succès');
      }
      navigate('/admin/taxes');
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
      title={isEditing ? 'Modifier la taxe' : 'Nouvelle taxe'}
      subtitle={isEditing ? 'Modifiez les informations de la taxe' : 'Créez une nouvelle taxe'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/taxes"
    >
      <FormField label="Type de service">
        <select
          value={formData.id_type_article || ''}
          onChange={(e) => setFormData({ ...formData, id_type_article: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Sélectionner un type</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Référence">
        <input
          type="text"
          value={formData.reference || ''}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </FormField>

      <FormField label="Type de taxe">
        <select
          value={formData.taxe_fixe ? 'fixe' : 'pourcentage'}
          onChange={(e) => setFormData({ ...formData, taxe_fixe: e.target.value === 'fixe' })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="pourcentage">Pourcentage</option>
          <option value="fixe">Fixe</option>
        </select>
      </FormField>

      {formData.taxe_fixe ? (
        <FormField label="Montant taxe fixe">
          <input
            type="number"
            step="0.01"
            value={formData.montant_taxe_fixe || ''}
            onChange={(e) => setFormData({ ...formData, montant_taxe_fixe: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>
      ) : (
        <FormField label="Taxe pourcentage">
          <input
            type="number"
            step="0.01"
            value={formData.taxe_pourcentage || ''}
            onChange={(e) => setFormData({ ...formData, taxe_pourcentage: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>
      )}
    </FormPageLayout>
  );
};

export default TaxeFormPage;

