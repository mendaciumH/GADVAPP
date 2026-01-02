import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import { caissesService, Caisse } from '../../services/admin.service';
import { Star, Wallet } from 'lucide-react';

const CaissesPage: React.FC = () => {
  const navigate = useNavigate();
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadCaisses();
  }, []);

  const loadCaisses = async () => {
    try {
      setLoading(true);
      const data = await caissesService.getAll();
      setCaisses(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/caisses/new');
  };

  const handleEdit = (caisse: Caisse) => {
    navigate(`/admin/caisses/${caisse.id}/edit`);
  };

  const handleDelete = async (caisse: Caisse) => {
    // Prevent deleting caisse principale
    if (caisse.is_principale) {
      toast.error('Impossible de supprimer la caisse principale');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la caisse "${caisse.nom_caisse}"?`)) {
      try {
        await caissesService.delete(caisse.id);
        toast.success('Caisse supprimée avec succès');
        loadCaisses();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredCaisses = caisses.filter(c =>
    c.nom_caisse.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { 
      key: 'nom_caisse', 
      header: 'Nom',
      render: (c: Caisse) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{c.nom_caisse}</span>
          {c.is_principale && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Star className="w-3 h-3" />
              Principale
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'montant_depart', 
      header: 'Montant départ', 
      render: (c: Caisse) => (
        <span className="text-gray-600">
          {(Number(c.montant_depart) || 0).toFixed(2)} {c.devise || 'DZD'}
        </span>
      )
    },
    { 
      key: 'solde_actuel', 
      header: 'Solde actuel', 
      render: (c: Caisse) => (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {(Number(c.solde_actuel) || 0).toFixed(2)} {c.devise || 'DZD'}
          </span>
        </div>
      )
    },
    { key: 'devise', header: 'Devise' },
  ];

  // Calculate total balance
  const totalBalance = caisses.reduce((sum, c) => sum + (Number(c.solde_actuel) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestion des Caisses</h1>
          <p className="text-text-secondary mt-2">Gérer vos caisses</p>
        </div>
        
        {/* Total balance card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-white/80">Solde total</p>
              <p className="text-2xl font-bold">{totalBalance.toFixed(2)} DZD</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredCaisses}
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

export default CaissesPage;

