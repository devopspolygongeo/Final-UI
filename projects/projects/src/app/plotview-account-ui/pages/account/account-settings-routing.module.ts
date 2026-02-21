import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlotviewAccountSettingsComponent } from './plotview-account-settings.component';

const routes: Routes = [
    {
        path: '',
        component: PlotviewAccountSettingsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountSettingsRoutingModule { }
