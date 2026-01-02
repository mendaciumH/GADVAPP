const fs = require('fs');
const path = require('path');

const paiementDir = path.join(__dirname, 'uploads', 'paiement');

if (!fs.existsSync(paiementDir)) {
  fs.mkdirSync(paiementDir, { recursive: true });
  console.log('Created paiement directory:', paiementDir);
} else {
  console.log('Paiement directory already exists:', paiementDir);
} 