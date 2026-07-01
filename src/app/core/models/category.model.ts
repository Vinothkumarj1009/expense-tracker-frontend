// src/app/core/models/category.model.ts

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;          // UUID
  name: string;
  type: CategoryType;
}

export interface CategoryRequest {
  name: string;
  type: CategoryType;
}