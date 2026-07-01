// src/app/features/categories/categories.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { CategoryService } from '../../core/services/category.service';
import { Category, CategoryType } from '../../core/models/category.model';
import {
  CategoryFormDialogComponent,
  CategoryDialogData,
} from './category-form-dialog/category-form-dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  template: `
    <div class="categories-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Categories</h1>
          <p class="page-subtitle">Organize your income and expenses</p>
        </div>
        <button mat-flat-button color="primary" class="btn-primary" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          New Category
        </button>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          class="filter-chip"
          [class.active]="filter() === 'ALL'"
          (click)="filter.set('ALL')">
          All ({{ categories().length }})
        </button>
        <button
          class="filter-chip"
          [class.active]="filter() === 'EXPENSE'"
          (click)="filter.set('EXPENSE')">
          Expense ({{ expenseCount() }})
        </button>
        <button
          class="filter-chip"
          [class.active]="filter() === 'INCOME'"
          (click)="filter.set('INCOME')">
          Income ({{ incomeCount() }})
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading categories…</p>
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
          @if (filteredCategories().length) {
            <table mat-table [dataSource]="filteredCategories()" class="categories-table">

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let c">
                  <span class="cat-name">{{ c.name }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let c">
                  <span class="type-chip" [class.income]="c.type === 'INCOME'" [class.expense]="c.type === 'EXPENSE'">
                    <mat-icon>{{ c.type === 'INCOME' ? 'trending_up' : 'trending_down' }}</mat-icon>
                    {{ c.type === 'INCOME' ? 'Income' : 'Expense' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
                <td mat-cell *matCellDef="let c" class="actions-col">
                  <button mat-icon-button matTooltip="Edit" (click)="openEdit(c)" [disabled]="deletingId() === c.id">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Delete"
                    class="delete-btn"
                    (click)="confirmDelete(c)"
                    [disabled]="deletingId() === c.id">
                    @if (deletingId() === c.id) {
                      <mat-spinner diameter="18"></mat-spinner>
                    } @else {
                      <mat-icon>delete_outline</mat-icon>
                    }
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" class="cat-row"></tr>
            </table>
          } @else {
            <div class="empty-state">
              <mat-icon>category</mat-icon>
              <p>{{ filter() === 'ALL' ? 'No categories yet' : 'No ' + (filter() | lowercase) + ' categories' }}</p>
              <button mat-flat-button color="primary" (click)="openCreate()">
                Create your first category
              </button>
            </div>
          }
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .categories-page {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
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
    }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Filter chips */
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      padding: 6px 16px;
      border-radius: 99px;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #64748b;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-chip:hover { border-color: #c7d2fe; }
    .filter-chip.active {
      background: #6366f1;
      border-color: #6366f1;
      color: #fff;
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
    .categories-table { width: 100%; }

    .mat-mdc-header-cell {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mat-mdc-cell { padding: 14px 16px !important; }
    .cat-row:hover .mat-mdc-cell { background: #f8fafc; }

    .cat-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }

    .type-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .type-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .type-chip.income { background: #dcfce7; color: #16a34a; }
    .type-chip.expense { background: #fee2e2; color: #dc2626; }

    .actions-col { width: 110px; text-align: right; }
    .delete-btn { color: #94a3b8; }
    .delete-btn:hover { color: #dc2626; }
  `],
})
export class CategoriesComponent implements OnInit {
  private categorySvc = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly columns = ['name', 'type', 'actions'];

  loading = signal(true);
  error = signal<string | null>(null);
  categories = signal<Category[]>([]);
  filter = signal<'ALL' | CategoryType>('ALL');
  deletingId = signal<string | null>(null);

  filteredCategories = computed(() => {
    const f = this.filter();
    const list = this.categories();
    return f === 'ALL' ? list : list.filter(c => c.type === f);
  });

  expenseCount = computed(() => this.categories().filter(c => c.type === 'EXPENSE').length);
  incomeCount = computed(() => this.categories().filter(c => c.type === 'INCOME').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categorySvc.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load categories.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open<CategoryFormDialogComponent, CategoryDialogData, Category | null>(
      CategoryFormDialogComponent,
      { data: { mode: 'create' }, width: '420px' }
    );

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.categories.update(list => [...list, result]);
        this.snackBar.open('Category created', 'Dismiss', { duration: 3000 });
      }
    });
  }

  openEdit(category: Category): void {
    const ref = this.dialog.open<CategoryFormDialogComponent, CategoryDialogData, Category | null>(
      CategoryFormDialogComponent,
      { data: { mode: 'edit', category }, width: '420px' }
    );

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.categories.update(list =>
          list.map(c => (c.id === result.id ? result : c))
        );
        this.snackBar.open('Category updated', 'Dismiss', { duration: 3000 });
      }
    });
  }

  confirmDelete(category: Category): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete category?',
          message: `"${category.name}" will be permanently removed. This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      }
    );

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteCategory(category);
      }
    });
  }

  private deleteCategory(category: Category): void {
    this.deletingId.set(category.id);

    this.categorySvc.delete(category.id).subscribe({
      next: () => {
        this.categories.update(list => list.filter(c => c.id !== category.id));
        this.deletingId.set(null);
        this.snackBar.open('Category deleted', 'Dismiss', { duration: 3000 });
      },
      error: (err) => {
        this.deletingId.set(null);

        if (err?.status === 409) {
          this.snackBar.open(
            `"${category.name}" can't be deleted — it has expenses linked to it.`,
            'Dismiss',
            { duration: 5000, panelClass: 'snack-error' }
          );
        } else {
          this.snackBar.open(
            err?.error?.message ?? 'Failed to delete category. Please try again.',
            'Dismiss',
            { duration: 4000, panelClass: 'snack-error' }
          );
        }
      },
    });
  }
}