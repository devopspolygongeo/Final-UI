import { Component, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AssetSelectionService } from '../../../admin-ui/services/asset-selection.service';
import { AuthService } from '../../../login/services/auth.service';

@Component({
    selector: 'app-plotview-layout',
    templateUrl: './plotview-layout.component.html',
    styleUrls: ['./plotview-layout.component.css'],
})
export class PlotviewLayoutComponent implements OnInit {

    dropdownOpen = false;
    userFirstName = '';

    constructor(
       private authService: AuthService,
  private router: Router,
  private route: ActivatedRoute,
  private assetService: AssetSelectionService
) {}
ngOnInit(): void {
  const user = this.authService.getUser();

this.userFirstName = user?.firstName || '';
  this.route.paramMap.subscribe(params => {
    const projectName = params.get('projectName');
    if (!projectName) return;

    const normalizedName = projectName
      .replace(/-/g, ' ')
      .toLowerCase();

    this.assetService.getAllProjects().subscribe(projects => {
      const project = projects.find(
        p => p.name.toLowerCase() === normalizedName
      );

      if (project) {
        this.router.navigate(
  ['/plotview-account-ui/assets'],
  { queryParams: { projectId: project.id } }
);

      } else {
        console.warn('Project not found:', projectName);
      }
    });
  });
}



    toggleDropdown(event: MouseEvent) {
        console.log('Dropdown toggled');
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    goToAccount(event: MouseEvent) {
        event.stopPropagation();
        this.dropdownOpen = false;
        this.router.navigate(['/plotview-account-ui/account']);
    }

    showNotification(event: MouseEvent) {
        event.stopPropagation();
        this.dropdownOpen = false;
        alert('Notifications feature coming soon!');
    }

    @HostListener('document:click')
    closeDropdown() {
        this.dropdownOpen = false;
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
