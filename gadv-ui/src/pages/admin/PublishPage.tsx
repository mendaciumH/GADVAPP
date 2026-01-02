import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { articlesService, Article } from '../../services/admin.service';
import { Globe, CheckCircle, XCircle, Eye } from 'lucide-react';

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

const PublishPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const articlesData = await articlesService.getAll();
      // Filter to only show "Voyage organisé" articles
      const voyageOrganiseArticles = (articlesData || []).filter(article => {
        const typeDescription = article.type_article?.description?.toLowerCase().trim() || '';
        const isVoyageOrganise = 
          typeDescription === 'voyage organisé' ||
          typeDescription === 'voyage organise' ||
          (typeDescription.includes('voyage') && typeDescription.includes('organisé')) ||
          article.id_type_article === 2; // ID 2 is "Voyage organisé" in seed data
        return isVoyageOrganise;
      });
      setArticles(voyageOrganiseArticles);
    } catch (error: any) {
      console.error('Error loading articles:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (article: Article) => {
    try {
      const newPublishedStatus = !article.is_published;
      await articlesService.update(article.id, { is_published: newPublishedStatus });
      toast.success(newPublishedStatus ? 'Article publié avec succès' : 'Article retiré de la publication');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleView = (article: Article) => {
    setViewingArticle(article);
    setIsViewModalOpen(true);
  };

  const filteredArticles = articles.filter(article =>
    article.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const totalItems = filteredArticles.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const columns = [
    { key: 'label', header: 'Libellé' },
    { 
      key: 'type_article',
      header: 'Type',
      render: (article: Article) => article.type_article?.description || 'N/A',
    },
    { 
      key: 'prix_offre',
      header: 'Prix',
      render: (article: Article) => article.prix_offre ? `${article.prix_offre} DA` : 'N/A',
    },
    {
      key: 'is_published',
      header: 'Statut',
      render: (article: Article) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          article.is_published 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {article.is_published ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Publié
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Non publié
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (article: Article) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(article)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Voir
          </button>
          <button
            onClick={() => handleTogglePublish(article)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              article.is_published
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {article.is_published ? (
              <>
                <XCircle className="w-4 h-4 inline mr-1" />
                Retirer
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 inline mr-1" />
                Publier
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Publier sur le site</h1>
        <p className="text-text-secondary mt-2">Gérer la publication des services de type "Voyage organisé" sur le site web</p>
      </div>

      <DataTable
        data={paginatedArticles}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <p className="text-sm text-gray-900">{viewingArticle.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
                <p className="text-sm text-gray-900">{viewingArticle.type_article?.description || 'N/A'}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publié</label>
                <p className="text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    viewingArticle.is_published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingArticle.is_published ? 'Oui' : 'Non'}
                  </span>
                </p>
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

            {/* Voyage organisé-specific fields */}
            {(viewingArticle.destination || viewingArticle.date_retour || viewingArticle.duree_voyage || viewingArticle.type_hebergement || viewingArticle.transport || viewingArticle.programme) && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails Voyage organisé</h3>
                <div className="grid grid-cols-2 gap-4">
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

export default PublishPage;

