import { Component, OnInit } from '@angular/core';
import { AdminDataService } from '../../services/admin-data.service';
import { Client as DBClient } from '../../../core/models/ui/client.model';
import { User } from '../../../core/models/ui/user.model';
import { Router } from '@angular/router';


interface UIClient extends DBClient {
  name: string;
  location: string;
  admin: string;
  totalAssets: number;
  closedAssets: number;
  subscriptions: number;
  isActive: boolean;
  assets: File[];
  id: number;
}

@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent implements OnInit {
  clients: UIClient[] = [];
  filteredClients: UIClient[] = [];
  newClient: UIClient = this.getEmptyClient();

  activeTab: 'all' | 'active' | 'inactive' = 'all';
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 4;
  showAddClientPanel = false;
  uniqueAdminUsernames: string[] = [];
  sortConfig: { key: keyof UIClient; direction: 'asc' | 'desc' } = { key: 'name', direction: 'asc' };

  constructor(
  private adminDataService: AdminDataService,
  private router: Router
) {}


  ngOnInit(): void {
    this.fetchClientsAndUsers();
  }

  private getEmptyClient(): UIClient {
    return {
      sno: 0,
      clientname: '',
      state: '',
      clientnameforuser: '',
      address: '',
      gstin: '',
      gstadded: false,
      clientid: 0,

      name: '',
      location: '',
      admin: '',
      totalAssets: 0,
      closedAssets: 0,
      subscriptions: 0,
      isActive: false,
      assets: [],
      id: 0
    };
  }

  fetchClientsAndUsers(): void {
    this.adminDataService.getClients().subscribe((clients: DBClient[]) => {
      this.adminDataService.getUsers().subscribe((users: User[]) => {
        this.uniqueAdminUsernames = Array.from(
          new Set(users.map(u => u.username || `${u.firstName} ${u.lastName}`))
        );

        this.clients = clients.map(client => {
          const matchedUsers = users.filter(u => u.clientId === client.clientid);
          const adminNames = matchedUsers.map(u => u.username || `${u.firstName} ${u.lastName}`).join(', ');

          return {
            ...client,
            name: client.clientname,
            location: client.state,
            admin: adminNames,
            totalAssets: 0,
            closedAssets: 0,
            subscriptions: 0,
            isActive: client.gstadded,
            assets: [],
            id: client.clientid
          };
        });

        this.filterClients();
      });
    });
  }

  addClient(): void {
    this.newClient = this.getEmptyClient();
    this.showAddClientPanel = true;
  }

  editClient(client: UIClient): void {
    this.newClient = { ...client };
    this.showAddClientPanel = true;
  }

  deleteClient(client: UIClient): void {
    const confirmed = confirm(`Are you sure you want to delete client "${client.name}"?`);
    if (!confirmed) return;

    this.adminDataService.deleteClient(client.id).subscribe({
      next: () => this.fetchClientsAndUsers(),
      error: err => {
        console.error('Failed to delete client:', err);
        alert('Deletion failed. Check console.');
      }
    });
  }

  toggleClientStatus(client: UIClient): void {
    client.isActive = !client.isActive;
    this.filterClients();
  }

  submitNewClient(): void {
    const payload: Partial<DBClient> = {
      clientname: this.newClient.name,
      state: this.newClient.location,
      clientnameforuser: '',
      address: '',
      gstin: '',
      gstadded: this.newClient.isActive
    };

    if (this.newClient.id === 0) {
      this.adminDataService.createClient(payload as Omit<DBClient, 'sno' | 'clientid'>).subscribe({
        next: () => {
          this.fetchClientsAndUsers();
          this.closeSidebar();
        },
        error: err => {
          console.error('Create client failed:', err);
          alert('Failed to add client. Check console.');
        }
      });
    } else {
      this.adminDataService.updateClient(this.newClient.id, payload).subscribe({
        next: () => {
          this.fetchClientsAndUsers();
          this.closeSidebar();
        },
        error: err => {
          console.error('Update client failed:', err);
          alert('Failed to update client. Check console.');
        }
      });
    }
  }

  closeSidebar(): void {
    this.showAddClientPanel = false;
    this.newClient = this.getEmptyClient();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.currentPage = 1;
    this.filterClients();
  }

  onTabChange(tab: 'all' | 'active' | 'inactive'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filterClients();
  }

  filterClients(): void {
    let filtered = [...this.clients];

    if (this.activeTab === 'active') {
      filtered = filtered.filter(client => client.isActive);
    } else if (this.activeTab === 'inactive') {
      filtered = filtered.filter(client => !client.isActive);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.location.toLowerCase().includes(term) ||
        client.admin.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[this.sortConfig.key];
      let bVal = b[this.sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      return aVal < bVal
        ? this.sortConfig.direction === 'asc' ? -1 : 1
        : aVal > bVal
          ? this.sortConfig.direction === 'asc' ? 1 : -1
          : 0;
    });

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredClients = filtered.slice(startIndex, startIndex + this.itemsPerPage);

    const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = 1;
      this.filterClients();
    }
  }

  sortBy(key: keyof UIClient): void {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'asc';
    }
    this.filterClients();
  }

  getSortIcon(key: keyof UIClient): string {
    return 'assets/admin-dashboard/admin-reorder.png';
  }

  getStartIndex(): number {
    return this.getTotalFilteredItems() === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return Math.min(end, this.getTotalFilteredItems());
  }

  getTotalFilteredItems(): number {
    return this.getFilteredClientsBeforePagination().length;
  }

  getFilteredClientsBeforePagination(): UIClient[] {
    let filtered = [...this.clients];

    if (this.activeTab === 'active') {
      filtered = filtered.filter(client => client.isActive);
    } else if (this.activeTab === 'inactive') {
      filtered = filtered.filter(client => !client.isActive);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.location.toLowerCase().includes(term) ||
        client.admin.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  getTotalPages(): number {
    return Math.ceil(this.getTotalFilteredItems() / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.filterClients();
    }
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  }
 navigateToAssetManagement(client: UIClient): void {
  this.router.navigate([
    'admin-asset-management',
    client.clientid,
    'survey'
  ], {
    relativeTo: this.router.routerState.root.firstChild
  });
}

  exportClient(client: UIClient): void {
    // Placeholder for export logic — use your own implementation
    console.log('Exporting client:', client);
  }

}
