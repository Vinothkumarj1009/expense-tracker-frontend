// src/app/features/expenses/expense-form/expense-form.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="form-page">

      <div class="page-header">
        <button mat-icon-button routerLink="/expenses" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="page-title">{{ isEdit() ? 'Edit Expense' : 'New Expense' }}</h1>
          <p class="page-subtitle">
            {{ isEdit() ? 'Update the details below' : 'Track a new expense' }}
          </p>
        </div>
      </div>

      @if (loadingInitial()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading…</p>
        </div>
      } @else {

        <mat-card class="form-card">
          <form [formGroup]="form" (ngSubmit)="submit()">

            @if (serverError()) {
              <div class="form-error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ serverError() }}</span>
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Grocery run">
              @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
                <mat-error>Title is required</mat-error>
              }
              @if (form.get('title')?.hasError('maxlength')) {
                <mat-error>Title is too long</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="3"
                placeholder="Optional notes about this expense">
              </textarea>
              @if (form.get('description')?.hasError('maxlength')) {
                <mat-error>Description is too long</mat-error>
              }
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Amount</mat-label>
                <span matTextPrefix>$&nbsp;</span>
                <input
                  matInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  formControlName="amount"
                  placeholder="0.00">
                @if (form.get('amount')?.hasError('required') && form.get('amount')?.touched) {
                  <mat-error>Amount is required</mat-error>
                }
                @if (form.get('amount')?.hasError('min')) {
                  <mat-error>Amount must be greater than 0</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId">
                  @for (cat of categories(); track cat.id) {
                    <mat-option [value]="cat.id">
                      {{ cat.name }}
                      <span class="cat-type-hint">({{ cat.type | lowercase }})</span>
                    </mat-option>
                  }
                </mat-select>
                @if (form.get('categoryId')?.hasError('required') && form.get('categoryId')?.touched) {
                  <mat-error>Category is required</mat-error>
                }
                @if (!categories().length) {
                  <mat-hint>No categories yet — create one first</mat-hint>
                }
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/expenses" [disabled]="submitting()">
                Cancel
              </button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="form.invalid || submitting()">
                @if (submitting()) {
                  <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                } @else {
                  {{ isEdit() ? 'Save Changes' : 'Create Expense' }}
                }
              </button>
            </div>

          </form>
        </mat-card>

      }
    </div>
  `,
  styles: [`
    .form-page {
      padding: 24px;
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .back-btn { color: #64748b; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: #1e293b; }
    .page-subtitle { margin: 2px 0 0; color: #64748b; font-size: 0.875rem; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px 0;
      color: #64748b;
    }

    .form-card {
      border-radius: 14px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04) !important;
      padding: 28px !important;
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.825rem;
      margin-bottom: 18px;
    }
    .form-error mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    .full-width { width: 100%; }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .half-width { flex: 1; min-width: 0; }
    @media (max-width: 480px) {
      .form-row { flex-direction: column; gap: 0; }
    }

    .cat-type-hint { color: #94a3b8; font-size: 0.8em; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .btn-spinner { display: inline-block; }
  `],
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expenseSvc = inject(ExpenseService);
  private categorySvc = inject(CategoryService);

  private expenseId: string | null = null;

  isEdit = signal(false);
  loadingInitial = signal(true);
  submitting = signal(false);
  serverError = signal<string | null>(null);
  categories = signal<Category[]>([]);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    categoryId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.expenseId = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!this.expenseId);

    const categories$ = this.categorySvc.getAll();

    if (this.isEdit()) {
      const expense$ = this.expenseSvc.getById(this.expenseId!);
      forkJoin({ categories: categories$, expense: expense$ }).subscribe({
        next: ({ categories, expense }) => {
          this.categories.set(categories);
          this.form.patchValue({
            title: expense.title,
            description: expense.description,
            amount: expense.amount,
            categoryId: expense.categoryId,
          });
          this.loadingInitial.set(false);
        },
        error: (err) => {
          this.serverError.set(err?.error?.message ?? 'Failed to load expense.');
          this.loadingInitial.set(false);
        },
      });
    } else {
      categories$.subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.loadingInitial.set(false);
        },
        error: (err) => {
          this.serverError.set(err?.error?.message ?? 'Failed to load categories.');
          this.loadingInitial.set(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const payload = {
      title: this.form.value.title!.trim(),
      description: this.form.value.description?.trim() ?? '',
      amount: this.form.value.amount!,
      categoryId: this.form.value.categoryId!,
    };

    const request$ = this.isEdit()
      ? this.expenseSvc.update(this.expenseId!, payload)
      : this.expenseSvc.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/expenses']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(
          err?.error?.message ?? 'Something went wrong. Please try again.'
        );
      },
    });
  }
}