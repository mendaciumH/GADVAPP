import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { articlesService, Article } from '../../services/admin.service';

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

const ArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const articlesData = await articlesService.getAllTourisme();

      // Debug: Log the first article to see the structure
      if (articlesData && articlesData.length > 0) {
        console.log('First article structure:', articlesData[0]);
        console.log('id_type_article:', articlesData[0].id_type_article);
        console.log('typeArticle:', (articlesData[0] as any).typeArticle);
      }

      // Filter out Omra articles (id_type_article === 1) - they have their own page
      const filteredArticles = (articlesData || []).filter(
        article => article.id_type_article !== 1
      );

      console.log('Total articles:', articlesData?.length);
      console.log('Filtered articles (excluding Omra):', filteredArticles.length);

      setArticles(filteredArticles);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/articles/new');
  };

  const handleEdit = (article: Article) => {
    navigate(`/admin/articles/${article.id}/edit`);
  };

  const handleView = (article: Article) => {
    setViewingArticle(article);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (article: Article) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${article.label}"?`)) {
      try {
        await articlesService.delete(article.id);
        toast.success('Service supprimé avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredArticles.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const columns = [
    { key: 'label', header: 'Libellé' },
    {
      key: 'typeArticle',
      header: 'Type',
      render: (article: Article) => (article as any).typeArticle?.description || article.type_article?.description || 'N/A',
    },
    {
      key: 'fournisseur',
      header: 'Fournisseur',
      render: (article: Article) => article.fournisseur?.nom_complet || 'N/A',
    },
    {
      key: 'prix_offre',
      header: 'Prix',
      render: (article: Article) => article.prix_offre ? `${article.prix_offre} DA` : 'N/A',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Gestion des Services</h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Gérer vos services</p>
      </div>

      <DataTable
        data={paginatedArticles}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={{
          page: currentPage,
          limit: itemsPerPage,
          total: totalItems,
          onPageChange: setCurrentPage,
        }}
      />

      {/* View Article Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails du service"
        size="xl"
      >
        {viewingArticle && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <p className="text-sm text-gray-900">{viewingArticle.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
                <p className="text-sm text-gray-900">{(viewingArticle as any).typeArticle?.description || viewingArticle.type_article?.description || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <p className="text-sm text-gray-900">{viewingArticle.label || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <p className="text-sm text-gray-900">{viewingArticle.fournisseur?.nom_complet || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                <p className="text-sm text-gray-900">
                  {viewingArticle.date_depart
                    ? new Date(viewingArticle.date_depart).toLocaleString('fr-FR')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                <p className="text-sm text-gray-900">{viewingArticle.commission ? `${viewingArticle.commission} DA` : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de l'offre</label>
                <p className="text-sm text-gray-900">{viewingArticle.prix_offre ? `${viewingArticle.prix_offre} DA` : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                <p className="text-sm text-gray-900">{viewingArticle.disponibilite ?? 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offre limitée</label>
                <p className="text-sm text-gray-900">{viewingArticle.offre_limitee ? 'Oui' : 'Non'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Archivé</label>
                <p className="text-sm text-gray-900">{viewingArticle.is_archiver ? 'Oui' : 'Non'}</p>
              </div>
            </div>

            {viewingArticle.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingArticle.description}</p>
              </div>
            )}

            {viewingArticle.image_banner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Bannière</label>
                <img
                  src={constructBannerUrl(viewingArticle.image_banner) || viewingArticle.image_banner}
                  alt="Banner"
                  className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-500 mt-1 break-all">{viewingArticle.image_banner}</p>
              </div>
            )}

            {/* Omra-specific fields */}
            {(viewingArticle.nom_hotel || viewingArticle.date || viewingArticle.chambres) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Omra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {viewingArticle.nom_hotel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'hôtel</label>
                      <p className="text-sm text-gray-900">{viewingArticle.nom_hotel}</p>
                    </div>
                  )}
                  {viewingArticle.date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingArticle.date) ? viewingArticle.date : [viewingArticle.date]).map((date, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingArticle.chambres && Array.isArray(viewingArticle.chambres) && viewingArticle.chambres.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chambres et tarifs</label>
                      <div className="flex flex-wrap gap-2">
                        {viewingArticle.chambres.map((chambre, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {chambre.type_chambre}: {chambre.prix?.toLocaleString('fr-FR')} DZD
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voyage organisé-specific fields */}
            {(viewingArticle.destination || viewingArticle.date_retour || viewingArticle.duree_voyage || viewingArticle.type_hebergement || viewingArticle.transport || viewingArticle.programme) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Voyage organisé</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {viewingArticle.destination && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <p className="text-sm text-gray-900">{viewingArticle.destination}</p>
                    </div>
                  )}
                  {viewingArticle.date_retour && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingArticle.date_retour).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {viewingArticle.duree_voyage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée du voyage</label>
                      <p className="text-sm text-gray-900">{viewingArticle.duree_voyage}</p>
                    </div>
                  )}
                  {viewingArticle.type_hebergement && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type d'hébergement</label>
                      <p className="text-sm text-gray-900">{viewingArticle.type_hebergement}</p>
                    </div>
                  )}
                  {viewingArticle.transport && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                      <p className="text-sm text-gray-900">{viewingArticle.transport}</p>
                    </div>
                  )}
                  {viewingArticle.programme && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingArticle.programme) ? viewingArticle.programme : [viewingArticle.programme]).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assurance voyage-specific fields */}
            {(viewingArticle.type_assurance || viewingArticle.duree_couverture || viewingArticle.zone_couverture || viewingArticle.montant_couverture || viewingArticle.franchise || viewingArticle.conditions_particulieres) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Assurance voyage</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {viewingArticle.type_assurance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type d'assurance</label>
                      <p className="text-sm text-gray-900">{viewingArticle.type_assurance}</p>
                    </div>
                  )}
                  {viewingArticle.duree_couverture && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée de couverture</label>
                      <p className="text-sm text-gray-900">{viewingArticle.duree_couverture}</p>
                    </div>
                  )}
                  {viewingArticle.zone_couverture && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone de couverture</label>
                      <p className="text-sm text-gray-900">{viewingArticle.zone_couverture}</p>
                    </div>
                  )}
                  {viewingArticle.montant_couverture && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant de couverture</label>
                      <p className="text-sm text-gray-900">{viewingArticle.montant_couverture} DZD</p>
                    </div>
                  )}
                  {viewingArticle.franchise && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Franchise</label>
                      <p className="text-sm text-gray-900">{viewingArticle.franchise} DZD</p>
                    </div>
                  )}
                  {viewingArticle.conditions_particulieres && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conditions particulières</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingArticle.conditions_particulieres) ? viewingArticle.conditions_particulieres : [viewingArticle.conditions_particulieres]).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billet d'avion-specific fields */}
            {(viewingArticle.aeroport_depart || viewingArticle.aeroport_arrivee || viewingArticle.date_depart_vol || viewingArticle.date_retour_vol || viewingArticle.compagnie_aerienne || viewingArticle.numero_vol || viewingArticle.classe_vol || viewingArticle.escales) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Billet d'avion</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {viewingArticle.aeroport_depart && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aéroport de départ</label>
                      <p className="text-sm text-gray-900">{viewingArticle.aeroport_depart}</p>
                    </div>
                  )}
                  {viewingArticle.aeroport_arrivee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aéroport d'arrivée</label>
                      <p className="text-sm text-gray-900">{viewingArticle.aeroport_arrivee}</p>
                    </div>
                  )}
                  {viewingArticle.date_depart_vol && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ du vol</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingArticle.date_depart_vol).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {viewingArticle.date_retour_vol && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour du vol</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingArticle.date_retour_vol).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {viewingArticle.compagnie_aerienne && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie aérienne</label>
                      <p className="text-sm text-gray-900">
                        {typeof viewingArticle.compagnie_aerienne === 'object'
                          ? viewingArticle.compagnie_aerienne.nom
                          : viewingArticle.compagnie_aerienne}
                      </p>
                    </div>
                  )}
                  {viewingArticle.numero_vol && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de vol</label>
                      <p className="text-sm text-gray-900">{viewingArticle.numero_vol}</p>
                    </div>
                  )}
                  {viewingArticle.classe_vol && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Classe de vol</label>
                      <p className="text-sm text-gray-900">{viewingArticle.classe_vol}</p>
                    </div>
                  )}
                  {viewingArticle.escales && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Escales</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingArticle.escales) ? viewingArticle.escales : [viewingArticle.escales]).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Réservation hôtels-specific fields */}
            {((viewingArticle as any).nom_hotel || (viewingArticle as any).date_check_in || (viewingArticle as any).date_check_out || (viewingArticle as any).nombre_nuits || (viewingArticle as any).nombre_chambres || (viewingArticle as any).nombre_personnes || (viewingArticle as any).type_chambre || (viewingArticle as any).services_hotel || (viewingArticle as any).adresse_hotel || (viewingArticle as any).ville_hotel || (viewingArticle as any).pays_hotel) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Réservation Hôtel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {(viewingArticle as any).nom_hotel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'hôtel</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).nom_hotel}</p>
                    </div>
                  )}
                  {(viewingArticle as any).date_check_in && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date d'arrivée (Check-in)</label>
                      <p className="text-sm text-gray-900">
                        {new Date((viewingArticle as any).date_check_in).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {(viewingArticle as any).date_check_out && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ (Check-out)</label>
                      <p className="text-sm text-gray-900">
                        {new Date((viewingArticle as any).date_check_out).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {(viewingArticle as any).nombre_nuits && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de nuits</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).nombre_nuits}</p>
                    </div>
                  )}
                  {(viewingArticle as any).nombre_chambres && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de chambres</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).nombre_chambres}</p>
                    </div>
                  )}
                  {(viewingArticle as any).nombre_personnes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).nombre_personnes}</p>
                    </div>
                  )}
                  {(viewingArticle as any).type_chambre && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de chambre</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).type_chambre}</p>
                    </div>
                  )}
                  {((viewingArticle as any).ville_hotel || (viewingArticle as any).pays_hotel) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                      <p className="text-sm text-gray-900">
                        {[(viewingArticle as any).ville_hotel, (viewingArticle as any).pays_hotel].filter(Boolean).join(', ') || 'N/A'}
                      </p>
                    </div>
                  )}
                  {(viewingArticle as any).adresse_hotel && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <p className="text-sm text-gray-900">{(viewingArticle as any).adresse_hotel}</p>
                    </div>
                  )}
                  {(viewingArticle as any).services_hotel && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Services de l'hôtel</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray((viewingArticle as any).services_hotel) ? (viewingArticle as any).services_hotel : [(viewingArticle as any).services_hotel]).map((service: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Demande Visa-specific fields */}
            {(viewingArticle.pays_destination || viewingArticle.type_visa || viewingArticle.duree_validite || viewingArticle.delai_traitement || viewingArticle.documents_requis) && (
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Visa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {viewingArticle.pays_destination && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pays de destination</label>
                      <p className="text-sm text-gray-900">{viewingArticle.pays_destination}</p>
                    </div>
                  )}
                  {viewingArticle.type_visa && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de visa</label>
                      <p className="text-sm text-gray-900">{viewingArticle.type_visa}</p>
                    </div>
                  )}
                  {viewingArticle.duree_validite && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durée de validité</label>
                      <p className="text-sm text-gray-900">{viewingArticle.duree_validite}</p>
                    </div>
                  )}
                  {viewingArticle.delai_traitement && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Délai de traitement</label>
                      <p className="text-sm text-gray-900">{viewingArticle.delai_traitement}</p>
                    </div>
                  )}
                  {viewingArticle.documents_requis && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documents requis</label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewingArticle.documents_requis) ? viewingArticle.documents_requis : [viewingArticle.documents_requis]).map((doc, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArticlesPage;
