// src/app/admin-ui/services/asset-selection.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Source } from '../../core/models/geo/source.model';
import { Group } from '../../core/models/geo/group.model';
import { GroupType } from '../../core/models/core/groupType.model';
import { Asset } from '../../core/models/geo/asset.model'; // Make sure this path matches your structure
import { Survey } from '../../core/models/geo/survey.model'; // Make sure this path matches your structure
import { Project } from '../../core/models/geo/project.model'; // Make sure this path matches your structure
import { Layer } from '../../core/models/geo/layer.model';
import { DTopography } from '../../core/models/core/topography.model';
@Injectable({
    providedIn: 'root'
})
export class AssetSelectionService {
    constructor(private http: HttpClient) { }
    private baseUrl = `${environment.apiUrl}/sources`;
    private selectedAsset: { id: number; name: string; type?: string } | null = null;
    getAllAssets(): Observable<Asset[]> {
        return this.http.get<Asset[]>(`${environment.apiUrl}/assets/all`);
    }

    getAllSurveys(): Observable<Survey[]> {
        const url = `${environment.apiUrl}/surveys/all`;
        return this.http.get<Survey[]>(url);
    }
    getAllLayers(): Observable<Layer[]> {
        return this.http.get<Layer[]>(`${environment.apiUrl}/layers/all`);
    }
    updateLayer(layerId: number, layerData: any): Observable<Layer> {
        return this.http.put<Layer>(`${environment.apiUrl}/layers/${layerId}`, layerData);
    }
    // Update this method in your AssetSelectionService
    getAllTopographies(): Observable<DTopography[]> {
        return this.http.get<DTopography[]>(`${environment.apiUrl}/topographies`);
    }
    createLayer(layerData: any): Observable<Layer> {
        return this.http.post<Layer>(`${environment.apiUrl}/layers`, layerData);
    }
    deleteLayer(layerId: number): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/layers/${layerId}`);
    }
    createSurvey(surveyData: Partial<Survey>): Observable<Survey> {
        const url = `${environment.apiUrl}/surveys`;
        return this.http.post<Survey>(url, surveyData);
    }

getAllProjects(): Observable<Project[]> {
  const userId = localStorage.getItem('userId');
  const url = `${environment.apiUrl}/projects/all?userId=${userId}`;

  return this.http.get<Project[]>(url);
}


    createProject(projectData: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/projects`, projectData); // ✅ CORRECT
    }


    setAsset(asset: { id: number; name: string; type?: string }) {
        this.selectedAsset = asset;
    }

    getAsset() {
        return this.selectedAsset;
    }

    getSourcesBySurveyId(surveyId: number): Observable<Source[]> {
        return this.http.get<Source[]>(`${environment.apiUrl}/sources?surveyId=${surveyId}`);
    }
    getSources(): Observable<Source[]> {
        const url = `${environment.apiUrl}/sources/all`;
        return this.http.get<Source[]>(url);
    }
    /**
  * Create a new source
  * @param source Source object
  */
    createSource(source: any): Observable<any> {
        console.log('Creating source:', source);
        return this.http.post<Source>(`${environment.apiUrl}/sources`, source);
    }
    /**
     * Update existing source by ID
     * @param id Source ID
     * @param source Updated Source object
     */
    updateSource(id: number, source: any): Observable<any> {
        return this.http.put<void>(`${environment.apiUrl}/sources/${id}`, source);
    }

    /**
     * Delete a source by ID
     * @param id Source ID
     */
    deleteSource(id: number): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/sources/${id}`);
    }
    baseUrlGroups = `${environment.apiUrl}`;
    getGroups(): Observable<Group[]> {
        return this.http.get<Group[]>(`${this.baseUrlGroups}/groups/all`);
    }
    /**
 * Create a new group
 */
    createGroup(group: Partial<Group>): Observable<Group> {
        return this.http.post<Group>(`${this.baseUrlGroups}/groups`, group);
    }


    /**
 * Update an existing group
 */
    updateGroup(groupId: number, group: Partial<Group>): Observable<void> {
        return this.http.put<void>(`${this.baseUrlGroups}/groups/${groupId}`, group);
    }

    /**
 * Delete a group by ID
 */
    deleteGroup(groupId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrlGroups}/groups/${groupId}`);
    }

    getGroupTypes(): Observable<GroupType[]> {
        return this.http.get<GroupType[]>(`${this.baseUrlGroups}/grouptypes`);
    }

    uploadToMapbox(formData: FormData): Observable<any> {
        return this.http.post(`${environment.apiUrl}/mapbox/upload`, formData);
    }

    deleteMapboxTileset(tilesetId: string): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/mapbox/tileset/${tilesetId}`);
    }



    
}


