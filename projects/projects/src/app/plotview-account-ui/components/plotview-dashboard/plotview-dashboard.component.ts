import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssetSelectionService } from '../../../admin-ui/services/asset-selection.service';

type TabType = 'All' | 'Ongoing Assets' | 'Closed Assets';

interface Asset {
  id: string;
  projectId: number;          // 👈 add this
  name: string;
  date: string;
  location: string;
  url: string;
  status: 'Active' | 'Inactive';
  validTill?: string;
}

interface DashboardData {
  account: { name: string; organization: string };
  subscription: { type: string; asset: string; validTill: string; daysRemaining: number; validDate: string };
  plotImpressions: { count: number; percentageIncrease: number; period: string };
  stats: { activeSubscriptions: number; activeAssets: number; registeredUsers: number };
  assets: Asset[];
}

@Component({
  selector: 'app-plotview-dashboard',
  templateUrl: './plotview-dashboard.component.html',
  styleUrls: ['./plotview-dashboard.component.css']
})


export class PlotviewDashboardComponent implements OnInit {
  activeTab: TabType = 'All';
  searchTerm = '';
  selectedPeriod = 'Month';
  tabs: TabType[] = ['All', 'Ongoing Assets', 'Closed Assets'];

  constructor(
    private router: Router,
    private assetService: AssetSelectionService
  ) { }

  dashboardData: DashboardData = {
    account: { name: 'Rayapati Rajasekhar', organization: 'Polygon Geospatial Pvt Ltd' },
    subscription: { type: 'PV001', asset: 'Harmony Meadows', validTill: '145 days', daysRemaining: 145, validDate: '12th June 2024' },
    plotImpressions: { count: 140, percentageIncrease: 53, period: 'Month' },
    stats: { activeSubscriptions: 2, activeAssets: 2, registeredUsers: 1 },
    assets: []
  };

  ngOnInit(): void {
    this.loadProjectsIntoAssets();
  }

  private loadProjectsIntoAssets(): void {
    this.assetService.getAllProjects().subscribe({
      next: (projects: any[]) => {
        this.dashboardData.assets = projects.map((p) => ({
          id: String(p.id),
          projectId: Number(p.id),              // 👈 keep a copy to pass along
          name: p.name ?? 'Untitled Project',
          location: p.location ?? '—',
          date: '09-Jan-2023',                  // static
         url: this.buildProjectUrl(p.name),
 // static
          status: 'Active',                     // static
          validTill: '12th June 2024'           // static
        }));
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.dashboardData.assets = [];
      }
    });
  }

  setActiveTab(tab: TabType) { this.activeTab = tab; }

  onPeriodChange(event: Event) {
    this.selectedPeriod = (event.target as HTMLSelectElement).value;
  }

  onAddAsset(): void {
    // no context -> New Asset
    this.router.navigate(['/plotview-account-ui/assets']);
  }

  /**
   * View button: pass projectId and the FIRST surveyId for that project.
   * The target page uses these to load sources/layers/layouts dynamically.
   */
  onViewAsset(asset: Asset): void {
    this.assetService.getAllSurveys().subscribe({
      next: (surveys: any[]) => {
        const firstSurvey = surveys.find(s => Number(s.projectId) === asset.projectId);
        
        const queryParams: any = {
          name: asset.name,
          projectId: asset.projectId
        };
        if (firstSurvey?.id) queryParams.surveyId = firstSurvey.id;

        this.router.navigate(['/plotview-account-ui/assets'], { queryParams });
      },
      error: () => {
        // fall back: navigate with just projectId; the page will try to resolve surveys again
        this.router.navigate(['/plotview-account-ui/assets'], {
          queryParams: { name: asset.name, projectId: asset.projectId }
        });
      }
    });
  }

  onEditAsset(asset: Asset): void {
  this.router.navigate(
    ['/plotview-account-ui/assets'],
    {
      queryParams: {
        projectId: asset.projectId,
        mode: 'edit'
      }
    }
  );
}
openMenuId: number | null = null;

toggleMenu(projectId: number): void {
  this.openMenuId =
    this.openMenuId === projectId ? null : projectId;
}





  get filteredAssets() {
    return this.dashboardData.assets.filter(asset => {
      const q = this.searchTerm.toLowerCase();
      const matchesSearch =
        asset.name.toLowerCase().includes(q) ||
        asset.location.toLowerCase().includes(q);

      if (this.activeTab === 'All') return matchesSearch;
      if (this.activeTab === 'Ongoing Assets') return matchesSearch && asset.status === 'Active';
      if (this.activeTab === 'Closed Assets') return matchesSearch && asset.status === 'Inactive';
      return matchesSearch;
    });
  }

  copiedUrl: string | null = null;

copyAssetUrl(url: string): void {
  navigator.clipboard.writeText(url).then(() => {
    this.copiedUrl = url;
    setTimeout(() => (this.copiedUrl = null), 2000);
  });
}


private buildAssetUrl(projectId: number, surveyId?: number): string {
  const base = 'https://www.projects.plotview.app/assets';

  if (surveyId) {
    return `${base}?projectId=${projectId}&surveyId=${surveyId}`;
  }

  return `${base}?projectId=${projectId}`;
}

onDisableAsset(asset: Asset): void {
  asset.status = 'Inactive';
  this.openMenuId = null;
}

onDeleteAsset(asset: Asset): void {
  if (!confirm(`Delete ${asset.name}?`)) return;

  this.dashboardData.assets =
    this.dashboardData.assets.filter(
      a => a.projectId !== asset.projectId
    );

  this.openMenuId = null;
}

private slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

private buildProjectUrl(projectName: string): string {
  return `${window.location.origin}/projects/${this.slugify(projectName)}`;
}


}
