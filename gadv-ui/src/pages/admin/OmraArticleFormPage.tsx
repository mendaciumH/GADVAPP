import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { articlesService, compagniesAeriennesService, bannerUploadService, Article, Chambre, CompagnieAerienne } from '../../services/admin.service';
import { Upload, X, AlertCircle } from 'lucide-react';
import algeriaAirportsData from '../../assets/data/algeria-airports.json';

// Helper function to construct full URL from banner filename
const constructBannerUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
    return filename;
  }
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

const OmraArticleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [compagniesAeriennes, setCompagniesAeriennes] = useState<CompagnieAerienne[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Article>>({
    label: '',
    description: '',
    image_banner: '',
    date_depart: undefined,
    date_retour: undefined,
    id_type_article: 1, // Always Omra (type 1)
    compagnie_aerienne_id: undefined,
    commission: undefined,
    offre_limitee: false,
    prix_offre: undefined,
    is_archiver: false,
    date: [],
    chambres: [],
    nom_hotel: '',
    distance_hotel: undefined,
    entree: '',
    sortie: '',
    tarif_additionnel: undefined,
    disponibilite: undefined, // Availability for the main date (date_depart)
    type_fly: '',
    ville_depart: '',
  });

  const [sessions, setSessions] = useState<Array<{ date: string; nombre_place: number }>>([{ date: '', nombre_place: 0 }]);
  const [chambres, setChambres] = useState<Array<Chambre | Omit<Chambre, 'id'>>>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const compagniesData = await compagniesAeriennesService.getAll();
      setCompagniesAeriennes(compagniesData || []);

      if (isEditing && id) {
        const article = await articlesService.getById(parseInt(id));
        console.log('Loaded article for editing:', article);
        console.log('Article id_type_article:', article.id_type_article, 'Type:', typeof article.id_type_article);
        // Ensure it's an Omra article - handle both string and number types
        const typeId = typeof article.id_type_article === 'string'
          ? parseInt(article.id_type_article, 10)
          : article.id_type_article;
        console.log('Parsed typeId:', typeId);
        if (typeId !== 1) {
          console.error('Article is not an Omra (typeId:', typeId, 'expected: 1)');
          toast.error('Cet article n\'est pas une Omra');
          navigate('/admin/omra');
          return;
        }
        setFormData({ ...article, id_type_article: 1 });

        // Load sessions if available
        if (article.sessions && Array.isArray(article.sessions) && article.sessions.length > 0) {
          // Identify the main session which corresponds to date_depart
          const dateDepartStr = article.date_depart ? new Date(article.date_depart).toISOString().split('T')[0] : '';

          let mainSessionFound = false;
          let mainDispo: number | undefined = undefined;

          const otherSessions = article.sessions.filter((session: any) => {
            const sessionDate = session.date ? new Date(session.date).toISOString().split('T')[0] : '';
            if (!mainSessionFound && dateDepartStr && sessionDate === dateDepartStr) {
              mainSessionFound = true;
              mainDispo = session.nombre_place;
              return false; // Exclude from sessions list
            }
            return true;
          }).map((session: any) => ({
            date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
            nombre_place: session.nombre_place || 0,
          }));

          setFormData(prev => ({ ...prev, disponibilite: mainDispo }));
          setSessions(otherSessions);
        } else if (article.date_depart) {
          // Fallback: create default session from date_depart (with default places)
          // Since it matches date_depart, it's the main session, so we don't put it in sessions list
          // But we default availability to 1 (or whatever default)
          setFormData(prev => ({ ...prev, disponibilite: 1 }));
          setSessions([]);
        } else {
          setSessions([]);
        }

        // Load chambres
        if (Array.isArray(article.chambres)) {
          setChambres(article.chambres);
        } else {
          setChambres([]);
        }

        if (article.image_banner && typeof article.image_banner === 'string') {
          const bannerUrl = constructBannerUrl(article.image_banner);
          setBannerPreview(bannerUrl);
        }
      }
    } catch (error: any) {
      console.error('Error loading article data:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/omra');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBannerError(null);

    if (file) {
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Veuillez sélectionner un fichier image (JPG, PNG, GIF, WEBP)';
        setBannerError(errorMsg);
        toast.error(errorMsg);
        e.target.value = '';
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      if (file.size > maxSize) {
        const errorMsg = `Fichier trop volumineux ! L'image fait ${fileSizeMB} MB. La taille maximale autorisée est de 5 MB.`;
        setBannerError(errorMsg);
        toast.error(errorMsg);
        e.target.value = '';
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError(null);
    setFormData({ ...formData, image_banner: '' });
  };

  const addTag = (tag: string, tagList: string[], setTagList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (tag.trim() && !tagList.includes(tag.trim())) {
      setTagList([...tagList, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string, tagList: string[], setTagList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  // Handle Enter key to move to next input instead of submitting form
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.key === 'Enter' && e.currentTarget.tagName !== 'TEXTAREA') {
      e.preventDefault();

      // Get all focusable form elements from the form or the closest container
      const form = e.currentTarget.closest('form');
      const container = form || e.currentTarget.closest('[class*="FormPageLayout"]') || document.body;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
      );

      const elementsArray = Array.from(focusableElements);
      const currentIndex = elementsArray.indexOf(e.currentTarget as HTMLElement);

      // Find next focusable element
      if (currentIndex < elementsArray.length - 1) {
        const nextElement = elementsArray[currentIndex + 1];
        nextElement.focus();
        // Prevent any default behavior
        e.stopPropagation();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.label || formData.label.trim() === '') {
        toast.error('Le libellé est requis');
        setIsSubmitting(false);
        return;
      }

      // Clean up form data: remove undefined, null, and empty string values
      const cleanData: any = { ...formData };

      // Ensure label is trimmed
      cleanData.label = cleanData.label.trim();

      // List of numeric fields that should be sent as undefined if empty
      const numericFields = [
        'compagnie_aerienne_id', 'commission', 'prix_offre', 'distance_hotel'
      ];

      // Remove undefined, null, or empty string values for numeric fields
      numericFields.forEach(field => {
        if (cleanData[field] === undefined || cleanData[field] === null || cleanData[field] === '') {
          delete cleanData[field];
        }
      });

      // Clean up string fields - remove empty strings
      const stringFields = ['description', 'nom_hotel', 'entree', 'sortie', 'type_fly', 'ville_depart'];
      stringFields.forEach(field => {
        if (cleanData[field] === '' || cleanData[field] === null) {
          delete cleanData[field];
        }
      });

      // Format date fields - ensure they're in ISO string format or undefined
      if (cleanData.date_depart) {
        cleanData.date_depart = new Date(cleanData.date_depart).toISOString();
      } else {
        delete cleanData.date_depart;
      }

      if (cleanData.date_retour) {
        cleanData.date_retour = new Date(cleanData.date_retour).toISOString();
      } else {
        delete cleanData.date_retour;
      }

      // Prepare sessions data (optional - backend will create default if empty)
      const sessionsData: any[] = [];

      // Add main session if date_depart is set
      // If "Offre limitée" is check, use the entered availability.
      // If NOT checked, what implies "unlimited"? Currently backend needs a number. 
      // If unchecked, maybe we default to a high number or 1? 
      // The prompt says "if Offre limitée is checked show input ... and add value".
      // If unchecked, we'll assume default behavior (1 place or standard), or maybe we should pass undefined?
      // But sessions table needs a number. Let's use the formData.disponibilite if set, or 1/50 default.
      // Actually, if 'offre_limitee' is false, logic might differ, but for NOW, let's just make sure
      // we respect the user flow: Main session comes from date_depart + Main Availability Input.

      if (cleanData.date_depart) {
        // Determine availability for main session
        // If offre_limitee is TRUE, use formData.disponibilite (default 0 if empty)
        // If offre_limitee is FALSE, currently we don't show input. 
        // We'll trust whatever is in formData.disponibilite or default to say 999 if "unlimited"? 
        // Or just 1. Let's stick to using formData.disponibilite if present.
        // If unlimited is UNCHECKED, the user likely assumes unlimited. 
        // But let's just send what we have.

        const mainPlaces = formData.offre_limitee && formData.disponibilite ? formData.disponibilite : (formData.disponibilite || 50);

        sessionsData.push({
          date: cleanData.date_depart.split('T')[0],
          nombre_place: mainPlaces
        });
      }

      const otherSessions = sessions
        .filter(s => s.date && s.nombre_place > 0)
        .map(s => ({
          date: s.date, // Already in YYYY-MM-DD format from date input
          nombre_place: s.nombre_place,
        }));

      sessionsData.push(...otherSessions);

      const submitData: any = {
        ...cleanData,
        id_type_article: 1, // Always Omra (ensure it's a number)
        sessions: sessionsData.length > 0 ? sessionsData : undefined, // Optional - backend will create default
        chambres: chambres.length > 0 ? chambres : undefined,
      };

      console.log('Submitting with sessions:', sessionsData);

      // Ensure id_type_article is a number
      if (submitData.id_type_article) {
        submitData.id_type_article = typeof submitData.id_type_article === 'string'
          ? parseInt(submitData.id_type_article, 10)
          : submitData.id_type_article;
      }

      if (bannerFile) {
        const uploadResult = await bannerUploadService.uploadBanner(bannerFile);
        if (!uploadResult || !uploadResult.filename) {
          throw new Error('Upload failed: No filename returned from server');
        }
        submitData.image_banner = uploadResult.filename;
      } else if (isEditing && !bannerPreview && formData.image_banner) {
        // Banner was removed - set to null/undefined instead of empty string
        submitData.image_banner = null;
      } else if (!bannerFile && !bannerPreview && formData.image_banner) {
        // Keep existing banner
        submitData.image_banner = formData.image_banner;
      } else if (isEditing && formData.image_banner && bannerPreview) {
        // Keep existing banner
        submitData.image_banner = formData.image_banner;
      } else if (!isEditing && !bannerFile) {
        // New article without banner
        submitData.image_banner = null;
      }

      // Remove image_banner if it's an empty string
      if (submitData.image_banner === '') {
        delete submitData.image_banner;
      }

      // Remove fields that shouldn't be sent in update
      const fieldsToRemove = [
        'id',
        'created_at',
        'updated_at',
        'fournisseur',
        'typeArticle',
        'compagnieAerienne',
        'compagnie_aerienne', // Alternative name
        'disponibilite', // Transient field
      ];

      fieldsToRemove.forEach(field => {
        delete submitData[field];
      });

      // Convert numeric fields from string to number if needed
      const numericFieldsToConvert = [
        'compagnie_aerienne_id',
        'commission',
        'prix_offre',
        'distance_hotel',
        'fournisseur_id',
        'tarif_additionnel',
        // 'disponibilite' is transient, handled below
      ];

      numericFieldsToConvert.forEach(field => {
        if (submitData[field] !== undefined && submitData[field] !== null && submitData[field] !== '') {
          submitData[field] = typeof submitData[field] === 'string'
            ? parseFloat(submitData[field])
            : submitData[field];
        }
      });

      // Remove null and undefined values to avoid sending them
      // Also remove empty strings for optional fields
      const cleanedSubmitData: any = {};
      Object.keys(submitData).forEach(key => {
        const value = submitData[key];
        // Only include non-null, non-undefined, non-empty-string values
        if (value !== undefined && value !== null && value !== '') {
          cleanedSubmitData[key] = value;
        }
      });

      console.log('Submitting data:', JSON.stringify(cleanedSubmitData, null, 2));

      if (isEditing && id) {
        console.log('Updating article with ID:', id);
        await articlesService.update(parseInt(id), cleanedSubmitData);
        toast.success('Omra mise à jour avec succès');
      } else {
        await articlesService.create(cleanedSubmitData);
        toast.success('Omra créée avec succès');
      }
      navigate('/admin/omra');
    } catch (error: any) {
      console.error('Error submitting article:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);

      // Handle validation errors from backend
      if (error.response?.data) {
        const errorData = error.response.data;

        // Check for validation error messages
        if (errorData.message) {
          const messages = errorData.message;

          // If message is an array of validation errors
          if (Array.isArray(messages)) {
            const errorMessages = messages.map((msg: any) => {
              if (typeof msg === 'string') return msg;
              if (msg.message) return msg.message;
              return JSON.stringify(msg);
            });
            toast.error(errorMessages.join(', '));
          } else {
            toast.error(messages);
          }
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          console.error('Full error response:', JSON.stringify(errorData, null, 2));
          toast.error('Erreur lors de l\'opération. Vérifiez la console pour plus de détails.');
        }
      } else {
        toast.error('Erreur lors de l\'opération');
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
      title={isEditing ? 'Modifier l\'Omra' : 'Nouvelle Omra'}
      subtitle={isEditing ? 'Modifiez les informations de l\'Omra' : 'Créez une nouvelle Omra'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/omra"
    >
      {/* Date de départ */}
      <FormField label="Date de départ">
        <input
          type="datetime-local"
          value={formData.date_depart
            ? new Date(formData.date_depart).toISOString().slice(0, 16)
            : ''}
          onChange={(e) => setFormData({ ...formData, date_depart: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </FormField>

      {/* Date de retour */}
      <FormField label="Date de retour">
        <input
          type="datetime-local"
          value={formData.date_retour
            ? new Date(formData.date_retour).toISOString().slice(0, 16)
            : ''}
          onChange={(e) => setFormData({ ...formData, date_retour: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </FormField>

      {/* Libellé */}
      <FormField label="Libellé" required>
        <input
          type="text"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
        />
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          rows={4}
        />
      </FormField>



      {/* Compagnie Aérienne */}
      <FormField label="Compagnie Aérienne">
        <select
          value={formData.compagnie_aerienne_id || ''}
          onChange={(e) => setFormData({ ...formData, compagnie_aerienne_id: e.target.value ? parseInt(e.target.value) : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Sélectionner une compagnie aérienne</option>
          {compagniesAeriennes.map((compagnie) => (
            <option key={compagnie.id} value={compagnie.id}>
              {compagnie.nom} {compagnie.code_iata ? `(${compagnie.code_iata})` : ''}
            </option>
          ))}
        </select>
      </FormField>

      {/* Ville de départ */}
      <FormField label="Ville de départ">
        <select
          value={formData.ville_depart || ''}
          onChange={(e) => setFormData({ ...formData, ville_depart: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Sélectionner un aéroport</option>
          {algeriaAirportsData.map((airport) => (
            <option key={airport.code} value={`${airport.city} - ${airport.name}`}>
              {airport.city} - {airport.name} ({airport.code})
            </option>
          ))}
        </select>
      </FormField>

      {/* Type de vol */}
      <FormField label="Type de vol">
        <select
          value={formData.type_fly || ''}
          onChange={(e) => setFormData({ ...formData, type_fly: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Sélectionner le type de vol</option>
          <option value="direct">Vol Direct</option>
          <option value="avec_escale">Vol avec escale</option>
        </select>
      </FormField>

      {/* Ville d'entrée */}
      <FormField label="Ville d'entrée">
        <input
          type="text"
          value={formData.entree || ''}
          onChange={(e) => setFormData({ ...formData, entree: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Ex: Jeddah"
        />
      </FormField>

      {/* Ville de sortie */}
      <FormField label="Ville de sortie">
        <input
          type="text"
          value={formData.sortie || ''}
          onChange={(e) => setFormData({ ...formData, sortie: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Ex: Medina"
        />
      </FormField>




      {/* Omra-specific fields */}
      <FormField label="Nom de l'hôtel">
        <input
          type="text"
          value={formData.nom_hotel || ''}
          onChange={(e) => setFormData({ ...formData, nom_hotel: e.target.value })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Nom de l'hôtel"
        />
      </FormField>

      {/* Distance de l'hôtel */}
      <FormField label="Distance de l'hôtel (mètres)">
        <input
          type="number"
          value={formData.distance_hotel || ''}
          onChange={(e) => setFormData({ ...formData, distance_hotel: e.target.value ? parseInt(e.target.value) : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Distance en mètres du Haram"
          min="0"
        />
      </FormField>

      <FormField label="Autre dates de départ disponibles">
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={session.date}
                    onChange={(e) => {
                      const newSessions = [...sessions];
                      newSessions[index].date = e.target.value;
                      setSessions(newSessions);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                  <input
                    type="number"
                    min="1"
                    value={session.nombre_place || ''}
                    onChange={(e) => {
                      const newSessions = [...sessions];
                      newSessions[index].nombre_place = parseInt(e.target.value) || 0;
                      setSessions(newSessions);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Nombre de places"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSessions(sessions.filter((_, i) => i !== index));
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setSessions([...sessions, { date: '', nombre_place: 0 }]);
            }}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Ajouter une date de départ
          </button>

          {sessions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              Aucune date de départ. Cliquez sur "Ajouter une date de départ" pour commencer.
            </p>
          )}
        </div>
      </FormField>

      <FormField label="Chambres et tarifs">
        <div className="space-y-3">
          {/* List of room types with prices */}
          {chambres.map((chambre, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <span className="font-medium text-gray-700">{chambre.type_chambre}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={chambre.prix}
                  onChange={(e) => {
                    const newChambres = [...chambres];
                    newChambres[index].prix = parseFloat(e.target.value) || 0;
                    setChambres(newChambres);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-right"
                  placeholder="0"
                  min="0"
                />
                <span className="text-gray-600 text-sm">DZD</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChambres(chambres.filter((_, i) => i !== index));
                }}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add new room type */}
          <div className="flex items-center gap-2">
            <select
              id="newChambreType"
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              defaultValue=""
            >
              <option value="" disabled>Sélectionner un type de chambre</option>
              {['Single', 'Double', 'Triple', 'Quadruple', 'Quintuple'].filter(
                type => !chambres.some(c => c.type_chambre === type)
              ).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const select = document.getElementById('newChambreType') as HTMLSelectElement;
                const type = select.value;
                if (type && !chambres.some(c => c.type_chambre === type)) {
                  setChambres([...chambres, { type_chambre: type, prix: 0 }]);
                  select.value = '';
                }
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ajouter
            </button>
          </div>
          <p className="text-xs text-gray-500">Ajoutez les types de chambres disponibles avec leurs prix respectifs</p>
        </div>
      </FormField>

      {/* Tarif Additionnel */}
      <FormField label="Tarif Additionnel">
        <input
          type="number"
          step="0.01"
          value={formData.tarif_additionnel || ''}
          onChange={(e) => setFormData({ ...formData, tarif_additionnel: e.target.value ? parseFloat(e.target.value) : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="0.00"
          min="0"
        />
      </FormField>

      {/* Image Banner */}
      <FormField label="Image Bannière">
        <div className="space-y-3">
          {bannerPreview && typeof bannerPreview === 'string' && (
            <div className="relative inline-block">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="max-w-full h-48 object-cover border border-gray-300 rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={removeBanner}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {!bannerPreview && (
            <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors">
              <label className="flex flex-col items-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Cliquez pour télécharger ou glissez-déposez</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP (max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {bannerError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{bannerError}</span>
            </div>
          )}
        </div>
      </FormField>

      {/* Archivé */}
      <FormField label="Archivé">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_archiver || false}
            onChange={(e) => setFormData({ ...formData, is_archiver: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Marquer comme archivé</span>
        </label>
      </FormField>

      {/* Prix de l'offre (alone) */}
      <FormField label="Prix de l'offre">
        <input
          type="number"
          step="0.01"
          value={formData.prix_offre || ''}
          onChange={(e) => setFormData({ ...formData, prix_offre: e.target.value ? parseFloat(e.target.value) : undefined })}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="0.00"
        />
      </FormField>

      {/* Offre limitée */}
      <FormField label="Offre limitée">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={formData.offre_limitee || false}
            onChange={(e) => setFormData({ ...formData, offre_limitee: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Marquer comme offre limitée</span>
        </label>

        {formData.offre_limitee && (
          <div className="mt-3 pl-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disponibilité (pour la date de départ principale)
            </label>
            <input
              type="number"
              min="1"
              value={formData.disponibilite || ''}
              onChange={(e) => setFormData({ ...formData, disponibilite: parseInt(e.target.value) || undefined })}
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Nombre de places"
            />
          </div>
        )}
      </FormField>

    </FormPageLayout>
  );
};

export default OmraArticleFormPage;

