import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../login/services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        if (router.url === '/login' && !router.navigated)
            return router.parseUrl('/dashboard');
        else
            return true;
    } else {
        // Redirect to the login page
        return router.parseUrl('/login?returnUrl='+router.routerState.snapshot.url);
    }
};

