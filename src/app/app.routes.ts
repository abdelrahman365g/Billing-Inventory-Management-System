import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/pages/companies/companies.component').then(
            (m) => m.CompaniesComponent,
          ),
      },
      {
        path: 'units',
        loadComponent: () =>
          import('./features/units/pages/units/units.component').then((m) => m.UnitsComponent),
      },
      {
        path: 'types',
        loadComponent: () =>
          import('./features/types/pages/types/types.component').then((m) => m.TypesComponent),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/pages/clients/clients.component').then(
            (m) => m.ClientsComponent,
          ),
      },
      {
        path: 'items',
        loadComponent: () =>
          import('./features/items/pages/items/items.component').then((m) => m.ItemsComponent),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/pages/invoice-create/invoice-create.component').then(
            (m) => m.InvoiceCreateComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/pages/sales-report/sales-report.component').then(
            (m) => m.SalesReportComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/pages/payment-create/payment-create.component').then(
            (m) => m.PaymentCreateComponent,
          ),
      },
      {
        path: 'not-found',
        loadComponent: () =>
          import('./features/static-pages/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'not-found' },
];
