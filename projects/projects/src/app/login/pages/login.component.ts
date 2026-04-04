import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserResponse } from '../models/user.response';
import { AuthService } from '../services/auth.service';
import { AppConstants } from '../../core/constants/app.constants';
import { ErrorMessages } from '../../core/constants/error-messages';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    console.log(
      '[LOGIN] query params =',
      this.activatedRoute.snapshot.queryParams,
    );
  }

  loginClick(event: { userName: string; password: string }) {
    console.log('[LOGIN] loginClick fired with userName =', event.userName);
    console.log(
      '[LOGIN] current query params before login =',
      this.activatedRoute.snapshot.queryParams,
    );

    this.authService.login(event.userName, event.password).subscribe({
      next: (resp: UserResponse) => {
        console.log('[LOGIN] login API success');
        console.log('[LOGIN] response =', resp);
        console.log(
          '[LOGIN] access token after login =',
          localStorage.getItem('polygon_user_a_token'),
        );
        console.log(
          '[LOGIN] refresh token after login =',
          localStorage.getItem('polygon_user_r_token'),
        );
        console.log(
          '[LOGIN] expires_at after login =',
          localStorage.getItem('expires_at'),
        );

        if (resp) {
          localStorage.setItem('currentUser', JSON.stringify(resp.user));

          const returnUrl =
            this.activatedRoute.snapshot.queryParams['returnUrl'] ||
            AppConstants.DASHBOARD_URL;

          console.log('[LOGIN] navigating to returnUrl =', returnUrl);
          this.router.navigateByUrl(returnUrl);
        } else {
          console.error('[LOGIN] resp is empty');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('[LOGIN] login API error =', error);

        if (error.error.code == 401) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = ErrorMessages.INTERNAL_SERVER_ERROR;
        }
      },
    });
  }
}
