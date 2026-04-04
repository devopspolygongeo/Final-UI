import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/pages/dashboard.component';
import { LoginComponent } from './login/pages/login.component';
import { authGuard } from './core/guards/auth-guard';

const routes: Routes = [
  // Default route → login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // Login route
  {
    path: 'login',
    component: LoginComponent,
  },

  // Main dashboard
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },

  // Public share route (no login)
  {
    path: 'share/:token',
    component: DashboardComponent,
  },

  // Admin UI
  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./admin-ui/admin-ui.module').then((m) => m.AdminUiModule),
    canActivate: [authGuard],
  },

  // Plotview Account UI
  {
    path: 'plotview-account-ui',
    loadChildren: () =>
      import('./plotview-account-ui/plotview-account-ui.module').then(
        (m) => m.PlotviewAccountUiModule,
      ),
    canActivate: [authGuard],
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
