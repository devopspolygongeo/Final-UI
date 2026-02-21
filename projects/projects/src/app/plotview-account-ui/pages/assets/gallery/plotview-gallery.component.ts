import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { Asset } from '../../../../core/models';
import { AppDialogComponent } from '../../../../shared/components/app-dialog/app-dialog.component';

// IMPORTANT: use the asset APIs from PlotStatusService
import {
    PlotStatusService,
    PresignResponse,
    AssetRow
} from '../../../services/plot-status.service';

type Kind = 'image' | 'video';

interface MediaItem {
    id: number | string;
    name?: string;
    url: string;
    size?: number;
    type: Kind;
    uploadDate?: Date;
}
interface VideoItem extends MediaItem {
    thumbnail?: string;
    duration?: number;
}

@Component({
    selector: 'app-plotview-gallery',
    templateUrl: './plotview-gallery.component.html',
    styleUrls: ['./plotview-gallery.component.css']
})
export class PlotviewGalleryComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    activeTab: 'images' | 'videos' = 'images';
    maxFileSize = 1000 * 1024 * 1024; // 1GB

    images: MediaItem[] = [];
    videos: VideoItem[] = [];

    private surveyId?: number;
    uploading = false;

    constructor(
        private route: ActivatedRoute,
        private assetsApi: PlotStatusService,   // <-- use PlotStatusService here
        private dialog: MatDialog
    ) { }

    async ngOnInit() {
        const qp = await firstValueFrom(this.route.queryParamMap);
        const surveyIdStr = qp.get('surveyId');
        this.surveyId = surveyIdStr ? Number(surveyIdStr) : undefined;

        if (this.surveyId) {
            this.loadAssets(this.surveyId);
        }
    }

    private async loadAssets(surveyId: number) {
        try {
            const assets: AssetRow[] = await firstValueFrom(this.assetsApi.getAssets(surveyId));

            const imgs: MediaItem[] = [];
            const vids: VideoItem[] = [];

            (assets ?? []).forEach((a: AssetRow) => {
                const kind: Kind =
                    a?.type ??
                    (a?.asset_type === 1 ? 'image'
                        : a?.asset_type === 2 ? 'video'
                            : undefined as any);

                if (!kind) return;

                const base: MediaItem = {
                    id: a.id,
                    name: a.name || (kind === 'image' ? 'Image' : 'Video'),
                    url: a.url,
                    size: a.size,
                    type: kind,
                    uploadDate: a.created_at ? new Date(a.created_at) : undefined
                };

                if (kind === 'image') imgs.push(base);
                else vids.push({ ...base, thumbnail: a.thumbnail || undefined });
            });

            this.images = imgs;
            this.videos = vids;
        } catch (e) {
            console.error('Failed to load assets', e);
            this.images = [];
            this.videos = [];
        }
    }

    // UI helpers
    setActiveTab(tab: 'images' | 'videos') { this.activeTab = tab; }
    triggerFileInput() { this.fileInput?.nativeElement.click(); }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) this.handleFiles(Array.from(input.files));
    }
    onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); }
    onDrop(event: DragEvent) {
        event.preventDefault(); event.stopPropagation();
        if (event.dataTransfer?.files) this.handleFiles(Array.from(event.dataTransfer.files));
    }

    // Upload pipeline
    private async handleFiles(files: File[]) {
        if (!this.surveyId) { alert('No survey selected.'); return; }

        this.uploading = true;
        try {
            for (const file of files) {
                if (file.size > this.maxFileSize) { alert(`"${file.name}" is larger than 1GB.`); continue; }
                const isImage = file.type?.startsWith('image/');
                const isVideo = file.type?.startsWith('video/');

                if (this.activeTab === 'images' && !isImage) { alert(`"${file.name}" is not an image.`); continue; }
                if (this.activeTab === 'videos' && !isVideo) { alert(`"${file.name}" is not a video.`); continue; }

                const kind: Kind = isImage ? 'image' : 'video';
                await this.uploadAndPersist(file, kind, this.surveyId);
            }
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. See console for details.');
        } finally {
            this.uploading = false;
            if (this.fileInput) this.fileInput.nativeElement.value = '';
            this.loadAssets(this.surveyId!);
        }
    }

    private async uploadAndPersist(file: File, kind: Kind, surveyId: number) {
        // 1) presign
        const presign = await firstValueFrom<PresignResponse>(
            this.assetsApi.presign({
                surveyId,
                assetType: kind,
                fileName: file.name,
                fileType: file.type || (kind === 'image' ? 'image/jpeg' : 'application/octet-stream'),
                fileSize: file.size
            })
        );

        // 2) PUT to S3
        const putRes = await fetch(presign.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file
        });
        if (!putRes.ok) throw new Error(`S3 PUT failed: ${putRes.status}`);

        // 3) persist metadata (DB)
        const assetTypeNum = kind === 'image' ? 1 : 2;
        await firstValueFrom(
            this.assetsApi.create({
                survey_id: surveyId,
                asset_type: assetTypeNum as 1 | 2,
                name: file.name,
                url: presign.publicUrl
            })
        );
    }

    // Viewer
    onClickImage(image: MediaItem) {
        const asset: Asset = { url: image.url, type: 'image' } as Asset;
        this.dialog.open(AppDialogComponent, { data: { asset }, height: '80%', width: '80%' });
    }
    onClickVideo(video: VideoItem, ev?: Event) {
        ev?.stopPropagation?.();
        const asset: Asset = { url: video.url, type: 'video' } as Asset;
        this.dialog.open(AppDialogComponent, { data: { asset }, height: '80%', width: '80%' });
    }

    // Delete
    async removeImage(index: number) {
        const it = this.images[index];
        if (!confirm('Delete this image?')) return;

        if (typeof it.id === 'number') {
            await firstValueFrom(this.assetsApi.delete(it.id));
        } else if (it.url?.startsWith('blob:')) {
            URL.revokeObjectURL(it.url);
        }
        this.images.splice(index, 1);
    }

    async removeVideo(index: number) {
        const it = this.videos[index];
        if (!confirm('Delete this video?')) return;

        if (typeof it.id === 'number') {
            await firstValueFrom(this.assetsApi.delete(it.id));
        } else if (it.url?.startsWith('blob:')) {
            URL.revokeObjectURL(it.url);
        }
        this.videos.splice(index, 1);
    }
}
