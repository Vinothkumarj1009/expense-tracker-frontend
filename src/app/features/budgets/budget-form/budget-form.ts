// src/app/features/budgets/budget-form/budget-form.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { BudgetService } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { Budget } from '../../../core/models/budget.model';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' },   { value: 4, label: 'April' },
  { value: 5, label: 'May' },     { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

@Component({
  selector: 'app-budget-form',
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
        <button mat-icon-button routerLink="/budgets" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="page-title">New Budget</h1>
          <p class="page-subtitle">Set a spending limit for a category and month</p>
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
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
              @if (form.get('categoryId')?.hasError('required') && form.get('categoryId')?.touched) {
                <mat-error>Category is required</mat-error>
              }
              @if (!categories().length) {
                <mat-hint>No categories yet — create one first</mat-hint>
              }
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Month</mat-label>
                <mat-select formControlName="month">
                  @for (m of months; track m.value) {
                    <mat-option [value]="m.value">{{ m.label }}</mat-option>
                  }
                </mat-select>
                @if (form.get('month')?.hasError('required') && form.get('month')?.touched) {
                  <mat-error>Month is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Year</mat-label>
                <mat-select formControlName="year">
                  @for (y of years; track y) {
                    <mat-option [value]="y">{{ y }}</mat-option>
                  }
                </mat-select>
                @if (form.get('year')?.hasError('required') && form.get('year')?.touched) {
                  <mat-error>Year is required</mat-error>
                }
              </mat-form-field>
            </div>

            @if (form.hasError('duplicate') && (form.get('categoryId')?.touched || form.get('month')?.touched)) {
              <div class="duplicate-warning">
                <mat-icon>warning</mat-icon>
                <span>A budget already exists for this category and month. Delete it first, or pick a different combination.</span>
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
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

            <div class="form-actions">
              <button mat-button type="button" routerLink="/budgets" [disabled]="submitting()">
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
                  Create Budget
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
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header { display: flex; align-items: center; gap: 8px; }
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

    .duplicate-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      color: #b45309;
      font-size: 0.8rem;
      margin: -8px 0 16px;
      line-height: 1.4;
    }
    .duplicate-warning mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .full-width { width: 100%; }
    .form-row { display: flex; gap: 16px; }
    .half-width { flex: 1; min-width: 0; }
    @media (max-width: 480px) {
      .form-row { flex-direction: column; gap: 0; }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .btn-spinner { display: inline-block; }
  `],
})
export class BudgetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private budgetSvc = inject(BudgetService);
  private categorySvc = inject(CategoryService);

  readonly months = MONTHS;
  readonly years: number[] = (() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - 1 + i); // last year .. +4
  })();

  loadingInitial = signal(true);
  submitting = signal(false);
  serverError = signal<string | null>(null);
  categories = signal<Category[]>([]);
  existingBudgets = signal<Budget[]>([]);

  form = this.fb.group(
    {
      categoryId: ['', [Validators.required]],
      month: [new Date().getMonth() + 1, [Validators.required]],
      year: [new Date().getFullYear(), [Validators.required]],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    },
    { validators: [this.duplicateComboValidator.bind(this)] }
  );

  private duplicateComboValidator(group: AbstractControl): ValidationErrors | null {
    const categoryId = group.get('categoryId')?.value;
    const month = group.get('month')?.value;
    const year = group.get('year')?.value;

    if (!categoryId || !month || !year) return null;

    const exists = this.existingBudgets().some(
      b => b.categoryId === categoryId && b.month === month && b.year === year
    );

    return exists ? { duplicate: true } : null;
  }

  ngOnInit(): void {
    forkJoin({
      categories: this.categorySvc.getAll(),
      budgets: this.budgetSvc.getAll(),
    }).subscribe({
      next: ({ categories, budgets }) => {
        this.categories.set(categories);
        this.existingBudgets.set(budgets);
        this.loadingInitial.set(false);
        // Re-run duplicate check once initial defaults are in place
        this.form.updateValueAndValidity();
      },
      error: (err) => {
        this.serverError.set(err?.error?.message ?? 'Failed to load form data.');
        this.loadingInitial.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const payload = {
      categoryId: this.form.value.categoryId!,
      month: this.form.value.month!,
      year: this.form.value.year!,
      amount: this.form.value.amount!,
    };

    this.budgetSvc.create(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/budgets']);
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