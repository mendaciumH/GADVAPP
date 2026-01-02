import api from './api';

// Base CRUD service patterns
export interface BaseEntity {
  id: number;
}

// Roles
export interface Role extends BaseEntity {
  name: string;
  permissions?: Permission[];
}

// Role update payload (includes permission_ids)
export interface UpdateRolePayload {
  name?: string;
  permission_ids?: number[];
}

// Permissions
export interface Permission extends BaseEntity {
  name: string;
}

// Users
export interface User extends BaseEntity {
  username: string;
  motdepasse?: string;
  role_id?: number;
  email?: string;
  role?: Role;
}

// Type Article
export interface TypeArticle extends BaseEntity {
  description: string;
}

// Fournisseurs
export interface Fournisseur extends BaseEntity {
  nom_complet: string;
  numero_mobile?: string;
  notes?: string;
  credit_depart?: number;
}

// Compagnies Aériennes
export interface CompagnieAerienne extends BaseEntity {
  nom: string;
  code_iata?: string;
  code_icao?: string;
}

// Caisses
export interface Caisse {
  id: number;
  nom_caisse: string;
  montant_depart: number;
  solde_actuel: number;
  devise: string;
  is_principale: boolean;
  created_at?: string;
}

export interface CaisseTransaction {
  id: number;
  caisse_id: number;
  user_id?: number | null;
  type: 'encaissement' | 'décaissement';
  montant: string | number;
  reference_type: 'facture' | 'bon_versement' | 'bon_remboursement';
  reference_id: number;
  description?: string;
  date_transaction: string;
  user?: User; // Optional user relation
}
// Clients
export type ClientType = 'Particulier' | 'Entreprise';
export interface Client extends BaseEntity {
  type_client: ClientType;
  nom_complet?: string;
  numero_passeport?: string;
  expiration_passeport?: string;
  numero_mobile?: string;
  numero_mobile_2?: string;
  email?: string;
  date_naissance?: string;
  notes?: string;
  image?: string;
  nom_entreprise?: string;
  rc?: string;
  nif?: string;
  ai?: string;
  nis?: string;
  prefere_facturation?: boolean;
}

// Room type interface (used by Omra, Voyage organisé, Réservation hôtel)
export interface Chambre {
  id?: number;
  type_chambre: string;
  prix: number;
}

// Articles
export interface Article extends BaseEntity {
  date_depart?: string;
  label: string;
  description?: string;
  image_banner?: string;
  fournisseur_id?: number;
  commission?: number;
  offre_limitee?: boolean;
  disponibilite?: number;
  places_restantes?: number | null; // Dynamically calculated remaining places
  prix_offre?: number;
  is_archiver?: boolean;
  is_published?: boolean;
  id_type_article?: number;
  sessions?: Array<{
    id: number;
    date: string;
    nombre_place: number;
    places_restantes?: number | null;
  }>;
  fournisseur?: Fournisseur;
  type_article?: TypeArticle;
  // Omra-specific fields
  date?: string | string[]; // Can be a single date or array of dates (tags)
  chambres?: Chambre[]; // Room types with prices (used by Omra, Voyage organisé, Réservation hôtel)
  nom_hotel?: string;
  distance_hotel?: number; // Distance from hotel to Haram (Omra)
  entree?: string; // Entry city (Omra)
  sortie?: string; // Exit city (Omra)
  tarif_additionnel?: number; // Additional tariff (Omra)
  // Demande Visa-specific fields
  pays_destination?: string;
  type_visa?: string;
  duree_validite?: string;
  delai_traitement?: string;
  documents_requis?: string | string[]; // Can be a single value or array (tags)
  // Voyage organisé-specific fields
  destination?: string;
  date_retour?: string;
  duree_voyage?: string;
  type_hebergement?: string;
  transport?: string;
  programme?: string | string[]; // Can be a single value or array (tags)
  // Assurance voyage-specific fields
  type_assurance?: string;
  duree_couverture?: string;
  zone_couverture?: string;
  montant_couverture?: string;
  franchise?: string;
  conditions_particulieres?: string | string[]; // Can be a single value or array (tags)
  // Billet d'avion-specific fields
  aeroport_depart?: string;
  aeroport_arrivee?: string;
  date_depart_vol?: string;
  date_retour_vol?: string;
  compagnie_aerienne_id?: number;
  compagnie_aerienne?: CompagnieAerienne;
  numero_vol?: string;
  classe_vol?: string;
  escales?: string | string[]; // Can be a single value or array (tags)
  // Réservation hôtels-specific fields
  date_check_in?: string;
  date_check_out?: string;
  nombre_nuits?: number;
  nombre_chambres?: number;
  nombre_personnes?: number;
  type_chambre?: string;
  services_hotel?: string | string[]; // Can be a single value or array (tags)
  adresse_hotel?: string;
  ville_hotel?: string;
  pays_hotel?: string;
  // General fields for all article types
  ville_depart?: string;
  type_fly?: string; // Direct or not direct flight
}

