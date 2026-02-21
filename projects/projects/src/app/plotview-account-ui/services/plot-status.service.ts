// projects/projects/src/app/dashboard/services/plot-status.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ------- Plot Status types -------
export interface PlotStatusUpdateReq {
    surveyId: number;
    tilesetId: string;
    datasetId: string;
    featureId: string;
    newStatus: 'Available' | 'In Progress' | 'Sold';
}
export interface PlotStatusUpdateRes {
    ok: boolean;
    message?: string;
    jobId?: string;
}

// ------- Asset API types -------
export type AssetKind = 'image' | 'video' | 'document' | 'panorama';
export interface AssetRow {
    id: number;
    asset_type?: 1 | 2 | 3 | 4;
    type?: AssetKind;
    url: string;
    name?: string;
    size?: number;
    created_at?: string;
    thumbnail?: string;
}
export interface PresignRequest {
    surveyId: number;
    assetType: AssetKind;
    fileName: string;
    fileType: string;
    fileSize: number;
}
export interface PresignResponse {
    uploadUrl: string;
    key: string;
    publicUrl: string;
}
export interface CreateAssetRequest {
    survey_id: number;
    asset_type: 1 | 2 | 3 | 4;
    name: string;
    url: string;
}

@Injectable({ providedIn: 'root' })
export class PlotStatusService {
    private mapboxBase = `${environment.apiUrl}/mapbox`;
    private assetsBase = `${environment.apiUrl}/assets`;

    constructor(private http: HttpClient) { }

    // --- Plot status ---
    updateStatus(body: PlotStatusUpdateReq): Observable<PlotStatusUpdateRes> {
        return this.http.post<PlotStatusUpdateRes>(`${this.mapboxBase}/plot-status`, body);
    }

    // --- Assets ---
    getAssets(surveyId: number): Observable<AssetRow[]> {
        return this.http.get<AssetRow[]>(`${this.assetsBase}`, { params: { surveyId } as any });
    }

    presign(body: PresignRequest): Observable<PresignResponse> {
        return this.http.post<PresignResponse>(`${this.assetsBase}/presign`, body);
    }

    create(body: CreateAssetRequest): Observable<{ id: number } & CreateAssetRequest> {
        return this.http.post<{ id: number } & CreateAssetRequest>(`${this.assetsBase}`, body);
    }

    delete(id: number): Observable<{ id: number }> {
        return this.http.delete<{ id: number }>(`${this.assetsBase}/${id}`);
    }
}
