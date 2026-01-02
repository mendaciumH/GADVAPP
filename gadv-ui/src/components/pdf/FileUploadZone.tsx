import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
    accept: Record<string, string[]>;
    maxSize?: number;
    onFileSelect: (file: File) => void;
    uploadProgress?: number;
    isUploading?: boolean;
    label: string;
    description: string;
    icon?: React.ReactNode;
    selectedFile?: File | null;
    onClear?: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    accept,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onFileSelect,
    uploadProgress = 0,
    isUploading = false,
    label,
    description,
    icon,
    selectedFile,
    onClear,
}) => {
    const [error, setError] = useState<string>('');

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: any[]) => {
            setError('');

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.code === 'file-too-large') {
                    setError(`Fichier trop volumineux. Maximum ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
                } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                    setError('Type de fichier non supporté');
                } else {
                    setError('Erreur lors du téléchargement du fichier');
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                onFileSelect(acceptedFiles[0]);
            }
        },
        [onFileSelect, maxSize]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
        disabled: isUploading,
    });

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {selectedFile ? (
                    <motion.div
                        key="selected"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 shadow-lg"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="p-3 rounded-2xl bg-white border border-green-200 shadow-sm">
                                    <File className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium">{formatFileSize(selectedFile.size)}</p>

                                    {isUploading && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-700">Téléchargement...</span>
                                                <span className="text-xs font-black text-green-600">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2 overflow-hidden shadow-inner">
                                                <motion.div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {onClear && !isUploading && (
                                <button
                                    onClick={onClear}
                                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group"
                                    title="Supprimer"
                                >
                                    <X className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        {...(() => {
                            const {
                                onAnimationStart,
                                onAnimationEnd,
                                onDragStart,
                                onDragEnd,
                                onDrag,
                                ...rootProps
                            } = getRootProps();
                            return rootProps;
                        })()}
                        className={`
              relative rounded-3xl border-2 border-dashed p-8 transition-all cursor-pointer
              ${isDragActive
                                ? 'border-primary bg-primary/5 shadow-xl scale-[1.02]'
                                : error
                                    ? 'border-red-300 bg-red-50/50'
                                    : 'border-slate-300 bg-slate-50/50 hover:border-primary/50 hover:bg-slate-100/50 hover:shadow-lg'
                            }
            `}
                    >
                        <input {...getInputProps()} />

                        <div className="flex flex-col items-center text-center">
                            <motion.div
                                animate={{
                                    scale: isDragActive ? 1.1 : 1,
                                    rotate: isDragActive ? 5 : 0,
                                }}
                                className={`p-4 rounded-2xl mb-4 ${isDragActive
                                    ? 'bg-primary/10 border-2 border-primary'
                                    : error
                                        ? 'bg-red-100 border-2 border-red-300'
                                        : 'bg-white border-2 border-slate-200'
                                    }`}
                            >
                                {icon || <Upload className={`w-8 h-8 ${error ? 'text-red-600' : 'text-slate-400'}`} />}
                            </motion.div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{label}</h3>
                            <p className="text-sm text-slate-600 font-medium mb-3">{description}</p>

                            {error ? (
                                <p className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-full">{error}</p>
                            ) : (
                                <p className="text-xs text-slate-500 font-medium">
                                    Glissez-déposez ou cliquez pour sélectionner • Max {(maxSize / 1024 / 1024).toFixed(0)}MB
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
