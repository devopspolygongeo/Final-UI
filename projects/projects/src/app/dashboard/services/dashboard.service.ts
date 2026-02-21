import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'projects/projects/src/environments/environment';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { Asset, Group, Landmark, Layer, Layout, Project, Source, Survey, View } from '../../core/models';





@Injectable()
export class DashboardService {

  private view$!: Observable<View>;
  private projectsMap$: Map<number, Observable<Project[]>> = new Map();
  private surveysMap$: Map<number, Observable<Survey[]>> = new Map();
  private sourcesMap$: Map<number, Observable<Source[]>> = new Map();
  private layersMap$: Map<string, Observable<Layer[]>> = new Map();
  private groupsMap$: Map<number, Observable<Group[]>> = new Map();
  // private plotsMap$: Map<number, Observable<Plot[]>> = new Map();
  private layoutsMap$: Map<number, Observable<Layout[]>> = new Map();
  private assetsMap$: Map<number, Observable<Asset[]>> = new Map();
  private landmarksMap$: Map<number, Observable<Landmark[]>> = new Map();
  constructor(private readonly http: HttpClient) {
  }

  public getView(): Observable<View> {
    if (!this.view$) {
      this.view$ = this.http.get<View>(environment.apiUrl + '/view').pipe(shareReplay(1));
    }
    return this.view$;
  }

  public getProjects(userId: number): Observable<Project[]> {
    if (!this.projectsMap$ || !this.projectsMap$.has(userId)) {
      this.projectsMap$.set(userId, this.http.get<Project[]>(environment.apiUrl + '/projects?userId=' + userId).pipe(shareReplay(1)));
    }
    return this.projectsMap$.get(userId) || of([]);
  }

  public getSurveys(projectId: number): Observable<Survey[]> {
    if (!this.surveysMap$ || !this.surveysMap$.has(projectId)) {
      this.surveysMap$.set(projectId, this.http.get<Survey[]>(environment.apiUrl + '/surveys?projectId=' + projectId).pipe(shareReplay(1)));
    }
    return this.surveysMap$.get(projectId) || of([]);
  }

  public getSources(surveyId: number): Observable<Source[]> {
   // console.log("Fetching sources for surveyId: from dashboard-view.component.ts", surveyId);
    if (!this.sourcesMap$ || !this.sourcesMap$.has(surveyId)) {
      this.sourcesMap$.set(surveyId, this.http.get<Source[]>(environment.apiUrl + '/sources?surveyId=' + surveyId).pipe(shareReplay(1)));
    }
    return this.sourcesMap$.get(surveyId) || of([]);
  }

  

   public getLayers(sourceIds: string): Observable<Layer[]> {
    if (!this.layersMap$ || !this.layersMap$.has(sourceIds)) {
      this.layersMap$.set(sourceIds, this.http.get<Layer[]>(environment.apiUrl + '/vectorLayers?sourceId=' + sourceIds).pipe(shareReplay(1)));
    }
    return this.layersMap$.get(sourceIds) || of([]);
  }

  public getGroups(surveyId: number): Observable<Group[]> {
    if (!this.groupsMap$ || !this.groupsMap$.has(surveyId)) {
      this.groupsMap$.set(surveyId, this.http.get<Group[]>(environment.apiUrl + '/groups?surveyId=' + surveyId).pipe(shareReplay(1)));
    }
    return this.groupsMap$.get(surveyId) || of([]);
  }

  public getLayouts(surveyId: number): Observable<Layout[]> {
    if (!this.layoutsMap$ || !this.layoutsMap$.has(surveyId)) {
      this.layoutsMap$.set(surveyId, this.http.get<Layout[]>(environment.apiUrl + '/layouts?surveyId=' + surveyId).pipe(shareReplay(1)));
    }
    return this.layoutsMap$.get(surveyId) || of([]);
  }

  public getAssets(surveyId: number): Observable<Asset[]> {
    if (!this.assetsMap$ || !this.assetsMap$.has(surveyId)) {
      this.assetsMap$.set(surveyId, this.http.get<Asset[]>(environment.apiUrl + '/assets?surveyId=' + surveyId).pipe(shareReplay(1)));
    }
    return this.assetsMap$.get(surveyId) || of([]);
  }
  public getLandmarks(surveyId: number): Observable<Landmark[]> {
    if (!this.landmarksMap$ || !this.landmarksMap$.has(surveyId)) {
      this.landmarksMap$.set(surveyId, this.http.get<Landmark[]>(environment.apiUrl + '/landmarks?surveyId=' + surveyId).pipe(shareReplay(1)));
    }
    return this.landmarksMap$.get(surveyId) || of([]);
  }
  public getBuildings3DSource(projectId: number) {
  return this.http.get<{
    tilesetId: string;
    layerName: string;
    heightField?: string;
  }>(`${environment.apiUrl}/projects/${projectId}/buildings-3d-source`);
}


  // public getPlots(surveyId: number): Observable<Plot[]> {
  //   if (!this.plotsMap$ || !this.plotsMap$.has(surveyId)) {
  //     this.plotsMap$.set(surveyId, this.http.get<Plot[]>(environment.apiUrl + '/plots?surveyId=' + surveyId).pipe(shareReplay(1)));
  //   }
  //   return this.plotsMap$.get(surveyId) || of([]);
  // }

}