import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AssetSelectionService } from '../../../../services/asset-selection.service';
import { Group as BackendGroup } from '../../../../../core/models/geo/group.model';
import { GroupType } from '../../../../../core/models/core/groupType.model';

interface GroupUI {
  id: number;
  groupName: string;
  groupType: number;
  surveyId: number;
  priority: number;
  visibility: boolean;
}

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  @ViewChild('groupForm') groupForm!: NgForm;

  activeNavTab: 'sources' | 'groups' | 'layers' | 'plotattributes' = 'groups';
  currentPage = 1;
  pageSize = 4;

  sortConfig: { key: keyof GroupUI; direction: 'asc' | 'desc' } = {
    key: 'id',
    direction: 'asc'
  };

  assetId: string = '';
  assetName = '';
  surveyId!: number;


  groups: GroupUI[] = [];
  filteredGroups: GroupUI[] = [];

  groupTypes: GroupType[] = [];

  newGroup: GroupUI = {
    id: 0,
    groupName: '',
    groupType: 0,
    surveyId: 0,
    priority: 1,
    visibility: false
  };

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetSelectionService
  ) { }

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    this.assetId = id ? id : '';
    this.assetName = this.route.snapshot.paramMap.get('assetName') || '';
    this.surveyId = +this.route.parent?.snapshot.paramMap.get('surveyId')!;

    this.assetService.getGroupTypes().subscribe({
      next: (types) => {
        this.groupTypes = types;
        this.getGroupsFromServer(); // ✅ Fetch groups only after groupTypes are ready
      },
      error: err => console.error('Failed to fetch group types:', err)
    });
  }


  getGroupTypesFromServer(): void {
    this.assetService.getGroupTypes().subscribe({
      next: (types) => {
        this.groupTypes = types;
      },
      error: err => {
        console.error('Failed to fetch group types:', err);
      }
    });
  }

  getGroupsFromServer(): void {
    this.assetService.getGroups().subscribe({
      next: (groups: any[]) => {
        console.log('Fetched groups:', groups);
        this.groups = groups
          .filter(g => g.surveyId === this.surveyId) // ✅ filter here
          .map(g => ({
            id: g.id,
            groupName: g.name,
            groupType: g.type,
            priority: g.priority,
            surveyId: g.surveyId,
            visibility: g.visibility
          }));
        this.filterGroups();
      },
      error: err => {
        console.error('Error fetching groups:', err);
      }
    });
  }

  initializeNewGroup(): void {
    this.newGroup = {
      id: 0,
      groupName: '',
      groupType: 0,
      surveyId: this.surveyId, // ✅ use the real one
      priority: 1,
      visibility: false
    };

    if (this.groupForm) {
      this.groupForm.resetForm();
    }
  }

  resetForm(): void {
    this.initializeNewGroup();
  }

  sortBy(key: keyof GroupUI): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterGroups();
  }

  getSortIcon(key: keyof GroupUI): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  filterGroups(): void {
    const sorted = [...this.groups].sort((a, b) => {
      const aVal = a[this.sortConfig.key];
      const bVal = b[this.sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return this.sortConfig.direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    this.filteredGroups = sorted;
  }

  toggleGroupVisibility(group: GroupUI): void {
    const updated: BackendGroup = {
      id: group.id,
      name: group.groupName,
      type: group.groupType,
      surveyId: group.surveyId,
      priority: group.priority,
      visibility: !group.visibility
    };

    this.assetService.updateGroup(group.id, updated).subscribe({
      next: () => {
        group.visibility = !group.visibility;
        this.filterGroups();
      },
      error: err => console.error('Visibility toggle failed', err)
    });
  }

  editGroup(group: GroupUI): void {
    this.newGroup = { ...group };
    setTimeout(() => {
      const formEl = document.querySelector('.right-sidebar');
      formEl?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  deleteGroup(group: GroupUI): void {
    if (confirm('Are you sure you want to delete this group?')) {
      this.assetService.deleteGroup(group.id).subscribe({
        next: () => {
          this.groups = this.groups.filter(g => g.id !== group.id);
          this.filterGroups();
        },
        error: err => console.error('Failed to delete group', err)
      });
    }
  }

  submitNewGroup(): void {
    if (this.groupForm.invalid) {
      Object.keys(this.groupForm.controls).forEach(key => {
        this.groupForm.controls[key].markAsTouched();
      });
      return;
    }

    const payload: Partial<BackendGroup> = {
      name: this.newGroup.groupName,
      type: this.newGroup.groupType,
      surveyId: this.newGroup.surveyId,
      priority: this.newGroup.priority,
      visibility: this.newGroup.visibility
    };

    if (this.newGroup.id === 0) {
      this.assetService.createGroup(payload).subscribe({
        next: (created: BackendGroup) => {
          const newUI: GroupUI = {
            id: created.id,
            groupName: created.name,
            groupType: created.type,
            surveyId: created.surveyId,
            priority: created.priority,
            visibility: created.visibility
          };
          this.getGroupsFromServer(); // 👈 re-fetch the latest list with clean data

          this.initializeNewGroup();
        },
        error: err => console.error('Create failed', err)
      });
    } else {
      this.assetService.updateGroup(this.newGroup.id, payload).subscribe({
        next: () => {
          const index = this.groups.findIndex(g => g.id === this.newGroup.id);
          if (index > -1) {
            this.groups[index] = { ...this.newGroup };
          }
          this.filterGroups();
          this.initializeNewGroup();
        },
        error: err => console.error('Failed to update group', err)
      });
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredGroups.length / this.pageSize);
  }

  getVisiblePages(): (number | string)[] {
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredGroups.length);
  }

  getTotalFilteredItems(): number {
    return this.filteredGroups.length;
  }

  get paginatedGroups(): GroupUI[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredGroups.slice(start, end);
  }

  // ✅ THIS IS WHAT MATCHES `type` TO GROUPTYPE NAME
  typeLabel(type: number): string {
    console.log('Resolving type label for:', type, 'Available types:', this.groupTypes);
    const match = this.groupTypes.find(t => t.id === type);
    console.log('Match found:', match);
    return match ? match.name : 'Unknown';
  }
}
