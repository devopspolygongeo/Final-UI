import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {

  constructor(public router: Router) { }

  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  navigateToAccount() {
    this.dropdownOpen = false;
    this.router.navigate(['/admin-dashboard/admin-account-settings']);
  }


  isActiveRoute(path: string): boolean {
    return this.router.url === path;
  }
  activeItem = 'Dashboard';
  sidebarOpen = true;

  setActive(item: string) {
    this.activeItem = item;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}