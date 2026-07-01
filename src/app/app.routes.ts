import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // ── Public: auth pages wrap inside AuthLayout ──
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ── Protected: all guarded pages wrap inside MainLayout ──
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'expenses',
        loadChildren: () => import('./features/expenses/expenses.routes').then(m => m.EXPENSES_ROUTES),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories').then(m => m.CategoriesComponent)
      },
      {
        path: 'budgets',
        loadChildren: () => import('./features/budgets/budgets.routes').then(m => m.BUDGETS_ROUTES),      
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent)
      }
    ]
  },

  { path: '**', redirectTo: '/auth/login' }
];
