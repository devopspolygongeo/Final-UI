import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // ✅ Bypass auth header injection when No-Auth is explicitly set
    if (req.headers.get('No-Auth') === 'True') {
      return next.handle(req.clone());
    }

    // ✅ If refresh token exists, attach Authorization header
    if (localStorage.getItem('polygon_user_r_token') != null) {
      const clonedreq = req.clone({
        headers: req.headers.set(
          'Authorization',
          'Bearer ' + localStorage.getItem('polygon_user_r_token'),
        ),
      });

      return next.handle(clonedreq).pipe(
        tap({
          next: () => {},
          error: (err) => {
            if (err.status === 401) {
              this.router.navigateByUrl('/login');
            } else if (err.status === 403) {
              // ✅ FIXED: was err.status = 403 (assignment). Now correct comparison.
              this.router.navigateByUrl('/forbidden');
            } else {
              // do nothing
            }
          },
        }),
      );
    } else {
      // ✅ Allow public share routes to work without forcing login redirect
      const isShareRoute = window.location.hash.includes('#/share/');

      if (isShareRoute) {
        // proceed without Authorization header
        return next.handle(req.clone());
      }

      // Normal behavior for protected pages
      this.router.navigateByUrl('/login');
      return new Observable<HttpEvent<any>>((observer) => observer.complete()); // avoid return type error
    }
  }
}