// Session interface
export interface Session extends BaseEntity {
  article_id: number;
  date: string;
  nombre_place: number;
  places_restantes?: number | null;
  created_at?: string;
  updated_at?: string;
  article?: Article;
}

// Commandes
export interface Commande extends BaseEntity {
  id: number;
  client_id: number;
  article_id: number;
  session_id?: number | null;
  date: Date | string;
  beneficiaire: boolean;

  // Fields for beneficiaire
  nom?: string;
  prenom?: string;
  date_naissance?: Date | string;
  genre?: string;
  numero_passport?: string;
  date_expiration_passport?: Date | string;

  numero_mobile?: string;
  remarques?: string;
  image?: string; // base64

  // Financial fields
  prix?: number;
  reductions?: number;
  autre_reductions?: number;
  taxes?: number;

  nombre_personnes?: number;
  chambre_id?: number;
  type_chambre?: string;
  created_at?: Date | string;
  numero_bon_commande?: string;
  statut?: 'active' | 'annulee';

  // Relations
  client?: Client;
  article?: Article;
  session?: Session;
  chambre?: Chambre;
  user?: User;
}

// Reductions
export interface Reduction extends BaseEntity {
  type_article_id?: number;
  reference?: string;
  reduction_fixe?: boolean;
  montant_reduction_fixe?: number;
  reduction_pourcentage?: number;
  type_article?: TypeArticle;
}

// Taxes
export interface Taxe extends BaseEntity {
  id_type_article?: number;
  reference?: string;
  taxe_fixe?: boolean;
  montant_taxe_fixe?: number;
  taxe_pourcentage?: number;
  type_article?: TypeArticle;
}

// Info Agence
export interface InfoAgence extends BaseEntity {
  nom_agence: string;
  tel?: string;
  email?: string;
  adresse?: string;
  site_web?: string;
  code_iata?: string;
  logo?: string;
  prefix_factures?: string;
  pied_facture?: string;
  n_licence?: string;
  fax: string;
  n_rc?: string;
  ar?: string;
  nis?: string;
  nif?: string;
  rib?: string;
}

// Factures
export type FactureStatut = 'en_attente' | 'payee' | 'annulee' | 'impayee';
export type FactureModeReglement = 'espèce' | 'chèque';

export interface Facture extends BaseEntity {
  commande_id: number;
  numero_facture: string;
  date_facture?: string;
  date_echeance?: string;
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc?: number;
  reductions?: number;
  autre_reductions?: number;
  taxes?: number;
  statut?: FactureStatut;
  notes?: string;
  mode_reglement?: FactureModeReglement;
  created_at?: string;
  updated_at?: string;
  commande?: Commande;
  user?: User;
  // Payment info (added by backend)
  montant_paye?: number;
  montant_restant?: number;
}

// Bon de Versement
export interface BonDeVersement {
  id: number;
  numero: string;
  date_versement: Date | string;
  client_id: number;
  commande_id: number;
  facture_id?: number;
  montant_verse: number;
  annule: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  client?: Client;
  commande?: Commande;
  facture?: Facture;
}

export interface BonDeRemboursement {
  id: number;
  numero: string;
  date_remboursement: Date | string;
  client_id: number;
  commande_id: number;
  montant: number;
  motif?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  client?: Client;
  commande?: Commande;
}

