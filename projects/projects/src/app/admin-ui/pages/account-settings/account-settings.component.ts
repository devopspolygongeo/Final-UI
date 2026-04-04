import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../login/services/auth.service';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css'],
})
export class AccountSettingsComponent {
  activeComponent: string = 'profile';
  userName: string = 'User';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  setActiveComponent(component: string) {
    this.activeComponent = component;
  }

  onLogout(): void {
    console.log('[ADMIN ACCOUNT SETTINGS] logout clicked');

    this.authService.logout().subscribe({
      next: () => {
        console.log('[ADMIN ACCOUNT SETTINGS] logout API success');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/admin-dashboard' },
        });
      },
      error: (err) => {
        console.error('[ADMIN ACCOUNT SETTINGS] logout API failed', err);
      },
    });
  }
}
