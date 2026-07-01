// src/app/features/reports/budget-comparison/budget-comparison.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportService } from '../../../core/services/report.service';
import { BudgetComparison } from '../../../core/models/report.model';
import { MonthYearPickerComponent } from '../../../shared/components/month-year-picker/month-year-picker';

@Component({
  selector: 'app-budget-comparison',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MonthYearPickerComponent,
  ],
  template: `
    <div class="reports-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-subtitle">Budget vs actual spending</p>
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

        @if (comparisons().length) {

          <!-- Summary strip -->
          <div class="summary-strip">
            <div class="strip-item">
              <span class="strip-label">Total Budgeted</span>
              <span class="strip-value">{{ totalBudget() | currency:'INR':'symbol-narrow' }}</span>
            </div>
            <div class="strip-item">
              <span class="strip-label">Total Spent</span>
              <span class="strip-value">{{ totalSpent() | currency:'INR':'symbol-narrow' }}</span>
            </div>
            <div class="strip-item" [class.over]="totalRemaining() < 0">
              <span class="strip-label">Remaining</span>
              <span class="strip-value">{{ totalRemaining() | currency:'INR':'symbol-narrow' }}</span>
            </div>
          </div>

          <!-- Progress bars per category -->
          <mat-card class="comparison-card">
            <ul class="comparison-list">
              @for (c of comparisons(); track c.categoryId) {
                <li class="comparison-item">
                  <div class="comparison-row">
                    <span class="cat-name">{{ c.categoryName }}</span>
                    <span class="cat-amounts">
                      <span [class.over-text]="c.remainingAmount < 0">{{ c.spentAmount | currency:'INR':'symbol-narrow' }}</span>
                      <span class="of-text"> of {{ c.budgetAmount | currency:'INR':'symbol-narrow' }}</span>
                    </span>
                  </div>

                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [class.over]="c.remainingAmount < 0"
                      [style.width.%]="pctUsed(c)">
                    </div>
                  </div>

                  <div class="comparison-footer">
                    @if (c.remainingAmount < 0) {
                      <span class="status-badge over">
                        <mat-icon>warning</mat-icon>
                        {{ Math.abs(c.remainingAmount) | currency:'INR':'symbol-narrow' }} over budget
                      </span>
                    } @else {
                      <span class="status-badge ok">
                        {{ c.remainingAmount | currency:'INR':'symbol-narrow' }} remaining
                      </span>
                    }
                    <span class="pct-label">{{ pctUsed(c) | number:'1.0-0' }}% used</span>
                  </div>
                </li>
              }
            </ul>
          </mat-card>

        } @else {
          <div class="empty-state">
            <mat-icon>account_balance_wallet</mat-icon>
            <p>No budgets set for {{ monthLabel() }}</p>
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
    .tab-link.active { color: #6366f1; border-bottom-color: #6366f1; }
    .tab-link:hover:not(.active) { color: #ffffff; }

    .picker-row { display: flex; }

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

    /* Summary strip */
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .strip-item {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .strip-label {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .strip-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .strip-item.over .strip-value { color: #dc2626; }

    @media (max-width: 600px) {
      .summary-strip { grid-template-columns: 1fr; }
    }

    /* Comparison card */
    .comparison-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
      padding: 8px !important;
    }
    .comparison-list { list-style: none; margin: 0; padding: 0; }
    .comparison-item {
      padding: 16px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .comparison-item:last-child { border-bottom: none; }

    .comparison-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .cat-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .cat-amounts { font-size: 0.85rem; color: #64748b; }
    .cat-amounts span:first-child { font-weight: 700; color: #1e293b; }
    .over-text { color: #dc2626 !important; }
    .of-text { color: #94a3b8; }

    .progress-track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .progress-fill.over { background: #ef4444; }

    .comparison-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 2px 0;
    }
    .status-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-badge.ok { color: #16a34a; }
    .status-badge.over { color: #dc2626; }
    .pct-label { font-size: 0.75rem; color: #94a3b8; }
  `],
})
export class BudgetComparisonComponent implements OnInit {
  private reportSvc = inject(ReportService);

  protected Math = Math;

  private today = new Date();
  month = signal(this.today.getMonth() + 1);
  year = signal(this.today.getFullYear());

  loading = signal(true);
  error = signal<string | null>(null);
  comparisons = signal<BudgetComparison[]>([]);

  monthLabel = computed(() => {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${names[this.month() - 1]} ${this.year()}`;
  });

  totalBudget = computed(() => this.comparisons().reduce((s, c) => s + c.budgetAmount, 0));
  totalSpent = computed(() => this.comparisons().reduce((s, c) => s + c.spentAmount, 0));
  totalRemaining = computed(() => this.totalBudget() - this.totalSpent());

  ngOnInit(): void {
    this.load();
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

    this.reportSvc.getBudgetComparison(this.month(), this.year()).subscribe({
      next: (data) => {
        this.comparisons.set(
          [...data].sort((a, b) => this.pctUsed(b) - this.pctUsed(a))
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load report.');
        this.loading.set(false);
      },
    });
  }

  pctUsed(c: BudgetComparison): number {
    if (c.budgetAmount === 0) return 0;
    return Math.min(100, (c.spentAmount / c.budgetAmount) * 100);
  }
}