import re

# Lire le fichier
with open('src/pages/admin/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Modifier le type de modal pour inclure 'wilaya-confirm'
content = content.replace(
    "type: 'wilaya' | 'commune' | 'propertyType' | 'success' | 'error' | 'info';",
    "type: 'wilaya' | 'commune' | 'propertyType' | 'success' | 'error' | 'info' | 'wilaya-confirm';"
)

# Écrire le fichier modifié
with open('src/pages/admin/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Type de modal 'wilaya-confirm' ajouté avec succès")
