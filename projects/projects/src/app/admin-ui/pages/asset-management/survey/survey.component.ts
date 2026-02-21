import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Survey } from '../../../../core/models/geo/survey.model'; // Adjust path
import { AssetSelectionService } from '../../../services/asset-selection.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css'],
})
export class SurveyComponent implements OnInit {
  projectId!: number;
  projectName: string = '';
  surveys: Survey[] = [];
  filteredSurveys: Survey[] = [];

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  showAddSurveySidebar = false;

  newSurvey: Survey = this.getEmptySurvey();

  sortConfig: { key: keyof Survey; direction: 'asc' | 'desc' } = {
    key: 'name',
    direction: 'asc',
  };

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetSelectionService,
    private router: Router // 👈 Inject router here
  ) {}

  ngOnInit(): void {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
    this.projectName = decodeURIComponent(
      this.route.snapshot.paramMap.get('name') || ''
    );
    this.loadSurveyData();
  }

  loadSurveyData(): void {
    this.assetService.getAllSurveys().subscribe((surveys: Survey[]) => {
      this.surveys = surveys.filter((s) => s.projectId === this.projectId);
      this.filterSurveys();
    });
  }

  filterSurveys(): void {
    let result = [...this.surveys];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((s) =>
        Object.values(s).some((val) =>
          val?.toString().toLowerCase().includes(term)
        )
      );
    }

    result.sort((a, b) => {
      const aVal = a[this.sortConfig.key] ?? 0;
const bVal = b[this.sortConfig.key] ?? 0;

if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1;
if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1;
return 0;

    
    });

    this.filteredSurveys = result;
  }

  sortBy(key: keyof Survey): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction =
        this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterSurveys();
  }

  getSortIcon(key: keyof Survey): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  goToSurveyDetail(survey: Survey): void {
    this.router.navigate([
      '/admin-dashboard/admin-asset-management',
      'details',
      survey.id, // 👈 this is the survey ID
    ]);
  }

  get paginatedSurveys(): Survey[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSurveys.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredSurveys.length / this.pageSize);
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
  getEmptySurvey(): Survey {
    return {
      id: 0,
      name: '',
      projectId: this.projectId,
      latitude: 0,
      longitude: 0,
      surveyDate: '',
      progress: 0,
      zoom: 0,
      zoomMin: 0,
      zoomMax: 0,
      threeD: '',
      plotView: false,
      terrainExaggeration: null

    };
  }

  addSurvey(): void {
    this.newSurvey = this.getEmptySurvey();
    this.showAddSurveySidebar = true;
  }

  closeSurveySidebar(): void {
    this.showAddSurveySidebar = false;
    this.newSurvey = this.getEmptySurvey();
  }

  submitSurvey(): void {

  // ✅ ADD VALIDATION AT THE TOP
  if (
    this.newSurvey.terrainExaggeration === undefined ||
    this.newSurvey.terrainExaggeration === null
  ) {
    alert('Please enter Terrain Exaggeration');
    return; // ⛔ stop submit
  }

  // ✅ EXISTING CODE CONTINUES
  (this.newSurvey as any).threed = this.newSurvey.plotView ? 'true' : 'false';
  this.newSurvey.projectId = this.projectId;

  //this.newSurvey.zoom = 0;
  //this.newSurvey.zoomMin = 0;
  //this.newSurvey.zoomMax = 0;
  //this.newSurvey.threeD = '';

  this.assetService.createSurvey(this.newSurvey).subscribe({
    next: (res) => {
      console.log('Survey created successfully:', res);
      this.loadSurveyData();
      this.closeSurveySidebar();
    },
    error: (err) => {
      console.error('Survey creation failed:', err);
      alert('Survey creation failed');
    }
  });
}

}
