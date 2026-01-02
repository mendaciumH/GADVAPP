/**
 * Centralized theme configuration for consistent styling across all pages
 * Based on IBM Carbon Design System - B2B Travel Management Theme
 */

export const theme = {
  colors: {
    // Primary colors
    primary: {
      DEFAULT: '#0050E6',
      dark: '#002D9C',
      light: '#4589FF',
      hover: '#0043CE',
    },
    secondary: {
      DEFAULT: '#08BDBA',
      dark: '#005D5D',
      light: '#20D5D2',
    },
    accent: {
      DEFAULT: '#FF7EB6',
      dark: '#FF50A0',
      light: '#FFA6C9',
    },
    // Gray scale
    gray: {
      10: '#F4F4F4',
      20: '#E5E5E5',
      30: '#E0E0E0',
      40: '#C6C6C6',
      50: '#A8A8A8',
      60: '#8D8D8D',
      70: '#525252',
      80: '#393939',
      90: '#161616',
      100: '#262626',
    },
    // Semantic colors
    success: {
      DEFAULT: '#24A148',
      dark: '#198038',
      light: '#42BE65',
    },
    warning: {
      DEFAULT: '#F1C21B',
      dark: '#D2A106',
      light: '#FDD13A',
    },
    error: {
      DEFAULT: '#DA1E28',
      dark: '#A2191F',
      light: '#FA4D56',
    },
    info: {
      DEFAULT: '#4589FF',
      dark: '#0043CE',
      light: '#6EA6FF',
    },
    // Backgrounds
    background: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    // Text
    text: {
      primary: '#161616',
      secondary: '#525252',
      disabled: '#A8A8A8',
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
} as const;

/**
 * Common CSS class combinations for consistent styling
 */
export const commonStyles = {
  // Page containers
  pageContainer: 'bg-white min-h-screen',
  pageContent: 'space-y-4 p-3 sm:p-4 lg:p-6',
  
  // Cards
  card: 'bg-white rounded-lg shadow-sm border border-gray-200',
  cardHeader: 'px-3 py-2 border-b border-gray-200',
  cardBody: 'px-3 py-2',
  cardFooter: 'px-3 py-2 border-t border-gray-200',
  
  // Headers
  pageHeader: 'bg-white rounded-lg shadow-sm p-3 border border-gray-200',
  pageTitle: 'text-xl font-bold text-gray-900',
  pageSubtitle: 'text-xs text-gray-600 mt-0.5',
  
  // Buttons
  btnPrimary: 'px-2.5 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  btnSecondary: 'px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  btnOutline: 'px-2.5 py-1 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  btnDanger: 'px-2.5 py-1 bg-error text-white text-xs font-medium rounded hover:bg-error-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  
  // Inputs
  input: 'w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none',
  inputDisabled: 'w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed',
  
  // Tables
  table: 'w-full border-collapse',
  tableHeader: 'bg-white border-b-2 border-gray-300',
  tableHeaderCell: 'px-3 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide',
  tableRow: 'border-b border-gray-200 hover:bg-gray-50 transition-colors',
  tableCell: 'px-3 py-1.5 text-sm text-gray-900',
  
  // Badges
  badgeSuccess: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success',
  badgeWarning: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning-dark',
  badgeError: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error',
  badgeInfo: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info-dark',
  
  // Loading states
  loadingSpinner: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary',
  loadingText: 'text-sm text-gray-600',
  
  // Info boxes
  infoBox: 'bg-blue-50 border border-blue-200 rounded-lg p-2',
  infoText: 'text-xs text-blue-800',
  
  // Empty states
  emptyState: 'flex flex-col items-center justify-center py-12 text-center',
  emptyStateIcon: 'w-12 h-12 text-gray-400 mb-4',
  emptyStateText: 'text-sm text-gray-600',
} as const;

