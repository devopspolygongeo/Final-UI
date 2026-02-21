import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssetSelectionService } from '../../services/asset-selection.service';
import { Project } from '../../../core/models/geo/project.model';
import { Client } from '../../../core/models/ui/client.model';
import { AdminDataService } from '../../services/admin-data.service';
import { DMapStyle } from '../../../core/models/core/mapStyle.model';
import { DCategory } from '../../../core/models/core/category.model';
@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css']
})
export class AssetManagementComponent implements OnInit {
  assets: Project[] = [];
  filteredAssets: Project[] = [];
  clients: Client[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 6;
  showAddProjectSidebar = false;
  categories: DCategory[] = [];

  satelliteMaps: DMapStyle[] = [];
  streetMaps: DMapStyle[] = [];

  newProject: Project = this.getEmptyProject();


  sortConfig: { key: keyof Project; direction: 'asc' | 'desc' } = {
    key: 'id',
    direction: 'asc'
  };

  constructor(
    private router: Router,
    private assetService: AssetSelectionService,
    private adminDataService: AdminDataService
  ) { }

  ngOnInit(): void {
    this.loadAssetData();
    this.loadClients();
    this.loadBasemaps();
    this.loadCategories();
  }

loadAssetData(): void {
  this.assetService.getAllProjects().subscribe((projects: Project[]) => {
    console.log("PROJECTS FROM API:", projects);   // 👈 ADD THIS
    this.assets = projects;
    this.filterAssets();
  });
}
  loadClients(): void {
    this.adminDataService.getClients().subscribe((clients) => {
      this.clients = clients;
    });
  }
  loadBasemaps(): void {
    this.adminDataService.getBaseMaps().subscribe((maps) => {
      this.satelliteMaps = maps.filter(m => m.maptype.toLowerCase() === 'satellite');
      this.streetMaps = maps.filter(m => m.maptype.toLowerCase() === 'street');
    });
  }
  loadCategories(): void {
    this.adminDataService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }
  getBasemapDescriptionById(id: number): string {
    const allMaps = [...this.satelliteMaps, ...this.streetMaps];
    const match = allMaps.find(m => Number(m.mapid) === Number(id));

    if (!match) {
     // console.warn('❌ Basemap not found for ID:', id, 'Available:', allMaps.map(m => m.mapid));
    }

    return match?.mapdescription || 'Unknown';
  }

  getCategoryNameById(id: number): string {
    return this.categories.find(c => c.categoryid === id)?.categoryname || 'Unknown';
  }

  filterAssets(): void {
    let result = [...this.assets];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((project) =>
        Object.values(project).some((val) =>
          val?.toString().toLowerCase().includes(term)
        )
      );
    }

    result.sort((a, b) => {
      const aVal = typeof a[this.sortConfig.key] === 'string'
        ? (a[this.sortConfig.key] as string).toLowerCase()
        : a[this.sortConfig.key];
      const bVal = typeof b[this.sortConfig.key] === 'string'
        ? (b[this.sortConfig.key] as string).toLowerCase()
        : b[this.sortConfig.key];

      if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredAssets = result;
  }

  getClientNameById(id: number): string {
    return this.clients.find(c => c.clientid === id)?.clientname || 'Unknown';
  }

  sortBy(key: keyof Project): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction =
        this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterAssets();
  }

  getSortIcon(key: keyof Project): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  goToDetail(project: Project): void {
    this.assetService.setAsset({
      id: project.id,
      name: project.name,
      type: 'Project'
    });
    this.router.navigate([
      '/admin-dashboard/admin-asset-management',
      project.id,
      'survey',
      project.name
    ]);
  }

  get paginatedAssets(): Project[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAssets.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredAssets.length / this.pageSize);
  }

  getPageNumbers(): (number | string)[] {
    const total = this.getTotalPages();
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  navigateToPage(page: number): void {
    this.currentPage = page;
  }

  getEmptyProject(): Project {
    return {
      id: 0,
      name: '',
      categoryId: -1,
      clientId: -1,
      satelliteMapId: -1,
      streetMapId: -1,
      location: '',
      area: 0,
      description: '',
      frequency: ''
      
      
      
    };
  }

  addProject(): void {
    this.newProject = this.getEmptyProject();
    this.showAddProjectSidebar = true;
  }

  closeSidebar(): void {
    this.showAddProjectSidebar = false;
    this.newProject = this.getEmptyProject();
  }

  submitProject(): void {
    if (!this.newProject.name || !this.newProject.categoryId || !this.newProject.clientId) {
      alert("Please fill all required fields.");
      return;
    }
    const projectToSend = { ...this.newProject };

    if (projectToSend.satelliteMapId === -1) projectToSend.satelliteMapId = 0;
    if (projectToSend.streetMapId === -1) projectToSend.streetMapId = 0;
    if (projectToSend.clientId === -1) projectToSend.clientId = 0;
    if (projectToSend.categoryId === -1) projectToSend.categoryId = 0;


    this.assetService.createProject(this.newProject).subscribe({
      next: (response) => {
        // Transform backend keys (if needed)
        const formattedProject: Project = {
          id: response.id,
          name: response.name,
          categoryId: response.categoryId,
          clientId: response.clientId,
          satelliteMapId: response.satelliteMapId || 0,
          streetMapId: response.streetMapId || 0,
          location: response.location,
          area: response.area,
          description: response.description,
          frequency: response.frequency
          
        };

        this.assets.push(formattedProject);
        this.filterAssets();
        this.closeSidebar();
      },
      error: (err) => {
        console.error('Error creating project:', err);
        alert("Something went wrong while creating the project.");
      }
    });
  }



}
