import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import moment from 'moment';
import { environment } from 'projects/projects/src/environments/environment';
import { Observable, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, UserResponse } from '../models/user.response';
import { StorageConstants } from '../../core/constants/storage.constants';

@Injectable()
export class AuthService {

    constructor(private readonly http: HttpClient) {
    }

    user!: User;

    login(userName: string, password: string): Observable<UserResponse> {
        const headers = new HttpHeaders().set("No-Auth", "True");
        return this.http.post<UserResponse>(environment.apiUrl + '/auth/login', { email: userName, password: password }, { headers: headers })
            .pipe(
                shareReplay(),
                tap((resp) => this.setSession(resp))
            )
    }

    setSession(userResponse: UserResponse) {
        const expiresAt = moment(userResponse.tokens.access.expires, 'YYYY-MM-DDThh:mm:ssZ');
        this.user = userResponse.user;
        localStorage.setItem(StorageConstants.LS_USER, JSON.stringify(userResponse.user));
        localStorage.setItem(StorageConstants.LS_REFRESH_TOKEN, userResponse.tokens.refresh.token);
        localStorage.setItem(StorageConstants.LS_ACCESS_TOKEN, userResponse.tokens.access.token);
        localStorage.setItem(StorageConstants.LS_EXPIRES_AT, JSON.stringify(expiresAt.valueOf()));
    }
    removeSession() {
        localStorage.removeItem(StorageConstants.LS_REFRESH_TOKEN);
        localStorage.removeItem(StorageConstants.LS_ACCESS_TOKEN);
        localStorage.removeItem(StorageConstants.LS_USER);
        localStorage.removeItem(StorageConstants.LS_EXPIRES_AT);
    }

    getUser(): User | undefined {
        if (this.user) {
            return this.user
        } else {
            const usr = localStorage.getItem('polygon_user');
            if (usr) {
                return JSON.parse(usr) as User;
            } else {
                return undefined;
            }
        }
    }

    isLoggedIn() {
        return moment().isBefore(this.getExpiration());
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

    getExpiration() {
        const expiration = localStorage.getItem("expires_at");

        if (expiration) {
            const expiresAt: number = JSON.parse(expiration);
            return moment.unix(expiresAt / 1000);
        } else {
            return moment("20120620", "YYYY-MM-DD HH:mm:ss");
        }
    }

    logout(): Observable<void> {
        const headers = new HttpHeaders().set("No-Auth", "True");
        return this.http.post<void>(environment.apiUrl + '/auth/logout', { refreshToken: localStorage.getItem(StorageConstants.LS_REFRESH_TOKEN) }, { headers: headers })
            .pipe(
                shareReplay(),
                tap((resp) => this.removeSession()))
    }
}
