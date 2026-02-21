import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// use the same service we wired for gallery
import {
    PlotStatusService,
    AssetRow,
    PresignResponse,
} from '../../../services/plot-status.service';

interface DocumentItem {
    id: string | number;
    name: string;
    url: string;
    size: number;
    type: string;          // MIME type (e.g., application/pdf)
    uploadDate: Date;
    thumbnail?: string;
}

@Component({
    selector: 'app-plotview-documents',
    templateUrl: './plotview-documents.component.html',
    styleUrls: ['./plotview-documents.component.css']
})
export class PlotviewDocumentsComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    // 10GB (matches UI copy)
    maxFileSize = 10000 * 1024 * 1024;

    documents: DocumentItem[] = [];
    selectedDocument: DocumentItem | null = null;
    isModalActive = false;

    private surveyId?: number;
    uploading = false;

    constructor(
        private sanitizer: DomSanitizer,
        private route: ActivatedRoute,
        private assetsApi: PlotStatusService
    ) { }

    async ngOnInit() {
        const qp = await firstValueFrom(this.route.queryParamMap);
        const surveyIdStr = qp.get('surveyId');
        this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

        if (this.surveyId) {
            await this.loadDocuments(this.surveyId);
        } else {
            this.documents = [];
        }
    }

    private async loadDocuments(surveyId: number) {
        try {
            const assets = await firstValueFrom(this.assetsApi.getAssets(surveyId));
            const docs: DocumentItem[] = [];

            (assets ?? []).forEach((a: AssetRow) => {
                // accept either asset_type=3 or type==='document'
                const isDoc =
                    a?.type === 'document' ||
                    a?.asset_type === 3;

                if (!isDoc) return;

                const name =
                    (a as any).name ??
                    (a as any).title ??
                    filenameFromUrl(a.url) ??
                    'Document';

                const size = (a as any).size ?? 0;
                const mime =
                    (a as any).contentType ??
                    guessMimeFromName(name) ??
                    'application/octet-stream';
                const uploaded =
                    (a as any).uploadDate ? new Date((a as any).uploadDate) : new Date();

                docs.push({
                    id: (a as any).id ?? cryptoRandomId(),
                    name,
                    url: a.url,
                    size,
                    type: mime,
                    uploadDate: uploaded,
                    thumbnail: (a as any).thumbnail
                });
            });

            this.documents = docs;
        } catch (err) {
            console.error('Failed to load documents', err);
            this.documents = [];
        }
    }

    // ---------- Uploads ----------
    triggerFileInput() { this.fileInput?.nativeElement.click(); }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) this.handleFiles(Array.from(input.files));
    }

    onDragOver(event: DragEvent) {
        event.preventDefault(); event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.add('dragover');
    }
    onDragLeave(event: DragEvent) {
        event.preventDefault(); event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.remove('dragover');
    }
    onDrop(event: DragEvent) {
        event.preventDefault(); event.stopPropagation();
        (event.currentTarget as HTMLElement).classList.remove('dragover');
        if (event.dataTransfer?.files) this.handleFiles(Array.from(event.dataTransfer.files));
    }

    private async handleFiles(files: File[]) {
        if (!this.surveyId) { alert('No survey selected.'); return; }

        const allowedTypes = new Set<string>([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]);

        this.uploading = true;
        try {
            for (const file of files) {
                if (file.size > this.maxFileSize) {
                    alert(`File "${file.name}" is too large. Maximum size is 10GB.`);
                    continue;
                }
                if (!allowedTypes.has(file.type)) {
                    alert(`"${file.name}" is not a supported document type.`);
                    continue;
                }

                // 1) presign (assetType 'document')
                const presign = await firstValueFrom<PresignResponse>(
                    this.assetsApi.presign({
                        surveyId: this.surveyId,
                        assetType: 'document',
                        fileName: file.name,
                        fileType: file.type || 'application/octet-stream',
                        fileSize: file.size
                    })
                );

                // 2) PUT to S3
                const putRes = await fetch(presign.uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'application/octet-stream' },
                    body: file
                });
                if (!putRes.ok) {
                    console.error('S3 PUT failed:', putRes.status, putRes.statusText);
                    alert(`Failed to upload "${file.name}"`);
                    continue;
                }

                // 3) persist metadata (asset_type = 3 for documents)
                await firstValueFrom(
                    this.assetsApi.create({
                        survey_id: this.surveyId,
                        asset_type: 3,
                        name: file.name,
                        url: presign.publicUrl
                    })
                );
            }
        } catch (err) {
            console.error('Document upload failed:', err);
            alert('Upload failed. See console for details.');
        } finally {
            this.uploading = false;
            if (this.fileInput) this.fileInput.nativeElement.value = '';
            if (this.surveyId) this.loadDocuments(this.surveyId);
        }
    }

    // ---------- Modal & helpers ----------
    openDocumentModal(document: DocumentItem) {
        this.selectedDocument = document;
        this.isModalActive = true;
    }
    closeModal() {
        this.isModalActive = false;
        setTimeout(() => (this.selectedDocument = null), 300);
    }

    canEmbedDocument(mimeType: string): boolean {
        return ['application/pdf', 'text/plain', 'text/html'].includes(mimeType);
    }
    getSafeUrl(url: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    viewDocument(document: DocumentItem) {
        if (document.url.startsWith('blob:')) {
            const w = window.open('', '_blank'); if (w) w.location.href = document.url;
        } else {
            window.open(document.url, '_blank');
        }
    }

    removeDocument(index: number, event: Event) {
        event.stopPropagation();
        const doc = this.documents[index];
        if (!confirm('Delete this document?')) return;

        // If it came from DB (numeric id), delete via API; otherwise revoke the blob URL
        if (typeof doc.id === 'number') {
            firstValueFrom(this.assetsApi.delete(doc.id))
                .then(() => this.documents.splice(index, 1))
                .catch(err => console.error('Delete failed', err));
        } else {
            if (doc.url?.startsWith('blob:')) URL.revokeObjectURL(doc.url);
            this.documents.splice(index, 1);
        }
    }

    // ---------- UI text helpers ----------
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toUpperCase() || 'FILE';
    }
    getDocumentTypeClass(mime: string): string {
        if (this.isPdfDocument(mime)) return 'pdf';
        if (this.isWordDocument(mime)) return 'word';
        if (this.isExcelDocument(mime)) return 'excel';
        if (this.isTextDocument(mime)) return 'text';
        return '';
    }
    isPdfDocument(m: string) { return m === 'application/pdf'; }
    isWordDocument(m: string) { return m === 'application/msword' || m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; }
    isExcelDocument(m: string) { return m === 'application/vnd.ms-excel' || m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; }
    isTextDocument(m: string) { return m === 'text/plain'; }
}

// --- tiny utils ---
function cryptoRandomId(): string {
    try { const a = new Uint32Array(2); crypto.getRandomValues(a); return (a[0].toString(36) + a[1].toString(36)).slice(0, 12); }
    catch { return Math.random().toString(36).slice(2, 14); }
}
function filenameFromUrl(url: string): string | undefined {
    try { const u = new URL(url); const p = u.pathname.split('/').pop(); return p || undefined; } catch { return undefined; }
}
function guessMimeFromName(name: string): string | undefined {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'txt': return 'text/plain';
        case 'html': return 'text/html';
        default: return undefined;
    }
}
