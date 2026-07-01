// src/app/features/categories/category-form-dialog/category-form-dialog.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryType } from '../../../core/models/category.model';

export interface CategoryDialogData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'New Category' : 'Edit Category' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>

        @if (serverError()) {
          <div class="form-error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ serverError() }}</span>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Groceries" autofocus>
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
          @if (form.get('name')?.hasError('maxlength')) {
            <mat-error>Name is too long</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="EXPENSE">Expense</mat-option>
            <mat-option value="INCOME">Income</mat-option>
          </mat-select>
          @if (form.get('type')?.hasError('required') && form.get('type')?.touched) {
            <mat-error>Type is required</mat-error>
          }
        </mat-form-field>

      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancel()" [disabled]="submitting()">
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
            {{ data.mode === 'create' ? 'Create' : 'Save' }}
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 360px; padding-top: 8px !important; }

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
      margin-bottom: 16px;
    }
    .form-error mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    .btn-spinner { display: inline-block; }

    @media (max-width: 480px) {
      mat-dialog-content { min-width: 0; }
    }
  `],
})
export class CategoryFormDialogComponent {
  private fb = inject(FormBuilder);
  private categorySvc = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  data: CategoryDialogData = inject(MAT_DIALOG_DATA);

  submitting = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.group({
    name: [
      this.data.category?.name ?? '',
      [Validators.required, Validators.maxLength(50)],
    ],
    type: [
      (this.data.category?.type ?? 'EXPENSE') as CategoryType,
      [Validators.required],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const payload = {
      name: this.form.value.name!.trim(),
      type: this.form.value.type!,
    };

    const request$ = this.data.mode === 'create'
      ? this.categorySvc.create(payload)
      : this.categorySvc.update(this.data.category!.id, payload);

    request$.subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(
          err?.error?.message ?? 'Something went wrong. Please try again.'
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}