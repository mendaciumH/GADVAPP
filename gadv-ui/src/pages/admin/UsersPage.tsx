import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import DataTable from '../../components/admin/DataTable';
import { usersService, User } from '../../services/admin.service';
import { UserPlus } from 'lucide-react';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await usersService.getAll();
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/users/new');
  };

  const handleEdit = (user: User) => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const handleDelete = async (user: User) => {
    // Prevent deletion of admin user
    if (user.id === 1) {
      toast.error('Impossible de supprimer l\'utilisateur administrateur');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}"?`)) {
      try {
        await usersService.delete(user.id);
        toast.success('Utilisateur supprimé avec succès');
        loadData();
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
        toast.error(errorMessage);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      key: 'username',
      header: 'Nom d\'utilisateur',
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => user.email || <span className="text-gray-400">N/A</span>,
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (user: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role?.name === 'admin' 
            ? 'bg-purple-100 text-purple-800' 
            : user.role?.name === 'Manager'
            ? 'bg-blue-100 text-blue-800'
            : user.role?.name === 'Comptable'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {user.role?.name || 'Aucun rôle'}
        </span>
      ),
    },
  ];

  // Show loading state immediately while data is being fetched
  if (loading && users.length === 0) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-text-secondary mt-2">Gérer les utilisateurs du système et leurs rôles</p>
        </div>
        <div className="text-sm text-text-secondary">
          Total: <span className="font-semibold text-primary">{users.length}</span> utilisateur{users.length > 1 ? 's' : ''}
        </div>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

    </motion.div>
  );
};

export default UsersPage;

