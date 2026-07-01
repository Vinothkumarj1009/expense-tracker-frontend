// src/app/features/budgets/budgets.routes.ts

import { Routes } from '@angular/router';

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budget-list/budget-list').then(m => m.BudgetListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./budget-form/budget-form').then(m => m.BudgetFormComponent),
  },
  // No 'edit/:id' route — API has no PUT /budgets/{id}.
];