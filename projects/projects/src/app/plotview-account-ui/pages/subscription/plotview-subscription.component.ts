import { Component, OnInit, HostListener } from '@angular/core';

interface Subscription {
    id: string;
    assetAssigned: string;
    validity: string;
    area: string;
    plan: string;
    amount: number;
    isActive: boolean;
    date: string;
    status: string;
    specialPlan?: string;
}

@Component({
    selector: 'app-plotview-subscription',
    templateUrl: './plotview-subscription.component.html',
    styleUrls: ['./plotview-subscription.component.css']
})
export class PlotViewSubscriptionComponent implements OnInit {
    currentPage: number = 1;
    itemsPerPage: number = 10;
    searchTerm: string = '';
    selectedDate: string = '';
    sortConfig: { key: string; direction: 'asc' | 'desc' } = { key: 'id', direction: 'asc' };
    activeMenuId: string | null = null;
    // Add these properties
    showAddModal: boolean = false;
    newSubscription = {
        asset: '',
        serviceType: '',
        assetSize: '10',
        customSize: '',
        duration: '6',
        includeOnboarding: false,
        includeMaintenance: false,
        amount: 12000
    };
    subscriptions: Subscription[] = [
        {
            id: 'PV0001',
            assetAssigned: 'Harmony Meadows',
            validity: '31st December 2023',
            area: '5 acres',
            plan: 'Quarterly',
            amount: 2500,
            isActive: false,
            date: '18th Sep 23',
            status: 'Not Activated',
            specialPlan: 'Half yearly + Onboarding'
        },
        {
            id: 'PV0002',
            assetAssigned: 'Green Valley',
            validity: '30th June 2024',
            area: '3 acres',
            plan: 'Annual',
            amount: 8000,
            isActive: true,
            date: '15th Oct 23',
            status: 'Active'
        },
        {
            id: 'PV0003',
            assetAssigned: 'Sunny Hills',
            validity: '31st March 2024',
            area: '2 acres',
            plan: 'Monthly',
            amount: 1000,
            isActive: true,
            date: '1st Nov 23',
            status: 'Active'
        },
        {
            id: 'PV0004',
            assetAssigned: 'River View',
            validity: '31st December 2023',
            area: '4 acres',
            plan: 'Quarterly',
            amount: 3000,
            isActive: false,
            date: '20th Sep 23',
            status: 'Expired'
        },
        {
            id: 'PV0005',
            assetAssigned: 'Mountain Peak',
            validity: '31st December 2024',
            area: '6 acres',
            plan: 'Annual',
            amount: 12000,
            isActive: true,
            date: '5th Oct 23',
            status: 'Active'
        },
        {
            id: 'PV0006',
            assetAssigned: 'Lake Side',
            validity: '30th June 2024',
            area: '3 acres',
            plan: 'Half Yearly',
            amount: 5000,
            isActive: true,
            date: '12th Nov 23',
            status: 'Active'
        },
        {
            id: 'PV0007',
            assetAssigned: 'Forest Edge',
            validity: '31st March 2024',
            area: '2 acres',
            plan: 'Quarterly',
            amount: 2000,
            isActive: false,
            date: '8th Oct 23',
            status: 'Pending'
        },
        {
            id: 'PV0008',
            assetAssigned: 'Ocean View',
            validity: '31st December 2024',
            area: '5 acres',
            plan: 'Annual',
            amount: 10000,
            isActive: true,
            date: '25th Sep 23',
            status: 'Active'
        },
        {
            id: 'PV0009',
            assetAssigned: 'Desert Bloom',
            validity: '30th June 2024',
            area: '4 acres',
            plan: 'Half Yearly',
            amount: 6000,
            isActive: true,
            date: '3rd Nov 23',
            status: 'Active'
        },
        {
            id: 'PV0010',
            assetAssigned: 'Urban Oasis',
            validity: '31st March 2024',
            area: '3 acres',
            plan: 'Quarterly',
            amount: 3000,
            isActive: false,
            date: '17th Oct 23',
            status: 'Suspended'
        },
        {
            id: 'PV0011',
            assetAssigned: 'Country Side',
            validity: '31st December 2024',
            area: '6 acres',
            plan: 'Annual',
            amount: 12000,
            isActive: true,
            date: '9th Nov 23',
            status: 'Active'
        },
        {
            id: 'PV0012',
            assetAssigned: 'Hill Top',
            validity: '30th June 2024',
            area: '2 acres',
            plan: 'Monthly',
            amount: 800,
            isActive: true,
            date: '22nd Oct 23',
            status: 'Active'
        }
    ];

