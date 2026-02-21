import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  dashboardItems = [
    { title: 'Client Management', icon: 'assets/admin-dashboard/admin-client.png', route: 'admin-client-management', rounded: true },
    { title: 'User Management', icon: 'assets/admin-dashboard/admin-user.jpeg', route: 'admin-user-management', rounded: true },
    { title: 'Project Management', icon: 'assets/admin-dashboard/admin-asset.png', route: 'admin-asset-management', rounded: false },
    { title: 'Master Data', icon: 'assets/admin-dashboard/admin-data.png', route: 'admin-master-data-management', rounded: false },
    { title: 'Payments & Invoices', icon: 'assets/admin-dashboard/admin-payment.jpeg', route: 'admin-payment-invoice', rounded: true },
    { title: 'Support', icon: 'assets/admin-dashboard/admin-support.png', route: 'admin-support', rounded: false }
  ];

  constructor(private router: Router) { }

  navigate(route: string) {
    this.router.navigate(['/admin-dashboard', route]);
  }
}