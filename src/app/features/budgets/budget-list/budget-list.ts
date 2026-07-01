// src/app/features/budgets/budget-list/budget-list.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BudgetService } from '../../../core/services/budget.service';
import { Budget, BudgetGroup } from '../../../core/models/budget.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="budgets-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Budgets</h1>
          <p class="page-subtitle">{{ budgets().length }} total budgets</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/budgets/create" class="btn-primary">
          <mat-icon>add</mat-icon>
          New Budget
        </a>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading budgets…</p>
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

      <!-- Grouped list -->
      @if (!loading() && !error()) {
        @if (groups().length) {
          <div class="groups-list">
            @for (group of groups(); track group.year + '-' + group.month) {
              <div class="group-section">

                <div class="group-header">
                  <h2 class="group-title">{{ group.label }}</h2>
                  <span class="group-total">{{ group.totalAmount | currency:'INR':'symbol-narrow' }} total</span>
                </div>

                <mat-card class="group-card">
                  <ul class="budget-list">
                    @for (b of group.budgets; track b.id) {
                      <li class="budget-item">
                        <div class="budget-icon">
                          <mat-icon>account_balance_wallet</mat-icon>
                        </div>
                        <div class="budget-info">
                          <span class="budget-category">{{ b.categoryName }}</span>
                        </div>
                        <span class="budget-amount">{{ b.amount | currency:'INR':'symbol-narrow' }}</span>
                        <button
                          mat-icon-button
                          matTooltip="Delete"
                          class="delete-btn"
                          (click)="confirmDelete(b)"
                          [disabled]="deletingId() === b.id">
                          @if (deletingId() === b.id) {
                            <mat-spinner diameter="18"></mat-spinner>
                          } @else {
                            <mat-icon>delete_outline</mat-icon>
                          }
                        </button>
                      </li>
                    }
                  </ul>
                </mat-card>

              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>account_balance_wallet</mat-icon>
            <p>No budgets yet</p>
            <a mat-flat-button color="primary" routerLink="/budgets/create">
              Create your first budget
            </a>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .budgets-page {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; color: #1e293b; }
    .page-subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.875rem; }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 10px !important;
      font-weight: 600 !important;
      text-decoration: none;
    }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

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

    /* Groups */
    .groups-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .group-section { display: flex; flex-direction: column; gap: 10px; }
    .group-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 0 4px;
    }
    .group-title {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .group-total {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .group-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
      overflow: hidden;
      padding: 0 !important;
    }

    .budget-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .budget-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
    }
    .budget-item:last-child { border-bottom: none; }
    .budget-item:hover { background: #f8fafc; }

    .budget-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .budget-icon mat-icon { font-size: 19px; width: 19px; height: 19px; color: #6366f1; }

    .budget-info { flex: 1; min-width: 0; }
    .budget-category {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .budget-amount {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.95rem;
      white-space: nowrap;
    }

    .delete-btn { color: #94a3b8; }
    .delete-btn:hover { color: #dc2626; }
  `],
})
export class BudgetListComponent implements OnInit {
  private budgetSvc = inject(BudgetService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  error = signal<string | null>(null);
  budgets = signal<Budget[]>([]);
  deletingId = signal<string | null>(null);

  groups = computed<BudgetGroup[]>(() => {
    const list = this.budgets();
    const map = new Map<string, BudgetGroup>();

    for (const b of list) {
      const key = `${b.year}-${b.month}`;
      if (!map.has(key)) {
        map.set(key, {
          year: b.year,
          month: b.month,
          label: `${MONTH_NAMES[b.month - 1]} ${b.year}`,
          budgets: [],
          totalAmount: 0,
        });
      }
      const group = map.get(key)!;
      group.budgets.push(b);
      group.totalAmount += b.amount;
    }

    // Sort groups newest first, then sort budgets within each group by category name
    return Array.from(map.values())
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .map(g => ({
        ...g,
        budgets: [...g.budgets].sort((a, b) => a.categoryName.localeCompare(b.categoryName)),
      }));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.budgetSvc.getAll().subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load budgets.');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(budget: Budget): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete budget?',
          message: `The ${budget.categoryName} budget for ${MONTH_NAMES[budget.month - 1]} ${budget.year} will be permanently removed.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      }
    );

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteBudget(budget);
      }
    });
  }

  private deleteBudget(budget: Budget): void {
    this.deletingId.set(budget.id);

    this.budgetSvc.delete(budget.id).subscribe({
      next: () => {
        this.budgets.update(list => list.filter(b => b.id !== budget.id));
        this.deletingId.set(null);
        this.snackBar.open('Budget deleted', 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        this.deletingId.set(null);
        this.snackBar.open(
          err?.error?.message ?? 'Failed to delete budget. Please try again.',
          'Dismiss',
          { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }
}