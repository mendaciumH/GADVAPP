import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import { typeArticleService, TypeArticle } from '../../services/admin.service';

const TypeArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState<TypeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await typeArticleService.getAll();
      setTypes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/type-article/new');
  };

  const handleEdit = (type: TypeArticle) => {
    navigate(`/admin/type-article/${type.id}/edit`);
  };

  const handleDelete = async (type: TypeArticle) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type "${type.description}"?`)) {
      try {
        await typeArticleService.delete(type.id);
        toast.success('Type supprimé avec succès');
        loadTypes();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };


  const filteredTypes = types.filter(type =>
    type.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    { key: 'description', header: 'Description' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Types de Services</h1>
        <p className="text-text-secondary mt-2">Gérer les types de services</p>
      </div>

      <DataTable
        data={filteredTypes}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        //onAdd={handleAdd}
        onEdit={handleEdit}
        // onDelete={handleDelete}
      />

    </div>
  );
};

export default TypeArticlePage;

