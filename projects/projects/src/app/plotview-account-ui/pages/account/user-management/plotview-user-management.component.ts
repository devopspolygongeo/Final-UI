import { Component, OnInit } from '@angular/core';
import { AdminDataService } from '../../../../admin-ui/services/admin-data.service';



/* ---------- Interfaces ---------- */
interface Project {
  id: number;
  name: string;
}


interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;

  // 🔥 MUST MATCH DB COLUMN
  projectaccess: number[];

  access: 'Full' | 'Limited';
}


/* ---------- Component ---------- */

@Component({
  selector: 'app-plotview-user-management',
  templateUrl: './plotview-user-management.component.html',
  styleUrls: ['./plotview-user-management.component.css']
})
export class PlotviewUserManagementComponent implements OnInit {

    constructor(private adminDataService: AdminDataService) {}


  /* ---------- Mock Projects (later replace with API) ---------- */
  /* ---------- Projects from DB ---------- */
projects: Project[] = [];



  /* ---------- Users ---------- */
  users: User[] = [
  {
    id: 1,
    name: 'Rayapati Rajasekhar',
    email: 'raja@polygongeo.com',
    phone: '9490442662',
    role: 'Organization Admin Account Owner',
    projectaccess: [1, 2],
    access: 'Full'
  },
  {
    id: 2,
    name: 'Rayapati Rajasekhar',
    email: 'raja1@polygongeo.com',
    phone: '9490442662',
    role: 'Asset Manager',
    projectaccess: [1],
    access: 'Limited'
  }
];



  filteredUsers: User[] = [];
  currentUser: User = this.createEmptyUser();
  showEditUserPanel = false;

  /* ---------- Lifecycle ---------- */
  ngOnInit(): void {
  this.filteredUsers = [...this.users];
  this.loadProjects();
}

loadProjects(): void {
  this.adminDataService.getProjects().subscribe({
    next: (projects: Project[]) => {

      this.projects = projects;
      console.log('✅ Projects loaded from DB:', projects);
    },
    error: (err) => {
      console.error('❌ Failed to load projects', err);
    }
  });
}

  /* ---------- Role Check ---------- */
  isAdminRole(): boolean {
    return this.currentUser.role === 'Organization Admin Account Owner';
  }

  /* ---------- Helpers ---------- */
  createEmptyUser(): User {
    return {
      id: 0,
      name: '',
      email: '',
      phone: '',
      role: '',
      projectaccess: [],

      access: 'Limited',
      
    };
  }

  isEditMode(): boolean {
    return this.currentUser.id !== 0;
  }

  /* ---------- Actions ---------- */
  openAddUser(): void {
    this.currentUser = this.createEmptyUser();
    this.showEditUserPanel = true;
  }

  editUser(user: User): void {
  this.currentUser = {
    ...user,
    projectaccess: [...(user.projectaccess || [])]
  };
  this.showEditUserPanel = true;
}



  deleteUser(user: User): void {
    this.users = this.users.filter(u => u.id !== user.id);
    this.filteredUsers = [...this.users];
  }

  toggleUserAccess(user: User): void {
    user.access = user.access === 'Full' ? 'Limited' : 'Full';
  }

  closeSidebar(): void {
    this.showEditUserPanel = false;
    this.currentUser = this.createEmptyUser();
  }

  /* ---------- Save ---------- */
  submitUserChanges(): void {

    // 🔒 Non-admin → no project access
    

    if (this.currentUser.id === 0) {
      const newId = Math.max(...this.users.map(u => u.id), 0) + 1;
      this.currentUser.id = newId;
      this.users.push({ ...this.currentUser });
    } else {
      const index = this.users.findIndex(u => u.id === this.currentUser.id);
      if (index > -1) {
        this.users[index] = { ...this.currentUser };
      }
    }

    this.filteredUsers = [...this.users];
    this.closeSidebar();
  }
  toggleCurrentUserAccess(): void {
  this.currentUser.access =
    this.currentUser.access === 'Full' ? 'Limited' : 'Full';
}
getProjectNameById(projectId: number): string {
  const project = this.projects.find(p => p.id === projectId);
  return project ? project.name : '';
}

}
