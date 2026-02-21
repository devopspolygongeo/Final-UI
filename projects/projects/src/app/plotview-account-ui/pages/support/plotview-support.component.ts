import { Component, OnInit } from '@angular/core';

export interface Issue {
    slNo: number;
    issueId: string;
    issueCategory: string;
    issueType: string;
    description: string;
    dateSubmitted: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface NewIssue {
    issueCategory: string;
    issueType: string;
    project: string;
    description: string;
}

@Component({
    selector: 'app-plotview-support',
    templateUrl: './plotview-support.component.html',
    styleUrls: ['./plotview-support.component.css']
})
export class PlotviewSupportComponent implements OnInit {
    // Tab management
    activeTab: 'all' | 'ongoing' | 'closed' = 'all';

    // Issues data
    issues: Issue[] = [
        {
            slNo: 1,
            issueId: 'Issue0001',
            issueCategory: 'Onboarding',
            issueType: 'Improper Georeferencing',
            description: 'Unable to properly georeference the uploaded map data',
            dateSubmitted: '18th Sep 23',
            status: 'In Progress'
        },
        {
            slNo: 2,
            issueId: 'Issue0002',
            issueCategory: 'Subscriptions',
            issueType: 'Subscription not updated',
            description: 'Subscription changes are not reflecting in the account',
            dateSubmitted: '18th Sep 23',
            status: 'Open'
        },
        {
            slNo: 3,
            issueId: 'Issue0003',
            issueCategory: 'Payments & Invoices',
            issueType: 'Payment did not reflect',
            description: 'Payment made but not showing in account balance',
            dateSubmitted: '18th Sep 23',
            status: 'Resolved'
        },
        {
            slNo: 4,
            issueId: 'Issue0004',
            issueCategory: 'Technical',
            issueType: 'Map rendering issue',
            description: 'Maps are not loading properly on the dashboard',
            dateSubmitted: '17th Sep 23',
            status: 'Closed'
        },
        {
            slNo: 5,
            issueId: 'Issue0005',
            issueCategory: 'General',
            issueType: 'Login problems',
            description: 'Unable to login with valid credentials',
            dateSubmitted: '15th Sep 23',
            status: 'In Progress'
        }
    ];

    filteredIssues: Issue[] = [];

    // Search and filtering
    searchTerm: string = '';
    selectedDate: string = '';

    // Pagination
    currentPage: number = 1;
    itemsPerPage: number = 10;

    // Sorting
    sortField: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Actions menu
    activeMenuId: string | null = null;

    // Modal
    showReportIssueModal: boolean = false;
    newIssue: NewIssue = {
        issueCategory: '',
        issueType: '',
        project: '',
        description: ''
    };

    // Dropdown options
    issueCategoryOptions = [
        'Onboarding',
        'Subscriptions',
        'Payments & Invoices',
        'Technical',
        'General'
    ];

    issueTypeOptions: { [key: string]: string[] } = {
        'Onboarding': [
            'Improper Georeferencing',
            'Account Setup Issues',
            'Documentation Problems',
            'Training Related',
            'Access Issues'
        ],
        'Subscriptions': [
            'Subscription not updated',
            'Plan Change Issues',
            'Billing Cycle Problems',
            'Feature Access Issues',
            'Cancellation Issues'
        ],
        'Payments & Invoices': [
            'Payment did not reflect',
            'Invoice Generation Issues',
            'Payment Method Problems',
            'Refund Requests',
            'Billing Discrepancies'
        ],
        'Technical': [
            'Map rendering issue',
            'Login problems',
            'Data Upload Issues',
            'Performance Issues',
            'API Integration Problems'
        ],
        'General': [
            'General Inquiry',
            'Feature Request',
            'Feedback',
            'Support Request',
            'Other'
        ]
    };

    projectOptions = [
        'Bhootpur',
        'Mumbai Metro',
        'Delhi Highway',
        'Bangalore IT Park',
        'Chennai Port',
        'Kolkata Bridge',
        'Hyderabad Airport',
        'Pune Smart City'
    ];

    ngOnInit(): void {
        this.filterIssues();
    }

    // Tab management
    setActiveTab(tab: 'all' | 'ongoing' | 'closed'): void {
        this.activeTab = tab;
        this.currentPage = 1;
        this.filterIssues();
    }

    // Filtering and search
    filterIssues(): void {
        let filtered = [...this.issues];

        // Filter by tab
        if (this.activeTab === 'ongoing') {
            filtered = filtered.filter(issue =>
                issue.status === 'Open' || issue.status === 'In Progress'
            );
        } else if (this.activeTab === 'closed') {
            filtered = filtered.filter(issue =>
                issue.status === 'Resolved' || issue.status === 'Closed'
            );
        }

        // Filter by search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(issue =>
                issue.issueId.toLowerCase().includes(term) ||
                issue.issueCategory.toLowerCase().includes(term) ||
                issue.issueType.toLowerCase().includes(term) ||
                issue.description.toLowerCase().includes(term) ||
                issue.status.toLowerCase().includes(term)
            );
        }

        // Filter by date
        if (this.selectedDate) {
            filtered = filtered.filter(issue => {
                // Convert date format for comparison (this is a simple implementation)
                // In a real app, you'd want proper date parsing
                return issue.dateSubmitted.includes(this.selectedDate);
            });
        }

        this.filteredIssues = filtered;

        // Reset to first page if current page is beyond available pages
        const totalPages = this.getTotalPages();
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = 1;
        }
    }

    onSearchChange(event: any): void {
        this.searchTerm = event.target.value;
        this.currentPage = 1;
        this.filterIssues();
    }

    onDateChange(): void {
        this.currentPage = 1;
        this.filterIssues();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this.filterIssues();
    }

    // Sorting
    sortBy(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredIssues.sort((a, b) => {
            let aValue = a[field as keyof Issue];
            let bValue = b[field as keyof Issue];

            // Handle numeric sorting for slNo
            if (field === 'slNo') {
                aValue = Number(aValue);
                bValue = Number(bValue);
            }

            if (aValue < bValue) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Pagination
    getPaginatedIssues(): Issue[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredIssues.slice(startIndex, endIndex);
    }

    getTotalPages(): number {
        return Math.ceil(this.filteredIssues.length / this.itemsPerPage);
    }

    getTotalFilteredItems(): number {
        return this.filteredIssues.length;
    }

    getStartIndex(): number {
        if (this.filteredIssues.length === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex(): number {
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.filteredIssues.length);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
        }
    }

    getVisiblePages(): (number | string)[] {
        const totalPages = this.getTotalPages();
        const current = this.currentPage;
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (current > 4) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current < totalPages - 3) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    }

    // Actions menu
    toggleActionsMenu(issueId: string): void {
        this.activeMenuId = this.activeMenuId === issueId ? null : issueId;
    }

    closeActionsMenu(): void {
        this.activeMenuId = null;
    }

    reportResolved(issue: Issue): void {
        const issueIndex = this.issues.findIndex(i => i.issueId === issue.issueId);
        if (issueIndex !== -1) {
            this.issues[issueIndex].status = 'Resolved';
            this.filterIssues();
        }
        this.closeActionsMenu();
        console.log('Issue marked as resolved:', issue.issueId);
    }

    closeIssue(issue: Issue): void {
        const issueIndex = this.issues.findIndex(i => i.issueId === issue.issueId);
        if (issueIndex !== -1) {
            this.issues[issueIndex].status = 'Closed';
            this.filterIssues();
        }
        this.closeActionsMenu();
        console.log('Issue closed:', issue.issueId);
    }

    // Report Issue Modal
    openReportIssueModal(): void {
        this.showReportIssueModal = true;
        this.resetNewIssueForm();
    }

    closeReportIssueModal(): void {
        this.showReportIssueModal = false;
        this.resetNewIssueForm();
    }

    resetNewIssueForm(): void {
        this.newIssue = {
            issueCategory: '',
            issueType: '',
            project: '',
            description: ''
        };
    }

    // Get available issue types based on selected category
    getAvailableIssueTypes(): string[] {
        if (!this.newIssue.issueCategory) {
            return [];
        }
        return this.issueTypeOptions[this.newIssue.issueCategory] || [];
    }

    // Handle category change
    onCategoryChange(): void {
        // Reset issue type when category changes
        this.newIssue.issueType = '';
    }

    submitSupport(): void {
        if (this.newIssue.issueCategory && this.newIssue.issueType &&
            this.newIssue.project && this.newIssue.description) {
            // Generate new issue ID
            const maxSlNo = Math.max(...this.issues.map(i => i.slNo));
            const newIssueId = `Issue${String(maxSlNo + 1).padStart(4, '0')}`;

            const newIssue: Issue = {
                slNo: maxSlNo + 1,
                issueId: newIssueId,
                issueCategory: this.newIssue.issueCategory,
                issueType: this.newIssue.issueType,
                description: `${this.newIssue.description} (Project: ${this.newIssue.project})`,
                dateSubmitted: this.getCurrentDate(),
                status: 'Open'
            };

            // Add to issues array
            this.issues.unshift(newIssue);

            // Refresh filtered issues
            this.filterIssues();

            // Close modal
            this.closeReportIssueModal();

            console.log('New issue submitted:', newIssue);

            // Here you would typically make an API call to save the issue
            // this.issueService.createIssue(newIssue).subscribe(...)
        }
    }

    private getCurrentDate(): string {
        const now = new Date();
        const day = now.getDate();
        const month = now.toLocaleString('default', { month: 'short' });
        const year = now.getFullYear().toString().slice(-2);

        const suffix = this.getOrdinalSuffix(day);
        return `${day}${suffix} ${month} ${year}`;
    }

    private getOrdinalSuffix(day: number): string {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
}