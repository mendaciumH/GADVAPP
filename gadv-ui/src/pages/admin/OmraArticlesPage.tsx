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

const OmraArticlesPage: React.FC = () => {
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
      const articlesData = await articlesService.getAll();

      console.log('All articles loaded:', articlesData?.length || 0);

      // Filter to show only Omra articles (id_type_article === 1)
      // Handle both string and number types
      const omraArticles = (articlesData || []).filter(
        article => {
          const typeId = typeof article.id_type_article === 'string'
            ? parseInt(article.id_type_article, 10)
            : article.id_type_article;
          return typeId === 1;
        }
      );

      setArticles(omraArticles);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/omra/new');
  };

  const handleEdit = (article: Article) => {
    if (!article?.id) {

      return;
    }
    console.log('Navigating to edit page for article ID:', article.id);
    navigate(`/admin/omra/${article.id}/edit`);
  };



  const handleView = (article: Article) => {
    setViewingArticle(article);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (article: Article) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'Omra "${article.label}"?`)) {
      try {
        await articlesService.delete(article.id);
        toast.success('Omra supprimée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.nom_hotel?.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.ville_depart?.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.entree?.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.sortie?.toLowerCase().includes(searchValue.toLowerCase()) ||
    (article as any).compagnieAerienne?.nom?.toLowerCase().includes(searchValue.toLowerCase()) ||
    (article as any).compagnie_aerienne?.nom?.toLowerCase().includes(searchValue.toLowerCase())
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
      key: 'nom_hotel',
      header: 'Hôtel',
      render: (article: Article) => article.nom_hotel || 'N/A',
    },
    {
      key: 'ville_depart',
      header: 'Ville de départ',
      render: (article: Article) => article.ville_depart || 'N/A',
    },
    {
      key: 'compagnie_aerienne',
      header: 'Compagnie Aérienne',
      render: (article: Article) => {
        const compagnie = (article as any).compagnieAerienne || (article as any).compagnie_aerienne;
        if (!compagnie) return 'N/A';
        return compagnie.nom ? `${compagnie.nom}${compagnie.code_iata ? ` (${compagnie.code_iata})` : ''}` : 'N/A';
      },
    },
    {
      key: 'type_fly',
      header: 'Type de vol',
      render: (article: Article) => {
        if (!article.type_fly) return 'N/A';
        return article.type_fly === 'direct' ? 'Direct' : article.type_fly === 'avec_escale' ? 'Avec escale' : article.type_fly;
      },
    },
    {
      key: 'date_depart',
      header: 'Date de départ',
      render: (article: Article) => {
        // If article has sessions, display all session dates
        if (article.sessions && article.sessions.length > 0) {
          return (
            <div className="flex flex-col gap-1">
              {article.sessions.map((session, idx) => (
                <span key={session.id || idx} className="text-sm">
                  {new Date(session.date).toLocaleDateString('fr-FR')}
                </span>
              ))}
            </div>
          );
        }
        // Fallback to date_depart if no sessions
        if (article.date_depart) {
          return new Date(article.date_depart).toLocaleDateString('fr-FR');
        }
        return 'N/A';
      },
    },
    {
      key: 'prix_offre',
      header: 'Prix',
      render: (article: Article) => article.prix_offre ? `${article.prix_offre.toLocaleString('fr-FR')} DA` : 'N/A',
    },
    {
      key: 'disponibilite',
      header: 'Disponibilité',
      render: (article: Article) => {
        // If article has sessions, display all session disponibilities (remaining places / total)
        if (article.sessions && article.sessions.length > 0) {
          return (
            <div className="flex flex-col gap-1">
              {article.sessions.map((session, idx) => {
                const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
                  ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
                  : null;
                const totalPlaces = session.nombre_place;

                const colorClass = placesRestantes === null
                  ? 'text-gray-600'
                  : placesRestantes === 0
                    ? 'text-red-600 font-semibold'
                    : placesRestantes <= 5
                      ? 'text-orange-600 font-semibold'
                      : 'text-green-600 font-semibold';

                return (
                  <span key={session.id || idx} className="text-sm">
                    <span className={colorClass}>
                      {placesRestantes !== null ? placesRestantes : 'N/A'}
                    </span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-700">
                      {totalPlaces || 'N/A'}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        }
        // Fallback to old disponibilite field if no sessions
        const disponibilite = article.disponibilite !== null && article.disponibilite !== undefined
          ? (typeof article.disponibilite === 'string' ? parseInt(article.disponibilite) : article.disponibilite)
          : null;

        // For singular articles without sessions, we might just have total (disponibilite) and remaining (places_restantes) on the article object
        // But usually 'disponibilite' meant 'Total Capacity' in legacy.
        // Let's rely on what was there or try to combine if possible.
        // Legacy: 'disponibilite' was Total. 'places_restantes' was Remaining.

        const placesRestantesSingle = article.places_restantes !== null && article.places_restantes !== undefined
          ? (typeof article.places_restantes === 'string' ? parseInt(article.places_restantes) : article.places_restantes)
          : null;

        if (disponibilite !== null) {
          if (placesRestantesSingle !== null) {
            return (
              <span className="text-sm">
                <span className={placesRestantesSingle === 0 ? 'text-red-600 font-semibold' : placesRestantesSingle <= 5 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {placesRestantesSingle}
                </span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-700">{disponibilite}</span>
              </span>
            );
          }
          return <span className="text-gray-700">{disponibilite}</span>;
        }
        return 'N/A';
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Gestion des Omra</h1>
        <p className="text-text-secondary mt-2">Gérer vos services Omra</p>
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
        title="Détails de l'Omra"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <p className="text-sm text-gray-900">{viewingArticle.label || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                {viewingArticle.sessions && viewingArticle.sessions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingArticle.sessions.map((session, idx) => (
                      <span key={session.id || idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {new Date(session.date).toLocaleDateString('fr-FR')}
                        {session.places_restantes !== null && session.places_restantes !== undefined && (
                          <span className="ml-1">
                            ({session.places_restantes} places restantes)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">
                    {viewingArticle.date_depart
                      ? new Date(viewingArticle.date_depart).toLocaleString('fr-FR')
                      : 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix de l'offre</label>
                <p className="text-sm text-gray-900">{viewingArticle.prix_offre ? `${viewingArticle.prix_offre} DA` : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                {viewingArticle.sessions && viewingArticle.sessions.length > 0 ? (
                  <div className="space-y-2">
                    {viewingArticle.sessions.map((session, idx) => {
                      const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
                        ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
                        : null;
                      return (
                        <div key={session.id || idx} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {new Date(session.date).toLocaleDateString('fr-FR')}:
                          </span>
                          <span className={`text-sm font-semibold ${placesRestantes === null
                            ? 'text-gray-600'
                            : placesRestantes === 0
                              ? 'text-red-600'
                              : placesRestantes <= 5
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}>
                            {placesRestantes !== null ? `${placesRestantes} places restantes` : 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">
                            (sur {session.nombre_place} places)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">{viewingArticle.disponibilite ?? 'N/A'}</p>
                )}
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
            <div className="border-t pt-3 sm:pt-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Détails Omra</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {viewingArticle.nom_hotel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'hôtel</label>
                    <p className="text-sm text-gray-900">{viewingArticle.nom_hotel}</p>
                  </div>
                )}
                {viewingArticle.distance_hotel !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance de l'hôtel</label>
                    <p className="text-sm text-gray-900">{viewingArticle.distance_hotel} mètres</p>
                  </div>
                )}
                {viewingArticle.ville_depart && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville de départ</label>
                    <p className="text-sm text-gray-900">{viewingArticle.ville_depart}</p>
                  </div>
                )}
                {(viewingArticle as any).compagnieAerienne?.nom || (viewingArticle as any).compagnie_aerienne?.nom ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compagnie Aérienne</label>
                    <p className="text-sm text-gray-900">
                      {(viewingArticle as any).compagnieAerienne?.nom || (viewingArticle as any).compagnie_aerienne?.nom}
                      {(viewingArticle as any).compagnieAerienne?.code_iata || (viewingArticle as any).compagnie_aerienne?.code_iata
                        ? ` (${(viewingArticle as any).compagnieAerienne?.code_iata || (viewingArticle as any).compagnie_aerienne?.code_iata})`
                        : ''}
                    </p>
                  </div>
                ) : null}
                {viewingArticle.type_fly && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de vol</label>
                    <p className="text-sm text-gray-900">
                      {viewingArticle.type_fly === 'direct' ? 'Vol Direct' :
                        viewingArticle.type_fly === 'avec_escale' ? 'Vol avec escale' :
                          viewingArticle.type_fly}
                    </p>
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
                {viewingArticle.entree && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville d'entrée</label>
                    <p className="text-sm text-gray-900">{viewingArticle.entree}</p>
                  </div>
                )}
                {viewingArticle.sortie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville de sortie</label>
                    <p className="text-sm text-gray-900">{viewingArticle.sortie}</p>
                  </div>
                )}
                {(viewingArticle.sessions && viewingArticle.sessions.length > 0) && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sessions disponibles</label>
                    <div className="space-y-2">
                      {viewingArticle.sessions.map((session, idx) => {
                        const placesRestantes = session.places_restantes !== null && session.places_restantes !== undefined
                          ? (typeof session.places_restantes === 'string' ? parseInt(session.places_restantes) : session.places_restantes)
                          : null;
                        return (
                          <div key={session.id || idx} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-900">
                                {new Date(session.date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-600">
                                  Capacité: {session.nombre_place} places
                                </span>
                                <span className={`text-sm font-semibold ${placesRestantes === null
                                  ? 'text-gray-600'
                                  : placesRestantes === 0
                                    ? 'text-red-600'
                                    : placesRestantes <= 5
                                      ? 'text-orange-600'
                                      : 'text-green-600'
                                  }`}>
                                  {placesRestantes !== null ? `${placesRestantes} restantes` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(!viewingArticle.sessions || viewingArticle.sessions.length === 0) && viewingArticle.date && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dates de départ disponibles</label>
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
                  <div className="col-span-2">
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

export default OmraArticlesPage;

