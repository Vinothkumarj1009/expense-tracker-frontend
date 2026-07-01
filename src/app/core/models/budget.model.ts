// src/app/core/models/budget.model.ts

export interface Budget {
  id: string;              // UUID
  categoryId: string;      // UUID
  categoryName: string;
  amount: number;
  month: number;            // 1–12
  year: number;
  createdAt: string;        // ISO date-time
  updatedAt: string;        // ISO date-time
}

export interface BudgetRequest {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
}

// Grouped view used by the list page
export interface BudgetGroup {
  year: number;
  month: number;
  label: string;            // e.g. "June 2026"
  budgets: Budget[];
  totalAmount: number;
}