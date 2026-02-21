import { Component } from "@angular/core";
import { Router } from '@angular/router';

type NavItem = { name: string, active: boolean };
@Component({
    selector: 'assets-component',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.css'],
  })

  export class UsersComponent {
    constructor(private router: Router) {}
    activeTab: string = 'profile';

    setActiveTab(tabName: string) {
      this.activeTab = tabName;
    }
    
  }