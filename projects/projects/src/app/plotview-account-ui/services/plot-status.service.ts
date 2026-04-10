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
  plotNo?: string | number;
  featureId?: string;
  newStatus: 'Available' | 'In Progress' | 'Sold';
  ownername?: string;
  Developer?: string;
  doc_no?: string;
}

export interface PlotDetails {
  plotNo: string;
  doc_no?: string;
  east: string;
  west: string;
  north: string;
  south: string;
  salestatus: 'Available' | 'In Progress' | 'Sold' | string;
  facing: string;
  ownername: string;
  Developer: string;
  priceMin: string;
  priceMax: string;
  priceUnit: string;
}

export interface PlotStatusUpdateRes {
  ok: boolean;
  message?: string;
  jobId?: string;
  datasetId?: string;
  featureId?: string;
  plot?: PlotDetails;
}

// ------- Plot Details types -------
export interface PlotDetailsReq {
  surveyId: number;
  tilesetId: string;
  plotNo?: string | number;
  featureId?: string;
}

export type PlotBBox = [number, number, number, number];

export interface PlotDetailsRes {
  ok: boolean;
  message?: string;
  datasetId?: string;
  featureId?: string;
  bbox?: PlotBBox;
  plot?: PlotDetails;
}

// ------- Plot Meta types -------
export interface PlotMetaReq {
  surveyId: number;
  tilesetId: string;
}

export interface PlotMetaRes {
  ok: boolean;
  message?: string;
  datasetId?: string;
  owners?: string[];
  developers?: string[];
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

// ------- CSV Data / Reports types -------
export interface CsvDataMeta {
  id: number;
  survey_id: number;
  file_name: string;
  csv_url: string;
}

export interface ParsedCsvDataRes extends CsvDataMeta {
  columns: string[];
  rows: Record<string, any>[];
}

@Injectable({ providedIn: 'root' })
export class PlotStatusService {
  private mapboxBase = `${environment.apiUrl}/mapbox`;
  private assetsBase = `${environment.apiUrl}/assets`;
  private csvDataBase = `${environment.apiUrl}/csv-data`;

  constructor(private http: HttpClient) {}

  // --- Plot status ---
  updateStatus(body: PlotStatusUpdateReq): Observable<PlotStatusUpdateRes> {
    const token = localStorage.getItem('polygon_user_a_token');

    return this.http.post<PlotStatusUpdateRes>(
      `${this.mapboxBase}/plot-status`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  // --- Plot details from dataset ---
  getPlotDetails(params: PlotDetailsReq): Observable<PlotDetailsRes> {
    const token = localStorage.getItem('polygon_user_a_token');

    const queryParams: any = {
      surveyId: params.surveyId,
      tilesetId: params.tilesetId,
      _ts: Date.now(),
    };

    if (params.featureId) {
      queryParams.featureId = params.featureId;
    }

    if (
      params.plotNo !== undefined &&
      params.plotNo !== null &&
      String(params.plotNo).trim() !== ''
    ) {
      queryParams.plotNo = params.plotNo;
    }

    return this.http.get<PlotDetailsRes>(`${this.mapboxBase}/plot-details`, {
      params: queryParams,
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  }

  // --- Plot meta from dataset ---
  getPlotMeta(params: PlotMetaReq): Observable<PlotMetaRes> {
    const token = localStorage.getItem('polygon_user_a_token');

    return this.http.get<PlotMetaRes>(`${this.mapboxBase}/plot-meta`, {
      params: {
        surveyId: params.surveyId,
        tilesetId: params.tilesetId,
        _ts: Date.now(),
      } as any,
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  }

  // --- Assets ---
  getAssets(surveyId: number): Observable<AssetRow[]> {
    return this.http.get<AssetRow[]>(`${this.assetsBase}`, {
      params: { surveyId } as any,
    });
  }

  presign(body: PresignRequest): Observable<PresignResponse> {
    return this.http.post<PresignResponse>(`${this.assetsBase}/presign`, body);
  }

  create(
    body: CreateAssetRequest,
  ): Observable<{ id: number } & CreateAssetRequest> {
    return this.http.post<{ id: number } & CreateAssetRequest>(
      `${this.assetsBase}`,
      body,
    );
  }

  delete(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(`${this.assetsBase}/${id}`);
  }

  // --- Reports / CSV Data ---
  getCsvDataMeta(surveyId: number): Observable<CsvDataMeta> {
    const token = localStorage.getItem('polygon_user_a_token');

    return this.http.get<CsvDataMeta>(`${this.csvDataBase}`, {
      params: { surveyId } as any,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getParsedCsvData(surveyId: number): Observable<ParsedCsvDataRes> {
    const token = localStorage.getItem('polygon_user_a_token');

    return this.http.get<ParsedCsvDataRes>(`${this.csvDataBase}/parsed`, {
      params: { surveyId } as any,
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  }
}
