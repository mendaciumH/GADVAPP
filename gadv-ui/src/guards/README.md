# Guards Documentation

Ce dossier contient les guards pour la protection des routes avec JWT et contrôle d'accès basé sur les rôles (RBAC).

## Guards disponibles

### AuthGuard
Protège les routes en vérifiant l'authentification JWT.

**Utilisation :**
```tsx
<AuthGuard>
  <YourProtectedComponent />
</AuthGuard>
```

- Vérifie si l'utilisateur a un token JWT valide
- Redirige vers `/login` si non authentifié
- Affiche un loader pendant la vérification

### RoleGuard
Protège les routes en vérifiant les rôles de l'utilisateur.

**Utilisation :**
```tsx
// Utilisateur doit avoir le rôle 'admin'
<RoleGuard requiredRoles={['admin']}>
  <AdminComponent />
</RoleGuard>

// Utilisateur doit avoir AU MOINS UN des rôles
<RoleGuard requiredRoles={['admin', 'manager']}>
  <Component />
</RoleGuard>

// Utilisateur doit avoir TOUS les rôles
<RoleGuard requiredRoles={['admin', 'super-admin']} requireAll={true}>
  <SuperAdminComponent />
</RoleGuard>
```

**Props :**
- `requiredRoles?: string[]` - Liste des rôles requis
- `requireAll?: boolean` - Si `true`, l'utilisateur doit avoir TOUS les rôles (par défaut: `false`)
- `fallbackPath?: string` - Chemin de redirection si l'utilisateur n'a pas les rôles (par défaut: `/dashboard`)

## Utilisation combinée

Les guards peuvent être combinés pour une protection en couches :

```tsx
<AuthGuard>
  <RoleGuard requiredRoles={['admin']}>
    <AdminLayout />
  </RoleGuard>
</AuthGuard>
```

**Important :** `RoleGuard` doit toujours être utilisé à l'intérieur de `AuthGuard` car il présuppose que l'utilisateur est authentifié.

## Hook useAuth

Pour une gestion réactive de l'authentification dans vos composants :

```tsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { isAuthenticated, user, hasRole, hasAnyRole } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Non authentifié</div>;
  }
  
  if (hasRole('admin')) {
    return <div>Vous êtes admin</div>;
  }
  
  return <div>Utilisateur normal</div>;
};
```

**Retour du hook :**
- `isAuthenticated: boolean` - Si l'utilisateur est authentifié
- `isLoading: boolean` - Si la vérification est en cours
- `user: UserProfile | null` - Profil de l'utilisateur
- `hasRole(role: string): boolean` - Vérifie si l'utilisateur a un rôle spécifique
- `hasAnyRole(roles: string[]): boolean` - Vérifie si l'utilisateur a au moins un des rôles
- `hasAllRoles(roles: string[]): boolean` - Vérifie si l'utilisateur a tous les rôles

