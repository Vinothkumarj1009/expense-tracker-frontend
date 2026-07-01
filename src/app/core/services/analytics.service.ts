// src/app/core/services/analytics.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TopCategory,
  MonthlyTrend,
  CategoryTrend,
  BudgetAlert,
  BiggestExpense,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analytics`;

  getTopCategories(): Observable<TopCategory[]> {
    return this.http.get<TopCategory[]>(`${this.base}/top-categories`);
  }

  getMonthlyTrend(year: number): Observable<MonthlyTrend[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<MonthlyTrend[]>(`${this.base}/monthly-trend`, { params });
  }

  getCategoryTrend(categoryId: string, year: number): Observable<CategoryTrend[]> {
    const params = new HttpParams().set('categoryId', categoryId).set('year', year);
    return this.http.get<CategoryTrend[]>(`${this.base}/category-trend`, { params });
  }

  getBudgetAlerts(month: number, year: number): Observable<BudgetAlert[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<BudgetAlert[]>(`${this.base}/budget-alerts`, { params });
  }

  getBiggestExpenses(limit: number): Observable<BiggestExpense[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<BiggestExpense[]>(`${this.base}/biggest-expenses`, { params });
  }
}