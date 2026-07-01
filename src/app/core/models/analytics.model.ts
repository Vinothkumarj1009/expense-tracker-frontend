// src/app/core/models/analytics.model.ts

export interface TopCategory {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
}

export interface MonthlyTrend {
  month: number;       // 1–12
  totalAmount: number;
}

export interface CategoryTrend {
  month: number;       // 1–12
  amount: number;
}

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
}

export interface BiggestExpense {
  expenseId: string;
  title: string;
  categoryName: string;
  amount: number;
  createdAt: string;   // ISO date-time
}