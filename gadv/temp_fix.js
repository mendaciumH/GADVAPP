const fs = require('fs');

// Lire le fichier
let content = fs.readFileSync('src/city/city.service.ts', 'utf8');

// Remplacer la méthode deleteWilaya
content = content.replace(
  /async deleteWilaya\(code: string\) \{\s*const wilaya = await this\.wilayaRepository\.findOne\(\{\s*where: \{ code \},\s*relations: \['communes'\]\s*\}\);\s*if \(!wilaya\) throw new NotFoundException\('Wilaya not found'\);\s*return this\.wilayaRepository\.delete\(code\);\s*\}/s,
  `async deleteWilaya(code: string) {
    const wilaya = await this.wilayaRepository.findOne({ 
      where: { code },
      relations: ['communes']
    });
    if (!wilaya) throw new NotFoundException('Wilaya not found');
    
    try {
      return await this.wilayaRepository.delete(code);
    } catch (error) {
      if (error.code === '23503' || error.message.includes('violates foreign key constraint')) {
        throw new Error('Impossible de supprimer cette wilaya car elle contient des communes. Supprimez d\\'abord toutes les communes de cette wilaya.');
      }
      throw error;
    }
  }`
);

// Remplacer la méthode deleteCommune
content = content.replace(
  /async deleteCommune\(code: string\) \{\s*const commune = await this\.communeRepository\.findOne\(\{ where: \{ code \} \}\);\s*if \(!commune\) throw new NotFoundException\('Commune not found'\);\s*return this\.communeRepository\.delete\(code\);\s*\}/s,
  `async deleteCommune(code: string) {
    const commune = await this.communeRepository.findOne({ where: { code } });
    if (!commune) throw new NotFoundException('Commune not found');
    
    try {
      return await this.communeRepository.delete(code);
    } catch (error) {
      if (error.code === '23503' || error.message.includes('violates foreign key constraint')) {
        throw new Error('Impossible de supprimer cette commune car elle contient des adresses. Supprimez d\\'abord toutes les adresses de cette commune.');
      }
      throw error;
    }
  }`
);

// Écrire le fichier modifié
fs.writeFileSync('src/city/city.service.ts', content);
console.log('✅ Fichier city.service.ts modifié avec succès');
