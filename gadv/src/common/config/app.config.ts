export const appConfig = {
  api: {
    port: parseInt(process.env.PORT || '5000', 10),
    // Use BASE_URL from environment, fallback to localhost for dev
    url: process.env.BASE_URL || 'http://localhost:5000',
  },
  cors: {
    // Parse CORS origins from environment variable (comma-separated) or use defaults for development
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'votre_secret_tres_securise',
    expiresIn: '1d',
  },
}; 