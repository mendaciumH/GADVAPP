import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { AuthGuard, PermissionGuard } from '../guards';
import { getPagePermissions } from '../utils/permissions';

import Login from '../components/Login';



// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import UserFormPage from '../pages/admin/UserFormPage';
import RolesPage from '../pages/admin/RolesPage';
import RoleFormPage from '../pages/admin/RoleFormPage';
import PermissionsPage from '../pages/admin/PermissionsPage';
import PermissionFormPage from '../pages/admin/PermissionFormPage';
import ClientsPage from '../pages/admin/ClientsPage';
import ClientFormPage from '../pages/admin/ClientFormPage';
import FournisseursPage from '../pages/admin/FournisseursPage';
import FournisseurFormPage from '../pages/admin/FournisseurFormPage';
import ArticlesPage from '../pages/admin/ArticlesPage';
import ArticleFormPage from '../pages/admin/ArticleFormPage';
import OmraArticlesPage from '../pages/admin/OmraArticlesPage';
import OmraArticleFormPage from '../pages/admin/OmraArticleFormPage';
import TypeArticlePage from '../pages/admin/TypeArticlePage';
import TypeArticleFormPage from '../pages/admin/TypeArticleFormPage';
import CommandesPage from '../pages/admin/CommandesPage';
import CommandeFormPage from '../pages/admin/CommandeFormPage';
import ReservationOmraPage from '../pages/admin/ReservationOmraPage';
import ReservationOmraFormPage from '../pages/admin/ReservationOmraFormPage';
import ReductionsPage from '../pages/admin/ReductionsPage';
import ReductionFormPage from '../pages/admin/ReductionFormPage';
import TaxesPage from '../pages/admin/TaxesPage';
import TaxeFormPage from '../pages/admin/TaxeFormPage';
import CaissesPage from '../pages/admin/CaissesPage';
import CaisseFormPage from '../pages/admin/CaisseFormPage';
import FacturesPage from '../pages/admin/FacturesPage';
import FactureFormPage from '../pages/admin/FactureFormPage';
import BonDeVersementPage from '../pages/admin/BonDeVersementPage';
import BonDeVersementFormPage from '../pages/admin/BonDeVersementFormPage';
import BonDeRemboursementPage from '../pages/admin/BonDeRemboursementPage';
import BonDeRemboursementFormPage from '../pages/admin/BonDeRemboursementFormPage';
import InfoAgencePage from '../pages/admin/InfoAgencePage';
import InfoAgenceFormPage from '../pages/admin/InfoAgenceFormPage';
import PublishPage from '../pages/admin/PublishPage';
import ParametresPage from '../pages/admin/ParametresPage';
import CaisseHistoryPage from '../pages/admin/CaisseHistoryPage';
import EtatCreancesPage from '../pages/admin/EtatCreancesPage';
import PdfLogoReplacementPage from '../pages/admin/PdfLogoReplacementPage';


export const router = createBrowserRouter([
  {
    path: '/',

    children: [

      {
        index: true,
        element: <Login />,
      },

    ],
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <PermissionGuard requiredPermissions={getPagePermissions('dashboard')}>
          <AdminLayout />
        </PermissionGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('dashboard')}>
            <DashboardPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('users')}>
            <UsersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'users/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('users_new')}>
            <UserFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'users/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('users_edit')}>
            <UserFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('roles')}>
            <RolesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'roles/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('roles_new')}>
            <RoleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'roles/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('roles_edit')}>
            <RoleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'permissions',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('permissions')}>
            <PermissionsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'permissions/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('permissions_new')}>
            <PermissionFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'permissions/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('permissions_edit')}>
            <PermissionFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'clients',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('clients')}>
            <ClientsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'clients/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('clients_new')}>
            <ClientFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'clients/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('clients_edit')}>
            <ClientFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'fournisseurs',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('fournisseurs')}>
            <FournisseursPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'fournisseurs/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('fournisseurs_new')}>
            <FournisseurFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'fournisseurs/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('fournisseurs_edit')}>
            <FournisseurFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'articles',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles')}>
            <ArticlesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'articles/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles_new')}>
            <ArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'articles/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles_edit')}>
            <ArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'omra',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles')}>
            <OmraArticlesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'omra/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles_new')}>
            <OmraArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'omra/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('articles_edit')}>
            <OmraArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'type-article',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('type_article')}>
            <TypeArticlePage />
          </PermissionGuard>
        ),
      },
      {
        path: 'type-article/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('type_article_new')}>
            <TypeArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'type-article/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('type_article_edit')}>
            <TypeArticleFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'commandes',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes')}>
            <CommandesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'commandes/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes_new')}>
            <CommandeFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'commandes/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes_edit')}>
            <CommandeFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reservation-omra',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes')}>
            <ReservationOmraPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reservation-omra/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes_new')}>
            <ReservationOmraFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reservation-omra/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('commandes_edit')}>
            <ReservationOmraFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reductions',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('reductions')}>
            <ReductionsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reductions/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('reductions_new')}>
            <ReductionFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reductions/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('reductions_edit')}>
            <ReductionFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'taxes',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('taxes')}>
            <TaxesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'taxes/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('taxes_new')}>
            <TaxeFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'taxes/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('taxes_edit')}>
            <TaxeFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'caisses',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('caisses')}>
            <CaissesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'caisses/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('caisses_new')}>
            <CaisseFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'caisses/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('caisses_edit')}>
            <CaisseFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'caisses-history',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('caisse_transactions')}>
            <CaisseHistoryPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'factures',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('factures')}>
            <FacturesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'factures/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('factures_new')}>
            <FactureFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'factures/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('factures_edit')}>
            <FactureFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-versement',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_versement')}>
            <BonDeVersementPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-versement/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_versement_new')}>
            <BonDeVersementFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-versement/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_versement_edit')}>
            <BonDeVersementFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-remboursement',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_remboursement')}>
            <BonDeRemboursementPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-remboursement/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_remboursement_new')}>
            <BonDeRemboursementFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'bon-de-remboursement/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('bon_de_remboursement_edit')}>
            <BonDeRemboursementFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'etat-creances',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('etat_creances')}>
            <EtatCreancesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'info-agence',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('info_agence')}>
            <InfoAgencePage />
          </PermissionGuard>
        ),
      },
      {
        path: 'info-agence/new',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('info_agence_new')}>
            <InfoAgenceFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'info-agence/:id/edit',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('info_agence_edit')}>
            <InfoAgenceFormPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('info_agence')}>
            <ParametresPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'publish',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('publish')}>
            <PublishPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'pdf-logo-replacement',
        element: (
          <PermissionGuard requiredPermissions={getPagePermissions('info_agence')}>
            <PdfLogoReplacementPage />
          </PermissionGuard>
        ),
      },
    ],
  },
]);
