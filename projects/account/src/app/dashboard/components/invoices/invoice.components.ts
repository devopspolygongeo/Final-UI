import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

export interface Invoice {
  invoiceId: string;
  date: string;
  billingName: string;
  amount: number;
  status: string;
}

const INVOICE_DATA: Invoice[] = [
  {invoiceId: 'INV-001', date: '2024-01-01', billingName: 'John Doe', amount: 500, status: 'Paid'},
  // Add more data here
];

type NavItem = { name: string, active: boolean };
@Component({
    selector: 'invoices',
    templateUrl: './invoice.component.html',
    styleUrls: ['./invoice.component.css'],
  })

  export class InvoicesComponent {
    displayedColumns: string[] = ['invoiceId', 'date', 'billingName', 'amount', 'status', 'downloadPdf', 'actions'];
    dataSource = new MatTableDataSource(INVOICE_DATA);
  
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
  
    ngOnInit() {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  
    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  
    downloadPdf(element: Invoice) {
      // Implement download PDF functionality
    }
  
    edit(element: Invoice) {
      // Implement edit functionality
    }
  
    delete(element: Invoice) {
      // Implement delete functionality
    }
  }