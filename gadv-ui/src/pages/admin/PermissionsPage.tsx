import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { rolesService, permissionsService, Role, Permission } from '../../services/admin.service';
import { PAGE_PERMISSIONS } from '../../utils/permissions';
import api from '../../services/api';
import { Save, Shield } from 'lucide-react';
import PageLayout from '../../components/admin/PageLayout';
import { commonStyles } from '../../styles/theme';

// Translation map for permissions to French
const permissionTranslations: Record<string, string> = {
  view_dashboard: 'Voir le tableau de bord',
  manage_users: 'Gérer les utilisateurs',
  manage_roles: 'Gérer les rôles',
  manage_permissions: 'Gérer les permissions',
  view_clients: 'Voir les clients',
  manage_clients: 'Gérer les clients',
  view_fournisseurs: 'Voir les fournisseurs',
  manage_fournisseurs: 'Gérer les fournisseurs',
  view_articles: 'Voir les services',
  manage_articles: 'Gérer les services',
  view_commandes: 'Voir les commandes',
  manage_commandes: 'Gérer les commandes',
  view_reductions: 'Voir les réductions',
  manage_reductions: 'Gérer les réductions',
  view_taxes: 'Voir les taxes',
  manage_taxes: 'Gérer les taxes',
  view_caisses: 'Voir les caisses',
  manage_caisses: 'Gérer les caisses',
  view_factures: 'Voir les factures',
  manage_factures: 'Gérer les factures',
  view_bon_de_versement: 'Voir les bons de versement',
  manage_bon_de_versement: 'Gérer les bons de versement',
  view_info_agence: 'Voir les informations de l\'agence',
  manage_info_agence: 'Gérer les informations de l\'agence',
  publish_content: 'Publier du contenu',
  view_omra: 'Voir les services Omra',
  manage_omra: 'Gérer les services Omra',
  view_caisse_omra: 'Voir la caisse Omra',
  manage_caisse_omra: 'Gérer la caisse Omra',
  view_bon_de_remboursement: 'Voir les bons de remboursement',
  manage_bon_de_remboursement: 'Gérer les bons de remboursement',
  view_etat_creances: 'Voir l\'état des créances',
  manage_etat_creances: 'Gérer l\'état des créances',
};

// Group permissions by resource to avoid repetition
const groupPermissionsByResource = (permissions: Permission[]) => {
  const resourceMap: Record<string, { view?: Permission; manage?: Permission }> = {};

  permissions.forEach(permission => {
    const parts = permission.name.split('_');
    if (parts.length >= 2) {
      const action = parts[0]; // 'view' or 'manage'
      const resource = parts.slice(1).join('_'); // resource name

      if (!resourceMap[resource]) {
        resourceMap[resource] = {};
      }

      if (action === 'view') {
        resourceMap[resource].view = permission;
      } else if (action === 'manage') {
        resourceMap[resource].manage = permission;
      }
    } else {
      // Handle special permissions like 'publish_content'
      const key = permission.name;
      if (!resourceMap[key]) {
        resourceMap[key] = {};
      }
      resourceMap[key].manage = permission;
    }
  });

  return resourceMap;
};

// Resource name translations
const resourceTranslations: Record<string, string> = {
  dashboard: 'Tableau de bord',
  users: 'Utilisateurs',
  roles: 'Rôles',
  permissions: 'Permissions',
  clients: 'Clients',
  fournisseurs: 'Fournisseurs',
  articles: 'Services',
  commandes: 'Commandes',
  reductions: 'Réductions',
  taxes: 'Taxes',
  caisses: 'Caisses',
  factures: 'Factures',
  bon_de_versement: 'Bons de versement',
  info_agence: 'Informations agence',
  publish_content: 'Publication',
  omra: 'Services Omra',
  caisse_omra: 'Caisse Omra',
  bon_de_remboursement: 'Bons de remboursement',
  etat_creances: 'État des créances',
};

const PermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [rolesData, permissionsData] = await Promise.all([
        rolesService.getAll(),
        permissionsService.getAll(),
      ]);

      // admin already have all permissions !
      const filteredRoles = rolesData.filter(role => {
        const isAdmin = role.id === 1 || role.name?.toLowerCase() === 'admin';
        return !isAdmin;
      });
      console.log('Roles loaded:', { all: rolesData.length, filtered: filteredRoles.length, roles: filteredRoles.map(r => ({ id: r.id, name: r.name })) });
      setRoles(filteredRoles);

      // Sync permissions from PAGE_PERMISSIONS if needed
      const allPermissionNames = new Set<string>();
      Object.values(PAGE_PERMISSIONS).forEach(perms => {
        perms.forEach(perm => allPermissionNames.add(perm));
      });

      const permissionNamesArray = Array.from(allPermissionNames);
      const existingPermissionNames = new Set(permissionsData.map(p => p.name));
      const missingPermissions = permissionNamesArray.filter(name => !existingPermissionNames.has(name));

      let finalPermissions = permissionsData;
      if (missingPermissions.length > 0) {
        await api.post('/admin/permissions/sync', { permission_names: permissionNamesArray });
        finalPermissions = await permissionsService.getAll();
      }

      setPermissions(finalPermissions);

      // Load permissions for each role
      const permissionsMap: Record<number, number[]> = {};
      for (const role of filteredRoles) {
        try {
          const roleWithPermissions = await rolesService.getById(role.id);
          const assignedPermissions = (roleWithPermissions as any).permissions || [];
          permissionsMap[role.id] = assignedPermissions.map((p: Permission) => p.id);
        } catch (error) {
          permissionsMap[role.id] = [];
        }
      }
      setRolePermissionsMap(permissionsMap);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (roleId: number, permissionId: number) => {
    setRolePermissionsMap(prev => {
      const currentPermissions = prev[roleId] || [];
      const newPermissions = currentPermissions.includes(permissionId)
        ? currentPermissions.filter(id => id !== permissionId)
        : [...currentPermissions, permissionId];
      return { ...prev, [roleId]: newPermissions };
    });
  };

  const handleToggleView = (roleId: number, permissionId: number | undefined) => {
    if (permissionId) {
      handlePermissionToggle(roleId, permissionId);
    }
  };

  const handleToggleManage = (roleId: number, permissionId: number | undefined) => {
    if (permissionId) {
      handlePermissionToggle(roleId, permissionId);
      // If managing, also grant view permission
      const resourcePermissions = groupPermissionsByResource(permissions);
      const permission = permissions.find(p => p.id === permissionId);
      if (permission) {
        const parts = permission.name.split('_');
        if (parts[0] === 'manage' && parts.length > 1) {
          const resource = parts.slice(1).join('_');
          const viewPermission = resourcePermissions[resource]?.view;
          if (viewPermission && !rolePermissionsMap[roleId]?.includes(viewPermission.id)) {
            handlePermissionToggle(roleId, viewPermission.id);
          }
        }
      }
    }
  };

  const handleSaveRole = async (roleId: number) => {
    try {
      setSaving(true);
      setSavingRoleId(roleId);

      const permissionIds = (rolePermissionsMap[roleId] || []).map(id => Number(id));
      console.log('Saving role permissions:', { roleId, permissionIds, original: rolePermissionsMap[roleId] });

      await rolesService.update(roleId, {
        permission_ids: permissionIds,
      });

      toast.success('Permissions mises à jour avec succès');
    } catch (error: any) {
      console.error('Error saving role permissions:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erreur lors de l\'enregistrement';

      // Log full error details for debugging
      if (error.response?.data) {
        console.error('Full error response:', error.response.data);
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setSavingRoleId(null);
    }
  };

  // Filter out admin-only resources (users, roles, permissions)
  const adminOnlyResources = ['users', 'roles', 'permissions'];
  const resourceGroups = Object.fromEntries(
    Object.entries(groupPermissionsByResource(permissions)).filter(
      ([resource]) => !adminOnlyResources.includes(resource)
    )
  );

  if (loading) {
    return (
      <PageLayout
        title="Équipe & Permissions"
        subtitle="Contrôlez les niveaux d'accès et assignez des rôles à votre équipe"
        icon={Shield}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className={commonStyles.loadingSpinner + ' mb-3'}></div>
            <p className={commonStyles.loadingText}>Chargement...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Équipe & Permissions"
      subtitle="Contrôlez les niveaux d'accès et assignez des rôles à votre équipe"
      icon={Shield}
    >
      <div className="space-y-4">

        {/* Optimized Permissions Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={commonStyles.card + ' overflow-hidden'}
        >
          {/* Table Header */}
          <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] gap-0 bg-white border-b-2 border-gray-300">
            <div className="px-3 py-1.5 border-r border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ressources</span>
            </div>
            {roles.map((role) => (
              <div key={role.id} className="px-3 py-1.5 border-r border-gray-200 last:border-r-0 text-center">
                <span className="text-xs font-semibold text-gray-700">{role.name}</span>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {Object.entries(resourceGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([resource, { view, manage }]) => {
                const resourceName = resourceTranslations[resource] || resource;
                const hasBoth = view && manage;

                return (
                  <div key={resource} className="group hover:bg-gray-50 transition-colors">
                    {/* Resource Row */}
                    <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] gap-0">
                      {/* Resource Name */}
                      <div className="px-3 py-1.5 border-r border-gray-200 flex items-center">
                        <span className="text-sm font-medium text-gray-900">{resourceName}</span>
                      </div>

                      {/* Role Columns */}
                      {roles.map((role) => {
                        const rolePerms = rolePermissionsMap[role.id] || [];
                        const hasView = view ? rolePerms.includes(view.id) : false;
                        const hasManage = manage ? rolePerms.includes(manage.id) : false;

                        return (
                          <div
                            key={role.id}
                            className="px-3 py-1.5 border-r border-gray-200 last:border-r-0 flex items-center justify-center gap-2"
                          >
                            {hasBoth ? (
                              // Show both view and manage toggles
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasView}
                                    onChange={() => handleToggleView(role.id, view?.id)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                  />
                                  <span className="text-xs text-gray-600">Voir</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasManage}
                                    onChange={() => handleToggleManage(role.id, manage?.id)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                  />
                                  <span className="text-xs text-gray-600">Gérer</span>
                                </label>
                              </div>
                            ) : manage ? (
                              // Only manage permission
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasManage}
                                  onChange={() => handlePermissionToggle(role.id, manage.id)}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                              </label>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Save Buttons Row */}
          <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] gap-0 bg-white border-t-2 border-gray-300">
            <div className="px-3 py-1.5 border-r border-gray-200"></div>
            {roles.map((role) => (
              <div key={role.id} className="px-3 py-1.5 border-r border-gray-200 last:border-r-0 flex justify-center">
                <button
                  onClick={() => handleSaveRole(role.id)}
                  disabled={saving && savingRoleId === role.id}
                  className={commonStyles.btnPrimary + ' flex items-center gap-1'}
                >
                  <Save className="w-3 h-3" />
                  {saving && savingRoleId === role.id ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={commonStyles.infoBox}
        >
          <p className={commonStyles.infoText}>
            <strong>Note:</strong> Le rôle <strong>Admin</strong> a automatiquement toutes les permissions et n'apparaît pas dans cette liste.
            Les ressources <strong>Utilisateurs</strong>, <strong>Rôles</strong> et <strong>Permissions</strong> sont réservées à l'admin uniquement.
          </p>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default PermissionsPage;
