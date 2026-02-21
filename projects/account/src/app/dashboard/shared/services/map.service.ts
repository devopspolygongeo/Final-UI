import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import mapboxgl, { LngLat } from 'mapbox-gl';
import { environment } from 'projects/projects/src/environments/environment';
import { BehaviorSubject, Observable, Subject, map, of, shareReplay } from 'rxjs';
import { MapBoxDirections, MapboxSuggestion, MapboxSuggestionResponse } from '../../../core/models';
import { StorageUtil } from '../utils/storage.util';
import { StorageConstants } from '../../../core/constants/storage.constants';
import { Asset, Group, Landmark, Layer, Layout, Project, Source, Survey, View , PlotDetails} from '../../../core/models';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private routeMap$: Map<string, Observable<MapBoxDirections>> = new Map();
  private suggestionsMap$: Map<string, Observable<MapboxSuggestion[]>> = new Map();
  private featureCollectionMap$: Map<string, Observable<GeoJSON.FeatureCollection>> = new Map();
  private plotsMap$: Map<number, Observable<PlotDetails[]>> = new Map();
  private _isMapLoaded = new BehaviorSubject<boolean>(false);

  constructor(private readonly http: HttpClient) { }


  isMapLoaded() {
    return this._isMapLoaded.asObservable();
  }

  setMapLoaded(isMapLoaded: boolean) {
    this._isMapLoaded.next(isMapLoaded);
  }

  getRoute(start: LngLat, end: LngLat): Observable<MapBoxDirections> {
    const key = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    if (!this.routeMap$ || !this.routeMap$.has(key)) {
      this.routeMap$.set(key, this.http.get<MapBoxDirections>(environment.mapBox.directionsApiUrl +
        `/driving/${key}?steps=true&geometries=geojson&access_token=${environment.mapBox.accessToken}`).pipe(shareReplay(1)));
    }
    return this.routeMap$.get(key) || of()
  }

  getSuggestions(searchText: string, proximity: string): Observable<MapboxSuggestion[]> {
    const key = `${searchText};${proximity}`;
    const sessionToken = localStorage.getItem(StorageConstants.LS_ACCESS_TOKEN)
    if (!this.suggestionsMap$ || !this.suggestionsMap$.has(key)) {
      this.suggestionsMap$.set(key, this.http.get<MapboxSuggestionResponse>(environment.mapBox.searchApiUrl +
        `/suggest?q=${searchText}&language=en&access_token=${environment.mapBox.accessToken}&session_token=${sessionToken}`).pipe(shareReplay(1), map(resp => resp.suggestions)));
    }
    return this.suggestionsMap$.get(key) || of();
  }

  retrieveFeature(mapboxId: string): Observable<GeoJSON.FeatureCollection> {
    const sessionToken = localStorage.getItem(StorageConstants.LS_ACCESS_TOKEN);
    if (!this.featureCollectionMap$ || !this.featureCollectionMap$.has(mapboxId)) {
      this.featureCollectionMap$.set(mapboxId, this.http.get<GeoJSON.FeatureCollection>(environment.mapBox.searchApiUrl +
        `/retrieve/${mapboxId}?access_token=${environment.mapBox.accessToken}&session_token=${sessionToken}`).pipe(shareReplay(1)));
    }
    return this.featureCollectionMap$.get(mapboxId) || of();
  }

  updateBackend(plotDetails: PlotDetails): Observable<any> {
    const sessionToken = localStorage.getItem(StorageConstants.LS_ACCESS_TOKEN);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionToken}`
    });
  
    return this.http.post(`${environment.mapBox.searchApiUrl}/update`, {
      plot_no: plotDetails.plot_no,
      salestatus: plotDetails.salestatus
    }, { headers });
  }

}
