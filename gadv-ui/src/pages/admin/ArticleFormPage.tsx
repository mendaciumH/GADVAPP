import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { articlesService, typeArticleService, fournisseursService, compagniesAeriennesService, bannerUploadService, Article, TypeArticle, Fournisseur, CompagnieAerienne, Chambre } from '../../services/admin.service';
import { Upload, X, AlertCircle } from 'lucide-react';
import countriesData from '../../assets/data/countries.json';
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

const ArticleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [types, setTypes] = useState<TypeArticle[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
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
    id_type_article: undefined,
    fournisseur_id: undefined,
    commission: undefined,
    offre_limitee: false,
    disponibilite: undefined,
    prix_offre: undefined,
    is_archiver: false,
    date: [],
    chambres: [],
    nom_hotel: '',
    pays_destination: '',
    type_visa: '',
    duree_validite: '',
    delai_traitement: '',
    documents_requis: [],
    destination: '',
    date_retour: undefined,
    duree_voyage: '',
    type_hebergement: '',
    transport: '',
    programme: [],
    type_assurance: '',
    duree_couverture: '',
    zone_couverture: '',
    montant_couverture: '',
    franchise: '',
    conditions_particulieres: [],
    aeroport_depart: '',
    aeroport_arrivee: '',
    date_depart_vol: undefined,
    date_retour_vol: undefined,
    compagnie_aerienne_id: undefined,
    numero_vol: '',
    classe_vol: '',
    escales: [],
    ville_depart: '',
    // Réservation hôtels fields
    date_check_in: undefined,
    date_check_out: undefined,
    nombre_nuits: undefined,
    nombre_chambres: undefined,
    nombre_personnes: undefined,
    type_chambre: '',
    services_hotel: [],
    adresse_hotel: '',
    ville_hotel: '',
    pays_hotel: '',
  });

  const [dateTags, setDateTags] = useState<string[]>([]);
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [documentsTags, setDocumentsTags] = useState<string[]>([]);
  const [programmeTags, setProgrammeTags] = useState<string[]>([]);
  const [conditionsTags, setConditionsTags] = useState<string[]>([]);
  const [escalesTags, setEscalesTags] = useState<string[]>([]);
  const [servicesHotelTags, setServicesHotelTags] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesData, fournisseursData, compagniesAeriennesData] = await Promise.all([
        typeArticleService.getAll(),
        fournisseursService.getAll(),
        compagniesAeriennesService.getAll(),
      ]);
      setTypes(typesData || []);
      setFournisseurs(fournisseursData || []);
      setCompagniesAeriennes(compagniesAeriennesData || []);

      if (isEditing && id) {
        const article = await articlesService.getById(parseInt(id));
        setFormData(article);
        setDateTags(Array.isArray(article.date) ? article.date : article.date ? [article.date] : []);
        // Load chambres
        if (Array.isArray(article.chambres)) {
          setChambres(article.chambres);
        } else {
          setChambres([]);
        }
        setDocumentsTags(Array.isArray(article.documents_requis) ? article.documents_requis : article.documents_requis ? [article.documents_requis] : []);
        setProgrammeTags(Array.isArray(article.programme) ? article.programme : article.programme ? [article.programme] : []);
        setConditionsTags(Array.isArray(article.conditions_particulieres) ? article.conditions_particulieres : article.conditions_particulieres ? [article.conditions_particulieres] : []);
        setEscalesTags(Array.isArray(article.escales) ? article.escales : article.escales ? [article.escales] : []);
        setServicesHotelTags(Array.isArray(article.services_hotel) ? article.services_hotel : article.services_hotel ? [article.services_hotel] : []);

        if (article.image_banner && typeof article.image_banner === 'string') {
          const bannerUrl = constructBannerUrl(article.image_banner);
          setBannerPreview(bannerUrl);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/articles');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Clean up form data: remove undefined, null, and empty string values for numeric fields
      const cleanData: any = { ...formData };

      // List of numeric fields that should be sent as undefined if empty
      const numericFields = [
        'id_type_article', 'fournisseur_id', 'commission', 'disponibilite',
        'prix_offre', 'compagnie_aerienne_id', 'nombre_nuits', 'nombre_chambres', 'nombre_personnes'
      ];

      // Remove undefined, null, or empty string values for numeric fields
      numericFields.forEach(field => {
        if (cleanData[field] === undefined || cleanData[field] === null || cleanData[field] === '') {
          delete cleanData[field];
        }
      });

      const submitData: any = {
        ...cleanData,
        date: dateTags.length > 0 ? dateTags : undefined,
        chambres: chambres.length > 0 ? chambres : undefined,
        documents_requis: documentsTags.length > 0 ? documentsTags : undefined,
        programme: programmeTags.length > 0 ? programmeTags : undefined,
        conditions_particulieres: conditionsTags.length > 0 ? conditionsTags : undefined,
        escales: escalesTags.length > 0 ? escalesTags : undefined,
        services_hotel: servicesHotelTags.length > 0 ? servicesHotelTags : undefined,
        // Reservation hotel fields
        date_check_in: formData.date_check_in,
        date_check_out: formData.date_check_out,
        nombre_nuits: formData.nombre_nuits,
        nombre_chambres: formData.nombre_chambres,
        nombre_personnes: formData.nombre_personnes,
        type_chambre: formData.type_chambre,
        adresse_hotel: formData.adresse_hotel,
        ville_hotel: formData.ville_hotel,
        pays_hotel: formData.pays_hotel,
      };

      if (bannerFile) {
        const uploadResult = await bannerUploadService.uploadBanner(bannerFile);
        if (!uploadResult || !uploadResult.filename) {
          throw new Error('Upload failed: No filename returned from server');
        }
        submitData.image_banner = uploadResult.filename;
      } else if (isEditing && !bannerPreview && formData.image_banner) {
        submitData.image_banner = '';
      } else if (!bannerFile && !bannerPreview && formData.image_banner) {
        submitData.image_banner = formData.image_banner;
      } else if (isEditing && formData.image_banner && bannerPreview) {
        submitData.image_banner = formData.image_banner;
      } else if (!isEditing && !bannerFile) {
        submitData.image_banner = null;
      }

      if (isEditing && id) {
        await articlesService.update(parseInt(id), submitData);
        toast.success('Service mis à jour avec succès');
      } else {
        await articlesService.create(submitData);
        toast.success('Service créé avec succès');
      }
      navigate('/admin/articles');
    } catch (error: any) {
      console.error('Error submitting article:', error);

      // Handle validation errors from backend
      if (error.response?.data?.message) {
        const messages = error.response.data.message;

        // If message is an array of validation errors
        if (Array.isArray(messages)) {
          toast.error(messages.join(', '));
        } else {
          toast.error(messages);
        }
      } else {
        toast.error('Erreur lors de l\'opération');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const typeId = Number(formData.id_type_article);
  const isOmra = typeId === 1;
  const isVoyageOrganise = typeId === 2;
  const isBilletAvion = typeId === 3;
  const isDemandeVisa = typeId === 4;
  const isAssuranceVoyage = typeId === 5;
  const isReservationHotel = typeId === 6;

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
      title={isEditing ? 'Modifier le service' : 'Nouveau service'}
      subtitle={isEditing ? 'Modifiez les informations du service' : 'Créez un nouveau service'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/articles"
    >
      {/* Type de service */}
      <FormField label="Type de service" required>
        <select
          value={formData.id_type_article || ''}
          onChange={(e) => {
            const newTypeId = e.target.value ? parseInt(e.target.value) : undefined;
            setFormData({ ...formData, id_type_article: newTypeId });
            if (newTypeId !== formData.id_type_article) {
              setDateTags([]);
              setChambres([]);
              setDocumentsTags([]);
              setProgrammeTags([]);
              setConditionsTags([]);
              setEscalesTags([]);
              setServicesHotelTags([]);
            }
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
        >
          <option value="">Sélectionner un type</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.description}
            </option>
          ))}
        </select>
      </FormField>

      {/* Date de départ - Not for Reservation Hotel */}
      {!isReservationHotel && (
        <FormField label="Date de départ">
          <input
            type="datetime-local"
            value={formData.date_depart
              ? new Date(formData.date_depart).toISOString().slice(0, 16)
              : ''}
            onChange={(e) => setFormData({ ...formData, date_depart: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>
      )}

      {/* Libellé */}
      <FormField label="Libellé" required>
        <input
          type="text"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
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
          rows={3}
        />
      </FormField>

      {/* Image Banner - Not for Reservation Hotel */}
      {!isReservationHotel && (
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
            <div className="flex items-center gap-3">
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-5 h-5 mr-2 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {bannerPreview && typeof bannerPreview === 'string' ? 'Changer l\'image' : 'Choisir une image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
              {bannerPreview && (
                <button
                  type="button"
                  onClick={removeBanner}
                  className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            {bannerError && (
              <div className="mt-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{bannerError}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Formats acceptés: JPG, PNG, GIF, WEBP (max 5MB)</p>
          </div>
        </FormField>
      )}

      {/* Fournisseur - Not for Reservation Hotel */}
      {!isReservationHotel && (
        <FormField label="Fournisseur">
          <select
            value={formData.fournisseur_id || ''}
            onChange={(e) => setFormData({ ...formData, fournisseur_id: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="">-</option>
            {fournisseurs.map((fournisseur) => (
              <option key={fournisseur.id} value={fournisseur.id}>
                {fournisseur.nom_complet}
              </option>
            ))}
          </select>
        </FormField>
      )}

      {/* Ville de départ - Not for Reservation Hotel */}
      {!isReservationHotel && (
        <FormField label="Ville de départ">
          <select
            value={formData.ville_depart || ''}
            onChange={(e) => setFormData({ ...formData, ville_depart: e.target.value })}
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
      )}

      {/* Omra-specific fields */}
      {isOmra && (
        <>
          <FormField label="Nom de l'hôtel">
            <input
              type="text"
              value={formData.nom_hotel || ''}
              onChange={(e) => setFormData({ ...formData, nom_hotel: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Nom de l'hôtel"
            />
          </FormField>

          <FormField label="Dates de départ disponibles">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {dateTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, dateTags, setDateTags)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter une date (ex: 15/01/2025)"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, dateTags, setDateTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, dateTags, setDateTags);
                    e.target.value = '';
                  }
                }}
              />
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
                      className="w-32 px-2.5 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-right"
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
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Ajouter
                </button>
              </div>
              <p className="text-xs text-gray-500">Ajoutez les types de chambres disponibles avec leurs prix respectifs</p>
            </div>
          </FormField>
        </>
      )}

      {/* Demande Visa-specific fields */}
      {isDemandeVisa && (
        <>
          <FormField label="Pays de destination">
            <input
              type="text"
              value={formData.pays_destination || ''}
              onChange={(e) => setFormData({ ...formData, pays_destination: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Pays de destination"
            />
          </FormField>

          <FormField label="Type de visa">
            <select
              value={formData.type_visa || ''}
              onChange={(e) => setFormData({ ...formData, type_visa: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner un type</option>
              <option value="Touristique">Touristique</option>
              <option value="Affaires">Affaires</option>
              <option value="Transit">Transit</option>
              <option value="Etudes">Etudes</option>
              <option value="Travail">Travail</option>
              <option value="Famille">Famille</option>
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Durée de validité">
              <input
                type="text"
                value={formData.duree_validite || ''}
                onChange={(e) => setFormData({ ...formData, duree_validite: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: 30 jours, 90 jours, 1 an"
              />
            </FormField>

            <FormField label="Délai de traitement">
              <input
                type="text"
                value={formData.delai_traitement || ''}
                onChange={(e) => setFormData({ ...formData, delai_traitement: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: 5-10 jours ouvrables"
              />
            </FormField>
          </div>

          <FormField label="Documents requis">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {documentsTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, documentsTags, setDocumentsTags)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter un document"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, documentsTags, setDocumentsTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, documentsTags, setDocumentsTags);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </FormField>
        </>
      )}

      {/* Voyage organisé-specific fields */}
      {isVoyageOrganise && (
        <>
          <FormField label="Destination">
            <select
              value={formData.destination || ''}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner un pays</option>
              {countriesData.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date de retour">
            <input
              type="datetime-local"
              value={formData.date_retour
                ? new Date(formData.date_retour).toISOString().slice(0, 16)
                : ''}
              onChange={(e) => setFormData({ ...formData, date_retour: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Durée du voyage">
              <input
                type="text"
                value={formData.duree_voyage || ''}
                onChange={(e) => setFormData({ ...formData, duree_voyage: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: 7 jours / 6 nuits"
              />
            </FormField>

            <FormField label="Type d'hébergement">
              <select
                value={formData.type_hebergement || ''}
                onChange={(e) => setFormData({ ...formData, type_hebergement: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Sélectionner un type</option>
                <option value="Hôtel 3 étoiles">Hôtel 3 étoiles</option>
                <option value="Hôtel 4 étoiles">Hôtel 4 étoiles</option>
                <option value="Hôtel 5 étoiles">Hôtel 5 étoiles</option>
                <option value="Résidence">Résidence</option>
                <option value="Appartement">Appartement</option>
                <option value="Villa">Villa</option>
                <option value="Auberge">Auberge</option>
              </select>
            </FormField>
          </div>

          <FormField label="Transport">
            <select
              value={formData.transport || ''}
              onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner un moyen de transport</option>
              <option value="Avion">Avion</option>
              <option value="Bus">Bus</option>
              <option value="Train">Train</option>
              <option value="Voiture">Voiture</option>
              <option value="Bateau">Bateau</option>
              <option value="Combiné">Combiné</option>
            </select>
          </FormField>

          <FormField label="Programme">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {programmeTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, programmeTags, setProgrammeTags)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter un élément au programme"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, programmeTags, setProgrammeTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, programmeTags, setProgrammeTags);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </FormField>
        </>
      )}

      {/* Assurance voyage-specific fields */}
      {isAssuranceVoyage && (
        <>
          <FormField label="Type d'assurance">
            <select
              value={formData.type_assurance || ''}
              onChange={(e) => setFormData({ ...formData, type_assurance: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner un type</option>
              <option value="Médicale">Médicale</option>
              <option value="Annulation">Annulation</option>
              <option value="Bagages">Bagages</option>
              <option value="Rapatriement">Rapatriement</option>
              <option value="Responsabilité civile">Responsabilité civile</option>
              <option value="Combinée">Combinée</option>
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Durée de couverture">
              <input
                type="text"
                value={formData.duree_couverture || ''}
                onChange={(e) => setFormData({ ...formData, duree_couverture: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: 30 jours, 1 an"
              />
            </FormField>

            <FormField label="Zone de couverture">
              <input
                type="text"
                value={formData.zone_couverture || ''}
                onChange={(e) => setFormData({ ...formData, zone_couverture: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: Europe, Monde, Schengen"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Montant de couverture">
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-700">
                  DZD
                </span>
                <input
                  type="text"
                  value={formData.montant_couverture || ''}
                  onChange={(e) => setFormData({ ...formData, montant_couverture: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Montant de couverture"
                />
              </div>
            </FormField>

            <FormField label="Franchise">
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-700">
                  DZD
                </span>
                <input
                  type="text"
                  value={formData.franchise || ''}
                  onChange={(e) => setFormData({ ...formData, franchise: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Franchise"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Conditions particulières">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {conditionsTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, conditionsTags, setConditionsTags)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter une condition"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, conditionsTags, setConditionsTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, conditionsTags, setConditionsTags);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </FormField>
        </>
      )}

      {/* Billet d'avion-specific fields */}
      {isBilletAvion && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Aéroport de départ">
              <input
                type="text"
                value={formData.aeroport_depart || ''}
                onChange={(e) => setFormData({ ...formData, aeroport_depart: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: Alger (ALG)"
              />
            </FormField>
            <FormField label="Aéroport d'arrivée">
              <input
                type="text"
                value={formData.aeroport_arrivee || ''}
                onChange={(e) => setFormData({ ...formData, aeroport_arrivee: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: Paris (CDG)"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Date de départ du vol">
              <input
                type="datetime-local"
                value={formData.date_depart_vol
                  ? new Date(formData.date_depart_vol).toISOString().slice(0, 16)
                  : ''}
                onChange={(e) => setFormData({ ...formData, date_depart_vol: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </FormField>
            <FormField label="Date de retour du vol (optionnel)">
              <input
                type="datetime-local"
                value={formData.date_retour_vol
                  ? new Date(formData.date_retour_vol).toISOString().slice(0, 16)
                  : ''}
                onChange={(e) => setFormData({ ...formData, date_retour_vol: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </FormField>
          </div>

          <FormField label="Compagnie aérienne">
            <select
              value={formData.compagnie_aerienne_id || ''}
              onChange={(e) => setFormData({ ...formData, compagnie_aerienne_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner une compagnie</option>
              {compagniesAeriennes.map((compagnie) => (
                <option key={compagnie.id} value={compagnie.id}>
                  {compagnie.nom} {compagnie.code_iata ? `(${compagnie.code_iata})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Numéro de vol">
              <input
                type="text"
                value={formData.numero_vol || ''}
                onChange={(e) => setFormData({ ...formData, numero_vol: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: AH1001"
              />
            </FormField>
            <FormField label="Classe de vol">
              <select
                value={formData.classe_vol || ''}
                onChange={(e) => setFormData({ ...formData, classe_vol: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Sélectionner une classe</option>
                <option value="Économique">Économique</option>
                <option value="Affaires">Affaires</option>
                <option value="Première">Première</option>
              </select>
            </FormField>
          </div>

          <FormField label="Escales">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {escalesTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, escalesTags, setEscalesTags)}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter une escale (ex: Rome)"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, escalesTags, setEscalesTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, escalesTags, setEscalesTags);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </FormField>
        </>
      )}

      {/* Réservation hôtels-specific fields */}
      {isReservationHotel && (
        <>
          <FormField label="Nom de l'hôtel">
            <input
              type="text"
              value={formData.nom_hotel || ''}
              onChange={(e) => setFormData({ ...formData, nom_hotel: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Nom de l'hôtel"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Date d'arrivée (Check-in)">
              <input
                type="datetime-local"
                value={formData.date_check_in
                  ? new Date(formData.date_check_in).toISOString().slice(0, 16)
                  : ''}
                onChange={(e) => setFormData({ ...formData, date_check_in: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </FormField>

            <FormField label="Date de départ (Check-out)">
              <input
                type="datetime-local"
                value={formData.date_check_out
                  ? new Date(formData.date_check_out).toISOString().slice(0, 16)
                  : ''}
                onChange={(e) => setFormData({ ...formData, date_check_out: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <FormField label="Nombre de nuits">
              <input
                type="number"
                step="1"
                min="1"
                value={formData.nombre_nuits || ''}
                onChange={(e) => setFormData({ ...formData, nombre_nuits: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Nombre de nuits"
              />
            </FormField>

            <FormField label="Nombre de chambres">
              <input
                type="number"
                step="1"
                min="1"
                value={formData.nombre_chambres || ''}
                onChange={(e) => setFormData({ ...formData, nombre_chambres: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Nombre de chambres"
              />
            </FormField>

            <FormField label="Nombre de personnes">
              <input
                type="number"
                step="1"
                min="1"
                value={formData.nombre_personnes || ''}
                onChange={(e) => setFormData({ ...formData, nombre_personnes: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Nombre de personnes"
              />
            </FormField>
          </div>

          <FormField label="Type de chambre">
            <select
              value={formData.type_chambre || ''}
              onChange={(e) => setFormData({ ...formData, type_chambre: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner un type</option>
              <option value="Chambre simple">Chambre simple</option>
              <option value="Chambre double">Chambre double</option>
              <option value="Chambre triple">Chambre triple</option>
              <option value="Suite">Suite</option>
              <option value="Suite junior">Suite junior</option>
              <option value="Suite présidentielle">Suite présidentielle</option>
              <option value="Appartement">Appartement</option>
              <option value="Villa">Villa</option>
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Ville">
              <input
                type="text"
                value={formData.ville_hotel || ''}
                onChange={(e) => setFormData({ ...formData, ville_hotel: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ville de l'hôtel"
              />
            </FormField>

            <FormField label="Pays">
              <select
                value={formData.pays_hotel || ''}
                onChange={(e) => setFormData({ ...formData, pays_hotel: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Sélectionner un pays</option>
                {countriesData.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Adresse de l'hôtel">
            <input
              type="text"
              value={formData.adresse_hotel || ''}
              onChange={(e) => setFormData({ ...formData, adresse_hotel: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Adresse complète de l'hôtel"
            />
          </FormField>

          <FormField label="Services de l'hôtel">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {servicesHotelTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag, servicesHotelTags, setServicesHotelTags)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ajouter un service (ex: WiFi, Piscine, Spa, Parking)"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value, servicesHotelTags, setServicesHotelTags);
                    e.currentTarget.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value, servicesHotelTags, setServicesHotelTags);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </FormField>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField label="Commission">
          <input
            type="number"
            step="0.01"
            value={formData.commission || ''}
            onChange={(e) => setFormData({ ...formData, commission: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Prix de l'offre">
          <input
            type="number"
            step="0.01"
            value={formData.prix_offre || ''}
            onChange={(e) => setFormData({ ...formData, prix_offre: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </FormField>
      </div>

      <FormField label="Offre limitée">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.offre_limitee || false}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData({
                ...formData,
                offre_limitee: checked,
                disponibilite: checked ? formData.disponibilite : undefined
              });
            }}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Offre limitée</span>
        </label>
      </FormField>

      {formData.offre_limitee && (
        <FormField label="Disponibilité">
          <input
            type="number"
            step="1"
            min="0"
            value={formData.disponibilite || ''}
            onChange={(e) => setFormData({ ...formData, disponibilite: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Nombre d'unités disponibles"
          />
        </FormField>
      )}

      <FormField label="Archiver">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_archiver || false}
            onChange={(e) => setFormData({ ...formData, is_archiver: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Archiver</span>
        </label>
      </FormField>
    </FormPageLayout>
  );
};

export default ArticleFormPage;

