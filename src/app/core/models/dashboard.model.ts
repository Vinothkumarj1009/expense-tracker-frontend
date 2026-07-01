export interface DashboardSummary {
  totalExpenses: number;
  totalBudget: number;
  remainingBudget: number;
  expenseCount: number;
  topCategories: TopCategory[];
  recentExpenses: RecentExpense[];
}

export interface TopCategory {
  categoryId: string;       // UUID
  categoryName: string;
  amount: number;
  percentage?: number;      // computed client-side — not from API
  color?: string;           // assigned client-side
}

export interface RecentExpense {
  id: string;               // UUID
  title: string;
  amount: number;
  categoryName: string;
  createdAt: string;        // ISO date-time
}