import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/dashboard.model';

Chart.register(...registerables);

const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dashboard-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <a routerLink="/expenses/create" class="btn-primary">
          <mat-icon>add</mat-icon>
          Add Expense
        </a>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading your dashboard…</p>
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
      @if (data(); as d) {

        <!-- KPI Cards -->
        <div class="kpi-grid">

          <div class="kpi-card kpi-expenses">
            <div class="kpi-icon"><mat-icon>payments</mat-icon></div>
            <div class="kpi-body">
              <span class="kpi-label">Total Expenses</span>
              <span class="kpi-value">{{ d.totalExpenses | currency:'INR':'symbol-narrow' }}</span>
            </div>
          </div>

          <div class="kpi-card kpi-count">
            <div class="kpi-icon"><mat-icon>receipt_long</mat-icon></div>
            <div class="kpi-body">
              <span class="kpi-label">Expense Count</span>
              <span class="kpi-value">{{ d.expenseCount }}</span>
            </div>
          </div>

          <div class="kpi-card kpi-budget">
            <div class="kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="kpi-body">
              <span class="kpi-label">Total Budget</span>
              <span class="kpi-value">{{ d.totalBudget | currency:'INR':'symbol-narrow' }}</span>
            </div>
          </div>

          <div class="kpi-card"
               [class.kpi-remaining-good]="remainingPositive()"
               [class.kpi-remaining-bad]="!remainingPositive()">
            <div class="kpi-icon">
              <mat-icon>{{ remainingPositive() ? 'savings' : 'warning' }}</mat-icon>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Remaining Budget</span>
              <span class="kpi-value">{{ d.remainingBudget | currency:'INR':'symbol-narrow' }}</span>
            </div>
            <div class="kpi-progress-bar">
              <div class="kpi-progress-fill"
                   [style.width.%]="budgetUsedPct()"
                   [class.overspent]="!remainingPositive()">
              </div>
            </div>
            <span class="kpi-pct-label">{{ budgetUsedPct() | number:'1.0-0' }}% used</span>
          </div>

        </div>

        <!-- Charts Row -->
        <div class="charts-row">

          <!-- Doughnut Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Spending by Category</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (coloredCategories().length) {
                <div class="pie-wrap">
                  <canvas #pieCanvas></canvas>
                </div>
                <ul class="legend">
                  @for (cat of coloredCategories(); track cat.categoryId) {
                    <li class="legend-item">
                      <span class="legend-dot" [style.background]="cat.color"></span>
                      <span class="legend-name">{{ cat.categoryName }}</span>
                      <span class="legend-pct">{{ cat.percentage! | number:'1.0-1' }}%</span>
                    </li>
                  }
                </ul>
              } @else {
                <div class="empty-chart">No category data yet</div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Top Categories Ranked List -->
          <mat-card class="top-categories-card">
            <mat-card-header>
              <mat-card-title>Top Categories (Ranked by spending)</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (coloredCategories().length) {
                <ul class="category-list">
                  @for (cat of coloredCategories(); track cat.categoryId; let i = $index) {
                    <li class="category-item">
                      <div class="cat-rank" [style.background]="cat.color">{{ i + 1 }}</div>
                      <div class="cat-info">
                        <span class="cat-name">{{ cat.categoryName }}</span>
                        <div class="cat-bar-wrap">
                          <div class="cat-bar"
                               [style.width.%]="cat.percentage"
                               [style.background]="cat.color">
                          </div>
                        </div>
                      </div>
                      <span class="cat-amount">{{ cat.amount | currency:'INR':'symbol-narrow' }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <div class="empty-state">
                  <mat-icon>pie_chart_outline</mat-icon>
                  <p>No categories yet</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

        </div>

        <!-- Recent Expenses Table -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-card-title>Recent Expenses</mat-card-title>
            <mat-card-subtitle>Your latest transactions</mat-card-subtitle>
            <div class="card-actions">
              <a routerLink="/expenses" class="view-all-link">View all →</a>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (d.recentExpenses.length) {
              <table mat-table [dataSource]="d.recentExpenses" class="recent-table">

                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let e">
                    {{ e.createdAt | date:'MMM d, y' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let e">
                    <span class="expense-title">{{ e.title }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="categoryName">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let e">
                    <span class="category-chip">{{ e.categoryName }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let e">
                    <span class="amount-cell">{{ e.amount | currency:'INR':'symbol-narrow' }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: tableColumns;" class="expense-row"></tr>
              </table>
            } @else {
              <div class="empty-state">
                <mat-icon>receipt_long</mat-icon>
                <p>No expenses yet</p>
                <a routerLink="/expenses/create" class="btn-primary small">Add your first expense</a>
              </div>
            }
          </mat-card-content>
        </mat-card>

      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 24px;
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Header ──────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: #1e293b;
    }
    .page-subtitle {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    /* ── Buttons ─────────────────────────────── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: #6366f1;
      color: #fff;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-primary.small { padding: 8px 16px; font-size: 0.8125rem; }

    /* ── Loading / Error ─────────────────────── */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px 0;
      color: #64748b;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
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

    /* ── KPI Grid ────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: #fff;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04);
      position: relative;
      overflow: hidden;
      flex-wrap: wrap;
    }
    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
    .kpi-expenses .kpi-icon      { background: #6366f1; }
    .kpi-count .kpi-icon         { background: #f59e0b; }
    .kpi-budget .kpi-icon        { background: #3b82f6; }
    .kpi-remaining-good .kpi-icon { background: #10b981; }
    .kpi-remaining-bad .kpi-icon  { background: #ef4444; }

    .kpi-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    .kpi-progress-bar {
      width: 100%;
      height: 4px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
      margin-top: 8px;
    }
    .kpi-progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .kpi-progress-fill.overspent { background: #ef4444; }
    .kpi-pct-label {
      font-size: 0.72rem;
      color: #94a3b8;
      width: 100%;
    }

    /* ── Charts Row ──────────────────────────── */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    .chart-card, .top-categories-card, .recent-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
    }

    .pie-wrap {
      width: 200px;
      height: 200px;
      margin: 16px auto;
    }
    .legend {
      list-style: none;
      padding: 0;
      margin: 8px 0 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-name { flex: 1; color: #ffffff; }
    .legend-pct { font-weight: 600; color: #ffffff; }

    /* ── Category List ───────────────────────── */
    .category-list {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .category-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-rank {
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
    .cat-info { flex: 1; min-width: 0; }
    .cat-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffffff;
      display: block;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cat-bar-wrap {
      height: 5px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
    }
    .cat-bar {
      height: 100%;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .cat-amount {
      font-weight: 700;
      font-size: 0.875rem;
      color: #d7dbe3;
      white-space: nowrap;
    }

    /* ── Recent Expenses ─────────────────────── */
    .card-actions {
      margin-left: auto;
      align-self: center;
    }
    .view-all-link {
      font-size: 0.8rem;
      color: #6366f1;
      font-weight: 600;
      text-decoration: none;
    }
    .view-all-link:hover { text-decoration: underline; }

    .recent-table { width: 100%; font-size: 0.875rem; }

    .mat-mdc-header-cell {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mat-mdc-cell {
      color: #ffffff;
      padding: 14px 16px !important;
    }
    .expense-row:hover .mat-mdc-cell { background: #f8fafc; }

    .expense-title { font-weight: 600; color: #1e293b; }
    .category-chip {
      background: #ede9fe;
      color: #6d28d9;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .amount-cell { font-weight: 700; color: #1e293b; }

    /* ── Empty States ────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px 0;
      color: #94a3b8;
      text-align: center;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state p { margin: 0; font-size: 0.875rem; }
    .empty-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  private dashSvc = inject(DashboardService);

  readonly today = new Date();
  readonly tableColumns = ['createdAt', 'title', 'categoryName', 'amount'];

  loading = signal(true);
  error   = signal<string | null>(null);
  data    = signal<DashboardSummary | null>(null);

  private pieChart: Chart | null = null;
  private chartBuilt = false;

  coloredCategories = computed(() => {
    const d = this.data();
    if (!d) return [];
    return d.topCategories.map((cat, i) => ({
      ...cat,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  });

  remainingPositive = computed(() => (this.data()?.remainingBudget ?? 0) >= 0);

  budgetUsedPct = computed(() => {
    const d = this.data();
    if (!d || d.totalBudget === 0) return 0;
    return Math.min(100, ((d.totalBudget - d.remainingBudget) / d.totalBudget) * 100);
  });

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    // If data arrived before view init, build chart now
    if (this.data() && !this.chartBuilt) {
      this.buildPieChart();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.chartBuilt = false;

    this.dashSvc.getSummary().subscribe({
      next: (summary) => {
        this.data.set(summary);
        this.loading.set(false);
        // One tick so Angular renders the canvas before we draw
        setTimeout(() => this.buildPieChart(), 0);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load dashboard. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private buildPieChart(): void {
    if (!this.pieCanvas?.nativeElement) return;
    const cats = this.coloredCategories();
    if (!cats.length) return;

    this.pieChart?.destroy();
    this.chartBuilt = true;

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.categoryName),
        datasets: [{
          data: cats.map(c => c.amount),
          backgroundColor: cats.map(c => c.color!),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number;
                return ` $${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.pieChart?.destroy();
  }
}