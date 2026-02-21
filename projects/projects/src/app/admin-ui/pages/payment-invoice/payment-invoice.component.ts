// payment-invoice.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Invoice {
  id: number;
  invoiceId: string;
  date: string;
  clientName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
  followup: string;
  followupDate: string;
  organization: string;
  assetName: string;
  dateSubmitted: string;
}

@Component({
  selector: 'app-payment-invoice',
  templateUrl: './payment-invoice.component.html',
  styleUrls: ['./payment-invoice.component.css'],
})
export class PaymentInvoiceComponent implements OnInit {
  activeTab: 'all' | 'ongoing' | 'closed' = 'all';
  searchTerm = '';
  currentPage = 1;
  pageSize = 4;
  sortConfig: { key: keyof Invoice; direction: 'asc' | 'desc' } = {
    key: 'invoiceId',
    direction: 'asc'
  };
  assetId: string = '';
  showPreview = false;

  previewInvoice: Invoice = {
    id: 0,
    invoiceId: '',
    date: '',
    clientName: '',
    amount: 0,
    status: 'Pending',
    description: '',
    followup: '',
    followupDate: '',
    organization: '',
    assetName: '',
    dateSubmitted: ''
  };

  invoices: Invoice[] = [
    {
      id: 1,
      invoiceId: 'PV0001',
      date: '12th Sep 2023',
      clientName: 'Polygon Geospatial',
      amount: 2500,
      status: 'Paid',
      description: 'Onboarding - Smooths',
      followup: 'Following status',
      followupDate: '12th Oct 2023',
      organization: 'Polygon Geospatial',
      assetName: 'Sri Venkateswara Farms',
      dateSubmitted: '18th Sep 23'
    },
    {
      id: 2,
      invoiceId: 'PV0002',
      date: '15th Sep 2023',
      clientName: 'Geo Solutions',
      amount: 1800,
      status: 'Pending',
      description: 'Annual Subscription',
      followup: 'Payment reminder',
      followupDate: '15th Oct 2023',
      organization: 'Geo Solutions',
      assetName: 'Northern Fields',
      dateSubmitted: '20th Sep 23'
    },
    {
      id: 3,
      invoiceId: 'PV0003',
      date: '20th Sep 2023',
      clientName: 'Map Masters',
      amount: 3200,
      status: 'Overdue',
      description: 'Custom Mapping Service',
      followup: 'Urgent payment request',
      followupDate: '20th Oct 2023',
      organization: 'Map Masters',
      assetName: 'Western Plains',
      dateSubmitted: '25th Sep 23'
    }
  ];

  filteredInvoices: Invoice[] = [];
  assetName = 'Sri Venkateswara Farms';

  newInvoice: Invoice = {
    id: 0,
    invoiceId: '',
    date: '',
    clientName: '',
    amount: 0,
    status: 'Pending',
    description: '',
    followup: '',
    followupDate: '',
    organization: '',
    assetName: '',
    dateSubmitted: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.assetName = this.route.snapshot.paramMap.get('assetName') || 'Sri Venkateswara Farms';
    this.initializeNewInvoice();
    this.filterInvoices();
    const id = this.route.parent?.snapshot.paramMap.get('id');
    this.assetId = id ? id : '';
  }

  initializeNewInvoice(): void {
    this.newInvoice = {
      id: 0,
      invoiceId: '',
      date: '',
      clientName: '',
      amount: 0,
      status: 'Pending',
      description: '',
      followup: '',
      followupDate: '',
      organization: '',
      assetName: this.assetName,
      dateSubmitted: ''
    };
  }

  onTabChange(tab: 'all' | 'ongoing' | 'closed'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filterInvoices();
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.currentPage = 1;
    this.filterInvoices();
  }

  filterInvoices(): void {
    let result = [...this.invoices];

    // Apply tab filter
    if (this.activeTab === 'ongoing') {
      result = result.filter(i => i.status !== 'Paid');
    } else if (this.activeTab === 'closed') {
      result = result.filter(i => i.status === 'Paid');
    }

    // Apply search filter
    if (this.searchTerm) {
      result = result.filter(invoice =>
        invoice.invoiceId.toLowerCase().includes(this.searchTerm) ||
        invoice.clientName.toLowerCase().includes(this.searchTerm) ||
        invoice.status.toLowerCase().includes(this.searchTerm)
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
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortConfig.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      }
      return 0;
    });

    this.filteredInvoices = result;
  }

  sortBy(key: keyof Invoice): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterInvoices();
  }

  getSortIcon(key: keyof Invoice): string {
    if (this.sortConfig.key !== key) {
      return 'assets/admin-dashboard/admin-reorder.png';
    }
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  editInvoice(invoice: Invoice): void {
    this.newInvoice = { ...invoice };
  }

  clearForm(): void {
    this.initializeNewInvoice();
  }

  deleteInvoice(invoice: Invoice): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.invoices = this.invoices.filter(i => i.id !== invoice.id);
      this.filterInvoices();
      this.clearForm();
    }
  }

  submitInvoice(): void {
    if (this.newInvoice.id === 0) {
      // Add new invoice
      const newId = Math.max(...this.invoices.map(i => i.id), 0) + 1;
      this.invoices.push({
        ...this.newInvoice,
        id: newId,
        invoiceId: `PV${newId.toString().padStart(4, '0')}`,
        dateSubmitted: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })
      });
    } else {
      // Update existing invoice
      const index = this.invoices.findIndex(i => i.id === this.newInvoice.id);
      if (index > -1) {
        this.invoices[index] = { ...this.newInvoice };
      }
    }

    this.clearForm();
    this.filterInvoices();
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.pageSize);
  }

  getPaginatedInvoices(): Invoice[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredInvoices.slice(start, end);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredInvoices.length);
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

  // Update these methods in your component

  showInvoice(invoice: Invoice): void {
    this.previewInvoice = { ...invoice };
    this.showPreview = true;
    document.body.classList.add('modal-open');
  }

  closePreview(): void {
    this.showPreview = false;
    document.body.classList.remove('modal-open');
  }
  printInvoice(): void {
    const printContent = document.querySelector('.invoice-preview-container')?.outerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${this.previewInvoice.invoiceId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-header { margin-bottom: 20px; }
              .invoice-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
              .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .summary-table th { background-color: #f2f2f2; }
              .summary-total { text-align: right; margin-top: 20px; }
              .divider { border-top: 1px solid #ddd; margin: 20px 0; }
              .invoice-actions { display: none; }
              @media print {
                body { margin: 0; padding: 20px; }
                .close-preview-btn { display: none; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);

        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load before printing
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  }

  downloadInvoice(): void {
    const printContent = document.querySelector('.invoice-preview-container')?.innerHTML;

    if (!printContent) return;

    const blob = new Blob([`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${this.previewInvoice.invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-header { margin-bottom: 20px; }
          .invoice-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .summary-table th { background-color: #f2f2f2; }
          .summary-total { text-align: right; margin-top: 20px; }
          .divider { border-top: 1px solid #ddd; margin: 20px 0; }
          .invoice-actions { display: none; }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${this.previewInvoice.invoiceId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.showPreview) {
      this.closePreview();
    }
  }
}