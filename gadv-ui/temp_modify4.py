import re

# Lire le fichier
with open('src/pages/admin/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Trouver la section handleConfirmDelete et ajouter le cas pour 'wilaya-confirm'
# Chercher la ligne avec "} else if (deleteModal.type === 'success' || deleteModal.type === 'error' || deleteModal.type === 'info') {"
pattern = r"(\s+} else if \(deleteModal\.type === 'success' \|\| deleteModal\.type === 'error' \|\| deleteModal\.type === 'info'\) \{)"

replacement = r'''\1
        // Gérer la confirmation de modification d'une wilaya existante
      } else if (deleteModal.type === 'wilaya-confirm') {
        try {
          if (pendingWilayaData) {
            // Modifier la wilaya existante avec les nouvelles données
            await cityService.updateWilaya(pendingWilayaData.code, {
              name: pendingWilayaData.name,
              arabic_name: pendingWilayaData.arabic_name
            });
            
            toast.success('Wilaya modifiée avec succès');
            setEditingWilaya(null);
            setNewWilaya({ code: '', name: '', arabic_name: '' });
            setWilayaFormSubmitted(false);
            setPendingWilayaData(null);
            await loadWilayas();
          }
          // Fermer la modal
          setDeleteModal({ isOpen: false, type: 'wilaya', id: 0, name: '' });
        } catch (error: any) {
          toast.error(error.message || 'Erreur lors de la modification de la wilaya');
          setDeleteModal({ isOpen: false, type: 'wilaya', id: 0, name: '' });
        }'''

content = re.sub(pattern, replacement, content)

# Écrire le fichier modifié
with open('src/pages/admin/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fonction handleConfirmDelete modifiée avec succès")