    filteredSubscriptions: Subscription[] = [];
    today: string | number | Date | undefined;

    // Listen for clicks outside the component to close menus
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.actions-container')) {
            this.activeMenuId = null;
        }
    }

    ngOnInit(): void {
        this.filterSubscriptions();
        // Set today's date for header display
        this.today = new Date();
        // Set default date for date picker
        this.selectedDate = this.formatDateForInput(new Date());
    }

    filterSubscriptions(): void {
        let filtered = [...this.subscriptions];

        // Filter by search term
        if (this.searchTerm) {
            filtered = filtered.filter(sub =>
                sub.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                sub.assetAssigned.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                sub.plan.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                sub.status.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        // Sort with proper type safety
        filtered.sort((a, b) => {
            // Get values with fallbacks for undefined cases
            const aValue = a[this.sortConfig.key as keyof Subscription] ?? '';
            const bValue = b[this.sortConfig.key as keyof Subscription] ?? '';

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const aStr = aValue.toLowerCase();
                const bStr = bValue.toLowerCase();

                if (aStr < bStr) {
                    return this.sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aStr > bStr) {
                    return this.sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            }

            // Handle number comparison
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return this.sortConfig.direction === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }

            // Handle date comparison for date strings
            if (this.sortConfig.key === 'date') {
                const aDate = this.parseDate(aValue as string);
                const bDate = this.parseDate(bValue as string);
                return this.sortConfig.direction === 'asc'
                    ? aDate.getTime() - bDate.getTime()
                    : bDate.getTime() - aDate.getTime();
            }

            return 0;
        });

        this.filteredSubscriptions = filtered;
        this.currentPage = 1; // Reset to first page after filtering
    }

    // Helper method to parse date strings
    private parseDate(dateString: string): Date {
        // Handle formats like "18th Sep 23"
        const parts = dateString.split(' ');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = this.getMonthNumber(parts[1]);
            const year = 2000 + parseInt(parts[2]);
            return new Date(year, month, day);
        }
        return new Date();
    }

    private getMonthNumber(monthAbbr: string): number {
        const months: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        return months[monthAbbr] || 0;
    }

    sortBy(key: string): void {
        if (this.sortConfig.key === key) {
            // Toggle direction if same key
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new key with ascending direction
            this.sortConfig = { key, direction: 'asc' };
        }
        this.filterSubscriptions();
    }

    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchTerm = target.value;
        this.filterSubscriptions();
    }

    onDateChange(): void {
        // Handle date filter logic here
        console.log('Date changed:', this.selectedDate);
        this.filterSubscriptions();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1; // Reset to first page
        this.filterSubscriptions();
    }

    toggleActive(subscription: Subscription): void {
        subscription.isActive = !subscription.isActive;
        subscription.status = subscription.isActive ? 'Active' : 'Inactive';
        console.log(`Subscription ${subscription.id} is now ${subscription.isActive ? 'active' : 'inactive'}`);
    }

    toggleActionsMenu(subscriptionId: string): void {
        this.activeMenuId = this.activeMenuId === subscriptionId ? null : subscriptionId;
    }

    closeActionsMenu(): void {
        this.activeMenuId = null;
    }

    addSubscription(): void {
        this.showAddModal = true;
        // Reset form
        this.newSubscription = {
            asset: '',
            serviceType: '',
            assetSize: '10',
            customSize: '',
            duration: '6',
            includeOnboarding: false,
            includeMaintenance: false,
            amount: 12000
        };
    }
    closeAddModal(): void {
        this.showAddModal = false;
    }

    saveSubscription(): void {
        // Generate new subscription ID
        const newId = 'PV' + String(this.subscriptions.length + 1).padStart(4, '0');

        // Create new subscription object
        const subscription: Subscription = {
            id: newId,
            assetAssigned: this.newSubscription.asset || 'New Asset',
            validity: this.calculateValidity(this.newSubscription.duration),
            area: this.newSubscription.customSize ?
                `${this.newSubscription.customSize} acres` :
                `${this.newSubscription.assetSize} acres`,
            plan: this.getDurationLabel(this.newSubscription.duration),
            amount: this.newSubscription.amount,
            isActive: true,
            date: this.formatCurrentDate(),
            status: 'Active',
            specialPlan: this.getSpecialPlan()
        };

        // Add to subscriptions array
        this.subscriptions.push(subscription);

        // Refresh filtered data
        this.filterSubscriptions();

        // Close modal
        this.closeAddModal();

        console.log('New subscription added:', subscription);
    }

    private calculateValidity(duration: string): string {
        const months = parseInt(duration);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + months);

        const day = futureDate.getDate();
        const month = futureDate.toLocaleString('default', { month: 'long' });
        const year = futureDate.getFullYear();

        return `${day}${this.getOrdinalSuffix(day)} ${month} ${year}`;
    }

    private getDurationLabel(duration: string): string {
        const months = parseInt(duration);
        switch (months) {
            case 3: return 'Quarterly';
            case 6: return 'Half Yearly';
            case 12: return 'Annual';
            default: return 'Monthly';
        }
    }

    private formatCurrentDate(): string {
        const now = new Date();
        const day = now.getDate();
        const month = now.toLocaleString('default', { month: 'short' });
        const year = String(now.getFullYear()).slice(-2);

        return `${day}${this.getOrdinalSuffix(day)} ${month} ${year}`;
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

    private getSpecialPlan(): string | undefined {
        if (this.newSubscription.includeOnboarding && this.newSubscription.includeMaintenance) {
            return 'Onboarding + Maintenance';
        } else if (this.newSubscription.includeOnboarding) {
            return 'With Onboarding';
        } else if (this.newSubscription.includeMaintenance) {
            return 'With Maintenance';
        }
        return undefined;
    }
    assignAsset(subscription: Subscription): void {
        console.log('Assign asset for subscription:', subscription.id);
        this.closeActionsMenu();
        // Implement assign asset logic
    }
    // Add these methods to your existing TypeScript component:

    toggleOnboarding(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.newSubscription.includeOnboarding = !this.newSubscription.includeOnboarding;
    }

    toggleMaintenance(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.newSubscription.includeMaintenance = !this.newSubscription.includeMaintenance;
    }

    extendPlan(subscription: Subscription): void {
        console.log('Extend plan for subscription:', subscription.id);
        this.closeActionsMenu();
        // Implement extend plan logic
    }

    reviseAsset(subscription: Subscription): void {
        console.log('Revise asset for subscription:', subscription.id);
        this.closeActionsMenu();
        // Implement revise asset logic
    }

    viewDetails(subscription: Subscription): void {
        console.log('View details for subscription:', subscription.id);
        this.closeActionsMenu();
        // Implement view details logic
    }

    // Pagination methods
    getTotalFilteredItems(): number {
        return this.filteredSubscriptions.length;
    }

    getTotalPages(): number {
        return Math.ceil(this.getTotalFilteredItems() / this.itemsPerPage);
    }

    getStartIndex(): number {
        return this.getTotalFilteredItems() === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex(): number {
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.getTotalFilteredItems());
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
        }
    }

    getVisiblePages(): (number | string)[] {
        const totalPages = this.getTotalPages();
        const currentPage = this.currentPage;
        const visiblePages: (number | string)[] = [];

        if (totalPages <= 7) {
            // Show all pages if total pages are 7 or less
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            // Always show first page
            visiblePages.push(1);

            if (currentPage > 4) {
                visiblePages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    visiblePages.push(i);
                }
            }

            if (currentPage < totalPages - 3) {
                visiblePages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                visiblePages.push(totalPages);
            }
        }

        return visiblePages;
    }

    // Helper method to format date for input
    private formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get paginated subscriptions for display
    getPaginatedSubscriptions(): Subscription[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredSubscriptions.slice(startIndex, endIndex);
    }
}