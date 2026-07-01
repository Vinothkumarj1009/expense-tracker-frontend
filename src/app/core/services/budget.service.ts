// src/app/core/services/budget.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Budget, BudgetRequest } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/budgets`;

  // No update() — API has no PUT /budgets/{id}, budgets are create/delete only.

  getAll(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.base);
  }

  getById(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.base}/${id}`);
  }

  create(payload: BudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.base, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}