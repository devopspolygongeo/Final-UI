import { Component, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AssetSelectionService } from '../../../admin-ui/services/asset-selection.service';


@Component({
    selector: 'app-plotview-layout',
    templateUrl: './plotview-layout.component.html',
    styleUrls: ['./plotview-layout.component.css'],
})
export class PlotviewLayoutComponent implements OnInit {

    dropdownOpen = false;

    constructor(
  private router: Router,
  private route: ActivatedRoute,
  private assetService: AssetSelectionService
) {}
ngOnInit(): void {
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

    
}
