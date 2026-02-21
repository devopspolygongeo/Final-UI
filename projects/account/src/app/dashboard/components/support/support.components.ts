import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ReportIssueDialogComponent } from './report-issue/report-issue.component';
import { MatDialog } from '@angular/material/dialog';

export interface SupportIssue {
  issueId: string;
  issueCategory: string;
  issueType: string;
  description: string;
  dateSubmitted: string;
  status: string;
}

const SUPPORT_DATA: SupportIssue[] = [
  {issueId: 'ISS-001', issueCategory: 'Technical', issueType: 'Bug', description: 'Login not working', dateSubmitted: '2024-01-01', status: 'Open'},
  {issueId: 'ISS-002', issueCategory: 'Account', issueType: 'Query', description: 'Billing issue', dateSubmitted: '2024-02-15', status: 'Closed'},
  {issueId: 'ISS-003', issueCategory: 'Technical', issueType: 'Feature Request', description: 'Request for dark mode', dateSubmitted: '2024-03-05', status: 'In Progress'},
  {issueId: 'ISS-004', issueCategory: 'Service', issueType: 'Complaint', description: 'Slow service response', dateSubmitted: '2024-03-20', status: 'Open'},
  {issueId: 'ISS-005', issueCategory: 'Technical', issueType: 'Bug', description: 'Error on dashboard', dateSubmitted: '2024-04-10', status: 'Open'}
];

type NavItem = { name: string, active: boolean };
@Component({
    selector: 'support',
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.css'],
  })

  export class SupportComponent {
    displayedColumns: string[] = ['slNo', 'issueId', 'issueCategory', 'issueType', 'description', 'dateSubmitted', 'status', 'actions'];
    dataSource = new MatTableDataSource(SUPPORT_DATA);

    constructor(private router: Router,
      public dialog: MatDialog
    ) {}

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

  edit(element: SupportIssue) {
    // Implement edit functionality
  }

  delete(element: SupportIssue) {
    // Implement delete functionality
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ReportIssueDialogComponent, {
      width: '600px',
      height:'660px',
      data: { subscriptionId: '', assetAssigned: '', validity: '', area: '', plan: '', amount: '', active: false, date: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
      }
    });
  }
  }