import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminUiRoutingModule } from './admin-ui-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ClientManagementComponent } from './pages/client-management/client-management.component'; // optional layout
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AssetManagementComponent } from './pages/asset-management/asset-management.component';
import { PaymentInvoiceComponent } from './pages/payment-invoice/payment-invoice.component';
import { SupportComponent } from './pages/support/support.component';
import { SurveyComponent } from './pages/asset-management/survey/survey.component';

@NgModule({
    declarations: [AdminLayoutComponent, AdminLayoutComponent, ClientManagementComponent, DashboardComponent, UserManagementComponent, AssetManagementComponent, PaymentInvoiceComponent, SupportComponent,SurveyComponent],
    imports: [
        FormsModule,
        CommonModule,
        RouterModule,
        AdminUiRoutingModule,
        MatSidenavModule,
        MatListModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
      
        
    ],
})
export class AdminUiModule { }
