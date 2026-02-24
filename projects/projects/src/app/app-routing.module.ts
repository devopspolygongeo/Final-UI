import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/pages/dashboard.component';

const routes: Routes = [
  // Default route → login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // ✅ Public share route (no login)
  {
    path: 'share/:token',
    component: DashboardComponent,
  },

  // Login module
  /*{
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then(
        (m) => m.LoginModule
      ),
  },*/

  // Admin UI (Dashboard + admin pages)
  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./admin-ui/admin-ui.module').then((m) => m.AdminUiModule),
  },

  // Plotview Account UI
  {
    path: 'plotview-account-ui',
    loadChildren: () =>
      import('./plotview-account-ui/plotview-account-ui.module').then(
        (m) => m.PlotviewAccountUiModule,
      ),
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
