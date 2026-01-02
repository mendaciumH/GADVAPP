import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { commandesService, clientsService, articlesService, sessionsService, Commande, Client, Article, Chambre, Session } from '../../services/admin.service';
import { AlertCircle, Download } from 'lucide-react';

const ReservationOmraFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [omraArticles, setOmraArticles] = useState<Article[]>([]);
  /* State for room selection */
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [availableChambres, setAvailableChambres] = useState<Chambre[]>([]);
  const [selectedChambreId, setSelectedChambreId] = useState<number | null>(null);
  const [selectedChambreIndex, setSelectedChambreIndex] = useState<number>(-1);
  const [selectedSessionRemainingPlaces, setSelectedSessionRemainingPlaces] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Commande> & { facturer?: boolean; client_est_beneficiaire?: boolean; imprimer_contrat?: boolean }>({
    client_id: undefined,
    article_id: undefined,
    date: new Date().toISOString().split('T')[0],
    beneficiaire: false,
    nom: '',
    prenom: '',
    date_naissance: '',
    genre: '',
    numero_passport: '',
    date_expiration_passport: '',
    numero_mobile: '',
    remarques: '',
    prix: undefined,
    reductions: undefined,
    autre_reductions: undefined,
    taxes: undefined,
    nombre_personnes: undefined,
    chambre_id: undefined,
    facturer: true, // Auto-check generate invoice
    client_est_beneficiaire: false,
    imprimer_contrat: false,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, articlesData] = await Promise.all([
        clientsService.getAll(),
        articlesService.getAll(),
      ]);

      // Filter only Omra articles (id_type_article === 1)
      const filteredOmraArticles = (articlesData || []).filter((article: Article) => {
        const typeId = typeof article.id_type_article === 'string'
          ? parseInt(article.id_type_article as any, 10)
          : article.id_type_article;
        return typeId === 1;
      });

      console.log('Omra articles loaded:', filteredOmraArticles.length);

      setClients(clientsData || []);
      setOmraArticles(filteredOmraArticles);

      if (isEditing && id) {
        const commande = await commandesService.getById(parseInt(id));

        // Verify it's an Omra reservation
        const articleTypeId = typeof commande.article?.id_type_article === 'string'
          ? parseInt(commande.article.id_type_article as any, 10)
          : commande.article?.id_type_article;

        if (articleTypeId !== 1) {
          toast.error('Cette réservation n\'est pas une Omra');
          navigate('/admin/reservation-omra');
          return;
        }

        const formatDate = (dateStr: string | Date | undefined): string => {
          if (!dateStr) return '';
          if (typeof dateStr === 'string') {
            try {
              return new Date(dateStr).toISOString().split('T')[0];
            } catch {
              return '';
            }
          }
          if (dateStr instanceof Date) {
            return dateStr.toISOString().split('T')[0];
          }
          return '';
        };

        setFormData({
          ...commande,
          date: formatDate(commande.date) || new Date().toISOString().split('T')[0],
          date_naissance: formatDate(commande.date_naissance),
          date_expiration_passport: formatDate(commande.date_expiration_passport),
          session_id: commande.session_id,
          type_chambre: commande.type_chambre,
          facturer: false,
          client_est_beneficiaire: false,
        });

        // Load sessions for the article
        if (commande.article_id) {
          try {
            const sessions = await sessionsService.findByArticleId(commande.article_id);
            setAvailableSessions(sessions);

            // If commande has a session_id, select it
            if (commande.session_id) {
              const session = sessions.find(s => s.id === commande.session_id);
              if (session) {
                setSelectedSession(session);
                const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
                  ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
                  : null;
                setSelectedSessionRemainingPlaces(placesRestantes);
              }
            }
          } catch (error: any) {
            console.error('Error loading sessions:', error);
          }
        }

        // Load full article details to ensure we have chambres and prices
        if (commande.article_id) {
          try {
            // Try to find in loaded list first
            let fullArticle = filteredOmraArticles.find(a => {
              const aId = typeof a.id === 'string' ? parseInt(a.id as any) : a.id;
              return aId === commande.article_id;
            });

            // If not found or doesn't have chambres, fetch explicitly
            if (!fullArticle || !fullArticle.chambres || fullArticle.chambres.length === 0) {
              console.log('Fetching full article details for ID:', commande.article_id);
              try {
                fullArticle = await articlesService.getById(commande.article_id);
              } catch (err) {
                console.error('Error fetching full article:', err);
              }
            }

            if (fullArticle?.chambres && Array.isArray(fullArticle.chambres) && fullArticle.chambres.length > 0) {
              console.log('Setting available chambres from full article:', fullArticle.chambres.length);
              setAvailableChambres(fullArticle.chambres);

              // If commande has a chambre_id, update selection logic
              if (commande.chambre_id) {
                // We just set result data (data is already bound to form)
                // Just need to ensure `selectedChambreId` is set for any legacy code relying on it
                setSelectedChambreId(commande.chambre_id);

                // Find index
                const idx = fullArticle.chambres.findIndex(c => {
                  const cId = typeof c.id === 'string' ? parseInt(c.id as any) : c.id;
                  const cmdId = typeof commande.chambre_id === 'string' ? parseInt(commande.chambre_id as any) : commande.chambre_id;
                  return cId === cmdId;
                });
                if (idx !== -1) setSelectedChambreIndex(idx);
              }
            } else if (commande.article?.chambres && Array.isArray(commande.article.chambres) && commande.article.chambres.length > 0) {
              // Fallback to commande.article if found in local list failed but present in commande
              setAvailableChambres(commande.article.chambres);
              if (commande.chambre_id) {
                setSelectedChambreId(commande.chambre_id);

                const idx = commande.article.chambres.findIndex(c => {
                  const cId = typeof c.id === 'string' ? parseInt(c.id as any) : c.id;
                  const cmdId = typeof commande.chambre_id === 'string' ? parseInt(commande.chambre_id as any) : commande.chambre_id;
                  return cId === cmdId;
                });
                if (idx !== -1) setSelectedChambreIndex(idx);
              }
            }
          } catch (error) {
            console.error('Error handling article details:', error);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/reservation-omra');
    } finally {
      setLoading(false);
    }
  };

  const formatClientDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string') {
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    if (dateStr instanceof Date) {
      return dateStr.toISOString().split('T')[0];
    }
    return '';
  };

  const fillBeneficiaryFromClient = (client: Client): Partial<Commande> => {
    const updatedData: any = {
      nom: '',
      prenom: '',
      date_naissance: '',
      numero_passport: '',
      date_expiration_passport: '',
      numero_mobile: '',
    };

    if (client.type_client === 'Particulier') {
      if (client.nom_complet) {
        const nameParts = client.nom_complet.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length > 0) {
          updatedData.nom = nameParts[0] || '';
          updatedData.prenom = nameParts.slice(1).join(' ') || '';
        }
      }
    } else if (client.type_client === 'Entreprise') {
      if (client.nom_entreprise) {
        updatedData.nom = client.nom_entreprise;
        updatedData.prenom = '';
      }
    }

    if (client.type_client === 'Particulier' && client.date_naissance) {
      const formattedDate = formatClientDate(client.date_naissance);
      if (formattedDate) {
        updatedData.date_naissance = formattedDate;
      }
    }

    if (client.numero_passeport) {
      updatedData.numero_passport = client.numero_passeport;
    }

    if (client.expiration_passeport) {
      const formattedExpiration = formatClientDate(client.expiration_passeport);
      if (formattedExpiration) {
        updatedData.date_expiration_passport = formattedExpiration;
      }
    }

    if (client.numero_mobile) {
      updatedData.numero_mobile = client.numero_mobile;
    } else if (client.numero_mobile_2) {
      updatedData.numero_mobile = client.numero_mobile_2;
    }

    return updatedData;
  };

  const handleClientChange = (clientId: number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, client_id: clientId };

      if (prev.client_est_beneficiaire && clientId) {
        const selectedClient = clients.find(c => c.id === clientId);
        if (selectedClient) {
          const beneficiaryData = fillBeneficiaryFromClient(selectedClient);
          return { ...newData, ...beneficiaryData };
        }
      }
      return newData;
    });
  };

  const handleArticleChange = async (articleId: number | undefined) => {
    // Reset all selections when article changes
    setSelectedChambreId(null);
    setAvailableChambres([]);
    setAvailableSessions([]);
    setSelectedSession(null);
    setSelectedSessionRemainingPlaces(null);

    setFormData(prev => ({
      ...prev,
      article_id: articleId,
      session_id: undefined,
      chambre_id: undefined,
      prix: undefined,
      nombre_personnes: undefined
    }));

    if (articleId) {
      try {
        // Load sessions for this article
        const sessions = await sessionsService.findByArticleId(articleId);
        if (sessions && sessions.length > 0) {
          setAvailableSessions(sessions);
          toast.info(`${sessions.length} session(s) disponible(s) pour cet article`);
        } else {
          toast.warning('Aucune session disponible pour cet article');
        }

        // Load full article to get Chambres
        // Note: The backend ArticlesService.findOne now includes 'chambres' relation.
        // We might need to fetch it explicitly if 'omraArticles' list doesn't have it fully loaded.
        // But usually 'omraArticles' comes from 'articlesService.getAll()' which now includes 'chambres' too.
        let selectedArticle = omraArticles.find(a => {
          const aId = typeof a.id === 'string' ? parseInt(a.id as any) : a.id;
          return aId === articleId;
        });

        // Use cached article if it has chambres, otherwise fetch
        if (!selectedArticle?.chambres || selectedArticle.chambres.length === 0) {
          selectedArticle = await articlesService.getById(articleId);
        }

        if (selectedArticle?.chambres && Array.isArray(selectedArticle.chambres)) {
          console.log(`Loaded ${selectedArticle.chambres.length} chambres for article ${articleId}`);
          setAvailableChambres(selectedArticle.chambres);
        } else {
          console.warn('No chambres found for article');
        }

      } catch (error: any) {
        console.error('Error loading article details:', error);
        toast.error('Erreur lors du chargement des détails');
      }
    }
  };

  const handleSessionChange = (sessionId: number | undefined) => {
    // Reset chambre selection to force user to re-select or verify, 
    // although rooms are usually per-article, not per-session.
    // If rooms depend on session, we would filter here. Assuming per-article for now as per entities.
    setSelectedChambreId(null);
    setSelectedChambreIndex(-1);
    setFormData(prev => ({
      ...prev,
      session_id: sessionId,
      chambre_id: undefined,
      prix: undefined,
      nombre_personnes: undefined
    }));

    if (sessionId) {
      const session = availableSessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSession(session);
        const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
          ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
          : null;
        setSelectedSessionRemainingPlaces(placesRestantes);
      }
    } else {
      setSelectedSession(null);
      setSelectedSessionRemainingPlaces(null);
    }
  };

  const getRoomUnitPrice = (chambreId: number): number | undefined => {
    if (!chambreId) return undefined;
    // Handle both number and string ID comparison caused by BigInt serialization
    const selectedChambre = availableChambres.find(c => {
      const cId = typeof c.id === 'string' ? parseInt(c.id as any) : c.id;
      return cId === chambreId;
    });

    if (selectedChambre) {
      const price = typeof selectedChambre.prix === 'string'
        ? parseFloat(selectedChambre.prix)
        : Number(selectedChambre.prix);
      return !isNaN(price) ? price : undefined;
    }
    return undefined;
  };

  const handleChambreChange = (index: number) => {
    // index is the index in availableChambres array
    // Invalid index check
    if (index < 0 || index >= availableChambres.length) {
      setSelectedChambreId(null);
      setSelectedChambreIndex(-1);
      setFormData(prev => ({ ...prev, chambre_id: undefined, prix: undefined }));
      return;
    }

    const selectedChambre = availableChambres[index];

    if (selectedChambre) {
      // We set the ID for persistence
      setSelectedChambreId(selectedChambre.id || null);
      setSelectedChambreIndex(index);

      const price = typeof selectedChambre.prix === 'string'
        ? parseFloat(selectedChambre.prix)
        : Number(selectedChambre.prix);

      const unitPrice = !isNaN(price) ? price : undefined;

      if (unitPrice !== undefined) {
        // Calculate total price: unit price * number of people
        const count = formData.nombre_personnes && formData.nombre_personnes > 0 ? formData.nombre_personnes : 1;
        const totalPrice = unitPrice * count;

        setFormData(prev => ({
          ...prev,
          chambre_id: selectedChambre.id,
          prix: totalPrice
        }));

        // Show notification/toast about price update
        toast.info(`Prix unitaire: ${unitPrice.toLocaleString('fr-FR')} DA x ${count} personne(s) = ${totalPrice.toLocaleString('fr-FR')} DA`);
      } else {
        // Fallback if price is not found
        setFormData(prev => ({ ...prev, chambre_id: selectedChambre.id }));
      }
    }
  };

  const handleClientEstBeneficiaireChange = (checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        if (!prev.client_id) {
          toast.warning('Veuillez d\'abord sélectionner un client');
          return {
            ...prev,
            client_est_beneficiaire: checked,
            beneficiaire: true,
          };
        }

        const selectedClient = clients.find(c => {
          const clientId = typeof c.id === 'string' ? parseInt(c.id as any) : c.id;
          const formClientId = typeof prev.client_id === 'string' ? parseInt(prev.client_id as any) : prev.client_id;
          return clientId === formClientId;
        });

        if (selectedClient) {
          const beneficiaryData = fillBeneficiaryFromClient(selectedClient);
          toast.success('Informations du client remplies automatiquement');
          return {
            ...prev,
            ...beneficiaryData,
            client_est_beneficiaire: checked,
            beneficiaire: true,
          };
        }

        return {
          ...prev,
          client_est_beneficiaire: checked,
          beneficiaire: true,
        };
      } else {
        return {
          ...prev,
          client_est_beneficiaire: false,
        };
      }
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.client_id) {
      errors.client_id = 'Le client est requis';
    }

    if (!formData.article_id) {
      errors.article_id = 'Le programme Omra est requis';
    }

    // Require chambre selection if chambres are available
    if (availableChambres.length > 0) {
      // Check if a room is selected via index
      if (selectedChambreIndex === -1) {
        errors.chambre = 'Le type de chambre est requis';
      }
    }

    // Validate session_id for OMRA articles
    if (!formData.session_id) {
      errors.session_id = 'Veuillez sélectionner une session (date de départ)';
    }

    // Validate nombre_personnes
    if (!formData.nombre_personnes || formData.nombre_personnes < 1) {
      errors.nombre_personnes = 'Le nombre de personnes doit être au moins 1';
    } else if (selectedSessionRemainingPlaces !== null && formData.nombre_personnes > selectedSessionRemainingPlaces) {
      errors.nombre_personnes = `Le nombre de personnes (${formData.nombre_personnes}) dépasse la disponibilité (${selectedSessionRemainingPlaces} places restantes)`;
    }

    if (!formData.nom?.trim()) {
      errors.nom = 'Le nom du bénéficiaire est requis';
    }
    if (!formData.prenom?.trim()) {
      errors.prenom = 'Le prénom du bénéficiaire est requis';
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
      const submitData: any = {
        client_id: formData.client_id,
        article_id: formData.article_id,
        session_id: formData.session_id,
        date: formData.date,
        beneficiaire: formData.beneficiaire || false,
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance || undefined,
        genre: formData.genre || undefined,
        numero_passport: formData.numero_passport || undefined,
        date_expiration_passport: formData.date_expiration_passport || undefined,
        numero_mobile: formData.numero_mobile || undefined,
        remarques: formData.remarques || undefined,
        prix: formData.prix || undefined,
        reductions: formData.reductions || undefined,
        autre_reductions: formData.autre_reductions || undefined,
        taxes: formData.taxes || undefined,
        nombre_personnes: formData.nombre_personnes || undefined,
        facturer: formData.facturer || false,
        chambre_id: formData.chambre_id || undefined,
        type_chambre: undefined, // Don't send type, let backend handle it via relation
      };

      // Fallback: If chambre_id is missing but we have a valid index, try to get it
      if (!submitData.chambre_id && selectedChambreIndex !== -1 && availableChambres[selectedChambreIndex]) {
        const selectedChambre = availableChambres[selectedChambreIndex];
        if (selectedChambre.id) {
          submitData.chambre_id = selectedChambre.id;
        }
      }

      let savedCommande: Commande;
      if (isEditing && id) {
        savedCommande = await commandesService.update(parseInt(id), submitData);
        toast.success('Réservation Omra mise à jour avec succès');
      } else {
        savedCommande = await commandesService.create(submitData);
        toast.success('Réservation Omra créée avec succès');
        if (formData.facturer) {
          toast.info('Facture générée automatiquement');
        }
      }

      // Imprimer le contrat automatiquement si la case est cochée
      if (savedCommande && formData.imprimer_contrat) {
        try {
          const blob = await commandesService.printContract(savedCommande.id);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contrat-omra-${savedCommande.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Contrat Omra téléchargé avec succès');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Erreur lors de la génération du contrat');
        }
      }

      navigate('/admin/reservation-omra');
    } catch (error: any) {
      console.error('Error submitting reservation:', error);

      const errorResponse = error.response?.data;

      if (errorResponse?.message) {
        const messages = errorResponse.message;

        if (Array.isArray(messages)) {
          toast.error(messages[0]);
          if (messages.length > 1) {
            messages.slice(1).forEach((msg: string) => {
              toast.error(msg, { autoClose: 5000 });
            });
          }
        } else {
          toast.error(messages);
        }
      } else {
        toast.error('Erreur lors de l\'opération');
      }

      if (errorResponse?.errors) {
        setFormErrors(errorResponse.errors);
      } else {
        setFormErrors({});
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
      title={isEditing ? 'Modifier la réservation Omra' : 'Nouvelle réservation Omra'}
      subtitle={isEditing ? 'Modifiez les informations de la réservation' : 'Créez une nouvelle réservation de Omra'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/reservation-omra"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField label="Client" required>
          <select
            value={formData.client_id || ''}
            onChange={(e) => handleClientChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.client_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.type_client === 'Entreprise' ? client.nom_entreprise : client.nom_complet}
              </option>
            ))}
          </select>
          {formErrors.client_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.client_id}
            </p>
          )}
        </FormField>

        <FormField label="Programme Omra" required>
          <select
            value={formData.article_id || ''}
            onChange={(e) => handleArticleChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.article_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            required
          >
            <option value="">Sélectionner un programme Omra</option>
            {omraArticles.map(article => (
              <option key={article.id} value={article.id}>
                {article.label}
              </option>
            ))}
          </select>
          {formErrors.article_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.article_id}
            </p>
          )}
          {omraArticles.length === 0 && (
            <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Aucun programme Omra disponible. Créez-en un dans la section Omra.
            </p>
          )}
        </FormField>
      </div>

      {/* Session Selection - Show when article is selected */}
      {formData.article_id && availableSessions.length > 0 && (
        <FormField label="Session (Date de départ)" required>
          <select
            value={formData.session_id || ''}
            onChange={(e) => handleSessionChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.session_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            required
          >
            <option value="">Sélectionner une session</option>
            {availableSessions.map((session) => {
              const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
                ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
                : null;
              const dateStr = new Date(session.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              return (
                <option key={session.id} value={session.id}>
                  {dateStr} - {placesRestantes !== null ? `${placesRestantes} places restantes` : 'N/A'}
                </option>
              );
            })}
          </select>
          {formErrors.session_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.session_id}
            </p>
          )}
          {formData.session_id && selectedSessionRemainingPlaces !== null && (
            <p className="mt-2 text-sm font-medium text-gray-700">
              Places restantes pour cette session: <span className="text-indigo-600 font-semibold">{selectedSessionRemainingPlaces}</span>
            </p>
          )}
        </FormField>
      )}

      {/* Chambre Selection - Only show when session is selected and article has chambres */}
      {formData.session_id && availableChambres.length > 0 && (
        <FormField label="Type de chambre" required>
          <select
            value={selectedChambreIndex !== -1 ? selectedChambreIndex : ''}
            onChange={(e) => handleChambreChange(e.target.value !== '' ? parseInt(e.target.value) : -1)}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.chambre ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Sélectionner un type de chambre</option>
            {availableChambres.map((chambre, index) => (
              <option key={chambre.id || `chambre-${index}`} value={index}>
                {chambre.type_chambre} - {Number(chambre.prix).toLocaleString('fr-FR')} DA
              </option>
            ))}
          </select>
          {formErrors.chambre && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.chambre}
            </p>
          )}
        </FormField>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField label="Date de réservation">
          <input
            type="date"
            value={formatClientDate(formData.date)}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>

        <FormField label="Prix">
          <input
            type="number"
            step="0.01"
            value={formData.prix || ''}
            onChange={(e) => setFormData({ ...formData, prix: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Nombre de personnes" required>
          <input
            type="number"
            min="1"
            value={formData.nombre_personnes || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined;

              setFormData(prev => {
                const newData = { ...prev, nombre_personnes: value };

                // Recalculate price if room type is selected
                if (selectedChambreIndex !== -1 && availableChambres[selectedChambreIndex] && value && value > 0) {
                  const selectedChambre = availableChambres[selectedChambreIndex];
                  const price = typeof selectedChambre.prix === 'string'
                    ? parseFloat(selectedChambre.prix)
                    : Number(selectedChambre.prix);

                  const unitPrice = !isNaN(price) ? price : undefined;

                  if (unitPrice !== undefined) {
                    const totalPrice = unitPrice * value;
                    newData.prix = totalPrice;
                    toast.info(`Prix mis à jour: ${unitPrice.toLocaleString('fr-FR')} DA x ${value} personne(s) = ${totalPrice.toLocaleString('fr-FR')} DA`);
                  }
                }

                return newData;
              });
            }}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.nombre_personnes ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            placeholder="1"
            required
          />
          {formErrors.nombre_personnes && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.nombre_personnes}
            </p>
          )}
          {/* Display remaining places after reservation in real-time */}
          {formData.session_id && selectedSessionRemainingPlaces !== null && formData.nombre_personnes && (
            <p className="mt-2 text-sm">
              <span className="font-medium text-gray-700">Places restantes après réservation: </span>
              <span className={`font-semibold ${(selectedSessionRemainingPlaces - formData.nombre_personnes) >= 0
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {Math.max(0, selectedSessionRemainingPlaces - formData.nombre_personnes)}
              </span>
            </p>
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField label="Réductions">
          <input
            type="number"
            step="0.01"
            value={formData.reductions || ''}
            onChange={(e) => setFormData({ ...formData, reductions: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Autres réductions">
          <input
            type="number"
            step="0.01"
            value={formData.autre_reductions || ''}
            onChange={(e) => setFormData({ ...formData, autre_reductions: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="0.00"
          />
        </FormField>
      </div>

      <FormField label="Taxes">
        <input
          type="number"
          step="0.01"
          value={formData.taxes || ''}
          onChange={(e) => setFormData({ ...formData, taxes: e.target.value ? parseFloat(e.target.value) : undefined })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="0.00"
        />
      </FormField>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du bénéficiaire</h3>
        le client est le bénéficiaire ?
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.client_est_beneficiaire || false}
              onChange={(e) => handleClientEstBeneficiaireChange(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700"></span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label="Nom" required>
            <input
              type="text"
              value={formData.nom || ''}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.nom ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
              required
            />
            {formErrors.nom && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.nom}
              </p>
            )}
          </FormField>

          <FormField label="Prénom" required>
            <input
              type="text"
              value={formData.prenom || ''}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.prenom ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
              required
            />
            {formErrors.prenom && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.prenom}
              </p>
            )}
          </FormField>

          <FormField label="Date de naissance">
            <input
              type="date"
              value={formatClientDate(formData.date_naissance)}
              onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </FormField>

          <FormField label="Genre">
            <select
              value={formData.genre || ''}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField label="Numéro du passeport">
            <input
              type="text"
              value={formData.numero_passport || ''}
              onChange={(e) => setFormData({ ...formData, numero_passport: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </FormField>

          <FormField label="Date d'expiration passeport">
            <input
              type="date"
              value={formatClientDate(formData.date_expiration_passport)}
              onChange={(e) => setFormData({ ...formData, date_expiration_passport: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </FormField>
        </div>

        <FormField label="Numéro de mobile">
          <input
            type="tel"
            value={formData.numero_mobile || ''}
            onChange={(e) => setFormData({ ...formData, numero_mobile: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </FormField>
      </div>

      <FormField label="Remarques">
        <textarea
          value={formData.remarques || ''}
          onChange={(e) => setFormData({ ...formData, remarques: e.target.value })}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          rows={3}
          placeholder="Notes supplémentaires"
        />
      </FormField>

      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.facturer || false}
              onChange={(e) => setFormData({ ...formData, facturer: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Facturer la réservation (générer la facture automatiquement)</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.imprimer_contrat || false}
              onChange={(e) => setFormData({ ...formData, imprimer_contrat: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Imprimer le contrat Omra automatiquement</span>
          </label>
        </div>
      </div>

      {/* Generate Bon de Commande PDF button - only show when editing */}
      {isEditing && id && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={async () => {
              try {
                const blob = await commandesService.generateBonDeCommande(parseInt(id));
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `bon-de-commande-omra-${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success('Bon de commande téléchargé avec succès');
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Erreur lors de la génération du bon de commande');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le bon de commande</span>
          </button>
        </div>
      )}
    </FormPageLayout>
  );
};

export default ReservationOmraFormPage;
