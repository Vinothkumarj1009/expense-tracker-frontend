// src/app/shared/components/confirm-dialog/confirm-dialog.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon" [class.danger]="data.danger">
        <mat-icon>{{ data.danger ? 'warning' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-button (click)="dialogRef.close(false)">
          {{ data.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          mat-flat-button
          [color]="data.danger ? 'warn' : 'primary'"
          (click)="dialogRef.close(true)">
          {{ data.confirmLabel ?? 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      text-align: center;
      padding: 8px 8px 0;
      min-width: 320px;
    }
    .confirm-icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
    }
    .confirm-icon mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #6366f1;
    }
    .confirm-icon.danger {
      background: #fef2f2;
    }
    .confirm-icon.danger mat-icon {
      color: #dc2626;
    }
    h2[mat-dialog-title] {
      font-size: 1.1rem;
      margin-bottom: 4px;
    }
    mat-dialog-content p {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }
    mat-dialog-actions {
      margin-top: 12px;
      padding-bottom: 4px;
    }
    @media (max-width: 480px) {
      .confirm-dialog { min-width: 0; }
    }
  `],
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}