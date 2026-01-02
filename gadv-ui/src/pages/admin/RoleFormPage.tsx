import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { rolesService, Role } from '../../services/admin.service';

const RoleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        if (parseInt(id) === 1) {
          toast.error('Le rôle admin ne peut pas être modifié');
          navigate('/admin/roles');
          return;
        }
        const role = await rolesService.getById(parseInt(id));
        setFormData({ name: role.name });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && id && parseInt(id) === 1) {
      toast.error('Le rôle admin ne peut pas être modifié');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await rolesService.update(parseInt(id), formData);
        toast.success('Rôle mis à jour avec succès');
      } else {
        await rolesService.create(formData);
        toast.success('Rôle créé avec succès');
      }
      navigate('/admin/roles');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'opération';
      toast.error(errorMessage);
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
      title={isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}
      subtitle={isEditing ? 'Modifiez le nom du rôle' : 'Créez un nouveau rôle'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/roles"
    >
      <FormField label="Nom du rôle" required>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
        />
      </FormField>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          💡 <strong>Note:</strong> Les permissions sont assignées depuis la page <strong>Permissions</strong>.
          Créez d'abord le rôle, puis allez dans Permissions pour lui assigner les permissions nécessaires.
        </p>
      </div>
    </FormPageLayout>
  );
};

export default RoleFormPage;

