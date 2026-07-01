// src/app/features/expenses/expense-list/expense-list.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { Expense, Page } from '../../../core/models/expense.model';
import { Category } from '../../../core/models/category.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="expenses-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Expenses</h1>
          <p class="page-subtitle">{{ page()?.totalElements ?? 0 }} total expenses</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/expenses/create" class="btn-primary">
          <mat-icon>add</mat-icon>
          Add Expense
        </a>
      </div>

      <!-- Search + Filter toolbar -->
      <div class="toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            placeholder="Search this page by title…"
            [(ngModel)]="searchTerm"
            (ngModelChange)="searchTerm.set($event)">
          @if (searchTerm()) {
            <button matSuffix mat-icon-button (click)="searchTerm.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="category-field">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="categoryFilter.set($event)">
            <mat-option value="">All categories</mat-option>
            @for (cat of categories(); track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <span class="filter-hint">
          <mat-icon matTooltip="Search and filter apply to the current page only">info_outline</mat-icon>
        </span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading expenses…</p>
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

      <!-- Table -->
      @if (!loading() && !error()) {
        <mat-card class="table-card">
          @if (filteredExpenses().length) {
            <table mat-table [dataSource]="filteredExpenses()" class="expenses-table">

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let e">
                  <div class="exp-title">{{ e.title }}</div>
                  @if (e.description) {
                    <div class="exp-desc">{{ e.description }}</div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
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

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let e">
                  {{ e.createdAt | date:'MMM d, y' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
                <td mat-cell *matCellDef="let e" class="actions-col">
                  <button
                    mat-icon-button
                    matTooltip="Edit"
                    [routerLink]="['/expenses/edit', e.id]"
                    [disabled]="deletingId() === e.id">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Delete"
                    class="delete-btn"
                    (click)="confirmDelete(e)"
                    [disabled]="deletingId() === e.id">
                    @if (deletingId() === e.id) {
                      <mat-spinner diameter="18"></mat-spinner>
                    } @else {
                      <mat-icon>delete_outline</mat-icon>
                    }
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" class="exp-row"></tr>
            </table>

            <mat-paginator
              [length]="page()?.totalElements ?? 0"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[10, 25, 50]"
              [pageIndex]="pageIndex()"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>

          } @else {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              @if (searchTerm() || categoryFilter()) {
                <p>No expenses match your search on this page</p>
                <button mat-button (click)="clearFilters()">Clear filters</button>
              } @else {
                <p>No expenses yet</p>
                <a mat-flat-button color="primary" routerLink="/expenses/create">
                  Add your first expense
                </a>
              }
            </div>
          }
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .expenses-page {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
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

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 220px; }
    .category-field { width: 220px; }
    mat-form-field { font-size: 0.875rem; }
    .filter-hint {
      color: #94a3b8;
      display: flex;
      align-items: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; cursor: help; }
    }

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

    /* Table card */
    .table-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
      overflow: hidden;
    }
    .expenses-table { width: 100%; }

    .mat-mdc-header-cell {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mat-mdc-cell { padding: 14px 16px !important; }
    .exp-row:hover .mat-mdc-cell { background: #f8fafc; }

    .exp-title { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .exp-desc {
      font-size: 0.78rem;
      color: #94a3b8;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }

    .category-chip {
      background: #ede9fe;
      color: #6d28d9;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .amount-cell { font-weight: 700; color: #1e293b; }

    .actions-col { width: 110px; text-align: right; }
    .delete-btn { color: #94a3b8; }
    .delete-btn:hover { color: #dc2626; }
  `],
})
export class ExpenseListComponent implements OnInit {
  private expenseSvc = inject(ExpenseService);
  private categorySvc = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly columns = ['title', 'category', 'amount', 'date', 'actions'];

  loading = signal(true);
  error = signal<string | null>(null);
  page = signal<Page<Expense> | null>(null);
  categories = signal<Category[]>([]);
  deletingId = signal<string | null>(null);

  pageIndex = signal(0);
  pageSize = signal(10);

  searchTerm = signal('');
  categoryFilter = signal('');

  filteredExpenses = computed(() => {
    const content = this.page()?.content ?? [];
    const term = this.searchTerm().trim().toLowerCase();
    const catId = this.categoryFilter();

    return content.filter(e => {
      const matchesSearch = !term || e.title.toLowerCase().includes(term);
      const matchesCategory = !catId || e.categoryId === catId;
      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.categorySvc.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}, // non-critical — filter dropdown just stays empty
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.expenseSvc.getPage(this.pageIndex(), this.pageSize()).subscribe({
      next: (data) => {
        this.page.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load expenses.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.searchTerm.set('');     // reset client-side filters on page change
    this.categoryFilter.set('');
    this.load();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
  }

  confirmDelete(expense: Expense): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete expense?',
          message: `"${expense.title}" will be permanently removed. This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      }
    );

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteExpense(expense);
      }
    });
  }

  private deleteExpense(expense: Expense): void {
    this.deletingId.set(expense.id);

    this.expenseSvc.delete(expense.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.snackBar.open('Expense deleted', 'Dismiss', { duration: 3000 });

        // If this was the last item on the page (and not page 0), step back a page
        const current = this.page();
        if (current && current.numberOfElements === 1 && this.pageIndex() > 0) {
          this.pageIndex.set(this.pageIndex() - 1);
        }
        this.load();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.snackBar.open(
          err?.error?.message ?? 'Failed to delete expense. Please try again.',
          'Dismiss',
          { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }
}