import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-brand">
        <div class="brand-logo">
          <span class="brand-icon">💰</span>
          <h1 class="brand-name">ExpenseTracker</h1>
        </div>
        <p class="brand-tagline">Take control of your finances</p>
      </div>
      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #0f1117;
    }

    .auth-brand {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 4rem;
      background: linear-gradient(135deg, #1a1d2e 0%, #0f1117 100%);
      border-right: 1px solid #1e2235;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .brand-icon {
      font-size: 2.5rem;
    }

    .brand-name {
      font-size: 2rem;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .brand-tagline {
      font-size: 1.125rem;
      color: #64748b;
      margin: 0;
    }

    .auth-content {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #0f1117;
    }

    @media (max-width: 768px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `]
})
export class AuthLayoutComponent {}
