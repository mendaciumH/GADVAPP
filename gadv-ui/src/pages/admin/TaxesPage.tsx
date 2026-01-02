import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import { taxesService, Taxe } from '../../services/admin.service';

const TaxesPage: React.FC = () => {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const taxesData = await taxesService.getAll();
      setTaxes(taxesData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/taxes/new');
  };

  const handleEdit = (taxe: Taxe) => {
    navigate(`/admin/taxes/${taxe.id}/edit`);
  };

  const handleDelete = async (taxe: Taxe) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette taxe?')) {
      try {
        await taxesService.delete(taxe.id);
        toast.success('Taxe supprimée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredTaxes = taxes.filter(t =>
    t.reference?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'reference', header: 'Référence' },
    { key: 'type_article', header: 'Type article', render: (t: Taxe) => t.type_article?.description || 'N/A' },
    { key: 'taxe', header: 'Taxe', render: (t: Taxe) => 
      t.taxe_fixe ? `${t.montant_taxe_fixe} DA` : `${t.taxe_pourcentage}%`
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Gestion des Taxes</h1>
        <p className="text-text-secondary mt-2">Gérer les taxes</p>
      </div>

      <DataTable
        data={filteredTaxes}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TaxesPage;

