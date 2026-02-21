import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VolumeService {

  private apiUrl = environment.apiUrl + '/volume/calculate';

  constructor(private http: HttpClient) {}

  calculateVolume(data: {
    polygon: GeoJSON.Polygon;
    baseHeight: number;
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
