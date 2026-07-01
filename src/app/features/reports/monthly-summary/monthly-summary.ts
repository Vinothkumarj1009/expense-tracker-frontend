// src/app/features/reports/monthly-summary/monthly-summary.ts

import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  AfterViewInit, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { ReportService } from '../../../core/services/report.service';
import { MonthlySummary, CategorySummary } from '../../../core/models/report.model';
import { MonthYearPickerComponent } from '../../../shared/components/month-year-picker/month-year-picker';

Chart.register(...registerables);

const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MonthYearPickerComponent,
  ],
  template: `
    <div class="reports-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-subtitle">Monthly spending breakdown</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="report-tabs">
        <a routerLink="/reports/monthly-summary" routerLinkActive="active" class="tab-link">
          Monthly Summary
        </a>
        <a routerLink="/reports/budget-comparison" routerLinkActive="active" class="tab-link">
          Budget Comparison
        </a>
      </div>

      <!-- Picker -->
      <div class="picker-row">
        <app-month-year-picker
          [month]="month()"
          [year]="year()"
          (monthChange)="onMonthChange($event)"
          (yearChange)="onYearChange($event)">
        </app-month-year-picker>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading report…</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button (click)="load()">Retry</button>
        </div>
      }

      <!-- Content -->
      @if (!loading() && !error()) {

        <!-- Total card -->
        <mat-card class="total-card">
          <div class="total-icon"><mat-icon>payments</mat-icon></div>
          <div class="total-body">
            <span class="total-label">Total Spent — {{ monthLabel() }}</span>
            <span class="total-value">{{ summary()?.totalSpent ?? 0 | currency:'INR':'symbol-narrow' }}</span>
          </div>
        </mat-card>

        @if (categories().length) {

          <!-- Bar chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Spending by Category</mat-card-title>
              <mat-card-subtitle>{{ monthLabel() }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="bar-wrap">
                <canvas #barCanvas></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Table -->
          <mat-card class="table-card">
            <mat-card-header>
              <mat-card-title>Category Breakdown</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="sortedCategories()" class="summary-table">

                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let c">
                    <span class="cat-dot" [style.background]="colorFor(c.categoryId)"></span>
                    {{ c.categoryName }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let c">
                    <span class="amount-cell">{{ c.totalSpent | currency:'INR':'symbol-narrow' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="share">
                  <th mat-header-cell *matHeaderCellDef>Share</th>
                  <td mat-cell *matCellDef="let c">
                    {{ sharePct(c.totalSpent) | number:'1.0-1' }}%
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>

        } @else {
          <div class="empty-state">
            <mat-icon>bar_chart</mat-icon>
            <p>No spending recorded for {{ monthLabel() }}</p>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .reports-page {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; color: #1e293b; }
    .page-subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.875rem; }

    /* Tabs */
    .report-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .tab-link {
      padding: 10px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .tab-link.active {
      color: #6366f1;
      border-bottom-color: #6366f1;
    }
    .tab-link:hover:not(.active) { color: #ffffff; }

    .picker-row { display: flex; }

    /* States */
    .loading-state, .error-banner, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      color: #64748b;
    }
    .error-banner {
      flex-direction: row;
      justify-content: flex-start;
      padding: 14px 18px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 0.875rem;
    }
    .error-banner button {
      margin-left: auto;
      background: #dc2626;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .empty-state mat-icon { font-size: 44px; width: 44px; height: 44px; color: #cbd5e1; }
    .empty-state p { margin: 0; font-size: 0.9rem; }

    /* Total card */
    .total-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
      padding: 20px !important;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .total-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .total-icon mat-icon { font-size: 24px; width: 24px; height: 24px; color: #fff; }
    .total-body { display: flex; flex-direction: column; gap: 2px; }
    .total-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .total-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }

    /* Chart + table cards */
    .chart-card, .table-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
    }
    mat-card-title { font-size: 1rem !important; font-weight: 700 !important; color: #1e293b !important; }
    mat-card-subtitle { font-size: 0.78rem !important; color: #94a3b8 !important; }

    .bar-wrap { height: 280px; margin-top: 8px; }

    .summary-table { width: 100%; font-size: 0.875rem; }
    .mat-mdc-header-cell {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mat-mdc-cell { padding: 12px 16px !important; }

    .cat-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      margin-right: 8px;
      vertical-align: middle;
    }
    .amount-cell { font-weight: 700; color: #1e293b; }
  `],
})
export class MonthlySummaryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barCanvas') barCanvas?: ElementRef<HTMLCanvasElement>;

  private reportSvc = inject(ReportService);

  readonly columns = ['category', 'amount', 'share'];

  private today = new Date();
  month = signal(this.today.getMonth() + 1);
  year = signal(this.today.getFullYear());

  loading = signal(true);
  error = signal<string | null>(null);
  summary = signal<MonthlySummary | null>(null);
  categories = signal<CategorySummary[]>([]);

  private barChart: Chart | null = null;
  private chartBuilt = false;

  monthLabel = computed(() => {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${names[this.month() - 1]} ${this.year()}`;
  });

  sortedCategories = computed(() =>
    [...this.categories()].sort((a, b) => b.totalSpent - a.totalSpent)
  );

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    if (this.categories().length && !this.chartBuilt) {
      this.buildBarChart();
    }
  }

  onMonthChange(m: number): void {
    this.month.set(m);
    this.load();
  }

  onYearChange(y: number): void {
    this.year.set(y);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.chartBuilt = false;

    forkJoin({
      summary: this.reportSvc.getMonthlySummary(this.month(), this.year()),
      categories: this.reportSvc.getCategorySummary(this.month(), this.year()),
    }).subscribe({
      next: ({ summary, categories }) => {
        this.summary.set(summary);
        this.categories.set(categories);
        this.loading.set(false);
        setTimeout(() => this.buildBarChart(), 0);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load report.');
        this.loading.set(false);
      },
    });
  }

  colorFor(categoryId: string): string {
    const idx = this.sortedCategories().findIndex(c => c.categoryId === categoryId);
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  }

  sharePct(amount: number): number {
    const total = this.summary()?.totalSpent ?? 0;
    return total > 0 ? (amount / total) * 100 : 0;
  }

  private buildBarChart(): void {
    if (!this.barCanvas?.nativeElement) return;
    const cats = this.sortedCategories();
    if (!cats.length) return;

    this.barChart?.destroy();
    this.chartBuilt = true;

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: cats.map(c => c.categoryName),
        datasets: [{
          label: 'Spent',
          data: cats.map(c => c.totalSpent),
          backgroundColor: cats.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
          borderRadius: 6,
          maxBarThickness: 48,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed.y as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `$${v}` },
            grid: { color: '#f1f5f9' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
  }
}