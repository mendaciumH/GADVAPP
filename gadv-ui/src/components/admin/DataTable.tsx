import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Eye, MoreVertical } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  mobileHidden?: boolean; // Hide this column on mobile
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  customActions?: (item: T) => React.ReactNode;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

function DataTable<T extends { id: number }>({
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onView,
  canEdit,
  canDelete,
  customActions,
  searchable = true,
  searchValue = '',
  onSearchChange,
  loading = false,
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-30">
      {/* Header */}
      <div className="p-2 sm:p-3 border-b border-gray-30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 sm:justify-between">
        <div className="flex-1 sm:max-w-md w-full">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-70 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 text-xs sm:text-sm border border-gray-30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors outline-none bg-surface text-gray-90 placeholder-gray-50"
              />
            </div>
          )}
        </div>
        {onAdd && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
            className="w-full sm:w-auto sm:ml-3 flex items-center justify-center space-x-1.5 bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-hover transition-colors shadow-sm font-medium text-xs sm:text-sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Ajouter</span>
          </motion.button>
        )}
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-70">Chargement...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-70">Aucune donnée disponible</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white border-b border-gray-30">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 sm:px-4 py-1.5 text-left text-xs font-semibold text-gray-70 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                {(onEdit || onDelete || onView || customActions) && (
                  <th className="px-3 sm:px-4 py-1.5 text-right text-xs font-semibold text-gray-70 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-30">
              {data.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 sm:px-4 py-1 whitespace-nowrap text-xs sm:text-sm text-gray-90">
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView || customActions) && (
                    <td className="px-3 sm:px-4 py-1 whitespace-nowrap text-right text-xs sm:text-sm">
                      <div className="flex items-center justify-end space-x-1">
                        {onView && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onView(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            aria-label="Voir"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                        {customActions && customActions(item)}
                        {onEdit && (canEdit ? canEdit(item) : true) && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            aria-label="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                        {onDelete && (canDelete ? canDelete(item) : true) && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-error hover:bg-error/10 rounded-md transition-colors"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Card View - Mobile */}
      <div className="md:hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-70 text-sm">Chargement...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-70 text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-30">
            {data.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-1.5">
                  {columns.filter(col => !col.mobileHidden).map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-semibold text-gray-70 uppercase min-w-[70px]">
                        {column.header}:
                      </span>
                      <span className="text-xs sm:text-sm text-gray-90 flex-1 text-right">
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </span>
                    </div>
                  ))}
                  {(onEdit || onDelete || onView || customActions) && (
                    <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-gray-20 mt-2">
                      {onView && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onView(item)}
                          className="flex-1 py-1.5 px-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Voir</span>
                        </motion.button>
                      )}
                      {customActions && customActions(item)}
                      {onEdit && (canEdit ? canEdit(item) : true) && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onEdit(item)}
                          className="flex-1 py-1.5 px-2.5 text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </motion.button>
                      )}
                      {onDelete && (canDelete ? canDelete(item) : true) && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDelete(item)}
                          className="flex-1 py-1.5 px-2.5 text-error bg-error/10 hover:bg-error/20 rounded-md transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-2 sm:px-4 py-2 border-t border-gray-30 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <div className="text-xs text-gray-70 text-center sm:text-left">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 border border-gray-30 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-90 transition-colors touch-manipulation"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="px-2 sm:px-3 py-1 text-xs font-medium text-gray-90 whitespace-nowrap">
              Page {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 border border-gray-30 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-90 transition-colors touch-manipulation"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

