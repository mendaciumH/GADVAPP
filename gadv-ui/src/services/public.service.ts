import axios from 'axios';

// Environment-aware API URL configuration
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use localhost
  // In production, construct from current origin
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:5000/api';
  } else {
    // In production, use the same origin as the frontend
    return `${window.location.origin}/api`;
  }
};

const API_URL = getApiUrl();

const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to construct full URL from banner filename
const constructBannerUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/')) {
    return filename;
  }
  
  const apiUrl = getApiUrl().replace('/api', '');
  return `${apiUrl}/uploads/${filename}`;
};

export interface PublishedArticle {
  id: number;
  label: string;
  description?: string;
  image_banner?: string;
  prix_offre?: number;
  date_depart?: string;
  destination?: string;
  type_article?: {
    id: number;
    description: string;
  };
  compagnie_aerienne?: {
    id: number;
    nom: string;
  };
}

export const publicService = {
  async getPublishedArticles(): Promise<PublishedArticle[]> {
    const response = await publicApi.get('/articles/published');
    return response.data.map((article: any) => ({
      ...article,
      image_banner: article.image_banner ? constructBannerUrl(article.image_banner) : null,
    }));
  },

  async getPublishedArticle(id: number): Promise<PublishedArticle | null> {
    try {
      const response = await publicApi.get(`/articles/published/${id}`);
      if (!response.data) return null;
      return {
        ...response.data,
        image_banner: response.data.image_banner ? constructBannerUrl(response.data.image_banner) : null,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

