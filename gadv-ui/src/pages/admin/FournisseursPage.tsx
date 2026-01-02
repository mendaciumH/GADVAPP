import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ImportModal from '../../components/admin/ImportModal';
import { fournisseursService, Fournisseur } from '../../services/admin.service';

const FournisseursPage: React.FC = () => {
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      setLoading(true);
      const data = await fournisseursService.getAll();
      setFournisseurs(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/fournisseurs/new');
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    navigate(`/admin/fournisseurs/${fournisseur.id}/edit`);
  };

  const handleDelete = async (fournisseur: Fournisseur) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${fournisseur.nom_complet}"?`)) {
      try {
        await fournisseursService.delete(fournisseur.id);
        toast.success('Fournisseur supprimé avec succès');
        loadFournisseurs();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleImport = async (file: File) => {
    const result = await fournisseursService.importFromExcel(file);
    if (result.success > 0) {
      toast.success(`${result.success} fournisseur(s) importé(s) avec succès`);
      loadFournisseurs();
    }
    if (result.errors.length > 0) {
      toast.warning(`${result.errors.length} erreur(s) lors de l'importation`);
    }
    return result;
  };


  const filteredFournisseurs = fournisseurs.filter(f =>
    f.nom_complet.toLowerCase().includes(searchValue.toLowerCase()) ||
    f.numero_mobile?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredFournisseurs.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFournisseurs = filteredFournisseurs.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const columns = [
    { key: 'nom_complet', header: 'Nom complet' },
    { key: 'numero_mobile', header: 'Téléphone', render: (f: Fournisseur) => f.numero_mobile || '-' },
    { 
      key: 'credit_depart', 
      header: 'Crédit départ', 
      render: (f: Fournisseur) => f.credit_depart ? `${Number(f.credit_depart).toFixed(2)} DA` : '-' 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-90">Gestion des Fournisseurs</h1>
          <p className="text-xs sm:text-sm text-gray-70 mt-1">Gérer vos fournisseurs</p>
        </div>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium text-sm sm:text-base"
        >
          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Importer depuis Excel</span>
        </button>
      </div>

      <DataTable
        data={paginatedFournisseurs}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={{
          page: currentPage,
          limit: itemsPerPage,
          total: totalItems,
          onPageChange: setCurrentPage,
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Importer des fournisseurs depuis Excel"
        helpText="Le fichier Excel doit contenir les colonnes suivantes: nom_complet (requis), numero_mobile, notes, credit_depart. La première ligne doit contenir les en-têtes."
      />
    </div>
  );
};

export default FournisseursPage;

