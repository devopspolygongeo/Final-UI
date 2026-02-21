import { Component, OnInit } from '@angular/core';

export interface LeadData {
    id: number;
    name: string;
    contactNumber: string;
    email: string;
    layoutName: string;
    plotNo: number;
    status: string;
    dateSubmitted: string;
    selected?: boolean;
}

@Component({
    selector: 'app-plotview-lead-management',
    templateUrl: './plotview-lead-management.component.html',
    styleUrls: ['./plotview-lead-management.component.css']
})
export class PlotviewLeadManagementComponent implements OnInit {
    leads: LeadData[] = [
        {
            id: 1,
            name: 'Rayapati Rajasekhar',
            contactNumber: '9490442662',
            email: 'rayapati.raja@gmail.com',
            layoutName: 'Bhoothpur',
            plotNo: 102,
            status: 'Inprogress',
            dateSubmitted: '18th Sep 23'
        },
        {
            id: 2,
            name: 'Priya Sharma',
            contactNumber: '9876543210',
            email: 'priya.sharma@gmail.com',
            layoutName: 'Green Valley',
            plotNo: 205,
            status: 'Completed',
            dateSubmitted: '22nd Sep 23'
        },
        {
            id: 3,
            name: 'Amit Kumar',
            contactNumber: '8765432109',
            email: 'amit.kumar@gmail.com',
            layoutName: 'Sunrise City',
            plotNo: 314,
            status: 'Pending',
            dateSubmitted: '25th Sep 23'
        },
        {
            id: 4,
            name: 'Sneha Reddy',
            contactNumber: '7654321098',
            email: 'sneha.reddy@gmail.com',
            layoutName: 'Paradise Hills',
            plotNo: 156,
            status: 'Inprogress',
            dateSubmitted: '28th Sep 23'
        },
        {
            id: 5,
            name: 'Rajesh Patel',
            contactNumber: '6543210987',
            email: 'rajesh.patel@gmail.com',
            layoutName: 'Golden Park',
            plotNo: 89,
            status: 'Completed',
            dateSubmitted: '2nd Oct 23'
        },
        {
            id: 6,
            name: 'Kavitha Nair',
            contactNumber: '5432109876',
            email: 'kavitha.nair@gmail.com',
            layoutName: 'Silver Springs',
            plotNo: 267,
            status: 'Pending',
            dateSubmitted: '5th Oct 23'
        },
        {
            id: 7,
            name: 'Suresh Babu',
            contactNumber: '4321098765',
            email: 'suresh.babu@gmail.com',
            layoutName: 'Crystal Heights',
            plotNo: 198,
            status: 'Inprogress',
            dateSubmitted: '8th Oct 23'
        },
        {
            id: 8,
            name: 'Meera Singh',
            contactNumber: '3210987654',
            email: 'meera.singh@gmail.com',
            layoutName: 'Royal Gardens',
            plotNo: 345,
            status: 'Completed',
            dateSubmitted: '12th Oct 23'
        },
        {
            id: 9,
            name: 'Vikram Rao',
            contactNumber: '2109876543',
            email: 'vikram.rao@gmail.com',
            layoutName: 'Dream Valley',
            plotNo: 421,
            status: 'Pending',
            dateSubmitted: '15th Oct 23'
        },
        {
            id: 10,
            name: 'Anitha Kumari',
            contactNumber: '1098765432',
            email: 'anitha.kumari@gmail.com',
            layoutName: 'Sunset Boulevard',
            plotNo: 178,
            status: 'Inprogress',
            dateSubmitted: '18th Oct 23'
        }
    ];

    currentPage = 1;
    itemsPerPage = 4;
    totalEntries = this.leads.length;
    allSelected = false;
    sortColumn = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    ngOnInit(): void {
        // Initialize component
    }

    // Checkbox functionality
    toggleAllSelection(): void {
        this.allSelected = !this.allSelected;
        this.leads.forEach(lead => lead.selected = this.allSelected);
    }

    toggleLeadSelection(lead: LeadData): void {
        lead.selected = !lead.selected;
        this.updateAllSelectedState();
    }

    private updateAllSelectedState(): void {
        const selectedCount = this.leads.filter(lead => lead.selected).length;
        this.allSelected = selectedCount === this.leads.length;
    }

    // Sorting functionality
    sortTable(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.leads.sort((a, b) => {
            let aValue: any = a[column as keyof LeadData];
            let bValue: any = b[column as keyof LeadData];

            // Handle different data types
            if (column === 'plotNo') {
                aValue = Number(aValue);
                bValue = Number(bValue);
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
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
    getPaginatedLeads(): LeadData[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.leads.slice(startIndex, endIndex);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    get totalPages(): number {
        return Math.ceil(this.totalEntries / this.itemsPerPage);
    }

    getStartIndex(): number {
        if (this.totalEntries === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex(): number {
        const end = this.currentPage * this.itemsPerPage;
        return Math.min(end, this.totalEntries);
    }

    getVisiblePages(): (number | string)[] {
        const totalPages = this.totalPages;
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
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (current < totalPages - 3) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    }

    // Action buttons
    onExport(): void {
        console.log('Export functionality');
        // Implement export logic
    }

    onPrint(): void {
        console.log('Print functionality');
        window.print();
    }

    onDownload(): void {
        console.log('Download functionality');
        // Implement download logic
    }

    // Status styling
    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'status-completed';
            case 'inprogress':
                return 'status-inprogress';
            case 'pending':
                return 'status-pending';
            default:
                return '';
        }
    }

    // Track by function for ngFor performance
    trackByFn(index: number, item: LeadData): number {
        return item.id;
    }
}