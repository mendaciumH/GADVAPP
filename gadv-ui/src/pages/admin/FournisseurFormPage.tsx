import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { fournisseursService, Fournisseur } from '../../services/admin.service';
import { AlertCircle } from 'lucide-react';

const FournisseurFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Fournisseur>>({
    nom_complet: '',
    numero_mobile: '',
    notes: '',
    credit_depart: undefined,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        const fournisseur = await fournisseursService.getById(parseInt(id));
        setFormData(fournisseur);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nom_complet?.trim()) {
      errors.nom_complet = 'Le nom complet est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        await fournisseursService.update(parseInt(id), formData);
        toast.success('Fournisseur mis à jour avec succès');
      } else {
        await fournisseursService.create(formData);
        toast.success('Fournisseur créé avec succès');
      }
      navigate('/admin/fournisseurs');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.message) {
        const messages = error.response.data.message;
        
        // If message is an array of validation errors
        if (Array.isArray(messages)) {
          const errors: Record<string, string> = {};
          messages.forEach((msg: string) => {
            // Match field names in error messages
            if (msg.includes('credit_depart') || msg.includes('crédit')) {
              errors.credit_depart = msg;
            } else if (msg.includes('nom_complet') || msg.includes('nom')) {
              errors.nom_complet = msg;
            } else if (msg.includes('numero_mobile') || msg.includes('téléphone')) {
              errors.numero_mobile = msg;
            } else if (msg.includes('notes')) {
              errors.notes = msg;
            }
          });
          
          if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error('Veuillez corriger les erreurs dans le formulaire');
          } else {
            toast.error(messages.join(', '));
          }
        } else {
          // Single error message
          toast.error(messages);
        }
      } else {
        toast.error('Erreur lors de l\'opération');
      }
      
      // Handle errors object if present
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
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
      title={isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      subtitle={isEditing ? 'Modifiez les informations du fournisseur' : 'Créez un nouveau fournisseur'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/fournisseurs"
    >
      <FormField label="Nom complet" required>
        <input
          type="text"
          value={formData.nom_complet || ''}
          onChange={(e) => {
            setFormData({ ...formData, nom_complet: e.target.value });
            if (formErrors.nom_complet) setFormErrors({ ...formErrors, nom_complet: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.nom_complet ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          required
          placeholder="Nom complet du fournisseur"
        />
        {formErrors.nom_complet && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.nom_complet}
          </p>
        )}
      </FormField>

      <FormField label="Téléphone">
        <input
          type="tel"
          value={formData.numero_mobile || ''}
          onChange={(e) => {
            setFormData({ ...formData, numero_mobile: e.target.value });
            if (formErrors.numero_mobile) setFormErrors({ ...formErrors, numero_mobile: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.numero_mobile ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Numéro de téléphone"
        />
        {formErrors.numero_mobile && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.numero_mobile}
          </p>
        )}
      </FormField>

      <FormField label="Notes">
        <textarea
          value={formData.notes || ''}
          onChange={(e) => {
            setFormData({ ...formData, notes: e.target.value });
            if (formErrors.notes) setFormErrors({ ...formErrors, notes: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.notes ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Notes supplémentaires"
        />
        {formErrors.notes && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.notes}
          </p>
        )}
      </FormField>

      <FormField label="Crédit départ">
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.credit_depart || ''}
          onChange={(e) => {
            setFormData({ ...formData, credit_depart: e.target.value ? parseFloat(e.target.value) : undefined });
            if (formErrors.credit_depart) setFormErrors({ ...formErrors, credit_depart: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.credit_depart ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
        />
        {formErrors.credit_depart && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.credit_depart}
          </p>
        )}
      </FormField>
    </FormPageLayout>
  );
};

export default FournisseurFormPage;

