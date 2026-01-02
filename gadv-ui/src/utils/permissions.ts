/**
 * Permission mapping for admin pages
 * Each page requires specific permissions to access
 * 
 * Example: A manager role can be assigned permissions like:
 * - view_clients, manage_clients
 * - view_articles, manage_articles
 * - view_commandes, manage_commandes
 * etc.
 */

export const PAGE_PERMISSIONS = {
  // Dashboard - accessible to all authenticated users with any admin permission
  dashboard: ['view_dashboard'],

  // User Management - typically admin only
  users: ['manage_users'],
  users_new: ['manage_users'],
  users_edit: ['manage_users'],

  // Role Management - typically admin only
  roles: ['manage_roles'],
  roles_new: ['manage_roles'],
  roles_edit: ['manage_roles'],

  // Permission Management - typically admin only
  permissions: ['manage_permissions'],
  permissions_new: ['manage_permissions'],
  permissions_edit: ['manage_permissions'],

  // Client Management - manager and admin
  clients: ['view_clients', 'manage_clients'],
  clients_new: ['manage_clients'],
  clients_edit: ['manage_clients'],

  // Supplier Management - manager and admin
  fournisseurs: ['view_fournisseurs', 'manage_fournisseurs'],
  fournisseurs_new: ['manage_fournisseurs'],
  fournisseurs_edit: ['manage_fournisseurs'],

  // Article Management - manager and admin (includes Omra)
  articles: ['view_articles', 'manage_articles', 'view_omra', 'manage_omra'],
  articles_new: ['manage_articles', 'manage_omra'],
  articles_edit: ['manage_articles', 'manage_omra'],

  // Article Type Management - manager and admin
  type_article: ['view_articles', 'manage_articles'],
  type_article_new: ['manage_articles'],
  type_article_edit: ['manage_articles'],

  // Order Management - manager and admin (includes Omra)
  commandes: ['view_commandes', 'manage_commandes', 'view_omra', 'manage_omra'],
  commandes_new: ['manage_commandes', 'manage_omra'],
  commandes_edit: ['manage_commandes', 'manage_omra'],

  // Reduction Management - manager and admin
  reductions: ['view_reductions', 'manage_reductions'],
  reductions_new: ['manage_reductions'],
  reductions_edit: ['manage_reductions'],

  // Tax Management - manager and admin
  taxes: ['view_taxes', 'manage_taxes'],
  taxes_new: ['manage_taxes'],
  taxes_edit: ['manage_taxes'],

  // Cash Register Management - manager and admin (includes Omra)
  caisses: ['view_caisses', 'manage_caisses', 'view_caisse_omra', 'manage_caisse_omra'],
  caisses_new: ['manage_caisses', 'manage_caisse_omra'],
  caisses_edit: ['manage_caisses', 'manage_caisse_omra'],
  caisse_transactions: ['view_caisses', 'view_caisse_omra'],

  // Invoice Management - manager and admin
  factures: ['view_factures', 'manage_factures'],
  factures_new: ['manage_factures'],
  factures_edit: ['manage_factures'],

  // Payment Voucher Management - manager and admin
  bon_de_versement: ['view_bon_de_versement', 'manage_bon_de_versement'],
  bon_de_versement_new: ['manage_bon_de_versement'],
  bon_de_versement_edit: ['manage_bon_de_versement'],

  // Refund Voucher Management - manager and admin
  bon_de_remboursement: ['view_bon_de_remboursement', 'manage_bon_de_remboursement'],
  bon_de_remboursement_new: ['manage_bon_de_remboursement'],
  bon_de_remboursement_edit: ['manage_bon_de_remboursement'],

  // Receivables Statement - manager and admin (dedicated permission for financial overview)
  etat_creances: ['view_etat_creances', 'manage_etat_creances'],

  // Agency Info Management - manager and admin
  info_agence: ['view_info_agence', 'manage_info_agence'],
  info_agence_new: ['manage_info_agence'],
  info_agence_edit: ['manage_info_agence'],

  // Publish Page - manager and admin
  publish: ['publish_content'],
} as const;

/**
 * Get required permissions for a page route
 */
export function getPagePermissions(pageKey: keyof typeof PAGE_PERMISSIONS): string[] {
  return PAGE_PERMISSIONS[pageKey] ? [...PAGE_PERMISSIONS[pageKey]] : [];
}

/**
 * Common permission groups for easy role assignment
 */
export const PERMISSION_GROUPS = {
  // Full admin access
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_roles',
    'manage_permissions',
    'view_clients',
    'manage_clients',
    'view_fournisseurs',
    'manage_fournisseurs',
    'view_articles',
    'manage_articles',
    'view_commandes',
    'manage_commandes',
    'view_reductions',
    'manage_reductions',
    'view_taxes',
    'manage_taxes',
    'view_caisses',
    'manage_caisses',
    'view_factures',
    'manage_factures',
    'view_bon_de_versement',
    'manage_bon_de_versement',
    'view_bon_de_remboursement',
    'manage_bon_de_remboursement',
    'view_etat_creances',
    'manage_etat_creances',
    'view_info_agence',
    'manage_info_agence',
    'publish_content',
  ],

  // Manager access - can view and manage most things but not users/roles/permissions
  manager: [
    'view_dashboard',
    'view_clients',
    'manage_clients',
    'view_fournisseurs',
    'manage_fournisseurs',
    'view_articles',
    'manage_articles',
    'view_commandes',
    'manage_commandes',
    'view_reductions',
    'manage_reductions',
    'view_taxes',
    'manage_taxes',
    'view_caisses',
    'manage_caisses',
    'view_factures',
    'manage_factures',
    'view_bon_de_versement',
    'manage_bon_de_versement',
    'view_bon_de_remboursement',
    'manage_bon_de_remboursement',
    'view_etat_creances',
    'manage_etat_creances',
    'view_info_agence',
    'manage_info_agence',
    'publish_content',
  ],

  // Viewer access - can only view, not manage
  viewer: [
    'view_dashboard',
    'view_clients',
    'view_fournisseurs',
    'view_articles',
    'view_commandes',
    'view_reductions',
    'view_taxes',
    'view_caisses',
    'view_factures',
    'view_bon_de_versement',
    'view_bon_de_remboursement',
    'view_info_agence',
  ],
} as const;

