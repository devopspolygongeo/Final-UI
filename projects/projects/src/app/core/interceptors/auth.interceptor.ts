import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { StorageConstants } from '../constants/storage.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    console.log('[INTERCEPTOR] request url =', req.url);
    console.log('[INTERCEPTOR] No-Auth header =', req.headers.get('No-Auth'));

    if (req.headers.get('No-Auth') === 'True') {
      console.log('[INTERCEPTOR] bypassing auth for request');
      return next.handle(req.clone());
    }

    const accessToken = localStorage.getItem(StorageConstants.LS_ACCESS_TOKEN);
    console.log('[INTERCEPTOR] access token =', accessToken);
    console.log('[INTERCEPTOR] current router url =', this.router.url);

    if (accessToken != null) {
      const clonedreq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
      });

      console.log('[INTERCEPTOR] attached Authorization header');

      return next.handle(clonedreq).pipe(
        tap({
          next: () => {},
          error: (err) => {
            console.error('[INTERCEPTOR] request failed', {
              url: req.url,
              status: err.status,
              routerUrl: this.router.url,
            });

            if (err.status === 401) {
              console.log(
                '[INTERCEPTOR] redirecting to login with returnUrl =',
                this.router.url,
              );
              this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url },
              });
            } else if (err.status === 403) {
              this.router.navigateByUrl('/forbidden');
            }
          },
        }),
      );
    } else {
      const isShareRoute = window.location.hash.includes('#/share/');
      console.log(
        '[INTERCEPTOR] no access token, isShareRoute =',
        isShareRoute,
      );

      if (isShareRoute) {
        return next.handle(req.clone());
      }

      console.log(
        '[INTERCEPTOR] redirecting to login because token missing. returnUrl =',
        this.router.url,
      );
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });

      return new Observable<HttpEvent<any>>((observer) => observer.complete());
    }
  }
}
