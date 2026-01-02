import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface LogoPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PdfPreviewCanvasProps {
    pdfFile: File;
    onLogoPositionSelect: (position: LogoPosition & { pageNumber: number }) => void;
    selectedPosition?: LogoPosition & { pageNumber: number };
}

export const PdfPreviewCanvas: React.FC<PdfPreviewCanvasProps> = ({
    pdfFile,
    onLogoPositionSelect,
    selectedPosition,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const renderTaskRef = useRef<any>(null);

    // Load PDF document
    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                const arrayBuffer = await pdfFile.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setLoading(false);
            }
        };

        loadPdf();
    }, [pdfFile]);

    // Render current page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderPage = async () => {
            // Cancel previous render
            if (renderTaskRef.current) {
                try {
                    await renderTaskRef.current.cancel();
                } catch (error) {
                    // Ignore cancel error
                }
            }

            const page = await pdfDoc.getPage(currentPage);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current!;
            const context = canvas.getContext('2d')!;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;

            try {
                await renderTask.promise;
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Render error:', error);
                }
            }
        };

        renderPage();

        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [pdfDoc, currentPage, scale]);

    // Handle mouse down - start selection
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
    };

    // Handle mouse move - update selection
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelecting || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setSelectionEnd({ x, y });
    };

    // Handle mouse up - finalize selection
    const handleMouseUp = () => {
        if (!isSelecting || !selectionStart || !selectionEnd) return;

        const x = Math.min(selectionStart.x, selectionEnd.x);
        const y = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);

        if (width > 10 && height > 10) {
            onLogoPositionSelect({
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(width),
                height: Math.round(height),
                pageNumber: currentPage,
            });
        }

        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-slate-50 rounded-3xl border-2 border-slate-200">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                    <p className="text-slate-600 font-medium">Chargement du PDF...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 px-3">
                        Page {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                    >
                        <ZoomOut className="w-5 h-5 text-slate-700" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 px-3">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                    >
                        <ZoomIn className="w-5 h-5 text-slate-700" />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                    <Crosshair className="w-4 h-4 text-blue-600" />
                    <span>Cliquez et glissez pour sélectionner la zone du logo</span>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="overflow-auto bg-slate-100 rounded-3xl border-2 border-slate-200 shadow-inner flex justify-center p-4"
                style={{ maxHeight: '600px' }}
            >
                <div
                    ref={containerRef}
                    className="relative shadow-lg"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: 'crosshair', userSelect: 'none' }}
                >
                    <motion.canvas
                        ref={canvasRef}
                        className="block bg-white"
                        style={{ display: 'block' }}
                    />

                    {/* Temporary Selection Overlay */}
                    {isSelecting && selectionStart && selectionEnd && (
                        <div
                            style={{
                                position: 'absolute',
                                left: Math.min(selectionStart.x, selectionEnd.x) * scale,
                                top: Math.min(selectionStart.y, selectionEnd.y) * scale,
                                width: Math.abs(selectionEnd.x - selectionStart.x) * scale,
                                height: Math.abs(selectionEnd.y - selectionStart.y) * scale,
                                border: '2px dashed #3B82F6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    {/* Final Selection Overlay */}
                    {selectedPosition && selectedPosition.pageNumber === currentPage && (
                        <div
                            style={{
                                position: 'absolute',
                                left: selectedPosition.x * scale,
                                top: selectedPosition.y * scale,
                                width: selectedPosition.width * scale,
                                height: selectedPosition.height * scale,
                                border: '3px solid #3B82F6',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </div>
            </div>

            {selectedPosition && selectedPosition.pageNumber === currentPage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 rounded-2xl border border-blue-200"
                >
                    <p className="text-sm font-bold text-blue-900 mb-2">Zone sélectionnée:</p>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="bg-white p-2 rounded-lg">
                            <span className="text-slate-500 font-medium">X:</span>
                            <span className="ml-1 font-bold text-slate-900">{selectedPosition.x}px</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                            <span className="text-slate-500 font-medium">Y:</span>
                            <span className="ml-1 font-bold text-slate-900">{selectedPosition.y}px</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                            <span className="text-slate-500 font-medium">Largeur:</span>
                            <span className="ml-1 font-bold text-slate-900">{selectedPosition.width}px</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                            <span className="text-slate-500 font-medium">Hauteur:</span>
                            <span className="ml-1 font-bold text-slate-900">{selectedPosition.height}px</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
