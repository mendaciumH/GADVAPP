import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { commandesService, clientsService, articlesService, Commande, Client, Article } from '../../services/admin.service';
import { AlertCircle, Download } from 'lucide-react';

const CommandeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
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
    facturer: false,
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
        articlesService.getAllTourisme(),
      ]);


      setClients(clientsData || []);
      setArticles(articlesData || []);

      if (isEditing && id) {
        const commande = await commandesService.getById(parseInt(id));
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
          facturer: false,
          client_est_beneficiaire: false,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/admin/commandes');
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

  const handleArticleChange = (articleId: number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, article_id: articleId };

      if (articleId) {
        // Compare both as numbers since API might return id as string
        const selectedArticle = articles.find(a => {
          const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          return aId === articleId;
        });

        console.log('Selected Article:', selectedArticle);
        console.log('Prix offre:', selectedArticle?.prix_offre);

        if (selectedArticle) {
          // Check if prix_offre exists and is valid
          const prixOffre = selectedArticle.prix_offre;

          if (prixOffre !== null && prixOffre !== undefined) {
            const price = typeof prixOffre === 'string'
              ? parseFloat(prixOffre)
              : Number(prixOffre);

            console.log('Parsed price:', price);

            if (!isNaN(price) && price > 0) {
              newData.prix = price;
              toast.info(`Prix automatiquement rempli: ${price.toFixed(2)} DA`);
            } else {
              console.log('Price is NaN or <= 0');
            }
          } else {
            console.log('Prix offre is null or undefined');
            toast.warning('Ce service n\'a pas de prix défini');
          }
        } else {
          console.log('Article not found - articleId:', articleId, 'articles:', articles.map(a => ({ id: a.id, label: a.label })));
        }
      }

      return newData;
    });
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
          const clientId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
          const formClientId = typeof prev.client_id === 'string' ? parseInt(prev.client_id) : prev.client_id;
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
      errors.article_id = 'Le service est requis';
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
        facturer: formData.facturer || false,
      };

      let savedCommande: Commande;
      if (isEditing && id) {
        savedCommande = await commandesService.update(parseInt(id), submitData);
        toast.success('Commande mise à jour avec succès');
      } else {
        savedCommande = await commandesService.create(submitData);
        toast.success('Commande créée avec succès');
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
          link.download = `contrat-voyage-${savedCommande.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Contrat de voyage téléchargé avec succès');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Erreur lors de la génération du contrat');
        }
      }

      navigate('/admin/commandes');
    } catch (error: any) {
      console.error('Error submitting commande:', error);

      const errorResponse = error.response?.data;

      // Handle validation errors from backend
      if (errorResponse?.message) {
        const messages = errorResponse.message;

        // If message is an array of validation errors
        if (Array.isArray(messages)) {
          // Show first error as main toast
          toast.error(messages[0]);
          // Show remaining errors if multiple
          if (messages.length > 1) {
            messages.slice(1).forEach(msg => {
              toast.error(msg, { autoClose: 5000 });
            });
          }
        } else {
          toast.error(messages);
        }
      } else {
        toast.error('Erreur lors de l\'opération');
      }

      // Handle errors object if present
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
      title={isEditing ? 'Modifier la commande' : 'Nouvelle commande'}
      subtitle={isEditing ? 'Modifiez les informations de la commande' : 'Créez une nouvelle commande'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/commandes"
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

        <FormField label="Service" required>
          <select
            value={formData.article_id || ''}
            onChange={(e) => handleArticleChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${formErrors.article_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            required
          >
            <option value="">Sélectionner un service</option>
            {articles.map(article => (
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
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <FormField label="Date">
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

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.client_est_beneficiaire || false}
              onChange={(e) => handleClientEstBeneficiaireChange(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Le client est le bénéficiaire ?</span>
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

          <FormField label="Date d'expiration passport">
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
            <span className="text-sm font-medium text-gray-700">Facturer la commande (générer la facture automatiquement)</span>
          </label>
        </div>

        {(() => {
          // Compare IDs properly (handle both string and number)
          const selectedArticle = articles.find(a => {
            const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
            const formId = typeof formData.article_id === 'string' ? parseInt(formData.article_id) : formData.article_id;
            return aId === formId;
          });

          console.log('=== CHECKBOX VERIFICATION ===');
          console.log('formData.article_id:', formData.article_id);
          console.log('Selected article:', selectedArticle);

          // Backend returns 'typeArticle' (CamelCase) not 'type_article' (snake_case)
          const typeArticle = (selectedArticle as any)?.typeArticle || selectedArticle?.type_article;
          console.log('Type article object:', typeArticle);

          const articleTypeName = typeArticle?.description?.toLowerCase().trim();
          console.log('Article type name (lowercase trimmed):', articleTypeName);

          const isVoyageOrOmra = articleTypeName === 'voyage organisé' ||
            articleTypeName === 'voyage organise' ||
            articleTypeName === 'omra' ||
            (articleTypeName && (
              (articleTypeName.includes('voyage') && articleTypeName.includes('organis')) ||
              articleTypeName.includes('omra')
            ));

          console.log('Is Voyage or Omra:', isVoyageOrOmra);
          console.log('===========================');

          if (isVoyageOrOmra) {
            return (
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.imprimer_contrat || false}
                    onChange={(e) => setFormData({ ...formData, imprimer_contrat: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Imprimer le contrat de voyage automatiquement</span>
                </label>
              </div>
            );
          }
          return null;
        })()}
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
                link.download = `bon-de-commande-${id}.pdf`;
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

export default CommandeFormPage;

