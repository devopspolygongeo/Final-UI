import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../login/services/auth.service';

export const authGuard = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AUTH GUARD] state.url =', state.url);
  console.log('[AUTH GUARD] isLoggedIn =', authService.isLoggedIn());
  console.log('[AUTH GUARD] expires_at =', localStorage.getItem('expires_at'));
  console.log(
    '[AUTH GUARD] access token =',
    localStorage.getItem('polygon_user_a_token'),
  );
  console.log(
    '[AUTH GUARD] refresh token =',
    localStorage.getItem('polygon_user_r_token'),
  );

  if (authService.isLoggedIn()) {
    console.log('[AUTH GUARD] allowing route:', state.url);
    return true;
  } else {
    const target = '/login?returnUrl=' + encodeURIComponent(state.url);
    console.log('[AUTH GUARD] redirecting to:', target);
    return router.parseUrl(target);
  }
};
