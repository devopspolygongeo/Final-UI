import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AccountSettingsRoutingModule } from './account-settings-routing.module';
import { PlotviewAccountSettingsComponent } from './plotview-account-settings.component';
import { PlotviewProfileComponent } from './profile/plotview-profile.component';
import { PlotviewChangePasswordComponent } from './change-password/plotview-change-password.component';
import { PlotviewOrganizationDetailsComponent } from './organization-details/plotview-organization-details.component';
import { PlotviewUserManagementComponent } from './user-management/plotview-user-management.component';

@NgModule({
    declarations: [
        PlotviewAccountSettingsComponent,
        PlotviewProfileComponent,
        PlotviewChangePasswordComponent,
        PlotviewOrganizationDetailsComponent,
        PlotviewUserManagementComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        AccountSettingsRoutingModule // ✅ THIS WAS MISSING
    ]
})
export class PlotviewAccountSettingsModule { }
