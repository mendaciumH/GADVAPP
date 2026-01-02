import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { clientsService, Client } from '../../services/admin.service';
import { AlertCircle } from 'lucide-react';

const ClientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({
    type_client: 'Particulier',
    nom_complet: '',
    numero_passeport: '',
    expiration_passeport: '',
    numero_mobile: '',
    numero_mobile_2: '',
    email: '',
    date_naissance: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        const client = await clientsService.getById(parseInt(id));
        setFormData({
          ...client,
          date_naissance: client.date_naissance || '',
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validation selon le type de client
    if (formData.type_client === 'Particulier') {
      if (!formData.nom_complet?.trim()) {
        errors.nom_complet = 'Le nom complet (nom et prénom) est requis pour un particulier';
      }
    } else if (formData.type_client === 'Entreprise') {
      if (!formData.nom_entreprise?.trim()) {
        errors.nom_entreprise = 'Le nom de l\'entreprise est requis pour une entreprise';
      }
    } else {
      // Par défaut, si aucun type n'est sélectionné, on considère comme Particulier
      if (!formData.nom_complet?.trim()) {
        errors.nom_complet = 'Le nom complet (nom et prénom) est requis';
      }
    }

    // Validation de l'email si fourni
    if (formData.email && formData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Format d\'email invalide';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Clean up form data: remove empty strings for optional fields
      const cleanedFormData = { ...formData };
      
      // Remove empty strings for optional date fields
      if (!cleanedFormData.expiration_passeport?.trim()) {
        delete cleanedFormData.expiration_passeport;
      }
      if (!cleanedFormData.date_naissance?.trim()) {
        delete cleanedFormData.date_naissance;
      }
      // Remove empty strings for optional text fields
      if (!cleanedFormData.email?.trim()) {
        delete cleanedFormData.email;
      }
      if (!cleanedFormData.numero_mobile?.trim()) {
        delete cleanedFormData.numero_mobile;
      }
      if (!cleanedFormData.numero_mobile_2?.trim()) {
        delete cleanedFormData.numero_mobile_2;
      }
      if (!cleanedFormData.numero_passeport?.trim()) {
        delete cleanedFormData.numero_passeport;
      }
      if (!cleanedFormData.notes?.trim()) {
        delete cleanedFormData.notes;
      }
      if (!cleanedFormData.nom_entreprise?.trim()) {
        delete cleanedFormData.nom_entreprise;
      }
      if (!cleanedFormData.rc?.trim()) {
        delete cleanedFormData.rc;
      }
      if (!cleanedFormData.nif?.trim()) {
        delete cleanedFormData.nif;
      }
      if (!cleanedFormData.ai?.trim()) {
        delete cleanedFormData.ai;
      }
      if (!cleanedFormData.nis?.trim()) {
        delete cleanedFormData.nis;
      }
      
      if (isEditing && id) {
        await clientsService.update(parseInt(id), cleanedFormData);
        toast.success('Client mis à jour avec succès');
      } else {
        await clientsService.create(cleanedFormData);
        toast.success('Client créé avec succès');
      }
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Error submitting client:', error);
      
      // Extract error messages from different possible formats
      let errorMessages: string[] = [];
      let fieldErrors: Record<string, string> = {};
      
      // Handle NestJS validation errors (class-validator format)
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Format 1: message is an array
        if (Array.isArray(errorData.message)) {
          errorMessages = errorData.message;
        }
        // Format 2: message is a string
        else if (typeof errorData.message === 'string') {
          errorMessages = [errorData.message];
        }
        // Format 3: errors object with field-specific errors
        else if (errorData.errors && typeof errorData.errors === 'object') {
          fieldErrors = errorData.errors;
          // Convert field errors to messages
          errorMessages = Object.entries(errorData.errors).map(([field, message]) => {
            const fieldName = field.replace(/_/g, ' ');
            return `${fieldName}: ${message}`;
          });
        }
        // Format 4: error property
        else if (errorData.error) {
          errorMessages = [errorData.error];
        }
      }
      
      // If no specific messages found, use generic error
      if (errorMessages.length === 0) {
        if (error.response?.status === 400) {
          errorMessages = ['Erreur de validation. Veuillez vérifier les champs du formulaire.'];
        } else if (error.response?.status === 403) {
          errorMessages = ['Vous n\'avez pas les permissions nécessaires pour effectuer cette action.'];
        } else if (error.response?.status === 404) {
          errorMessages = ['Ressource non trouvée.'];
        } else if (error.response?.status >= 500) {
          errorMessages = ['Erreur serveur. Veuillez réessayer plus tard.'];
        } else {
          errorMessages = ['Erreur lors de l\'opération. Veuillez réessayer.'];
        }
      }
      
      // Display error messages
      errorMessages.forEach((message) => {
        toast.error(message, {
          autoClose: 5000,
        });
      });
      
      // Set field-specific errors for form validation display
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors);
      } else if (error.response?.data?.message && typeof error.response.data.message === 'object') {
        // Try to extract field errors from nested message structure
        const messageObj = error.response.data.message;
        const extractedErrors: Record<string, string> = {};
        
        Object.keys(messageObj).forEach((key) => {
          if (Array.isArray(messageObj[key])) {
            extractedErrors[key] = messageObj[key][0];
          } else if (typeof messageObj[key] === 'string') {
            extractedErrors[key] = messageObj[key];
          }
        });
        
        if (Object.keys(extractedErrors).length > 0) {
          setFormErrors(extractedErrors);
        }
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
      title={isEditing ? 'Modifier le client' : 'Nouveau client'}
      subtitle={isEditing ? 'Modifiez les informations du client' : 'Créez un nouveau client'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/clients"
    >
      <FormField label="Type de client">
        <select
          value={formData.type_client || 'Particulier'}
          onChange={(e) => {
            setFormData({ ...formData, type_client: e.target.value as 'Particulier' | 'Entreprise' });
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
        >
          <option value="Particulier">Particulier</option>
          <option value="Entreprise">Entreprise</option>
        </select>
      </FormField>

      {formData.type_client === 'Particulier' && (
        <>
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
              placeholder="Nom complet"
            />
            {formErrors.nom_complet && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.nom_complet}
              </p>
            )}
          </FormField>

          <FormField label="Numéro de passeport">
            <input
              type="text"
              value={formData.numero_passeport || ''}
              onChange={(e) => setFormData({ ...formData, numero_passeport: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Numéro de passeport"
            />
          </FormField>

          <FormField label="Date d'expiration du passeport">
            <input
              type="date"
              value={formData.expiration_passeport || ''}
              onChange={(e) => setFormData({ ...formData, expiration_passeport: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Date d'expiration du passeport"
            />
          </FormField>

          <FormField label="Numéro de mobile">
            <input
              type="tel"
              value={formData.numero_mobile || ''}
              onChange={(e) => setFormData({ ...formData, numero_mobile: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Numéro de mobile"
            />
          </FormField>

          <FormField label="Numéro de mobile 2">
            <input
              type="tel"
              value={formData.numero_mobile_2 || ''}
              onChange={(e) => setFormData({ ...formData, numero_mobile_2: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Numéro de mobile 2"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
              }}
              className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
                formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Email"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.email}
              </p>
            )}
          </FormField>

          <FormField label="Date de naissance">
            <input
              type="date"
              value={formData.date_naissance || ''}
              onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </FormField>

          <FormField label="Plus d'informations">
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              rows={3}
              placeholder="Notes supplémentaires"
            />
          </FormField>
        </>
      )}

      {formData.type_client === 'Entreprise' && (
        <>
          <FormField label="Nom de l'entreprise" required>
            <input
              type="text"
              value={formData.nom_entreprise || ''}
              onChange={(e) => {
                setFormData({ ...formData, nom_entreprise: e.target.value });
                if (formErrors.nom_entreprise) setFormErrors({ ...formErrors, nom_entreprise: '' });
              }}
              className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
                formErrors.nom_entreprise ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Nom de l'entreprise"
              required
            />
            {formErrors.nom_entreprise && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.nom_entreprise}
              </p>
            )}
          </FormField>
          <FormField label="RC">
            <input
              type="text"
              value={formData.rc || ''}
              onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="RC"
            />
          </FormField>
          <FormField label="NIF">
            <input
              type="text"
              value={formData.nif || ''}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="NIF"
            />
          </FormField>
          <FormField label="AI">
            <input
              type="text"
              value={formData.ai || ''}
              onChange={(e) => setFormData({ ...formData, ai: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="AI"
            />
          </FormField>
          <FormField label="NIS">
            <input
              type="text"
              value={formData.nis || ''}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="NIS"
            />
          </FormField>
          <FormField label="Numéro de mobile">
            <input
              type="tel"
              value={formData.numero_mobile || ''}
              onChange={(e) => setFormData({ ...formData, numero_mobile: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Numéro de mobile"
            />
          </FormField>
          <FormField label="Numéro de mobile 2">
            <input
              type="tel"
              value={formData.numero_mobile_2 || ''}
              onChange={(e) => setFormData({ ...formData, numero_mobile_2: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Numéro de mobile 2"
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
              }}
              className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
                formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Email"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.email}
              </p>
            )}
          </FormField>
        </>
      )}
    </FormPageLayout>
  );
};

export default ClientFormPage;

