import re

# Lire le fichier
with open('src/pages/admin/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter l'état pour pendingWilayaData après la ligne 228
lines = content.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i == 227:  # Après la ligne 228 (index 227)
        new_lines.append('  // État pour stocker les données de wilaya en attente de confirmation')
        new_lines.append('  const [pendingWilayaData, setPendingWilayaData] = useState<{ name: string; code: string; arabic_name: string } | null>(null);')

# Écrire le fichier modifié
with open('src/pages/admin/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("État pendingWilayaData ajouté avec succès")
