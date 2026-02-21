import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ClientManagementComponent } from './pages/client-management/client-management.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AssetManagementComponent } from './pages/asset-management/asset-management.component';
import { PaymentInvoiceComponent } from './pages/payment-invoice/payment-invoice.component';
import { SupportComponent } from './pages/support/support.component';
import { AccountSettingsModule } from './pages/account-settings/account-settings.module';
import { SurveyComponent } from './pages/asset-management/survey/survey.component';
const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        children: [
            { path: '', component: DashboardComponent },
            { path: 'admin-client-management', component: ClientManagementComponent },
            { path: 'admin-user-management', component: UserManagementComponent },
            {
                path: 'admin-asset-management',
                children: [
                    { path: '', component: AssetManagementComponent },
                    {
                        path: 'details/:surveyId',
                        loadChildren: () => import('./pages/asset-management/asset-detail/asset-detail.module')
                            .then(m => m.AssetDetailModule)
                    },
                    {
                        path: ':id/survey',
                        component: SurveyComponent
                    },
                    {
                        path: ':id/survey/:name',
                        component: SurveyComponent
                    }


                ]
            },
            {
                path: 'admin-payment-invoice',
                component: PaymentInvoiceComponent
            },
            {
                path: 'admin-support',
                component: SupportComponent
            },
            {
                path: 'admin-account-settings',
                loadChildren: () =>
                    import('./pages/account-settings/account-settings.module').then(m => m.AccountSettingsModule),
            }

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminUiRoutingModule { }