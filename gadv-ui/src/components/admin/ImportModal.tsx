import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from './Modal';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ success: number; errors: string[] }>;
  title: string;
  acceptedFileTypes?: string;
  helpText?: string;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  title,
  acceptedFileTypes = '.xlsx,.xls',
  helpText,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    try {
      const importResult = await onImport(file);
      setResult(importResult);
    } catch (error: any) {
      setResult({
        success: 0,
        errors: [error.response?.data?.message || error.message || 'Erreur lors de l\'importation'],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-4">
        {!result ? (
          <>
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Cliquez pour sélectionner un fichier Excel
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {acceptedFileTypes}
                  </p>
                </div>
                {file && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {helpText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">{helpText}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isImporting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || isImporting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importation...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Importer</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg flex items-start space-x-3 ${
                  result.success > 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      result.success > 0 ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.success > 0
                      ? `${result.success} élément(s) importé(s) avec succès`
                      : 'Aucun élément importé'}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-red-800">Erreurs:</p>
                      <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index} className="pl-2">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Importer un autre fichier
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;

