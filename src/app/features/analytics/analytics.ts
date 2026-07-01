// src/app/features/analytics/analytics.ts

import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, signal, computed, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { AnalyticsService } from '../../core/services/analytics.service';
import { CategoryService } from '../../core/services/category.service';
import {
  TopCategory, MonthlyTrend, CategoryTrend,
  BudgetAlert, BiggestExpense,
} from '../../core/models/analytics.model';
import { Category } from '../../core/models/category.model';

Chart.register(...registerables);

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="analytics-page">

      <!-- ── Page header ───────────────────────── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Trends, patterns, and insights across your finances</p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════
           1. Monthly Trend — Line chart
      ════════════════════════════════════════════ -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Monthly Trend</h2>
          <mat-form-field appearance="outline" class="year-picker">
            <mat-select [ngModel]="trendYear()" (ngModelChange)="onTrendYearChange($event)">
              @for (y of years; track y) {
                <mat-option [value]="y">{{ y }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-card class="chart-card">
          <mat-card-content>
            @if (trendLoading()) {
              <div class="card-loading"><mat-spinner diameter="32"></mat-spinner></div>
            } @else if (trendError()) {
              <div class="card-error"><mat-icon>error_outline</mat-icon> {{ trendError() }}</div>
            } @else if (monthlyTrend().length) {
              <div class="line-wrap"><canvas #lineCanvas></canvas></div>
            } @else {
              <div class="card-empty"><mat-icon>show_chart</mat-icon><p>No data for {{ trendYear() }}</p></div>
            }
          </mat-card-content>
        </mat-card>
      </section>

      <!-- ═══════════════════════════════════════
           2. Top Categories — Pie chart + list
      ════════════════════════════════════════════ -->
      <section class="section">
        <h2 class="section-title">Top Categories</h2>

        <div class="two-col">
          <mat-card class="chart-card">
            <mat-card-content>
              @if (topLoading()) {
                <div class="card-loading"><mat-spinner diameter="32"></mat-spinner></div>
              } @else if (topError()) {
                <div class="card-error"><mat-icon>error_outline</mat-icon> {{ topError() }}</div>
              } @else if (topCategories().length) {
                <div class="pie-wrap"><canvas #pieCanvas></canvas></div>
              } @else {
                <div class="card-empty"><mat-icon>pie_chart_outline</mat-icon><p>No category data</p></div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="list-card">
            <mat-card-content>
              @if (!topLoading() && !topError() && topCategories().length) {
                <ul class="top-cat-list">
                  @for (cat of topCategories(); track cat.categoryId; let i = $index) {
                    <li class="top-cat-item">
                      <span class="rank-dot" [style.background]="PALETTE[i % PALETTE.length]">{{ i + 1 }}</span>
                      <span class="cat-name">{{ cat.categoryName }}</span>
                      <span class="cat-amt">{{ cat.totalAmount | currency:'INR':'symbol-narrow' }}</span>
                    </li>
                  }
                </ul>
              } @else if (!topLoading()) {
                <div class="card-empty"><mat-icon>category</mat-icon><p>No data</p></div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- ═══════════════════════════════════════
           3. Category Trend — Bar chart
      ════════════════════════════════════════════ -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Category Trend</h2>
          <div class="section-controls">
            <mat-form-field appearance="outline" class="cat-picker">
              <mat-label>Category</mat-label>
              <mat-select [ngModel]="selectedCategoryId()" (ngModelChange)="onCategoryChange($event)">
                @for (cat of expenseCategories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="year-picker">
              <mat-select [ngModel]="catTrendYear()" (ngModelChange)="onCatTrendYearChange($event)">
                @for (y of years; track y) {
                  <mat-option [value]="y">{{ y }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <mat-card class="chart-card">
          <mat-card-content>
            @if (catTrendLoading()) {
              <div class="card-loading"><mat-spinner diameter="32"></mat-spinner></div>
            } @else if (catTrendError()) {
              <div class="card-error"><mat-icon>error_outline</mat-icon> {{ catTrendError() }}</div>
            } @else if (!selectedCategoryId()) {
              <div class="card-empty"><mat-icon>bar_chart</mat-icon><p>Select a category to view its trend</p></div>
            } @else if (categoryTrend().length) {
              <div class="bar-wrap"><canvas #barCanvas></canvas></div>
            } @else {
              <div class="card-empty"><mat-icon>bar_chart</mat-icon><p>No data for this selection</p></div>
            }
          </mat-card-content>
        </mat-card>
      </section>

      <!-- ═══════════════════════════════════════
           4. Budget Alerts — Cards with % used
      ════════════════════════════════════════════ -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Budget Alerts</h2>
          <div class="section-controls">
            <mat-form-field appearance="outline" class="month-picker">
              <mat-select [ngModel]="alertMonth()" (ngModelChange)="onAlertMonthChange($event)">
                @for (m of months; track m.value) {
                  <mat-option [value]="m.value">{{ m.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="year-picker">
              <mat-select [ngModel]="alertYear()" (ngModelChange)="onAlertYearChange($event)">
                @for (y of years; track y) {
                  <mat-option [value]="y">{{ y }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        @if (alertLoading()) {
          <div class="loading-state"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (alertError()) {
          <div class="error-banner"><mat-icon>error_outline</mat-icon> {{ alertError() }}</div>
        } @else if (budgetAlerts().length) {
          <div class="alert-grid">
            @for (a of budgetAlerts(); track a.categoryId) {
              <mat-card class="alert-card">
                <div class="alert-top">
                  <span class="alert-cat">{{ a.categoryName }}</span>
                  <span class="alert-pct">{{ a.percentageUsed | number:'1.0-1' }}%</span>
                </div>
                <div class="alert-amounts">
                  <span>{{ a.spentAmount | currency:'INR':'symbol-narrow' }} <span class="of">of</span> {{ a.budgetAmount | currency:'INR':'symbol-narrow' }}</span>
                </div>
                <div class="alert-track">
                  <div class="alert-fill"
                    [style.width.%]="clamp(a.percentageUsed)"
                    [style.background]="alertColor(a.percentageUsed)">
                  </div>
                </div>
                <div class="alert-remaining">
                  @if (a.spentAmount > a.budgetAmount) {
                    <span class="over-label">{{ (a.spentAmount - a.budgetAmount) | currency:'INR':'symbol-narrow' }} over</span>
                  } @else {
                    <span class="remaining-label">{{ (a.budgetAmount - a.spentAmount) | currency:'INR':'symbol-narrow' }} left</span>
                  }
                </div>
              </mat-card>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>No budget alerts for this period</p>
          </div>
        }
      </section>

      <!-- ═══════════════════════════════════════
           5. Biggest Expenses — Table with limit
      ════════════════════════════════════════════ -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Biggest Expenses</h2>
          <mat-form-field appearance="outline" class="limit-picker">
            <mat-label>Show</mat-label>
            <mat-select [ngModel]="expenseLimit()" (ngModelChange)="onLimitChange($event)">
              <mat-option [value]="5">Top 5</mat-option>
              <mat-option [value]="10">Top 10</mat-option>
              <mat-option [value]="25">Top 25</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-card class="table-card">
          @if (bigLoading()) {
            <div class="card-loading"><mat-spinner diameter="32"></mat-spinner></div>
          } @else if (bigError()) {
            <div class="card-error"><mat-icon>error_outline</mat-icon> {{ bigError() }}</div>
          } @else if (biggestExpenses().length) {
            <table mat-table [dataSource]="biggestExpenses()" class="big-table">

              <ng-container matColumnDef="rank">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let e; let i = index">
                  <span class="rank-badge">{{ i + 1 }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let e">
                  <span class="exp-title">{{ e.title }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let e">
                  <span class="cat-chip">{{ e.categoryName }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let e">
                  <span class="exp-amount">{{ e.amount | currency:'INR':'symbol-narrow' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let e">{{ e.createdAt | date:'MMM d, y' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="bigCols"></tr>
              <tr mat-row *matRowDef="let row; columns: bigCols;" class="big-row"></tr>
            </table>
          } @else {
            <div class="card-empty"><mat-icon>receipt_long</mat-icon><p>No expenses found</p></div>
          }
        </mat-card>
      </section>

    </div>
  `,
  styles: [`
    .analytics-page {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* ── Page header ───────────────────────────── */
    .page-title  { font-size: 1.75rem; font-weight: 700; margin: 0; color: #1e293b; }
    .page-subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.875rem; }

    /* ── Section chrome ────────────────────────── */
    .section { display: flex; flex-direction: column; gap: 12px; }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #ffffff; margin: 0; }
    .section-controls { display: flex; gap: 8px; flex-wrap: wrap; }

    /* Pickers */
    .year-picker  { width: 110px; font-size: 0.8rem; }
    .month-picker { width: 150px; font-size: 0.8rem; }
    .cat-picker   { width: 200px; font-size: 0.8rem; }
    .limit-picker { width: 120px; font-size: 0.8rem; }

    /* ── Cards ─────────────────────────────────── */
    .chart-card, .list-card, .alert-card, .table-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    /* Canvas wraps */
    .line-wrap { height: 260px; }
    .pie-wrap  { width: 220px; height: 220px; margin: 16px auto; }
    .bar-wrap  { height: 260px; }

    /* Inline states */
    .card-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
    }
    .card-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px;
      color: #dc2626;
      font-size: 0.875rem;
    }
    .card-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 0;
      color: #94a3b8;
      font-size: 0.875rem;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
      p { margin: 0; }
    }

    /* Shared page-level states */
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 18px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 0.875rem;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 40px 0;
      color: #94a3b8;
      font-size: 0.875rem;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
      p { margin: 0; }
    }

    /* ── Top Categories list ───────────────────── */
    .top-cat-list { list-style: none; padding: 8px 4px; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .top-cat-item { display: flex; align-items: center; gap: 10px; }
    .rank-dot {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .cat-name { flex: 1; font-weight: 600; color: #ffffff; font-size: 0.875rem; }
    .cat-amt  { font-weight: 700; color: #1e293b; font-size: 0.875rem; white-space: nowrap; }

    /* ── Budget Alert cards ────────────────────── */
    .alert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
    }
    .alert-card {
      padding: 16px !important;
    }
    .alert-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .alert-cat  { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .alert-pct  { font-weight: 700; color: #6366f1; font-size: 1rem; }
    .alert-amounts { font-size: 0.78rem; color: #64748b; margin-bottom: 10px; }
    .alert-amounts .of { color: #94a3b8; }
    .alert-track {
      height: 6px;
      background: #f1f5f9;
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .alert-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.5s ease;
    }
    .alert-remaining { font-size: 0.75rem; font-weight: 600; }
    .over-label { color: #dc2626; }
    .remaining-label { color: #16a34a; }

    /* ── Biggest Expenses table ────────────────── */
    .big-table { width: 100%; font-size: 0.875rem; }
    .mat-mdc-header-cell {
      font-size: 0.72rem !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mat-mdc-cell { padding: 12px 16px !important; }
    .big-row:hover .mat-mdc-cell { background: #f8fafc; }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .exp-title  { font-weight: 600; color: #1e293b; }
    .exp-amount { font-weight: 700; color: #1e293b; }
    .cat-chip {
      background: #ede9fe;
      color: #6d28d9;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `],
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineCanvas') lineCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas')  pieCanvas?:  ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')  barCanvas?:  ElementRef<HTMLCanvasElement>;

  private analytSvc   = inject(AnalyticsService);
  private categorySvc = inject(CategoryService);

  protected PALETTE = PALETTE;
  protected Math = Math;

  private today = new Date();

  readonly bigCols = ['rank', 'title', 'category', 'amount', 'date'];
  readonly years   = Array.from({ length: 6 }, (_, i) => this.today.getFullYear() - 4 + i);
  readonly months  = MONTH_NAMES.map((label, i) => ({ value: i + 1, label }));

  /* ── per-widget state ──────────────────────── */
  trendYear    = signal(this.today.getFullYear());
  trendLoading = signal(false);
  trendError   = signal<string | null>(null);
  monthlyTrend = signal<MonthlyTrend[]>([]);

  topLoading   = signal(false);
  topError     = signal<string | null>(null);
  topCategories = signal<TopCategory[]>([]);

  selectedCategoryId = signal<string>('');
  catTrendYear    = signal(this.today.getFullYear());
  catTrendLoading = signal(false);
  catTrendError   = signal<string | null>(null);
  categoryTrend   = signal<CategoryTrend[]>([]);
  expenseCategories = signal<Category[]>([]);

  alertMonth   = signal(this.today.getMonth() + 1);
  alertYear    = signal(this.today.getFullYear());
  alertLoading = signal(false);
  alertError   = signal<string | null>(null);
  budgetAlerts = signal<BudgetAlert[]>([]);

  expenseLimit   = signal(10);
  bigLoading     = signal(false);
  bigError       = signal<string | null>(null);
  biggestExpenses = signal<BiggestExpense[]>([]);

  /* ── Charts ────────────────────────────────── */
  private lineChart: Chart | null = null;
  private pieChart:  Chart | null = null;
  private barChart:  Chart | null = null;

  ngOnInit(): void {
    this.loadTrend();
    this.loadTopCategories();
    this.loadCategories();
    this.loadAlerts();
    this.loadBiggest();
  }

  ngAfterViewInit(): void { /* charts built after data arrives */ }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.pieChart?.destroy();
    this.barChart?.destroy();
  }

  /* ── Monthly Trend ─────────────────────────── */
  loadTrend(): void {
    this.trendLoading.set(true);
    this.trendError.set(null);
    this.lineChart?.destroy();

    this.analytSvc.getMonthlyTrend(this.trendYear()).subscribe({
      next: (data) => {
        this.monthlyTrend.set(data);
        this.trendLoading.set(false);
        setTimeout(() => this.buildLineChart(), 0);
      },
      error: (err) => {
        this.trendError.set(err?.error?.message ?? 'Failed to load trend.');
        this.trendLoading.set(false);
      },
    });
  }

  onTrendYearChange(y: number): void { this.trendYear.set(y); this.loadTrend(); }

  private buildLineChart(): void {
    if (!this.lineCanvas?.nativeElement) return;
    const data = this.monthlyTrend();
    if (!data.length) return;

    this.lineChart?.destroy();

    // Fill all 12 months, 0 for missing
    const amounts = Array.from({ length: 12 }, (_, i) => {
      const found = data.find(d => d.month === i + 1);
      return found?.totalAmount ?? 0;
    });

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: MONTH_NAMES,
        datasets: [{
          label: 'Spending',
          data: amounts,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${(ctx.parsed.y as number).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `₹${v}` },
            grid: { color: '#f1f5f9' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  /* ── Top Categories ────────────────────────── */
  loadTopCategories(): void {
    this.topLoading.set(true);
    this.topError.set(null);
    this.pieChart?.destroy();

    this.analytSvc.getTopCategories().subscribe({
      next: (data) => {
        this.topCategories.set(data);
        this.topLoading.set(false);
        setTimeout(() => this.buildPieChart(), 0);
      },
      error: (err) => {
        this.topError.set(err?.error?.message ?? 'Failed to load categories.');
        this.topLoading.set(false);
      },
    });
  }

  private buildPieChart(): void {
    if (!this.pieCanvas?.nativeElement) return;
    const cats = this.topCategories();
    if (!cats.length) return;

    this.pieChart?.destroy();

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.categoryName),
        datasets: [{
          data: cats.map(c => c.totalAmount),
          backgroundColor: cats.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            },
          },
        },
      },
    });
  }

  /* ── Category Trend ────────────────────────── */
  loadCategories(): void {
    this.categorySvc.getAll().subscribe({
      next: (cats) => {
        // Only EXPENSE categories make sense for a spending trend
        const expense = cats.filter(c => c.type === 'EXPENSE');
        this.expenseCategories.set(expense);
        if (expense.length) {
          this.selectedCategoryId.set(expense[0].id);
          this.loadCategoryTrend();
        }
      },
      error: () => {},
    });
  }

  loadCategoryTrend(): void {
    const catId = this.selectedCategoryId();
    if (!catId) return;

    this.catTrendLoading.set(true);
    this.catTrendError.set(null);
    this.barChart?.destroy();

    this.analytSvc.getCategoryTrend(catId, this.catTrendYear()).subscribe({
      next: (data) => {
        this.categoryTrend.set(data);
        this.catTrendLoading.set(false);
        setTimeout(() => this.buildBarChart(), 0);
      },
      error: (err) => {
        this.catTrendError.set(err?.error?.message ?? 'Failed to load category trend.');
        this.catTrendLoading.set(false);
      },
    });
  }

  onCategoryChange(id: string): void    { this.selectedCategoryId.set(id); this.loadCategoryTrend(); }
  onCatTrendYearChange(y: number): void { this.catTrendYear.set(y); this.loadCategoryTrend(); }

  private buildBarChart(): void {
    if (!this.barCanvas?.nativeElement) return;
    const data = this.categoryTrend();
    if (!data.length) return;

    this.barChart?.destroy();

    const amounts = Array.from({ length: 12 }, (_, i) => {
      const found = data.find(d => d.month === i + 1);
      return found?.amount ?? 0;
    });

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: MONTH_NAMES,
        datasets: [{
          label: 'Spent',
          data: amounts,
          backgroundColor: 'rgba(99,102,241,0.75)',
          borderRadius: 6,
          maxBarThickness: 40,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${(ctx.parsed.y as number).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `₹${v}` },
            grid: { color: '#f1f5f9' },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  /* ── Budget Alerts ─────────────────────────── */
  loadAlerts(): void {
    this.alertLoading.set(true);
    this.alertError.set(null);

    this.analytSvc.getBudgetAlerts(this.alertMonth(), this.alertYear()).subscribe({
      next: (data) => {
        // Sort by percentageUsed descending so most-spent shows first
        this.budgetAlerts.set([...data].sort((a, b) => b.percentageUsed - a.percentageUsed));
        this.alertLoading.set(false);
      },
      error: (err) => {
        this.alertError.set(err?.error?.message ?? 'Failed to load alerts.');
        this.alertLoading.set(false);
      },
    });
  }

  onAlertMonthChange(m: number): void { this.alertMonth.set(m); this.loadAlerts(); }
  onAlertYearChange(y: number): void  { this.alertYear.set(y);  this.loadAlerts(); }

  clamp(pct: number): number { return Math.min(100, pct); }

  alertColor(pct: number): string {
    // Gradient: green → amber → red proportionally to usage
    if (pct >= 100) return '#ef4444';
    if (pct >= 75)  return '#f59e0b';
    return '#10b981';
  }

  /* ── Biggest Expenses ──────────────────────── */
  loadBiggest(): void {
    this.bigLoading.set(true);
    this.bigError.set(null);

    this.analytSvc.getBiggestExpenses(this.expenseLimit()).subscribe({
      next: (data) => {
        this.biggestExpenses.set(data);
        this.bigLoading.set(false);
      },
      error: (err) => {
        this.bigError.set(err?.error?.message ?? 'Failed to load expenses.');
        this.bigLoading.set(false);
      },
    });
  }

  onLimitChange(limit: number): void { this.expenseLimit.set(limit); this.loadBiggest(); }
}