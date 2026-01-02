import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { infoAgenceService, InfoAgence } from '../../services/admin.service';
import { Building2, Plus, Save } from 'lucide-react';

// Helper function to construct full URL from logo filename
const constructLogoUrl = (filename: string | null): string | null => {
  if (!filename) return null;

  // Get API base URL (same logic as api.ts)
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
  const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const uploadsPrefix = isDevelopment ? '/uploads/' : '/api/uploads/';
  return `${apiUrl}${uploadsPrefix}${filename}`;
};

const InfoAgencePage: React.FC = () => {
  const navigate = useNavigate();
  const [infoAgence, setInfoAgence] = useState<InfoAgence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const data = await infoAgenceService.getAll();
      setInfoAgence(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/info-agence/new');
  };

  const handleEdit = (info: InfoAgence) => {
    navigate(`/admin/info-agence/${info.id}/edit`);
  };


  // Show loading state immediately while data is being fetched
  if (loading && infoAgence.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Informations de l'Agence
          </h1>
          <p className="text-text-secondary mt-2">Gérer les informations de votre agence</p>
        </div>
        <div className="text-sm text-text-secondary">
          Total: <span className="font-semibold text-primary">{infoAgence.length}</span> enregistrement{infoAgence.length > 1 ? 's' : ''}
        </div>
      </div>

      {infoAgence.length === 0 ? (
        <div className="bg-surface rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-text-secondary text-lg mb-4">Aucune information d'agence enregistrée</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter les informations de l'agence</span>
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {infoAgence.map((info) => (
            <div key={info.id} className="p-4 sm:p-8">
              {/* Header with Logo and Name - Responsive Column on Mobile */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-8 border-b border-gray-200 text-center md:text-left">
                <div className="flex-shrink-0">
                  {info.logo && typeof info.logo === 'string' ? (
                    <div className="w-32 h-32 rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center mx-auto md:mx-0">
                      <img
                        src={constructLogoUrl(info.logo) || ''}
                        alt={`Logo ${info.nom_agence}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<Building2 className="w-16 h-16 text-gray-400" />';
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-gray-200 flex items-center justify-center mx-auto md:mx-0">
                      <Building2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">{info.nom_agence}</h2>
                      {info.code_iata && (
                        <p className="text-text-secondary mb-4">
                          <span className="font-semibold">Code IATA:</span> {info.code_iata}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(info)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2 border-b-0">
                    <Building2 className="w-5 h-5 text-primary" />
                    Informations de contact
                  </h3>

                  <div className="space-y-4 pl-1">
                    {info.adresse && (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-text-secondary font-medium min-w-[100px]">Adresse:</span>
                        <span className="text-text-primary">{info.adresse}</span>
                      </div>
                    )}
                    {info.tel && (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-text-secondary font-medium min-w-[100px]">Téléphone:</span>
                        <span className="text-text-primary font-mono">{info.tel}</span>
                      </div>
                    )}
                    {info.fax && (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-text-secondary font-medium min-w-[100px]">Fax:</span>
                        <span className="text-text-primary font-mono">{info.fax}</span>
                      </div>
                    )}
                    {info.email && (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-text-secondary font-medium min-w-[100px]">Email:</span>
                        <a href={`mailto:${info.email}`} className="text-primary hover:underline break-all">
                          {info.email}
                        </a>
                      </div>
                    )}
                    {info.site_web && (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-text-secondary font-medium min-w-[100px]">Site web:</span>
                        <a
                          href={info.site_web.startsWith('http') ? info.site_web : `https://${info.site_web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {info.site_web}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal & Banking Information */}
                <div className="space-y-8">
                  {/* Legal Info */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2 border-b-0">
                      <Save className="w-5 h-5 text-primary" />
                      Informations Légales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pl-1">
                      {info.n_licence && (
                        <div className="col-span-full">
                          <span className="text-text-secondary font-medium block text-xs uppercase tracking-wider mb-1">N° Licence</span>
                          <span className="text-text-primary font-mono font-medium text-lg">{info.n_licence}</span>
                        </div>
                      )}
                      {info.n_rc && (
                        <div>
                          <span className="text-text-secondary font-medium block text-xs uppercase tracking-wider mb-1">RC</span>
                          <span className="text-text-primary font-mono">{info.n_rc}</span>
                        </div>
                      )}
                      {info.nif && (
                        <div>
                          <span className="text-text-secondary font-medium block text-xs uppercase tracking-wider mb-1">NIF</span>
                          <span className="text-text-primary font-mono">{info.nif}</span>
                        </div>
                      )}
                      {info.nis && (
                        <div>
                          <span className="text-text-secondary font-medium block text-xs uppercase tracking-wider mb-1">NIS</span>
                          <span className="text-text-primary font-mono">{info.nis}</span>
                        </div>
                      )}
                      {info.ar && (
                        <div>
                          <span className="text-text-secondary font-medium block text-xs uppercase tracking-wider mb-1">AI (Article)</span>
                          <span className="text-text-primary font-mono">{info.ar}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banking Info */}
                  {info.rib && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Relevé d'Identité Bancaire (RIB)</h4>
                      <div className="pl-1 font-mono text-indigo-900 break-all select-all text-lg">
                        {info.rib}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Facturation Settings */}
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-xl font-semibold text-text-primary mb-6">Paramètres de Facturation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {info.prefix_factures && (
                    <div className="flex items-center gap-3">
                      <span className="text-text-secondary font-medium">Préfixe par défaut:</span>
                      <span className="text-text-primary font-mono font-medium text-lg">{info.prefix_factures}</span>
                    </div>
                  )}
                  {info.pied_facture && (
                    <div className="col-span-full">
                      <span className="text-text-secondary font-medium block mb-2">Pied de facture (Note par défaut):</span>
                      <div className="text-text-primary text-sm whitespace-pre-wrap italic pl-1 text-gray-600">
                        {info.pied_facture}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default InfoAgencePage;

