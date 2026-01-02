import axios from 'axios';

// Environment-aware API URL configuration
const getApiUrl = () => {
  // If environment variable is set, use it
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

// Log the API URL in development for debugging
// if (process.env.NODE_ENV === 'development') {
//   console.log('🔧 API URL:', API_URL);
// }

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Check if this is a FormData request (file upload)
    const isFormData = config.data instanceof FormData;
    
    // If FormData, remove Content-Type header to let browser set it with boundary
    if (isFormData) {
      delete config.headers['Content-Type'];
      console.log('📤 FormData detected - Content-Type header removed for multipart/form-data');
    }
    
    // Always check for token on every request
    const token = localStorage.getItem('token');
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    
    // Debug: Log all requests to admin routes
    if (config.url?.includes('/admin/') || fullUrl?.includes('/admin/')) {
      console.log('API Request Interceptor - Processing:', {
        url: config.url,
        fullUrl: fullUrl,
        method: config.method,
        isFormData: isFormData,
        hasTokenInStorage: !!token,
        tokenLength: token?.length || 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Always add token if available
    if (token) {
      // Ensure headers object exists and set Authorization header
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
      
      // Debug log for admin routes
      if (config.url?.includes('/admin/') || fullUrl?.includes('/admin/')) {
        console.log('API Request - Token added to:', config.url, {
          hasToken: !!token,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
          headerSet: !!(config.headers as any)['Authorization']
        });
      }
    } else {
      // Warn if trying to access protected route without token
      if (config.url?.includes('/admin/') || fullUrl?.includes('/admin/')) {
        console.error('API Request - CRITICAL: No token for protected route:', config.url, {
          localStorageKeys: Object.keys(localStorage),
          tokenKey: localStorage.getItem('token') ? 'exists' : 'missing',
          allStorage: Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = key === 'token' ? '***' : localStorage.getItem(key)?.substring(0, 20);
            return acc;
          }, {} as Record<string, any>)
        });
      }
    }
    
    // Log final headers for debugging
    if (config.url?.includes('/admin/') || fullUrl?.includes('/admin/')) {
      const authHeader = (config.headers as any)?.['Authorization'];
      const authHeaderStr = typeof authHeader === 'string' ? authHeader : String(authHeader || '');
      console.log('API Request - Final check:', {
        url: config.url,
        isFormData: isFormData,
        contentType: config.headers['Content-Type'] || 'auto (FormData)',
        hasAuthorization: !!authHeader,
        authorizationHeader: authHeaderStr ? authHeaderStr.substring(0, 30) + '...' : 'none',
        allHeaders: Object.keys(config.headers || {})
      });
    }
    
 
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const requestUrl = error.config?.url || '';
    const requestHeaders = error.config?.headers || {};
    
    // Don't handle auth errors for login endpoint to avoid loops
    if (requestUrl.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Invalid or expired token
    if (status === 401) {
      const errorMessage = error.response?.data?.message || 'Unauthorized';
      const hadAuthorizationHeader = !!requestHeaders['Authorization'] || !!requestHeaders['authorization'];
      
      console.warn('API 401 Unauthorized:', {
        url: requestUrl,
        path: currentPath,
        message: errorMessage,
        hadAuthorizationHeader: hadAuthorizationHeader,
        headers: Object.keys(requestHeaders),
        requestConfig: {
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          url: error.config?.url
        }
      });
      
      // If the error is "No authorization header found", it means the token wasn't sent
      // This could be a timing issue or the token was already cleared
      // Check if token exists in storage - if it does, it's a bug, don't clear
      const tokenInStorage = localStorage.getItem('token');
      
      if (errorMessage === 'No authorization header found' || !hadAuthorizationHeader) {
        if (tokenInStorage) {
          console.error('CRITICAL: Token exists in storage but was not sent in request!', {
            tokenExists: !!tokenInStorage,
            tokenLength: tokenInStorage.length,
            requestUrl: requestUrl,
            headersInRequest: Object.keys(requestHeaders)
          });
          // Token exists but wasn't sent - this is a bug, don't clear token
          // Just return the error and let the component handle it
          return Promise.reject(error);
        } else {
          console.warn('No token in storage and no authorization header - token was already cleared');
          // Token doesn't exist - it was already cleared, don't do anything
          return Promise.reject(error);
        }
      }
      
      // Debug: Log all conditions before deciding to clear token
      console.log('🔍 Token Deletion Decision:', {
        condition1_currentPath: currentPath,
        condition1_notOnLogin: currentPath !== '/login' && !currentPath.includes('/login'),
        condition2_tokenInStorage: !!tokenInStorage,
        condition3_hadAuthorizationHeader: hadAuthorizationHeader,
        condition4_errorMessage: errorMessage,
        condition4_notNoHeaderError: errorMessage !== 'No authorization header found',
        willClearToken: (
          currentPath !== '/login' && 
          !currentPath.includes('/login') && 
          tokenInStorage &&
          hadAuthorizationHeader &&
          errorMessage !== 'No authorization header found'
        )
      });
      
    
      const shouldClearToken = (
        currentPath !== '/login' && 
        !currentPath.includes('/login') && 
        tokenInStorage &&
        hadAuthorizationHeader &&
        errorMessage !== 'No authorization header found'
      );
      
      if (shouldClearToken) {
        // Token was sent but rejected - this means it's invalid or expired
        console.error('🚨 DELETING TOKEN - Conditions met:', {
          errorMessage: errorMessage,
          tokenLength: tokenInStorage.length,
          hadAuthorizationHeader: hadAuthorizationHeader,
          requestUrl: requestUrl,
          currentPath: currentPath,
          reason: 'Token was sent but server rejected it (invalid/expired)'
        });
        
        // Clear tokens and notify auth context
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Dispatch event to notify auth context
        window.dispatchEvent(new Event('auth-changed'));
        
        // Use React Router navigation instead of hard redirect
        // This will be handled by AuthGuard
        console.log('✅ Token cleared due to 401, AuthGuard will handle redirect');
      } else {
        // Log why token was NOT cleared
        console.log('✅ Token NOT cleared - Reason:', {
          tokenInStorage: !!tokenInStorage,
          hadAuthorizationHeader: hadAuthorizationHeader,
          errorMessage: errorMessage,
          reason: !tokenInStorage ? 'No token in storage' :
                  !hadAuthorizationHeader ? 'Token was not sent in request' :
                  errorMessage === 'No authorization header found' ? 'Error indicates header was missing' :
                  currentPath === '/login' || currentPath.includes('/login') ? 'On login page' :
                  'Unknown reason'
        });
        
        if (tokenInStorage && !hadAuthorizationHeader) {
          // Token exists but wasn't sent - don't clear, just log the issue
          console.error('⚠️ Token exists but was not sent - potential bug in request interceptor', {
            tokenExists: !!tokenInStorage,
            requestUrl: requestUrl,
            errorMessage: errorMessage,
            headersInRequest: Object.keys(requestHeaders)
          });
        }
      }
    }
    
    // Handle 403 Forbidden - User doesn't have required permissions
    if (status === 403) {
      // Don't clear tokens for 403, user is authenticated but lacks permission
      // Just log the error, the RoleGuard will handle the redirect
      console.warn('Access forbidden: User does not have required permissions', {
        url: requestUrl,
        message: error.response?.data?.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default api; 