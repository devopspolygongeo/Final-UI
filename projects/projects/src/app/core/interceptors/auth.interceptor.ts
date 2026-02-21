import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.headers.get('No-Auth') === 'True') {
            return next.handle(req.clone());
        }

        if (localStorage.getItem('polygon_user_r_token') != null) {
            const clonedreq = req.clone({
                headers: req.headers.set(
                    'Authorization',
                    'Bearer ' + localStorage.getItem('polygon_user_r_token')
                )  
            });
            return next.handle(clonedreq).pipe(
                tap({
                    next: x => {},
                    error: err => {
                        if (err.status === 401) {
                            this.router.navigateByUrl('/login');
                        } else if (err.status = 403) {
                            this.router.navigateByUrl('/forbidden');
                        } else {
                            
                        }
                    }
                })
            );
        } else {
            this.router.navigateByUrl('/login');
            return new Observable<HttpEvent<any>>((observer) => observer.complete()); // This line is to avoid return type error only.
        }
    }
}