import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DataTable from '../../components/admin/DataTable';
import { rolesService, Role } from '../../services/admin.service';

const RolesPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    navigate('/admin/roles/new');
  };

  const handleEdit = (role: Role) => {
    // Prevent editing admin role
    if (role.id === 1) {
      toast.error('Le rôle admin ne peut pas être modifié');
      return;
    }
    navigate(`/admin/roles/${role.id}/edit`);
  };

  const handleDelete = async (role: Role) => {
    // Prevent deleting admin role
    if (role.id === 1) {
      toast.error('Le rôle admin ne peut pas être supprimé');
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}"?`)) {
      try {
        await rolesService.delete(role.id);
        toast.success('Rôle supprimé avec succès');
        loadRoles();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Check if role can be edited (admin role with id: 1 cannot be edited)
  const canEditRole = (role: Role) => role.id !== 1;

  // Check if role can be deleted (admin role with id: 1 cannot be deleted)
  const canDeleteRole = (role: Role) => role.id !== 1;


  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Nom',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Gestion des Rôles</h1>
        <p className="text-text-secondary mt-2">Gérer les rôles des utilisateurs</p>
      </div>

      <DataTable
        data={filteredRoles}
        columns={columns}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditRole}
        canDelete={canDeleteRole}
      />

    </div>
  );
};

export default RolesPage;

