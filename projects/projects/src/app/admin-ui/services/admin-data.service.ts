import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

import { User } from '../../core/models/ui/user.model';
import { Client } from '../../core/models/ui/client.model'; // ✅ Add this line
import { UserType } from '../../core/models/ui/usertype.model';
import { DMapStyle } from '../../core/models/core/mapStyle.model'; // ✅ Add this line
import { DCategory } from '../../core/models/core/category.model'; // ✅ Add this line
// console.log('above', environment.apiUrl);

@Injectable({
    providedIn: 'root',
})
export class AdminDataService {
    private apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) { }
    public clients: Client[] = [];

    /**
     * Fetch all users from backend.
     * Assumes backend route: GET /v1/users
     */
    getUsers(): Observable<User[]> {
        const url = `${environment.apiUrl}/users`;
        //  console.log('Fetching users from:', url);
        return this.http.get<User[]>(url);
    }

    /**
     * ✅ Fetch all clients from backend.
     * Assumes backend route: GET /v1/clients
     */
    getUserTypes(): Observable<UserType[]> {
        const url = `${environment.apiUrl}/usertypes`;
        return this.http.get<UserType[]>(url);
    }

    updateUser(userId: number, data: any): Observable<any> {
        return this.http.put(`${environment.apiUrl}/users/${userId}`, data);
    }

    createUser(data: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/users`, data);
    }

    deleteUser(userId: number): Observable<void> {
        const url = `${environment.apiUrl}/users/${userId}`;
        return this.http.delete<void>(url);
    }

    getClients(): Observable<Client[]> {
        const url = `${environment.apiUrl}/clients`;
        console.log('Fetching clients from:', url);
        return this.http.get<Client[]>(url);
    }

    createClient(clientData: Omit<Client, 'sno' | 'clientid'>): Observable<Client> {
        const url = `${environment.apiUrl}/clients`;
        return this.http.post<Client>(url, clientData);
    }

    /**
     * Update client by clientid
     */
    updateClient(clientid: number, updatedData: Partial<Client>): Observable<Client> {
        const url = `${environment.apiUrl}/clients/${clientid}`;
        return this.http.put<Client>(url, updatedData);
    }

    /**
     * Delete client by clientid
     */
    deleteClient(clientid: number): Observable<any> {
        const url = `${environment.apiUrl}/clients/${clientid}`;
        return this.http.delete(url);
    }

    getBaseMaps(): Observable<DMapStyle[]> {
        const url = `${environment.apiUrl}/mapstyles`;
        //  console.log('📡 Fetching basemaps from:', url);
        return this.http.get<DMapStyle[]>(url);
    }
    getCategories(): Observable<DCategory[]> {
        const url = `${environment.apiUrl}/categories`;
        return this.http.get<DCategory[]>(url);
    }
    getProjects(): Observable<any[]> {
  const url = `${this.apiUrl}/projects/all`;
  console.log('Fetching projects from:', url);
  return this.http.get<any[]>(url);
}




}
