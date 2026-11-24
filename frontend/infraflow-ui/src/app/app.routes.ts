import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'catalog',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/catalog/catalog').then(m => m.Catalog),
  },
  {
    path: 'approvals',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/approvals/approvals').then(m => m.Approvals),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
