// src/app/features/expenses/expenses.routes.ts

import { Routes } from '@angular/router';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./expense-list/expense-list').then(m => m.ExpenseListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./expense-form/expense-form').then(m => m.ExpenseFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./expense-form/expense-form').then(m => m.ExpenseFormComponent),
  },
];