import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X } from 'lucide-react';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showBackButton?: boolean;
  backPath?: string;
  actions?: React.ReactNode;
}

const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  showBackButton = true,
  backPath,
  actions,
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 sm:space-y-4 max-w-4xl mx-auto px-3 sm:px-0"
    >
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            {showBackButton && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 flex-shrink-0 touch-manipulation"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4" />
              </motion.button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
          <div className="space-y-3 sm:space-y-4">
            {children}
          </div>
        </div>

        {/* Actions - Fixed on mobile for better UX */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-4 sticky bottom-0 sm:static z-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            {actions}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-1.5 text-xs sm:text-sm touch-manipulation"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{cancelLabel}</span>
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-1.5 shadow-sm text-xs sm:text-sm touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default FormPageLayout;

