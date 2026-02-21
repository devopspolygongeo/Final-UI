import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PlotviewLayoutComponent } from './components/layout/plotview-layout.component';
import { PlotviewDashboardComponent } from './components/plotview-dashboard/plotview-dashboard.component'
import { PlotviewAssetsComponent } from './pages/assets/plotview-assets.component';
import { PlotviewBasicDetailsComponent } from './pages/assets/basicdetails/plotview-basic-details.component';
import { PlotviewPlotDetailsComponent } from './pages/assets/plotdetails/plotview-plot-details.component';
import { PlotviewProximityComponent } from './pages/assets/proximity/plotview-proximity.component';
import { PlotviewGalleryComponent } from './pages/assets/gallery/plotview-gallery.component';
import { PlotviewDocumentsComponent } from './pages/assets/documents/plotview-documents.component';
import { PlotviewLeadManagementComponent } from './pages/assets/lead-management/plotview-lead-management.component';
import { PlotViewSubscriptionComponent } from './pages/subscription/plotview-subscription.component';
import { PlotviewInvoicesComponent } from './pages/invoices/plotview-invoices.component';
import { PlotviewSupportComponent } from './pages/support/plotview-support.component';
const routes: Routes = [
    {
        path: '',
        component: PlotviewLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: PlotviewDashboardComponent },
            {
                path: 'assets',
                component: PlotviewAssetsComponent,
                children: [
                    { path: '', redirectTo: 'basicdetails', pathMatch: 'full' },
                    { path: 'basicdetails', component: PlotviewBasicDetailsComponent },
                    { path: 'plotdetails', component: PlotviewPlotDetailsComponent },
                    { path: 'proximity', component: PlotviewProximityComponent },
                    { path: 'gallery', component: PlotviewGalleryComponent },
                    { path: 'documents', component: PlotviewDocumentsComponent },
                    { path: 'lead-management', component: PlotviewLeadManagementComponent }
                ]
            },
            { path: 'subscription', component: PlotViewSubscriptionComponent },
            { path: 'invoices', component: PlotviewInvoicesComponent },
            {
                path: 'support',
                component: PlotviewSupportComponent
            },
            {
                path: 'account',
                loadChildren: () =>
                    import('./pages/account/account-settings.module').then(
                        (m) => m.PlotviewAccountSettingsModule
                    )
            }




        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PlotviewAccountUiRoutingModule { }
