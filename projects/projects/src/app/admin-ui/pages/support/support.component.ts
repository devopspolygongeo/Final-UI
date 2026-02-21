import { Component } from '@angular/core';

interface Issue {
  id: number;
  serialNo: string;
  issueId: string;
  issueCategory: string;
  issueType: string;
  description: string;
  date: string;
  status: string;
  assetName: string;
  clientName: string;
}

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent {
  newIssue: Issue = {
    id: 0,
    serialNo: '',
    issueId: 'ISSUE-' + Math.floor(Math.random() * 10000),
    issueCategory: 'Technical',
    issueType: '',
    description: '',
    date: new Date().toLocaleDateString(),
    status: 'Inprogress',
    assetName: '',
    clientName: ''
  };
  // Component state
  activeTab: 'all' | 'active' | 'inactive' = 'all';
  searchTerm = '';
  currentPage = 1;
  pageSize = 4;
  sortConfig: { key: keyof Issue; direction: 'asc' | 'desc' } = {
    key: 'issueId',
    direction: 'asc'
  };

  // Sample data
  issues: Issue[] = [
    {
      id: 1,
      serialNo: '01',
      issueId: 'Issue0001',
      issueCategory: 'Onboarding',
      issueType: 'Improper Geofencing',
      description: 'There is an issue with geofencing setup for this asset. The boundaries are not properly configured.',
      date: '18th Sep 23',
      status: 'Inprogress',
      assetName: 'Sri Venkateswara Farms',
      clientName: 'Polygon Geospatial'
    },
    {
      id: 2,
      serialNo: '02',
      issueId: 'Issue0002',
      issueCategory: 'Subscriptions',
      issueType: 'Subscription not updated',
      description: 'Customer subscription status is not reflecting the recent payment made.',
      date: '18th Sep 23',
      status: 'Inprogress',
      assetName: 'Sri Venkateswara Farms',
      clientName: 'Polygon Geospatial'
    },
    {
      id: 3,
      serialNo: '03',
      issueId: 'Issue0003',
      issueCategory: 'Payments & invoices',
      issueType: 'Payment did not reflect',
      description: 'Payment was made but not reflected in the system. Need to verify transaction details.',
      date: '18th Sep 23',
      status: 'Inprogress',
      assetName: 'Sri Venkateswara Farms',
      clientName: 'Polygon Geospatial'
    }
  ];

  filteredIssues: Issue[] = [];
  selectedIssue: Issue | null = null;
  originalIssue: Issue | null = null;

  constructor() {
    this.filterIssues();
  }

  // Filtering and sorting
  filterIssues(): void {
    let result = [...this.issues];

    // Apply active/inactive filter
    if (this.activeTab === 'active') {
      result = result.filter(i => i.status === 'Inprogress' || i.status === 'Pending');
    } else if (this.activeTab === 'inactive') {
      result = result.filter(i => i.status === 'Resolved' || i.status === 'Closed');
    }

    // Apply search filter
    if (this.searchTerm) {
      result = result.filter(issue =>
        issue.issueId.toLowerCase().includes(this.searchTerm) ||
        issue.issueType.toLowerCase().includes(this.searchTerm) ||
        issue.description.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[this.sortConfig.key];
      const bVal = b[this.sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return this.sortConfig.direction === 'asc'
          ? (aVal as any) - (bVal as any)
          : (bVal as any) - (aVal as any);
      }
    });

    this.filteredIssues = result;
  }

  // Sorting
  sortBy(key: keyof Issue): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterIssues();
  }

  getSortIcon(key: keyof Issue): string {
    if (this.sortConfig.key !== key) {
      return 'assets/admin-dashboard/admin-reorder.png';
    }
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  selectIssue(issue: Issue): void {
    this.newIssue = { ...issue };
  }

  saveIssue(): void {
    if (this.newIssue.id === 0) {
      // Add new issue
      this.newIssue.id = Math.max(...this.issues.map(i => i.id), 0) + 1;
      this.newIssue.serialNo = (this.issues.length + 1).toString().padStart(2, '0');
      this.issues.push({ ...this.newIssue });
    } else {
      // Update existing issue
      const index = this.issues.findIndex(i => i.id === this.newIssue.id);
      if (index !== -1) {
        this.issues[index] = { ...this.newIssue };
      }
    }

    // Reset form after submission
    this.resetNewIssue();
    this.filterIssues();
  }
  resetNewIssue(): void {
    this.newIssue = {
      id: 0,
      serialNo: '',
      issueId: 'ISSUE-' + Math.floor(Math.random() * 10000),
      issueCategory: 'Technical',
      issueType: '',
      description: '',
      date: new Date().toLocaleDateString(),
      status: 'Inprogress',
      assetName: '',
      clientName: ''
    };
  }

  deleteIssue(issue: Issue): void {
    if (confirm('Are you sure you want to delete this issue?')) {
      this.issues = this.issues.filter(i => i.id !== issue.id);
      this.filterIssues();
      if (this.selectedIssue?.id === issue.id) {
        this.selectedIssue = null;
        this.originalIssue = null;
      }
    }
  }

  cancelEdit(): void {
    if (this.originalIssue) {
      this.selectedIssue = { ...this.originalIssue };
    } else {
      this.selectedIssue = null;
    }
  }

  onTabChange(tab: 'all' | 'active' | 'inactive'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filterIssues();
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.currentPage = 1;
    this.filterIssues();
  }

  // Pagination
  getTotalPages(): number {
    return Math.ceil(this.filteredIssues.length / this.pageSize);
  }

  getVisiblePages(): (number | string)[] {
    const total = this.getTotalPages();
    const current = this.currentPage;
    const range: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) range.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) range.push(i);

      if (current < total - 2) range.push('...');
      range.push(total);
    }

    return range;
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
    return Math.min(this.currentPage * this.pageSize, this.filteredIssues.length);
  }

  getTotalFilteredItems(): number {
    return this.filteredIssues.length;
  }

  get paginatedIssues(): Issue[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredIssues.slice(start, end);
  }
}