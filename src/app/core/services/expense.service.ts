// src/app/core/services/expense.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseRequest, Page } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/expenses`;

  getPage(page: number, size: number): Observable<Page<Expense>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<Expense>>(this.base, { params });
  }

  getById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.base}/${id}`);
  }

  create(payload: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.base, payload);
  }

  update(id: string, payload: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}