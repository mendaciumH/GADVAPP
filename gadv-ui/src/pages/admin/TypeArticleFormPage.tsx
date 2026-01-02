import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { typeArticleService, TypeArticle } from '../../services/admin.service';

const TypeArticleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ description: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        const type = await typeArticleService.getById(parseInt(id));
        setFormData({ description: type.description });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/type-article');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await typeArticleService.update(parseInt(id), formData);
        toast.success('Type mis à jour avec succès');
      } else {
        await typeArticleService.create(formData);
        toast.success('Type créé avec succès');
      }
      navigate('/admin/type-article');
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
      title={isEditing ? 'Modifier le type' : 'Nouveau type'}
      subtitle={isEditing ? 'Modifiez la description du type de service' : 'Créez un nouveau type de service'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/type-article"
    >
      <FormField label="Description" required>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
        />
      </FormField>
    </FormPageLayout>
  );
};

export default TypeArticleFormPage;

