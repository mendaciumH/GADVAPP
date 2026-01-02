export class UploadResponseDto {
    fileId: string;
    filename: string;
    size: number;
    uploadedAt: string;
}

export class ProcessingStatusDto {
    status: 'processing' | 'completed' | 'failed';
    message?: string;
    downloadUrl?: string;
}
