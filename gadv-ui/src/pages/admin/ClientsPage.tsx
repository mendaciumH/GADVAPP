import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ImportModal from '../../components/admin/ImportModal';
import { clientsService, Client } from '../../services/admin.service';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/clients/new');
  };

  const handleEdit = (client: Client) => {
    navigate(`/admin/clients/${client.id}/edit`);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.nom_complet || client.id}"?`)) {
      try {
        await clientsService.delete(client.id);
        toast.success('Client supprimé avec succès');
        loadClients();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleImport = async (file: File) => {
    const result = await clientsService.importFromExcel(file);
    if (result.success > 0) {
      toast.success(`${result.success} client(s) importé(s) avec succès`);
      loadClients();
    }
    if (result.errors.length > 0) {
      toast.warning(`${result.errors.length} erreur(s) lors de l'importation`);
    }
    return result;
  };


  const filteredClients = clients.filter(client => {
    const searchLower = searchValue.toLowerCase();
    const name = client.type_client === 'Entreprise' 
      ? client.nom_entreprise?.toLowerCase() 
      : client.nom_complet?.toLowerCase();
    return (
      name?.includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.numero_mobile?.includes(searchValue) ||
      client.numero_mobile_2?.includes(searchValue)
    );
  });

  // Pagination logic
  const totalItems = filteredClients.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const columns = [
    { 
      key: 'nom', 
      header: 'Nom',
      render: (client: Client) => {
        if (client.type_client === 'Entreprise') {
          return client.nom_entreprise || '-';
        }
        return client.nom_complet || '-';
      }
    },
    { key: 'type_client', header: 'Type' },
    { key: 'numero_mobile', header: 'Téléphone' },
    { key: 'email', header: 'Email' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Gestion des Clients</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Gérer vos clients</p>
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
        data={paginatedClients}
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
        title="Importer des clients depuis Excel"
        helpText="Le fichier Excel doit contenir les colonnes suivantes: type_client (Particulier/Entreprise), nom_complet, nom_entreprise, numero_mobile, email, etc. La première ligne doit contenir les en-têtes."
      />
    </div>
  );
};

export default ClientsPage;

