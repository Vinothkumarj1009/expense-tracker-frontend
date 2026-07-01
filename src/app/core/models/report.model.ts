// src/app/core/models/report.model.ts

export interface MonthlySummary {
  month: number;
  year: number;
  totalSpent: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
}

export interface BudgetComparison {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
}