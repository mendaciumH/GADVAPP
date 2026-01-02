import api from './api';

export interface UploadResponse {
    fileId: string;
    filename: string;
    size: number;
    uploadedAt: string;
}

export interface ReplaceLogoRequest {
    pdfFileId: string;
    logoFileId: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ProcessingStatus {
    status: 'processing' | 'completed' | 'failed';
    message?: string;
    downloadUrl?: string;
}

class PdfLogoService {
    private readonly basePath = '/pdf-processing';

    /**
     * Upload a PDF file
     */
    async uploadPdf(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadResponse>(`${this.basePath}/upload-pdf`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    }

    /**
     * Upload a logo image
     */
    async uploadLogo(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadResponse>(`${this.basePath}/upload-logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    }

    /**
     * Replace logo in PDF
     */
    async replaceLogo(request: ReplaceLogoRequest): Promise<ProcessingStatus> {
        const response = await api.post<ProcessingStatus>(`${this.basePath}/replace-logo`, request);
        return response.data;
    }

    /**
     * Download modified PDF
     */
    async downloadPdf(fileId: string): Promise<Blob> {
        const response = await api.get(`${this.basePath}/download/${fileId}`, {
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Helper to trigger browser download
     */
    triggerDownload(blob: Blob, filename: string = 'modified-document.pdf'): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

export const pdfLogoService = new PdfLogoService();
