import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { infoAgenceService, logoUploadService, InfoAgence } from '../../services/admin.service';
import { AlertCircle, Upload, X } from 'lucide-react';

// Helper function to construct full URL from logo filename
const constructLogoUrl = (filename: string | null): string | null => {
  if (!filename) return null;
  
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL.replace('/api', '');
    }
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
      return 'http://localhost:5000';
    } else {
      return window.location.origin;
    }
  };
  
  const apiUrl = getApiUrl();
  return `${apiUrl}/uploads/${filename}`;
};

const InfoAgenceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<InfoAgence>>({
    nom_agence: '',
    tel: '',
    email: '',
    adresse: '',
    site_web: '',
    code_iata: '',
    prefix_factures: '',
    fax: '',
    n_licence: '',
    pied_facture: '',
    n_rc: '',
    ar: '',
    nis: '',
    nif: '',
    rib: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isEditing && id) {
        const info = await infoAgenceService.getById(parseInt(id));
        setFormData({
          nom_agence: info.nom_agence || '',
          tel: info.tel || '',
          email: info.email || '',
          adresse: info.adresse || '',
          site_web: info.site_web || '',
          code_iata: info.code_iata || '',
          prefix_factures: info.prefix_factures || '',
          pied_facture: info.pied_facture || '',
          fax: info.fax || '',
          n_licence: info.n_licence || '',
          n_rc: info.n_rc || '',
          ar: info.ar || '',
          nis: info.nis || '',
          nif: info.nif || '',
          rib: info.rib || '',
        });
        if (info.logo && typeof info.logo === 'string') {
          const logoUrl = constructLogoUrl(info.logo);
          setLogoPreview(logoUrl);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/info-agence');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nom_agence || formData.nom_agence.trim().length === 0) {
      errors.nom_agence = 'Le nom de l\'agence est requis';
    }

    if (formData.email && formData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Format d\'email invalide';
      }
    }

    if (formData.site_web && formData.site_web.trim().length > 0) {
      try {
        new URL(formData.site_web);
      } catch {
        errors.site_web = 'Format d\'URL invalide (ex: https://example.com)';
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
      
      // Clean up empty strings - convert to null/undefined for optional fields
      const submitData: any = {
        nom_agence: formData.nom_agence || '',
        tel: formData.tel?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        adresse: formData.adresse?.trim() || undefined,
        site_web: formData.site_web?.trim() || undefined,
        code_iata: formData.code_iata?.trim() || undefined,
        prefix_factures: formData.prefix_factures?.trim() || undefined,
        pied_facture: formData.pied_facture?.trim() || undefined,
        fax: formData.fax?.trim() || undefined,
        n_licence: formData.n_licence?.trim() || undefined,
        n_rc: formData.n_rc?.trim() || undefined,
        ar: formData.ar?.trim() || undefined,
        nis: formData.nis?.trim() || undefined,
        nif: formData.nif?.trim() || undefined,
        rib: formData.rib?.trim() || undefined,
      };
      
      if (logoFile) {
        const uploadResult = await logoUploadService.uploadLogo(logoFile);
        submitData.logo = uploadResult.filename;
      } else if (isEditing && !logoPreview) {
        submitData.logo = null;
      }

      if (isEditing && id) {
        await infoAgenceService.update(parseInt(id), submitData);
        toast.success('Informations mises à jour avec succès');
      } else {
        await infoAgenceService.create(submitData);
        toast.success('Informations créées avec succès');
      }
      navigate('/admin/info-agence');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'opération';
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
      title={isEditing ? 'Modifier les informations de l\'agence' : 'Ajouter les informations de l\'agence'}
      subtitle={isEditing ? 'Modifiez les informations de votre agence' : 'Ajoutez les informations de votre agence'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/info-agence"
    >
      <FormField label="Nom de l'agence" required>
        <input
          type="text"
          value={formData.nom_agence || ''}
          onChange={(e) => {
            setFormData({ ...formData, nom_agence: e.target.value });
            if (formErrors.nom_agence) setFormErrors({ ...formErrors, nom_agence: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.nom_agence ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          required
          placeholder="Nom de l'agence"
        />
        {formErrors.nom_agence && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.nom_agence}
          </p>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Téléphone">
          <input
            type="tel"
            value={formData.tel || ''}
            onChange={(e) => {
              setFormData({ ...formData, tel: e.target.value });
              if (formErrors.tel) setFormErrors({ ...formErrors, tel: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.tel ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Téléphone"
          />
          {formErrors.tel && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.tel}
            </p>
          )}
        </FormField>

        <FormField label="Fax">
          <input
            type="text"
            value={formData.fax || ''}
            onChange={(e) => {
              setFormData({ ...formData, fax: e.target.value });
              if (formErrors.fax) setFormErrors({ ...formErrors, fax: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.fax ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Fax"
          />
          {formErrors.fax && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.fax}
            </p>
          )}
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
            placeholder="email@example.com"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.email}
            </p>
          )}
        </FormField>
      </div>

      <FormField label="Adresse">
        <textarea
          value={formData.adresse || ''}
          onChange={(e) => {
            setFormData({ ...formData, adresse: e.target.value });
            if (formErrors.adresse) setFormErrors({ ...formErrors, adresse: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.adresse ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          rows={2}
          placeholder="Adresse complète"
        />
        {formErrors.adresse && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.adresse}
          </p>
        )}
      </FormField>

      <FormField label="Site web">
        <input
          type="url"
          value={formData.site_web || ''}
          onChange={(e) => {
            setFormData({ ...formData, site_web: e.target.value });
            if (formErrors.site_web) setFormErrors({ ...formErrors, site_web: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.site_web ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="https://example.com"
        />
        {formErrors.site_web && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.site_web}
          </p>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Code IATA">
          <input
            type="text"
            value={formData.code_iata || ''}
            onChange={(e) => {
              setFormData({ ...formData, code_iata: e.target.value });
              if (formErrors.code_iata) setFormErrors({ ...formErrors, code_iata: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.code_iata ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Code IATA"
          />
          {formErrors.code_iata && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.code_iata}
            </p>
          )}
        </FormField>

        <FormField label="Numéro de licence">
          <input
            type="text"
            value={formData.n_licence || ''}
            onChange={(e) => {
              setFormData({ ...formData, n_licence: e.target.value });
              if (formErrors.n_licence) setFormErrors({ ...formErrors, n_licence: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.n_licence ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Numéro de licence"
          />
          {formErrors.n_licence && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.n_licence}
            </p>
          )}
        </FormField>
      </div>

      <FormField label="Logo">
        <div className="space-y-3">
          {logoPreview && typeof logoPreview === 'string' && (
            <div className="relative inline-block">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="max-w-xs max-h-48 object-contain border border-gray-300 rounded-lg p-2 bg-gray-50"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center justify-center px-3 py-1.5 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">
                {logoPreview && typeof logoPreview === 'string' ? 'Changer le logo' : 'Choisir un logo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            {logoPreview && (
              <button
                type="button"
                onClick={removeLogo}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                Supprimer
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, GIF (max 5MB)</p>
          {formErrors.logo && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.logo}
            </p>
          )}
        </div>
      </FormField>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Numéro de RC">
          <input
            type="text"
            value={formData.n_rc || ''}
            onChange={(e) => {
              setFormData({ ...formData, n_rc: e.target.value });
              if (formErrors.n_rc) setFormErrors({ ...formErrors, n_rc: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.n_rc ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Numéro de RC"
          />
          {formErrors.n_rc && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.n_rc}
            </p>
          )}
        </FormField>

        <FormField label="Numéro AR">
          <input
            type="text"
            value={formData.ar || ''}
            onChange={(e) => {
              setFormData({ ...formData, ar: e.target.value });
              if (formErrors.ar) setFormErrors({ ...formErrors, ar: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.ar ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Numéro AR"
          />
          {formErrors.ar && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.ar}
            </p>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="NIS">
          <input
            type="text"
            value={formData.nis || ''}
            onChange={(e) => {
              setFormData({ ...formData, nis: e.target.value });
              if (formErrors.nis) setFormErrors({ ...formErrors, nis: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.nis ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="NIS"
          />
          {formErrors.nis && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.nis}
            </p>
          )}
        </FormField>

        <FormField label="NIF">
          <input
            type="text"
            value={formData.nif || ''}
            onChange={(e) => {
              setFormData({ ...formData, nif: e.target.value });
              if (formErrors.nif) setFormErrors({ ...formErrors, nif: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.nif ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="NIF"
          />
          {formErrors.nif && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.nif}
            </p>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <FormField label="Préfixe factures">
        <input
          type="text"
          value={formData.prefix_factures || ''}
          onChange={(e) => {
            setFormData({ ...formData, prefix_factures: e.target.value });
            if (formErrors.prefix_factures) setFormErrors({ ...formErrors, prefix_factures: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.prefix_factures ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Préfixe pour les factures"
        />
        {formErrors.prefix_factures && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.prefix_factures}
          </p>
        )}
      </FormField>

        <FormField label="RIB">
          <input
            type="text"
            value={formData.rib || ''}
            onChange={(e) => {
              setFormData({ ...formData, rib: e.target.value });
              if (formErrors.rib) setFormErrors({ ...formErrors, rib: '' });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
              formErrors.rib ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="RIB"
          />
          {formErrors.rib && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.rib}
            </p>
          )}
        </FormField>
      </div>


      <FormField label="Pied de facture">
        <textarea
          value={formData.pied_facture || ''}
          onChange={(e) => {
            setFormData({ ...formData, pied_facture: e.target.value });
            if (formErrors.pied_facture) setFormErrors({ ...formErrors, pied_facture: '' });
          }}
          className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${
            formErrors.pied_facture ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Texte à afficher en pied de facture"
        />
        {formErrors.pied_facture && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors.pied_facture}
          </p>
        )}
      </FormField>

    </FormPageLayout>
  );
};

export default InfoAgenceFormPage;

