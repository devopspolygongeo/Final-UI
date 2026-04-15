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
    const shouldReload = sessionStorage.getItem('reloadLoginOnce');

    if (shouldReload === 'true') {
      sessionStorage.removeItem('reloadLoginOnce');
      window.location.reload();
      return;
    }
  }

  private getDashboardUrlByRole(role: number): string {
    switch (role) {
      case 1:
        return '/admin-dashboard';
      case 2:
        return '/plotview-account-ui';
      case 3:
        return AppConstants.DASHBOARD_URL;
      default:
        return AppConstants.DASHBOARD_URL;
    }
  }

  loginClick(event: {
    userName: string;
    password: string;
    loginTarget: string;
  }) {
    this.authService.login(event.userName, event.password).subscribe({
      next: (resp: UserResponse) => {
        if (resp) {
          localStorage.setItem('currentUser', JSON.stringify(resp.user));

          const roleBasedTarget = this.getDashboardUrlByRole(resp.user.role);

          this.router.navigateByUrl(roleBasedTarget);
        } else {
          console.error('Error in logging in the user');
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.error.code == 401) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = ErrorMessages.INTERNAL_SERVER_ERROR;
        }
      },
    });
  }
}