// Numerotation
export type NumerotationType = 'FACTURE' | 'BON_VERSEMENT' | 'BON_REMBOURSEMENT';

export interface Numerotation extends BaseEntity {
  type: NumerotationType;
  prefix: string;
  format: string;
  counter: number;
  reset_interval: string;
  last_reset?: string;
}

// Payment interfaces
export interface PayFacturePayload {
  montant: number;
  date_versement?: string;
  notes?: string;
  mode_reglement?: FactureModeReglement;
}

export interface PaymentResult {
  facture: Facture;
  bonDeVersement: BonDeVersement;
  montantPaye: number;
  montantRestant: number;
}

export interface PaymentInfo {
  montantPaye: number;
  montantRestant: number;
  versements: BonDeVersement[];
  transactions: CaisseTransaction[];
}

// Commande with details
export interface CommandeWithDetails extends Commande {
  statut?: 'active' | 'annulee';
  total_factures?: number;
  total_versements?: number;
  factures?: Facture[];
  bons_de_versement?: BonDeVersement[];
}

// Generic CRUD service
class AdminService<T extends BaseEntity> {
  constructor(private endpoint: string) { }

  async getAll(): Promise<T[]> {
    try {
      const response = await api.get(`/${this.endpoint}`);
      console.log(`API Response for ${this.endpoint}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching ${this.endpoint}:`, error);
      throw error;
    }
  }

