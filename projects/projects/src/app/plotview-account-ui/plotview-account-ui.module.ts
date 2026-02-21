import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { PlotviewAccountUiRoutingModule } from './plotview-account-ui-routing.module';
import { PlotviewDashboardComponent } from './components/plotview-dashboard/plotview-dashboard.component';
import { PlotviewAssetsComponent } from './pages/assets/plotview-assets.component';
import { PlotviewLayoutComponent } from './components/layout/plotview-layout.component';
import { PlotviewBasicDetailsComponent } from './pages/assets/basicdetails/plotview-basic-details.component';
import { FormsModule } from '@angular/forms';
import { PlotviewPlotDetailsComponent } from './pages/assets/plotdetails/plotview-plot-details.component';
import { PlotviewProximityComponent } from './pages/assets/proximity/plotview-proximity.component';
import { PlotviewGalleryComponent } from './pages/assets/gallery/plotview-gallery.component';
import { PlotviewDocumentsComponent } from './pages/assets/documents/plotview-documents.component';
import { PlotviewLeadManagementComponent } from './pages/assets/lead-management/plotview-lead-management.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PlotViewSubscriptionComponent } from './pages/subscription/plotview-subscription.component';
import { PlotviewInvoicesComponent } from './pages/invoices/plotview-invoices.component';
import { PlotviewSupportComponent } from './pages/support/plotview-support.component';
import { DashboardModule } from '../dashboard/dashboard.module';

@NgModule({
    declarations: [
        PlotviewDashboardComponent,
        PlotviewAssetsComponent,
        PlotviewLayoutComponent,
        PlotviewBasicDetailsComponent,
        PlotviewPlotDetailsComponent,
        PlotviewProximityComponent,
        PlotviewGalleryComponent,
        PlotviewDocumentsComponent,
        PlotviewLeadManagementComponent,
        PlotViewSubscriptionComponent,
        PlotviewInvoicesComponent,
        PlotviewSupportComponent,
        // Add more components here
    ],
    imports: [
        CommonModule,
        PlotviewAccountUiRoutingModule,
        MatTabsModule,
        FormsModule,
        ReactiveFormsModule,
        DashboardModule, 
    ]
})
export class PlotviewAccountUiModule { }
