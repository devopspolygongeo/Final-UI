// plotview-invoices.component.ts
import { Component, HostListener, OnInit } from '@angular/core';

interface Invoice {
    id: string;
    date: string;
    billingName: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Pending';
    assetAssigned?: string;
}

@Component({
    selector: 'app-plotview-invoices',
    templateUrl: './plotview-invoices.component.html',
    styleUrls: ['./plotview-invoices.component.css']
})
export class PlotviewInvoicesComponent implements OnInit {
    currentPage: number = 1;
    itemsPerPage: number = 10;
    searchTerm: string = '';
    selectedDate: string = '';
    sortConfig: { key: string; direction: 'asc' | 'desc' } = { key: 'id', direction: 'asc' };
    activeMenuId: string | null = null;
    showInvoiceModal: boolean = false;
    selectedInvoice: Invoice | null = null;

    invoices: Invoice[] = [
        { id: 'PV0001', date: '18th Sep 23', billingName: 'Organization Name', amount: 2500, status: 'Paid', assetAssigned: 'Harmony Meadows' },
        { id: 'PV0002', date: '15th Oct 23', billingName: 'Company Ltd', amount: 8000, status: 'Paid', assetAssigned: 'Green Valley' },
        { id: 'PV0003', date: '1st Nov 23', billingName: 'Business Inc', amount: 1000, status: 'Unpaid', assetAssigned: 'Sunny Hills' },
        { id: 'PV0004', date: '20th Sep 23', billingName: 'Enterprise Corp', amount: 3000, status: 'Paid', assetAssigned: 'River View' },
        { id: 'PV0005', date: '5th Oct 23', billingName: 'Organization Name', amount: 12000, status: 'Paid', assetAssigned: 'Mountain Peak' },
        { id: 'PV0006', date: '12th Nov 23', billingName: 'Company Ltd', amount: 5000, status: 'Pending', assetAssigned: 'Lake Side' },
        { id: 'PV0007', date: '8th Oct 23', billingName: 'Business Inc', amount: 2000, status: 'Unpaid', assetAssigned: 'Forest Edge' },
        { id: 'PV0008', date: '25th Sep 23', billingName: 'Enterprise Corp', amount: 10000, status: 'Paid', assetAssigned: 'Ocean View' },
        { id: 'PV0009', date: '3rd Nov 23', billingName: 'Organization Name', amount: 6000, status: 'Paid', assetAssigned: 'Desert Bloom' },
        { id: 'PV0010', date: '17th Oct 23', billingName: 'Company Ltd', amount: 3000, status: 'Unpaid', assetAssigned: 'Urban Oasis' },
        { id: 'PV0011', date: '9th Nov 23', billingName: 'Business Inc', amount: 12000, status: 'Pending', assetAssigned: 'Country Side' },
        { id: 'PV0012', date: '22nd Oct 23', billingName: 'Enterprise Corp', amount: 800, status: 'Paid', assetAssigned: 'Hill Top' }
    ];

    filteredInvoices: Invoice[] = [];

    ngOnInit(): void {
        this.filterInvoices();
        this.selectedDate = this.formatDateForInput(new Date());
    }

    // Helper method to generate email from billing name
    generateEmailFromBillingName(billingName: string): string {
        return billingName.replace(/\s+/g, '').toLowerCase() + '@rhyta.com';
    }

    // Helper method to format asset name for display
    getAssetDisplayName(invoice: Invoice): string {
        return invoice.assetAssigned || 'Minia';
    }

    // Helper method to calculate half amount
    getHalfAmount(amount: number): number {
        return amount / 2;
    }

    onDateChange(): void {
        this.filterInvoices();
    }

    private formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    viewInvoiceDetails(invoice: Invoice): void {
        console.log('View invoice details for:', invoice.id);
        this.selectedInvoice = invoice;
        this.showInvoiceModal = true;
        this.closeActionsMenu();
    }

    closeInvoiceModal(): void {
        this.showInvoiceModal = false;
        this.selectedInvoice = null;
    }

    // Add this method to handle ESC key closing
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (this.showInvoiceModal) {
            this.closeInvoiceModal();
        }
    }

    filterInvoices(): void {
        let filtered = [...this.invoices];

        // Filter by search term
        if (this.searchTerm) {
            filtered = filtered.filter(inv =>
                inv.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                inv.billingName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (inv.assetAssigned && inv.assetAssigned.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
                inv.status.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        // Filter by date if selected
        if (this.selectedDate) {
            const selectedDateObj = new Date(this.selectedDate);
            filtered = filtered.filter(inv => {
                const invoiceDate = this.parseDateString(inv.date);
                return invoiceDate >= selectedDateObj;
            });
        }

        // Sort invoices
        if (this.sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = this.getSortableValue(a, this.sortConfig.key);
                const bValue = this.getSortableValue(b, this.sortConfig.key);

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return this.sortConfig.direction === 'asc' ? comparison : -comparison;
                }

                if (aValue < bValue) {
                    return this.sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return this.sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        this.filteredInvoices = filtered;
        this.currentPage = 1;
    }

    private getSortableValue(invoice: Invoice, key: string): any {
        switch (key) {
            case 'id':
                return invoice.id;
            case 'date':
                return this.parseDateString(invoice.date).getTime();
            case 'billingName':
                return invoice.billingName.toLowerCase();
            case 'amount':
                return invoice.amount;
            case 'status':
                return invoice.status.toLowerCase();
            default:
                const value = invoice[key as keyof Invoice];
                return typeof value === 'string' ? value.toLowerCase() : value || '';
        }
    }

    private parseDateString(dateString: string): Date {
        const parts = dateString.split(' ');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const monthAbbr = parts[1];
            const year = parseInt(parts[2]) + 2000;

            const months: { [key: string]: number } = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };

            const month = months[monthAbbr] || 0;
            return new Date(year, month, day);
        }
        return new Date();
    }

    sortBy(key: string): void {
        if (this.sortConfig.key === key) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig = { key, direction: 'asc' };
        }
        this.filterInvoices();
    }

    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchTerm = target.value;
        this.filterInvoices();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this.filterInvoices();
    }

    download(invoiceId: string): void {
        console.log(`Download invoice: ${invoiceId}`);
        // Trigger real download logic here
    }

    // Only showing the relevant changed methods
    toggleActionsMenu(invoiceId: string): void {
        this.activeMenuId = this.activeMenuId === invoiceId ? null : invoiceId;
    }

    closeActionsMenu(): void {
        this.activeMenuId = null;
    }

    viewDetails(invoice: Invoice): void {
        console.log('View details for invoice:', invoice.id);
        this.closeActionsMenu();
        // Implement your view details logic here
    }

    assignAsset(invoice: Invoice): void {
        console.log('Assign asset for invoice:', invoice.id);
        this.closeActionsMenu();
    }

    extendPlan(invoice: Invoice): void {
        console.log('Extend plan for invoice:', invoice.id);
        this.closeActionsMenu();
    }

    reviseAsset(invoice: Invoice): void {
        console.log('Revise asset for invoice:', invoice.id);
        this.closeActionsMenu();
    }

    // Pagination methods
    getTotalFilteredItems(): number {
        return this.filteredInvoices.length;
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
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            visiblePages.push(1);

            if (currentPage > 4) {
                visiblePages.push('...');
            }

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

            if (totalPages > 1) {
                visiblePages.push(totalPages);
            }
        }

        return visiblePages;
    }

    getPaginatedInvoices(): Invoice[] {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredInvoices.slice(startIndex, endIndex);
    }
}