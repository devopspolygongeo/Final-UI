import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../login/services/auth.service';

@Component({
  selector: 'app-plotview-account-settings',
  templateUrl: './plotview-account-settings.component.html',
  styleUrls: ['./plotview-account-settings.component.css'],
})
export class PlotviewAccountSettingsComponent {
  activeComponent: string = 'profile';
  userName: string = 'Speed Admin';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  setActiveComponent(component: string) {
    this.activeComponent = component;
  }

  onLogout(): void {
    console.log('[PLOTVIEW ACCOUNT SETTINGS] logout clicked');

    this.authService.logout().subscribe({
      next: () => {
        console.log('[PLOTVIEW ACCOUNT SETTINGS] logout API success');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/plotview-account-ui' },
        });
      },
      error: (err) => {
        console.error('[PLOTVIEW ACCOUNT SETTINGS] logout API failed', err);
      },
    });
  }
}
