import re

# Lire le fichier
with open('src/pages/admin/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer la fonction saveWilaya
old_saveWilaya = '''  const saveWilaya = async (wilaya: Wilaya | { name: string; code: string; arabic_name: string }) => {
    try {
      setIsLoading(true);
      
      if ('id' in wilaya && wilaya.id) {
        // Modification d'une wilaya existante
        await cityService.updateWilaya( wilaya.code, { 
          name: wilaya.name,
          arabic_name: wilaya.arabic_name 
        });
        toast.success('Wilaya modifiée avec succès');
      } else {
        // Création d'une nouvelle wilaya
        await cityService.createWilaya({ 
          code: wilaya.code, 
          name: wilaya.name,
          arabic_name: wilaya.arabic_name
        });
        toast.success('Wilaya créée avec succès');
      }
      
      setEditingWilaya(null);
      setNewWilaya({ code: '', name: '', arabic_name: '' }); setWilayaFormSubmitted(false);
      await loadWilayas();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };'''

new_saveWilaya = '''  const saveWilaya = async (wilaya: Wilaya | { name: string; code: string; arabic_name: string }) => {
    try {
      setIsLoading(true);
      
      if ('id' in wilaya && wilaya.id) {
        // Modification d'une wilaya existante
        await cityService.updateWilaya( wilaya.code, { 
          name: wilaya.name,
          arabic_name: wilaya.arabic_name 
        });
        toast.success('Wilaya modifiée avec succès');
      } else {
        // Création d'une nouvelle wilaya - Vérifier si le code existe déjà
        const existingWilaya = wilayas.find(w => w.code === wilaya.code);
        
        if (existingWilaya) {
          // Le code existe déjà, demander confirmation
          setDeleteModal({
            isOpen: true,
            type: 'wilaya-confirm',
            id: 0,
            name: 'Wilaya existante',
            title: 'Code de wilaya existant',
            message: `Une wilaya avec le code "${wilaya.code}" existe déjà (${existingWilaya.name}). Voulez-vous vraiment la modifier ?`
          });
          
          // Stocker temporairement les données pour la confirmation
          setPendingWilayaData(wilaya);
          setIsLoading(false);
          return;
        }
        
        // Création d'une nouvelle wilaya
        await cityService.createWilaya({ 
          code: wilaya.code, 
          name: wilaya.name,
          arabic_name: wilaya.arabic_name
        });
        toast.success('Wilaya créée avec succès');
      }
      
      setEditingWilaya(null);
      setNewWilaya({ code: '', name: '', arabic_name: '' }); 
      setWilayaFormSubmitted(false);
      await loadWilayas();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };'''

content = content.replace(old_saveWilaya, new_saveWilaya)

# Écrire le fichier modifié
with open('src/pages/admin/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fonction saveWilaya modifiée avec succès")
