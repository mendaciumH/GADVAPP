import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import { reductionsService, Reduction } from '../../services/admin.service';

const ReductionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reductions, setReductions] = useState<Reduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const reductionsData = await reductionsService.getAll();
      setReductions(reductionsData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/reductions/new');
  };

  const handleEdit = (reduction: Reduction) => {
    navigate(`/admin/reductions/${reduction.id}/edit`);
  };

  const handleDelete = async (reduction: Reduction) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réduction?')) {
      try {
        await reductionsService.delete(reduction.id);
        toast.success('Réduction supprimée avec succès');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredReductions = reductions.filter(r =>
    r.reference?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'reference', header: 'Référence' },
    { key: 'type_article', header: 'Type article', render: (r: Reduction) => r.type_article?.description || 'N/A' },
    { key: 'reduction', header: 'Réduction', render: (r: Reduction) => 
      r.reduction_fixe ? `${r.montant_reduction_fixe} DA` : `${r.reduction_pourcentage}%`
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Gestion des Réductions</h1>
        <p className="text-text-secondary mt-2">Gérer les réductions</p>
      </div>

      <DataTable
        data={filteredReductions}
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

export default ReductionsPage;

