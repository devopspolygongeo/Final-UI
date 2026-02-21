import { Component } from '@angular/core';

@Component({
    selector: 'app-plotview-account-settings',
    templateUrl: './plotview-account-settings.component.html',
    styleUrls: ['./plotview-account-settings.component.css']
})
export class PlotviewAccountSettingsComponent {
    activeComponent: string = 'profile';
    userName: string = 'Rayapati Rajasekhar';

    setActiveComponent(component: string) {
        this.activeComponent = component;
    }
}
