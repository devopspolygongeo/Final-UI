// user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminDataService } from '../../services/admin-data.service';
import { User } from '../../../core/models/ui/user.model';
import { Client } from '../../../core/models/ui/client.model';
import { UserType } from '../../../core/models/ui/usertype.model';

type SortableUserField =
    | 'sno'
    | 'username'
    | 'clientName'
    | 'designation'
    | 'email'
    | 'contact'
    | 'role';

@Component({
    selector: 'app-user-management',
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
    currentPage = 1;
    itemsPerPage = 10;

    users: (User & { clientName?: string; username?: string; roleName?: string })[] = [];
    displayedUsers: typeof this.users = [];
    currentTab: 'all' | 'ongoing' | 'closed' = 'all';
    sortConfig: { key: SortableUserField; direction: 'asc' | 'desc' } = {
        key: 'username',
        direction: 'asc',
    };

    showUserPanel = false;
    isEditMode = false;
    editingUserId: number | null = null;
    clients: Client[] = [];
    userTypes: UserType[] = [];
    projects: any[] = [];

    // STEP 1 – UI support only
loggedInUserRole: number = 1;   // TEMP: assume admin
//projects: any[] = [];           // TEMP: empty project list


    newUser: any = {
        sno: 0,
        userid: 0,
        clientId: 0,
        role: 0,
        firstName: '',
        lastName: '',
        contact: '',
        email: '',
        designation: '',
        projectAccess: [] as number[],

        password: '',
        profilePhoto: '',
    };

    constructor(private adminDataService: AdminDataService) { }

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    async loadData(): Promise<void> {
        try {
            const [users, clients, userTypes, projects] = await Promise.all([
  this.adminDataService.getUsers().toPromise(),
  this.adminDataService.getClients().toPromise(),
  this.adminDataService.getUserTypes().toPromise(),
  this.adminDataService.getProjects().toPromise(),   // 👈 ADD THIS
]);

this.projects = projects ?? [];   // 👈 ADD THIS

            //  console.log('Loaded users with sno:', this.users.map(u => u.sno));

            this.clients = clients ?? [];
            this.userTypes = userTypes ?? [];

            this.users = (users ?? []).map((user) => {
                const firstName = user.firstName || '';
                const lastName = user.lastName || '';
                const client = this.clients.find((c) => c.sno == user.clientId);
                const userType = this.userTypes.find((t) => t.usertypeid == user.role);

                return {
                    ...user,
                    sno: user.sno, // 👈 this line is key
                    username: `${firstName} ${lastName}`.trim(),
                    clientName: client ? client.clientname : 'Unknown',
                    roleName: userType ? userType.usertypename : 'Unknown Role',
                };
            });


            this.updateDisplayedUsers();
        } catch (err) {
            console.error('Failed to load user/client/usertype data', err);
        }
    }

    switchTab(tab: 'all' | 'ongoing' | 'closed'): void {
        this.currentTab = tab;
        this.currentPage = 1;
        this.updateDisplayedUsers();
    }

    updateDisplayedUsers(): void {
        let filteredUsers = [...this.users];
        filteredUsers = this.applySorting(filteredUsers);

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.displayedUsers = filteredUsers.slice(startIndex, endIndex);
    }

    applySorting(users: typeof this.users): typeof this.users {
        return users.sort((a, b) => {
            const aVal = this.getSortValue(a, this.sortConfig.key);
            const bVal = this.getSortValue(b, this.sortConfig.key);
            if (aVal === bVal) return 0;
            return aVal < bVal
                ? this.sortConfig.direction === 'asc' ? -1 : 1
                : this.sortConfig.direction === 'asc' ? 1 : -1;
        });
    }

    private getSortValue(user: any, key: string): string {
        switch (key) {
            case 'username': return user.username || '';
            case 'clientName': return user.clientName || '';
            default: return user[key] || '';
        }
    }

    sortData(key: SortableUserField): void {
        this.sortConfig.key === key
            ? (this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc')
            : (this.sortConfig = { key, direction: 'asc' });
        this.updateDisplayedUsers();
    }

    getSortIcon(key: SortableUserField): string {
        // In the future, you can return dynamic icons for different sort directions
        return 'assets/admin-dashboard/admin-reorder.png';
    }

    getTotalUsers(): number {
        return this.users.length;
    }

    getTotalPages(): number {
        return Math.ceil(this.getTotalUsers() / this.itemsPerPage);
    }

    getStartIndex(): number {
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.itemsPerPage, this.getTotalUsers());
    }

    getPageNumbers(): (number | string)[] {
        const totalPages = this.getTotalPages();
        const maxPages = 5;
        const pages: (number | string)[] = [];

        if (totalPages <= maxPages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const start = Math.max(1, this.currentPage - 2);
            const end = Math.min(totalPages, this.currentPage + 2);
            if (start > 1) pages.push(1, '...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages) pages.push('...', totalPages);
        }

        return pages;
    }

    navigateToPage(page: number): void {
        this.currentPage = page;
        this.updateDisplayedUsers();
    }

    openUserPanel(): void {
        this.showUserPanel = true;
        this.isEditMode = false;
        this.editingUserId = null;
        this.resetNewUser();
    }

    closeUserPanel(): void {
        this.showUserPanel = false;
        this.isEditMode = false;
        this.editingUserId = null;
        this.resetNewUser();
    }

    resetNewUser(): void {
  this.newUser = {
    sno: 0,
    userid: 0,
    clientId: null,
    role: null,                 // 👈 IMPORTANT
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    designation: '',
    projectAccess: [],           // 👈 MUST BE ARRAY
    password: '',
    profilePhoto: ''
  };
}

    editUser(user: any): void {
        this.showUserPanel = true;
        this.isEditMode = true;
        this.editingUserId = user.userid || user.id;

        this.newUser = {
            ...user,
            firstName: user.firstName,
            lastName: user.lastName,
            contact: user.contact,
            email: user.email,
            designation: user.designation,
            clientId: user.clientId,
            role: user.role,

            projectAccess: user.projectAccess
    ? user.projectAccess.split(',').map((id: string) => +id)
    : [],
            sno: user.sno,
            userid: user.userid,
            password: '', // Optional: clear password
            profilePhoto: user.profilePhoto ?? ''
        };
    }


    async submitUser(): Promise<void> {
        console.log(
  'Before submit projectAccess:',
  this.newUser.projectAccess,
  Array.isArray(this.newUser.projectAccess)
);

        try {
            const payload = { ...this.newUser };

            // STEP 1 FIX: convert projectAccess array to string
payload.projectAccess = Array.isArray(payload.projectAccess)
  ? payload.projectAccess.join(',')
  : '';


            if (!this.isEditMode) {
                delete payload.sno;
                delete payload.userid;
            }
            console.log('Updated user payload:', payload);
            console.log('Editing ID:', this.editingUserId);

            if (this.isEditMode && this.editingUserId !== null) {
                await this.adminDataService.updateUser(this.editingUserId, payload).toPromise();

            } else {
                const res = await this.adminDataService.createUser(payload).toPromise();
                const newId = res?.userid || res?.user?.userid;
                if (newId) {
                    this.newUser.userid = newId;
                    this.newUser.sno = newId;
                }
            }

            await this.loadData();
            this.closeUserPanel();
        } catch (error) {
            console.error('Submit failed:', error);
        }
    }



    getClientName(clientId: number): string {
        const client = this.clients.find(c => c.sno === clientId);
        return client ? client.clientname : 'Unknown Client';
    }

    deleteUser(user: any): void {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`);

        if (!confirmDelete) return;

        this.adminDataService.deleteUser(user.userid || user.id).subscribe({
            next: async () => {
                console.log('User deleted:', user.userid || user.id);

                // Reload from backend
                await this.loadData();

                // Optional: show a simple alert or toast
                alert('User deleted successfully');
            },
            error: (err) => {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user. Please try again.');
            }
        });
    }

}
