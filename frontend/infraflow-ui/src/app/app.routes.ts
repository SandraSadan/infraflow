import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/portal-layout/portal-layout').then(
        (m) => m.PortalLayout,
      ),
    children: [
      {
        path: 'catalog',
        loadComponent: () =>
          import('./pages/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'catalog/request',
        loadComponent: () =>
          import('./pages/catalog/vm-request/vm-request').then(
            (m) => m.VmRequest,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests').then((m) => m.Requests),
      },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./pages/approvals/approvals').then((m) => m.Approvals),
      },
      {
        path: '',
        redirectTo: 'catalog',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
