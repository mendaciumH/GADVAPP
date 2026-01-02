/**
 * JWT Configuration - Shared secret for signing and validating tokens
 * This ensures the same secret is used everywhere
 */
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: '8h', // Increased from 1h to prevent logout during work
  refreshExpiresIn: '7d',
};

