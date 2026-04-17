import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { AssetSelectionService } from '../../../../services/asset-selection.service';
import { Source as DBSource } from '../../../../../core/models/geo/source.model';

interface UISource extends DBSource {
  id: number;
  surveyId: number;
  dataType: string;
  name: string;
  link: string;
  priority: number;
  visibility: boolean;
  assetName: string;
}

@Component({
  selector: 'app-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.css'],
})
export class SourcesComponent implements OnInit {
  sources: UISource[] = [];
  filteredSources: UISource[] = [];
  newSource!: UISource;
  assetId: string = '';
  assetName: string = '';
  surveyId!: number;

  currentPage: number = 1;
  pageSize: number = 10;
  showUploadModal = false;
  uploadFile: File | null = null;
  uploadTileset: string = '';
  uploadName: string = '';
  uploadProgress = 0;
  disableNameAndLink = false;
  uploadLink = '';

  sortConfig: { key: keyof UISource; direction: 'asc' | 'desc' } = {
    key: 'id',
    direction: 'asc',
  };

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetSelectionService,
  ) {}

  ngOnInit(): void {
    this.assetName = this.route.snapshot.paramMap.get('assetName') || '';
    this.assetId = this.route.parent?.snapshot.paramMap.get('id') || '';
    this.surveyId = +this.route.parent?.snapshot.paramMap.get('surveyId')!;
    console.log('surveyId:', this.surveyId);
    this.newSource = this.getEmptySource();
    this.fetchSources();
  }

  private getEmptySource(): UISource {
    return {
      id: 0,
      surveyId: this.surveyId,
      dataType: '',
      name: '',
      link: '',
      priority: 1,
      visibility: false,
      assetName: this.assetName,
    };
  }

  fetchSources(): void {
    this.assetService.getSources().subscribe((data: any[]) => {
      console.log('Fetched sources:', data);
      this.sources = data
        .filter((src) => Number(src.surveyId) === Number(this.surveyId))
        .map((src) => ({
          id: src.id,
          surveyId: src.surveyId,
          dataType: src.dataType,
          name: src.name,
          link: src.link,
          priority: src.priority,
          visibility: !!src.visibility,
          assetName: this.assetName,
        }));

      console.log('Mapped sources:', this.sources);
      this.filterSources();
    });
  }

  addSource(): void {
    this.newSource = this.getEmptySource();
  }

  editSource(source: UISource): void {
    this.newSource = { ...source };
  }

  deleteSource(source: UISource): void {
    const confirmed = confirm(
      `Are you sure you want to delete source "${source.name}"?`,
    );
    if (!confirmed) return;

    this.assetService.deleteSource(source.id).subscribe({
      next: () => this.fetchSources(),
      error: (err) => {
        console.error('Failed to delete source:', err);
        alert('Deletion failed. Check console.');
      },
    });
  }

  toggleSourceVisibility(source: UISource): void {
    const updatedVisibility = !source.visibility;
    const backendPayload = { sourcevisibility: updatedVisibility ? 1 : 0 };

    this.assetService.updateSource(source.id, backendPayload).subscribe({
      next: () => {
        source.visibility = updatedVisibility;
        this.filterSources();
      },
      error: (err) => {
        console.error('Toggle visibility failed:', err);
        alert('Toggle failed.');
      },
    });
  }

  private toBackendSourceDTO(ui: UISource): any {
    const surveyid = Number(this.surveyId);

    return {
      surveyid: Number.isFinite(surveyid) ? surveyid : 0,
      datatype: (ui.dataType ?? '').toString().trim(),
      sourcename: (ui.name ?? '').toString().trim(),
      sourcelink: (ui.link ?? '').toString().trim(),
      sourcepriority: Number(ui.priority ?? 1),
      sourcevisibility: ui.visibility ? 1 : 0,
    };
  }

  submitNewSource(): void {
    console.log('🧾 Form Input:', this.newSource);

    if (!this.newSource.surveyId) {
      this.newSource.surveyId = this.surveyId;
    }

    const backendPayload = this.toBackendSourceDTO(this.newSource);

    console.log('🚀 Backend Payload (snake_case):', backendPayload);

    if (this.newSource.id === 0) {
      this.assetService.createSource(backendPayload).subscribe({
        next: (created: any) => {
          console.log('✅ Source created:', created);
          this.fetchSources();
          this.newSource = this.getEmptySource();
        },
        error: (err) => {
          console.error('❌ Create failed:', err);
          alert('Create failed.');
        },
      });
    } else {
      this.assetService
        .updateSource(this.newSource.id, backendPayload)
        .subscribe({
          next: () => {
            console.log('✅ Source updated');
            this.fetchSources();
            this.newSource = this.getEmptySource();
          },
          error: (err) => {
            console.error('❌ Update failed:', err);
            alert('Update failed.');
          },
        });
    }
  }

  resetForm(): void {
    this.newSource = this.getEmptySource();
  }

  filterSources(): void {
    const sorted = [...this.sources].sort((a, b) => {
      const aVal = a[this.sortConfig.key];
      const bVal = b[this.sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return this.sortConfig.direction === 'asc'
          ? (aVal as any) > (bVal as any)
            ? 1
            : -1
          : (aVal as any) < (bVal as any)
            ? 1
            : -1;
      }
    });

    this.filteredSources = sorted;
  }

  sortBy(key: keyof UISource): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction =
        this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }

    this.filterSources();
  }

  getSortIcon(_key: keyof UISource): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  get paginatedSources(): UISource[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSources.slice(start, end);
  }

  getStartIndex(): number {
    return this.getTotalFilteredItems() === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.getTotalFilteredItems());
  }

  getTotalFilteredItems(): number {
    return this.filteredSources.length;
  }

  getTotalPages(): number {
    return Math.ceil(this.getTotalFilteredItems() / this.pageSize);
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.filterSources();
    }
  }

  openUploadModal(): void {
    if (!this.newSource.dataType) {
      alert('Please select datatype first.');
      return;
    }

    this.showUploadModal = true;
    this.uploadFile = null;
    this.uploadTileset = '';
    this.uploadName = '';
    this.uploadProgress = 0;
    this.uploadLink = '';
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.uploadLink = '';
    this.uploadProgress = 0;
  }

  onFileChange(event: any): void {
    this.uploadFile = event.target.files?.[0] || null;
  }

  async uploadToMapbox(): Promise<void> {
    if (
      !this.uploadFile ||
      !this.uploadTileset ||
      !this.uploadName ||
      !this.newSource.dataType
    ) {
      alert('Please fill all fields and choose a file');
      return;
    }

    try {
      this.uploadProgress = 5;

      const credentialsResponse: any = await lastValueFrom(
        this.assetService.getMapboxUploadCredentials({
          tileset: this.uploadTileset,
          name: this.uploadName,
          surveyId: this.surveyId,
          datatype: this.newSource.dataType,
        }),
      );

      const creds = credentialsResponse?.credentials;

      if (!creds?.bucket || !creds?.key || !creds?.url) {
        throw new Error('Invalid upload credentials received from backend');
      }

      const s3 = new S3Client({
        region: 'us-east-1',
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });

      const uploader = new Upload({
        client: s3,
        params: {
          Bucket: creds.bucket,
          Key: creds.key,
          Body: this.uploadFile,
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024,
        leavePartsOnError: false,
      });

      uploader.on('httpUploadProgress', (progress: any) => {
        if (progress?.loaded && progress?.total) {
          const percent = Math.round((progress.loaded / progress.total) * 90);
          this.uploadProgress = Math.max(10, percent);
        }
      });

      await uploader.done();

      const finalizeResponse: any = await lastValueFrom(
        this.assetService.finalizeMapboxUpload({
          tileset: this.uploadTileset,
          name: this.uploadName,
          surveyId: this.surveyId,
          datatype: this.newSource.dataType,
          s3Url: creds.url,
          sourcepriority: 1,
          sourcevisibility: 1,
        }),
      );

      this.uploadProgress = 100;
      this.uploadLink = finalizeResponse.tileset;
      this.newSource.name = this.uploadName;
      this.newSource.link = finalizeResponse.sourceLink;
      this.disableNameAndLink = true;

      this.fetchSources();
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      alert(err?.message || err?.error?.details || 'Upload failed');
      this.uploadProgress = 0;
    }
  }

  deleteFromMapbox(tilesetId: string): void {
    if (!tilesetId) {
      alert('No tileset link found.');
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete tileset "${tilesetId}" from Mapbox?`,
    );
    if (!confirmDelete) return;

    this.assetService.deleteMapboxTileset(tilesetId).subscribe({
      next: (res) => {
        alert(`✅ ${res.message}`);
        this.fetchSources();
      },
      error: (err) => {
        console.error(err);
        alert(
          `❌ Failed to delete tileset.\n${
            err?.error?.details?.message || err.message
          }`,
        );
      },
    });
  }
}
