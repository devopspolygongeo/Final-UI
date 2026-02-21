import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionDialogComponent } from './add-subscription/subscription-dialog.component';

export interface Subscription {
  subscriptionId: string;
  assetAssigned: string;
  validity: string;
  area: string;
  plan: string;
  amount: number;
  active: boolean;
  date: string;
}

const SUBSCRIPTION_DATA: Subscription[] = [
  { subscriptionId: '1', assetAssigned: 'Asset 1', validity: '1 year', area: 'Area 1', plan: 'Plan A', amount: 1000, active: true, date: '2024-01-01' },
  { subscriptionId: '2', assetAssigned: 'Asset 2', validity: '6 months', area: 'Area 2', plan: 'Plan B', amount: 600, active: false, date: '2024-02-01' },
  { subscriptionId: '3', assetAssigned: 'Asset 3', validity: '1 year', area: 'Area 3', plan: 'Plan C', amount: 1200, active: true, date: '2024-03-01' },
  { subscriptionId: '4', assetAssigned: 'Asset 4', validity: '3 months', area: 'Area 4', plan: 'Plan A', amount: 300, active: true, date: '2024-04-01' },
  { subscriptionId: '5', assetAssigned: 'Asset 5', validity: '1 year', area: 'Area 5', plan: 'Plan D', amount: 1500, active: false, date: '2024-05-01' },
  { subscriptionId: '6', assetAssigned: 'Asset 6', validity: '2 years', area: 'Area 6', plan: 'Plan E', amount: 2000, active: true, date: '2024-06-01' },
  { subscriptionId: '7', assetAssigned: 'Asset 7', validity: '1 year', area: 'Area 7', plan: 'Plan F', amount: 1100, active: true, date: '2024-07-01' }
];


type NavItem = { name: string, active: boolean };
@Component({
    selector: 'subscription',
    templateUrl: './subscription.component.html',
    styleUrls: ['./subscription.component.css'],
  })

  export class SubscriptionComponent {
    constructor(private router: Router,
      public dialog: MatDialog
    ) {}
   

    displayedColumns: string[] = ['subscriptionId', 'assetAssigned', 'validity', 'area', 'plan', 'amount', 'active', 'date', 'actions'];
    dataSource = new MatTableDataSource(SUBSCRIPTION_DATA);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  openDialog(): void {
    const dialogRef = this.dialog.open(SubscriptionDialogComponent, {
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

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  edit(element: Subscription) {
    // Implement edit functionality
  }

  delete(element: Subscription) {
    // Implement delete functionality
  }
  }