import { Component } from '@angular/core';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css']
})
export class AccountSettingsComponent {
  activeComponent: string = 'profile';
  userName: string = 'Rayapati Rajasekhar';

  setActiveComponent(component: string) {
    this.activeComponent = component;
  }
}