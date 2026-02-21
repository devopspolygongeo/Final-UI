import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { authGuard } from '../core/guards/auth-guard';
import { AddAssetsComponent } from './components/add-assets/add-assets.component';
import { AssetsComponent } from './components/assets/add-assets.component';
import { SubscriptionComponent } from './components/subscription/subscription.components'
import { InvoicesComponent } from './components/invoices/invoice.components';
import { SupportComponent } from './components/support/support.components';
import { UsersComponent } from './components/user/user.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: 'addAssets', component: AddAssetsComponent},
      { path: 'assets', component: AssetsComponent },
      { path: 'subscriptions', component: SubscriptionComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'support', component: SupportComponent },
      { path: 'user', component: UsersComponent },
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
