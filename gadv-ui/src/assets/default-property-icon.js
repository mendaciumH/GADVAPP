// Modern house icon in SVG format
export const defaultPropertyIcon = `
<svg width="400" height="300" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ecfdf9" />
      <stop offset="100%" stop-color="#def7f2" />
    </linearGradient>
    <linearGradient id="house_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b87e" />
      <stop offset="100%" stop-color="#0e9667" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#bg_grad)" x="0" y="0" />
  
  <!-- House icon centered in the image -->
  <g transform="translate(100, 50)">
    <!-- Main house shape -->
    <path d="M200,30 L30,150 L30,270 L370,270 L370,150 Z" fill="url(#house_grad)" />
    
    <!-- Door -->
    <rect x="150" y="170" width="80" height="100" fill="#ffffff" />
    <rect x="155" y="175" width="70" height="95" fill="#f5f5f5" />
    <circle cx="215" cy="220" r="5" fill="#0c8258" />
    
    <!-- Windows -->
    <rect x="70" y="170" width="50" height="50" fill="#ffffff" />
    <rect x="75" y="175" width="40" height="40" fill="#f5f5f5" />
    
    <rect x="280" y="170" width="50" height="50" fill="#ffffff" />
    <rect x="285" y="175" width="40" height="40" fill="#f5f5f5" />
    
    <!-- Roof decoration -->
    <rect x="180" y="60" width="40" height="40" fill="#ffffff" />
    <rect x="185" y="65" width="30" height="30" fill="#f5f5f5" />
  </g>
  
  <!-- Application text -->
  <text x="200" y="260" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#10b981" text-anchor="middle">GestionADV</text>
</svg>
`;
