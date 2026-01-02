import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { usersService, rolesService, User, Role } from '../../services/admin.service';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    motdepasse: '',
    role_id: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const rolesData = await rolesService.getAll();
      setRoles(rolesData || []);

      if (isEditing && id) {
        const user = await usersService.getById(parseInt(id));
        setFormData({
          username: user.username,
          email: user.email || '',
          motdepasse: '',
          role_id: user.role_id?.toString() || '',
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!isEditing && !formData.motdepasse) {
      errors.motdepasse = 'Le mot de passe est requis';
    } else if (formData.motdepasse && formData.motdepasse.length < 6) {
      errors.motdepasse = 'Le mot de passe doit contenir au moins 6 caractères';
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
      const submitData: any = {
        username: formData.username.trim(),
        email: formData.email.trim() || null,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
      };
      
      if (formData.motdepasse) {
        submitData.motdepasse = formData.motdepasse;
      }
      
      if (isEditing && id) {
        await usersService.update(parseInt(id), submitData);
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await usersService.create(submitData);
        toast.success('Utilisateur créé avec succès');
      }
      navigate('/admin/users');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'opération';
      toast.error(errorMessage);
      
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
      title={isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      subtitle={isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/users"
    >
      <FormField label="Nom d'utilisateur" required>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => {
            setFormData({ ...formData, username: e.target.value });
            if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.username ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          required
          placeholder="Entrez le nom d'utilisateur"
        />
        {formErrors.username && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.username}
          </p>
        )}
      </FormField>

      <FormField label="Email">
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="utilisateur@example.com (optionnel)"
        />
        {formErrors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.email}
          </p>
        )}
      </FormField>

      <FormField 
        label={isEditing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} 
        required={!isEditing}
      >
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.motdepasse}
            onChange={(e) => {
              setFormData({ ...formData, motdepasse: e.target.value });
              if (formErrors.motdepasse) setFormErrors({ ...formErrors, motdepasse: '' });
            }}
            className={`w-full px-3 py-1.5 pr-10 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.motdepasse ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            required={!isEditing}
            placeholder={isEditing ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formErrors.motdepasse && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.motdepasse}
          </p>
        )}
        {!isEditing && !formErrors.motdepasse && (
          <p className="mt-1 text-xs text-gray-500">Le mot de passe doit contenir au moins 6 caractères</p>
        )}
      </FormField>

      <FormField label="Rôle">
        <select
          value={formData.role_id}
          onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          disabled={loading}
        >
          <option value="">
            {loading ? 'Chargement des rôles...' : roles.length === 0 ? 'Aucun rôle disponible' : 'Sélectionner un rôle'}
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {roles.length === 0 && !loading && (
          <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Aucun rôle disponible. Veuillez créer des rôles dans la section Rôles.
          </p>
        )}
      </FormField>
    </FormPageLayout>
  );
};

export default UserFormPage;

