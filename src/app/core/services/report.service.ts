// src/app/core/services/report.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonthlySummary, CategorySummary, BudgetComparison } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  private monthYearParams(month: number, year: number): HttpParams {
    return new HttpParams().set('month', month).set('year', year);
  }

  getMonthlySummary(month: number, year: number): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${this.base}/monthly-summary`, {
      params: this.monthYearParams(month, year),
    });
  }

  getCategorySummary(month: number, year: number): Observable<CategorySummary[]> {
    return this.http.get<CategorySummary[]>(`${this.base}/category-summary`, {
      params: this.monthYearParams(month, year),
    });
  }

  getBudgetComparison(month: number, year: number): Observable<BudgetComparison[]> {
    return this.http.get<BudgetComparison[]>(`${this.base}/budget-comparison`, {
      params: this.monthYearParams(month, year),
    });
  }
}