  async getById(id: number): Promise<T> {
    const response = await api.get(`/${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await api.post(`/${this.endpoint}`, data);
    return response.data;
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    const response = await api.put(`/${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/${this.endpoint}/${id}`);
  }
}

// Export service instances
const baseRolesService = new AdminService<Role>('admin/roles');
export const rolesService = {
  getAll: baseRolesService.getAll.bind(baseRolesService),
  getById: baseRolesService.getById.bind(baseRolesService),
  create: baseRolesService.create.bind(baseRolesService),
  update: (id: number, data: UpdateRolePayload) => baseRolesService.update(id, data as Partial<Role>),
  delete: baseRolesService.delete.bind(baseRolesService),
};
export const permissionsService = new AdminService<Permission>('admin/permissions');
export const usersService = new AdminService<User>('admin/users');
export const typeArticleService = new AdminService<TypeArticle>('admin/type-article');
const baseFournisseursService = new AdminService<Fournisseur>('admin/fournisseurs');
const baseClientsService = new AdminService<Client>('admin/clients');
export const compagniesAeriennesService = new AdminService<CompagnieAerienne>('admin/compagnies-aeriennes');
export const caissesService = new AdminService<Caisse>('admin/caisses');

// Extended fournisseurs service with import
export const fournisseursService = {
  getAll: baseFournisseursService.getAll.bind(baseFournisseursService),
  getById: baseFournisseursService.getById.bind(baseFournisseursService),
  create: baseFournisseursService.create.bind(baseFournisseursService),
  update: baseFournisseursService.update.bind(baseFournisseursService),
  delete: baseFournisseursService.delete.bind(baseFournisseursService),
  async importFromExcel(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ success: number; errors: string[] }>('/admin/fournisseurs/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Extended clients service with import
export const clientsService = {
  getAll: baseClientsService.getAll.bind(baseClientsService),
  getById: baseClientsService.getById.bind(baseClientsService),
  create: baseClientsService.create.bind(baseClientsService),
  update: baseClientsService.update.bind(baseClientsService),
  delete: baseClientsService.delete.bind(baseClientsService),
  async importFromExcel(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ success: number; errors: string[] }>('/admin/clients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
const baseArticlesService = new AdminService<Article>('admin/articles');
export const articlesService = {
  getAll: baseArticlesService.getAll.bind(baseArticlesService),
  getById: baseArticlesService.getById.bind(baseArticlesService),
  create: baseArticlesService.create.bind(baseArticlesService),
  update: baseArticlesService.update.bind(baseArticlesService),
  delete: baseArticlesService.delete.bind(baseArticlesService),
  getAllTourisme: async (): Promise<Article[]> => {
    const response = await api.get('/admin/articles/tourisme');
    return response.data;
  },
};

// Sessions service
export const sessionsService = {
  async findByArticleId(articleId: number): Promise<Session[]> {
    const response = await api.get(`/admin/sessions/article/${articleId}`);
    // Calculate remaining places for each session
    const sessions = response.data || [];
    const sessionsWithRemaining = await Promise.all(
      sessions.map(async (session: Session) => {
        // The backend should already include places_restantes, but we can calculate it here if needed
        return session;
      })
    );
    return sessionsWithRemaining;
  },
};
const baseCommandesService = new AdminService<Commande>('admin/commandes');

export const commandesService = {
  getAll: baseCommandesService.getAll.bind(baseCommandesService),
  getById: baseCommandesService.getById.bind(baseCommandesService),
  create: baseCommandesService.create.bind(baseCommandesService),
  update: baseCommandesService.update.bind(baseCommandesService),
  delete: baseCommandesService.delete.bind(baseCommandesService),
  async printContract(commandeId: number): Promise<Blob> {
    const response = await api.get(`/admin/commandes/${commandeId}/print-contract`, {
      responseType: 'blob',
    });
    return response.data;
  },
  async getAllTourisme(): Promise<Commande[]> {
    const response = await api.get('/admin/commandes/tourisme');
    return response.data;
  },
  async getAllOmra(): Promise<Commande[]> {
    const response = await api.get('/admin/commandes/omra');
    return response.data;
  },
  async generateBonDeCommande(commandeId: number): Promise<Blob> {
    const response = await api.get(`/admin/commandes/${commandeId}/bon-de-commande`, {
      responseType: 'blob',
    });
    return response.data;
  },
  async getWithDetails(commandeId: number): Promise<CommandeWithDetails> {
    const response = await api.get(`/admin/commandes/${commandeId}/details`);
    return response.data;
  },
  async cancelCommande(commandeId: number): Promise<CommandeWithDetails> {
    const response = await api.post(`/admin/commandes/${commandeId}/cancel`);
    return response.data;
  },
};
export const reductionsService = new AdminService<Reduction>('admin/reductions');
export const taxesService = new AdminService<Taxe>('admin/taxes');
export const infoAgenceService = new AdminService<InfoAgence>('admin/info-agence');
export const numerotationsService = new AdminService<Numerotation>('numerotations');

// Extended numerotations service with preview
export const numerotationsServiceExtended = {
  ...numerotationsService,
  async getPreview(type: 'FACTURE' | 'BON_VERSEMENT' | 'BON_REMBOURSEMENT'): Promise<string> {
    const response = await api.get<{ numero: string }>(`/numerotations/preview/${type}`);
    return response.data.numero;
  },
};
const baseFacturesService = new AdminService<Facture>('admin/factures');

export const facturesService = {
  getAll: baseFacturesService.getAll.bind(baseFacturesService),
  getById: baseFacturesService.getById.bind(baseFacturesService),
  create: baseFacturesService.create.bind(baseFacturesService),
  update: baseFacturesService.update.bind(baseFacturesService),
  delete: baseFacturesService.delete.bind(baseFacturesService),
  async generateFromCommande(commandeId: number, notes?: string): Promise<Facture> {
    const response = await api.post(`/admin/factures/generate/${commandeId}`, { notes });
    return response.data;
  },
  async findByCommandeId(commandeId: number): Promise<Facture[]> {
    const response = await api.get(`/admin/factures/commande/${commandeId}`);
    return response.data;
  },
  async getPaymentInfo(factureId: number): Promise<PaymentInfo> {
    const response = await api.get(`/admin/factures/${factureId}/payment-info`);
    return response.data;
  },
  async payFacture(factureId: number, payload: PayFacturePayload): Promise<PaymentResult> {
    const response = await api.post(`/admin/factures/${factureId}/pay`, payload);
    return response.data;
  },
  async cancelFacture(factureId: number): Promise<Facture> {
    const response = await api.post(`/admin/factures/${factureId}/cancel`);
    return response.data;
  },
  async generatePdf(factureId: number): Promise<Blob> {
    const response = await api.get(`/admin/factures/${factureId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

const baseBonDeVersementService = new AdminService<BonDeVersement>('admin/bon-de-versement');
const baseBonDeRemboursementService = new AdminService<BonDeRemboursement>('admin/bon-de-remboursement');

export const bonDeVersementService = {
  getAll: baseBonDeVersementService.getAll.bind(baseBonDeVersementService),
  getById: baseBonDeVersementService.getById.bind(baseBonDeVersementService),
  create: baseBonDeVersementService.create.bind(baseBonDeVersementService),
  update: baseBonDeVersementService.update.bind(baseBonDeVersementService),
  delete: baseBonDeVersementService.delete.bind(baseBonDeVersementService),
  async findByCommandeId(commandeId: number): Promise<BonDeVersement[]> {
    const response = await api.get(`/admin/bon-de-versement/commande/${commandeId}`);
    return response.data;
  },
  async findByClientId(clientId: number): Promise<BonDeVersement[]> {
    const response = await api.get(`/admin/bon-de-versement/client/${clientId}`);
    return response.data;
  },
  async printPdf(bonDeVersementId: number): Promise<Blob> {
    const response = await api.get(`/admin/bon-de-versement/${bonDeVersementId}/print`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const bonDeRemboursementService = {
  getAll: baseBonDeRemboursementService.getAll.bind(baseBonDeRemboursementService),
  getById: baseBonDeRemboursementService.getById.bind(baseBonDeRemboursementService),
  create: baseBonDeRemboursementService.create.bind(baseBonDeRemboursementService),
  update: baseBonDeRemboursementService.update.bind(baseBonDeRemboursementService),
  delete: baseBonDeRemboursementService.delete.bind(baseBonDeRemboursementService),
  async findByCommandeId(commandeId: number): Promise<BonDeRemboursement[]> {
    const response = await api.get(`/admin/bon-de-remboursement/commande/${commandeId}`);
    return response.data;
  },
  async findByClientId(clientId: number): Promise<BonDeRemboursement[]> {
    const response = await api.get(`/admin/bon-de-remboursement/client/${clientId}`);
    return response.data;
  },
  async printPdf(bonDeRemboursementId: number): Promise<Blob> {
    const response = await api.get(`/admin/bon-de-remboursement/${bonDeRemboursementId}/print`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Banner upload service
export const bannerUploadService = {
  async uploadBanner(file: File): Promise<{ url: string; filename: string }> {
    console.log('📦 Creating FormData for upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    const formData = new FormData();
    formData.append('banner', file);

    // Verify FormData was created correctly
    console.log('✅ FormData created, checking entries...');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  - ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    }

    // Don't set Content-Type header - axios will set it automatically with the correct boundary
    const response = await api.post('/admin/articles/upload-banner', formData);
    return response.data;
  },
};

// Logo upload service
export const logoUploadService = {
  async uploadLogo(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    // Don't set Content-Type header - axios will set it automatically with the correct boundary
    const response = await api.post<{ url: string; filename: string }>('/admin/info-agence/upload-logo', formData);
    return response.data;
  },
};

// Role Permissions service
export const rolePermissionsService = {
  async getByRoleId(roleId: number): Promise<Permission[]> {
    const response = await api.get(`/admin/roles/${roleId}/permissions`);
    return response.data;
  },
  async assign(roleId: number, permissionId: number): Promise<void> {
    await api.post(`/admin/roles/${roleId}/permissions/${permissionId}`);
  },
  async revoke(roleId: number, permissionId: number): Promise<void> {
    await api.delete(`/admin/roles/${roleId}/permissions/${permissionId}`);
  },
};

// Caisse Transactions Service
export const caisseTransactionsService = {
  getAll: async (filters?: any): Promise<CaisseTransaction[]> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.caisseId) params.append('caisseId', filters.caisseId.toString());
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
    }
    const response = await api.get(`/admin/caisse-transactions?${params.toString()}`);
    return response.data;
  },
  getOmraTransactions: async (): Promise<CaisseTransaction[]> => {
    const response = await api.get('/admin/caisse-transactions/omra');
    return response.data;
  },
  getByCaisseId: async (caisseId: number): Promise<CaisseTransaction[]> => {
    const response = await api.get(`/admin/caisse-transactions/caisse/${caisseId}`);
    return response.data;
  }
};
