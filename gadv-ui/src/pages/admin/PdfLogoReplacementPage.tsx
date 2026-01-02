import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Wand2, Download, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { FileUploadZone } from '../../components/pdf/FileUploadZone';
import { PdfPreviewCanvas } from '../../components/pdf/PdfPreviewCanvas';
import { pdfLogoService, UploadResponse } from '../../services/pdf-logo.service';

interface LogoPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
}

type ProcessingStep = 'upload' | 'select' | 'process' | 'download';

const PdfLogoReplacementPage: React.FC = () => {
    // File states
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [pdfUploadData, setPdfUploadData] = useState<UploadResponse | null>(null);
    const [logoUploadData, setLogoUploadData] = useState<UploadResponse | null>(null);

    // Upload progress
    const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
    const [logoUploadProgress, setLogoUploadProgress] = useState(0);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Logo position
    const [logoPosition, setLogoPosition] = useState<LogoPosition | null>(null);

    // Processing states
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingComplete, setProcessingComplete] = useState(false);
    const [processedFileId, setProcessedFileId] = useState<string | null>(null);

    // Current step
    const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload');

    /**
     * Handle PDF file selection and upload
     */
    const handlePdfSelect = async (file: File) => {
        try {
            setPdfFile(file);
            setIsUploadingPdf(true);
            setPdfUploadProgress(0);

            const response = await pdfLogoService.uploadPdf(file, (progress) => {
                setPdfUploadProgress(progress);
            });

            setPdfUploadData(response);
            toast.success('PDF téléchargé avec succès');
            setIsUploadingPdf(false);
        } catch (error: any) {
            console.error('PDF upload error:', error);
            toast.error('Erreur lors du téléchargement du PDF');
            setPdfFile(null);
            setIsUploadingPdf(false);
        }
    };

    /**
     * Handle logo file selection and upload
     */
    const handleLogoSelect = async (file: File) => {
        try {
            setLogoFile(file);
            setIsUploadingLogo(true);
            setLogoUploadProgress(0);

            const response = await pdfLogoService.uploadLogo(file, (progress) => {
                setLogoUploadProgress(progress);
            });

            setLogoUploadData(response);
            toast.success('Logo téléchargé avec succès');
            setIsUploadingLogo(false);
        } catch (error: any) {
            console.error('Logo upload error:', error);
            toast.error('Erreur lors du téléchargement du logo');
            setLogoFile(null);
            setIsUploadingLogo(false);
        }
    };

    /**
     * Handle logo position selection
     */
    const handleLogoPositionSelect = (position: LogoPosition) => {
        setLogoPosition(position);
        toast.success('Position du logo sélectionnée');
    };

    /**
     * Process PDF with logo replacement
     */
    const handleProcessPdf = async () => {
        if (!pdfUploadData || !logoUploadData || !logoPosition) {
            toast.error('Veuillez compléter toutes les étapes');
            return;
        }

        try {
            setIsProcessing(true);
            setCurrentStep('process');

            const result = await pdfLogoService.replaceLogo({
                pdfFileId: pdfUploadData.fileId,
                logoFileId: logoUploadData.fileId,
                pageNumber: logoPosition.pageNumber,
                x: logoPosition.x,
                y: logoPosition.y,
                width: logoPosition.width,
                height: logoPosition.height,
            });

            if (result.status === 'completed' && result.downloadUrl) {
                setProcessedFileId(result.downloadUrl.split('/').pop() || null);
                setProcessingComplete(true);
                setCurrentStep('download');
                toast.success('PDF traité avec succès!');
            } else if (result.status === 'failed') {
                throw new Error(result.message || 'Processing failed');
            }
        } catch (error: any) {
            console.error('Processing error:', error);
            toast.error(error.response?.data?.message || 'Erreur lors du traitement du PDF');
            setCurrentStep('select');
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Download processed PDF
     */
    const handleDownload = async () => {
        if (!processedFileId) return;

        try {
            const blob = await pdfLogoService.downloadPdf(processedFileId);
            const filename = `${pdfFile?.name.replace('.pdf', '')}_modified.pdf` || 'modified-document.pdf';
            pdfLogoService.triggerDownload(blob, filename);
            toast.success('Téléchargement démarré');
        } catch (error: any) {
            console.error('Download error:', error);
            toast.error('Erreur lors du téléchargement');
        }
    };

    /**
     * Reset all states
     */
    const handleReset = () => {
        setPdfFile(null);
        setLogoFile(null);
        setPdfUploadData(null);
        setLogoUploadData(null);
        setLogoPosition(null);
        setProcessingComplete(false);
        setProcessedFileId(null);
        setCurrentStep('upload');
    };

    const canProceedToSelection = pdfUploadData && logoUploadData && !isUploadingPdf && !isUploadingLogo;
    const canProcess = canProceedToSelection && logoPosition;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                        Remplacement de Logo PDF
                    </h1>
                    <p className="text-slate-600 font-medium">
                        Téléchargez votre PDF, sélectionnez la zone du logo à remplacer, et obtenez un document modifié de haute qualité
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        {[
                            { id: 'upload', label: 'Téléchargement', icon: FileText },
                            { id: 'select', label: 'Sélection', icon: Image },
                            { id: 'process', label: 'Traitement', icon: Wand2 },
                            { id: 'download', label: 'Téléchargement', icon: Download },
                        ].map((step, index, array) => {
                            const isActive = currentStep === step.id;
                            const isCompleted =
                                (step.id === 'upload' && canProceedToSelection) ||
                                (step.id === 'select' && canProcess) ||
                                (step.id === 'process' && processingComplete) ||
                                (step.id === 'download' && processingComplete);

                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div
                                            className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                        ${isCompleted
                                                    ? 'bg-green-500 border-2 border-green-600 shadow-lg shadow-green-500/30'
                                                    : isActive
                                                        ? 'bg-primary border-2 border-primary shadow-lg shadow-primary/30'
                                                        : 'bg-slate-100 border-2 border-slate-200'
                                                }
                      `}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle className="w-7 h-7 text-white" />
                                            ) : (
                                                <step.icon
                                                    className={`w-7 h-7 ${isActive ? 'text-white' : 'text-slate-400'}`}
                                                />
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs font-bold ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < array.length - 1 && (
                                        <div className="flex-1 h-0.5 bg-slate-200 mx-4 mt-[-20px]">
                                            <div
                                                className={`h-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                                    }`}
                                                style={{
                                                    width: isCompleted ? '100%' : '0%',
                                                }}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* PDF Upload */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Document PDF</h2>
                                    <p className="text-sm text-slate-600 font-medium">Téléchargez votre fichier PDF</p>
                                </div>
                            </div>

                            <FileUploadZone
                                accept={{ 'application/pdf': ['.pdf'] }}
                                maxSize={20 * 1024 * 1024} // 20MB
                                onFileSelect={handlePdfSelect}
                                uploadProgress={pdfUploadProgress}
                                isUploading={isUploadingPdf}
                                label="Sélectionner un PDF"
                                description="Formats acceptés: PDF • Max 20MB"
                                icon={<FileText className="w-8 h-8 text-blue-600" />}
                                selectedFile={pdfFile}
                                onClear={() => {
                                    setPdfFile(null);
                                    setPdfUploadData(null);
                                }}
                            />
                        </div>

                        {/* Logo Upload */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                                    <Image className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Nouveau Logo</h2>
                                    <p className="text-sm text-slate-600 font-medium">Téléchargez votre nouveau logo</p>
                                </div>
                            </div>

                            <FileUploadZone
                                accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
                                maxSize={5 * 1024 * 1024} // 5MB
                                onFileSelect={handleLogoSelect}
                                uploadProgress={logoUploadProgress}
                                isUploading={isUploadingLogo}
                                label="Sélectionner un logo"
                                description="Formats acceptés: PNG, JPG • Max 5MB"
                                icon={<Image className="w-8 h-8 text-purple-600" />}
                                selectedFile={logoFile}
                                onClear={() => {
                                    setLogoFile(null);
                                    setLogoUploadData(null);
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <AnimatePresence>
                            {canProceedToSelection && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-3"
                                >
                                    {!processingComplete ? (
                                        <button
                                            onClick={() => setCurrentStep('select')}
                                            disabled={!canProceedToSelection || currentStep === 'select'}
                                            className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                        >
                                            <span>Sélectionner la position du logo</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleReset}
                                            className="w-full py-4 bg-slate-900 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-slate-900/30 transition-all"
                                        >
                                            Nouveau document
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Right Column - Preview & Processing */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                                <Wand2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Aperçu & Traitement</h2>
                                <p className="text-sm text-slate-600 font-medium">Sélectionnez la zone du logo à remplacer</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {!pdfFile ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-[600px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300"
                                >
                                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Téléchargez un PDF pour commencer</p>
                                </motion.div>
                            ) : currentStep === 'select' && pdfFile ? (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <PdfPreviewCanvas
                                        pdfFile={pdfFile}
                                        onLogoPositionSelect={handleLogoPositionSelect}
                                        selectedPosition={logoPosition || undefined}
                                    />

                                    {logoPosition && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={handleProcessPdf}
                                            disabled={isProcessing}
                                            className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                                    <span>Traitement en cours...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="w-5 h-5" />
                                                    <span>Remplacer le logo</span>
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </motion.div>
                            ) : processingComplete ? (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center justify-center h-[600px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200"
                                >
                                    <div className="p-6 rounded-full bg-white border-4 border-green-500 shadow-xl mb-6">
                                        <CheckCircle className="w-16 h-16 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Traitement terminé!</h3>
                                    <p className="text-slate-600 font-medium mb-8">Votre PDF est prêt à être téléchargé</p>

                                    <button
                                        onClick={handleDownload}
                                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-green-500/30 transition-all flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Télécharger le PDF</span>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-[600px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300"
                                >
                                    <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Cliquez sur "Sélectionner la position du logo" pour continuer</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default PdfLogoReplacementPage;
