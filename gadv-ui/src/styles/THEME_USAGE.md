# Guide d'utilisation du système de thème

Ce guide explique comment utiliser le système de couleurs et de styles centralisé pour maintenir une cohérence visuelle à travers toutes les pages.

## Fichiers principaux

### `theme.ts`
Contient la configuration complète du thème :
- Couleurs (primary, secondary, accent, gray scale, semantic colors)
- Espacements
- Rayons de bordure
- Ombres
- Styles CSS communs pré-configurés

### `PageLayout.tsx`
Composant de layout réutilisable pour toutes les pages admin qui fournit :
- Header standardisé avec titre, sous-titre et icône
- Structure de page cohérente
- Animations intégrées (framer-motion)
- Support pour actions dans le header

## Utilisation

### 1. Utiliser PageLayout pour une nouvelle page

```tsx
import PageLayout from '../../components/admin/PageLayout';
import { Shield } from 'lucide-react';

const MyPage: React.FC = () => {
  return (
    <PageLayout
      title="Ma Page"
      subtitle="Description de la page"
      icon={Shield}
      iconColor="text-primary" // optionnel
      headerActions={
        <button className={commonStyles.btnPrimary}>
          Action
        </button>
      }
    >
      {/* Contenu de la page */}
    </PageLayout>
  );
};
```

### 2. Utiliser les styles communs

```tsx
import { commonStyles } from '../../styles/theme';

// Cartes
<div className={commonStyles.card}>
  <div className={commonStyles.cardHeader}>Titre</div>
  <div className={commonStyles.cardBody}>Contenu</div>
</div>

// Boutons
<button className={commonStyles.btnPrimary}>Action principale</button>
<button className={commonStyles.btnSecondary}>Action secondaire</button>
<button className={commonStyles.btnOutline}>Action outline</button>
<button className={commonStyles.btnDanger}>Action dangereuse</button>

// Inputs
<input className={commonStyles.input} placeholder="Saisir..." />
<input className={commonStyles.inputDisabled} disabled />

// Badges
<span className={commonStyles.badgeSuccess}>Succès</span>
<span className={commonStyles.badgeWarning}>Avertissement</span>
<span className={commonStyles.badgeError}>Erreur</span>
<span className={commonStyles.badgeInfo}>Info</span>

// États de chargement
<div className={commonStyles.loadingSpinner}></div>
<p className={commonStyles.loadingText}>Chargement...</p>

// Boîtes d'information
<div className={commonStyles.infoBox}>
  <p className={commonStyles.infoText}>Message informatif</p>
</div>
```

### 3. Utiliser les couleurs du thème

Les couleurs sont disponibles via Tailwind CSS :
- `bg-primary`, `text-primary`, `border-primary`
- `bg-secondary`, `text-secondary`
- `bg-accent`, `text-accent`
- `bg-gray-10` à `bg-gray-100`
- `bg-success`, `bg-warning`, `bg-error`, `bg-info`

### 4. Exemple complet d'une page

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/admin/PageLayout';
import { commonStyles } from '../../styles/theme';
import { Users, Plus } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <PageLayout
      title="Utilisateurs"
      subtitle="Gérer les utilisateurs du système"
      icon={Users}
      headerActions={
        <button className={commonStyles.btnPrimary + ' flex items-center gap-1'}>
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className={commonStyles.loadingSpinner + ' mb-3'}></div>
            <p className={commonStyles.loadingText}>Chargement...</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={commonStyles.card}
        >
          <div className={commonStyles.cardBody}>
            {/* Contenu */}
          </div>
        </motion.div>
      )}
    </PageLayout>
  );
};

export default UsersPage;
```

## Avantages

1. **Cohérence** : Toutes les pages utilisent les mêmes couleurs et styles
2. **Maintenabilité** : Modifier le thème en un seul endroit affecte toutes les pages
3. **Rapidité** : Pas besoin de redéfinir les styles pour chaque page
4. **Accessibilité** : Les couleurs et contrastes sont testés et conformes

## Migration d'une page existante

Pour migrer une page existante :

1. Importer `PageLayout` et `commonStyles`
2. Remplacer le conteneur principal par `<PageLayout>`
3. Remplacer les classes CSS hardcodées par `commonStyles.*`
4. Supprimer les styles inline redondants

## Notes importantes

- Toujours utiliser `commonStyles` au lieu de classes Tailwind hardcodées pour les éléments communs
- Utiliser `PageLayout` pour toutes les pages admin
- Les couleurs du thème sont disponibles via Tailwind (ex: `bg-primary`)
- Pour des styles spécifiques à une page, utiliser des classes Tailwind normales

