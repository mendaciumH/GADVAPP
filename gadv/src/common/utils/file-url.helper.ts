/**
 * Helper class for generating file URLs
 */
export class FileUrlHelper {
  /**
   * Generates the appropriate file URL based on environment
   * @param filename The name of the file
   * @param baseUrl Optional base URL (from env)
   * @returns The relative URL path for the file
   */
  static generateFileUrl(filename: string, baseUrl?: string): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadsPrefix = isProduction ? '/api/uploads/' : '/uploads/';
    return `${uploadsPrefix}${filename}`;
  }

  /**
   * Extracts just the filename from a full path or URL
   * @param path The full path or URL
   * @returns Just the filename
   */
  static extractFilename(path: string | null): string | null {
    if (!path) return null;
    
    // If path contains a separator, extract just the filename
    if (path.includes('/')) {
      return path.split('/').pop() || path;
    }
    
    return path;
  }
}

