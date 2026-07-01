// src/app/core/models/expense.model.ts

export interface Expense {
  id: string;              // UUID
  title: string;
  description: string;
  amount: number;
  createdAt: string;       // ISO date-time
  updatedAt: string;       // ISO date-time
  categoryId: string;      // UUID
  categoryName: string;
}

export interface ExpenseRequest {
  title: string;
  description: string;
  amount: number;
  categoryId: string;
}

// Spring Data Page<T> response shape
export interface Page<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;          // current page index (0-based)
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}