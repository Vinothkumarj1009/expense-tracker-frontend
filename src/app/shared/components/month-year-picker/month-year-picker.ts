// src/app/shared/components/month-year-picker/month-year-picker.ts

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-month-year-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="picker">
      <button mat-icon-button (click)="shiftMonth(-1)" matTooltip="Previous month">
        <mat-icon>chevron_left</mat-icon>
      </button>

      <mat-form-field appearance="outline" class="month-field">
        <mat-select [ngModel]="month()" (ngModelChange)="onMonthChange($event)">
          @for (m of months; track m.value) {
            <mat-option [value]="m.value">{{ m.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="year-field">
        <mat-select [ngModel]="year()" (ngModelChange)="onYearChange($event)">
          @for (y of years; track y) {
            <mat-option [value]="y">{{ y }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-icon-button (click)="shiftMonth(1)" matTooltip="Next month">
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .picker {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .month-field { width: 150px; }
    .year-field { width: 100px; }
    mat-form-field {
      font-size: 0.875rem;
    }
    ::ng-deep .picker .mat-mdc-text-field-wrapper {
      padding-bottom: 0 !important;
    }
  `],
})
export class MonthYearPickerComponent {
  month = input.required<number>();
  year = input.required<number>();

  monthChange = output<number>();
  yearChange = output<number>();

  readonly months = MONTH_NAMES.map((label, i) => ({ value: i + 1, label }));
  readonly years: number[] = (() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - 4 + i); // -4 .. +1
  })();

  onMonthChange(value: number): void {
    this.monthChange.emit(value);
  }

  onYearChange(value: number): void {
    this.yearChange.emit(value);
  }

  shiftMonth(delta: number): void {
    let m = this.month() + delta;
    let y = this.year();
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    this.monthChange.emit(m);
    this.yearChange.emit(y);
  }
}