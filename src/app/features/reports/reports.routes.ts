// src/app/features/reports/reports.routes.ts

import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'monthly-summary',
    pathMatch: 'full',
  },
  {
    path: 'monthly-summary',
    loadComponent: () =>
      import('./monthly-summary/monthly-summary').then(m => m.MonthlySummaryComponent),
  },
  {
    path: 'budget-comparison',
    loadComponent: () =>
      import('./budget-comparison/budget-comparison').then(m => m.BudgetComparisonComponent),
  },
];