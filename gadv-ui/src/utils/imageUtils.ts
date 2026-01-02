/**
 * Utility function to fix image URLs by using the correct API server URL
 * @param imageUrl - The image URL to fix
 * @returns The fixed image URL
 */
export const fixImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  
  // Use the same environment-aware API URL logic as api.ts
  const getApiUrl = () => {
    // If environment variable is set, use it
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL.replace('/api', '');
    }
    
    // In development, use localhost
    // In production, construct from current origin
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return 'http://localhost:5000';
    } else {
      // In production, use the same origin as the frontend
      return window.location.origin;
    }
  };
  
  const apiUrl = getApiUrl();
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  
  // If it's already a full URL, check if it needs fixing
  if (imageUrl.includes('localhost:5000') || imageUrl.startsWith('http')) {
    // If we're in production but the URL contains localhost, fix it
    if (!isDevelopment && imageUrl.includes('localhost:5000')) {
      return imageUrl.replace('http://localhost:5000', apiUrl);
    }
    // If we're in localhost but the URL contains a production domain, fix it
    if (isDevelopment && imageUrl.startsWith('http') && !imageUrl.includes('localhost')) {
      return imageUrl.replace(/https?:\/\/[^/]+/, apiUrl);
    }
    return imageUrl;
  }
  
  // If it's a relative URL, add the base URL
  if (imageUrl.startsWith('/')) {
    return `${apiUrl}${imageUrl}`;
  }
  
  // If it's a relative URL without leading slash, add it
  if (!imageUrl.startsWith('http')) {
    return `${apiUrl}/${imageUrl}`;
  }
  
  return imageUrl;
};

/**
 * Get the main image URL from a property's images array
 * @param images - Array of image objects
 * @param fallbackUrl - Fallback URL if no images are available
 * @returns The main image URL
 */
export const getMainImageUrl = (images: any[] | undefined, fallbackUrl: string = ''): string => {
  if (!images || images.length === 0) {
    return fallbackUrl;
  }
  
  // Try to find the principal image first
  const principalImage = images.find(img => img.isPrincipal);
  if (principalImage && principalImage.url) {
    return fixImageUrl(principalImage.url);
  }
  
  // Otherwise use the first image
  const firstImage = images[0];
  if (firstImage && firstImage.url) {
    return fixImageUrl(firstImage.url);
  }
  
  return fallbackUrl;
}; 

// Utility function to get the base URL for images
export const getImageBaseUrl = (): string => {
  return window.location.origin;
}; 