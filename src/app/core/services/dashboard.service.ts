import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard`).pipe(
      map(d => {
        // Compute percentage client-side — API does not return it
        const total = d.topCategories.reduce((sum, c) => sum + c.amount, 0);
        return {
          ...d,
          topCategories: d.topCategories.map(c => ({
            ...c,
            percentage: total > 0 ? (c.amount / total) * 100 : 0,
          })),
        };
      })
    );
  }
}