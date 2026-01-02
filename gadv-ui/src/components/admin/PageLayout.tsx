import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { commonStyles } from '../../styles/theme';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

/**
 * Common page layout component for all admin pages
 * Provides consistent styling and structure
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  children,
  headerActions,
  className = '',
}) => {
  return (
    <div className={`${commonStyles.pageContainer} ${className}`}>
      <div className={commonStyles.pageContent}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={commonStyles.pageHeader}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
              <div>
                <h1 className={commonStyles.pageTitle}>{title}</h1>
                {subtitle && <p className={commonStyles.pageSubtitle}>{subtitle}</p>}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </motion.div>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default PageLayout;

