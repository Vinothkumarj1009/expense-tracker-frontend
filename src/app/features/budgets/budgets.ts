import { Component } from '@angular/core';

@Component({
  selector: 'app-budgets',
  standalone: true,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Budgets</h1>
        <p class="page-sub">This module will be built in a future phase.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #e2e8f0; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
    .page-sub { color: #64748b; margin: 0; font-size: 0.9rem; }
  `]
})
export class BudgetsComponent {}
