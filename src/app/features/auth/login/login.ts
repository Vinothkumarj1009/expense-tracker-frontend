import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="card-header">
          <h2>Welcome back</h2>
          <p>Sign in to your account</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            <mat-icon matPrefix>mail_outline</mat-icon>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <mat-error>Enter a valid email address</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
          </mat-form-field>

          <button
            mat-flat-button
            type="submit"
            class="submit-btn"
            [disabled]="loading() || form.invalid">
            @if (loading()) {
              <mat-spinner diameter="20" />
              <span>Signing in…</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <p class="footer-link">
          Don't have an account?
          <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      width: 100%;
      max-width: 420px;
    }

    .login-card {
      background: #1a1d2e;
      border: 1px solid #1e2235;
      border-radius: 16px;
      padding: 2.5rem;
    }

    .card-header {
      margin-bottom: 2rem;
      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      p {
        color: #64748b;
        margin: 0;
        font-size: 0.9rem;
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .full-width { width: 100%; margin-bottom: 0.5rem; }

    .submit-btn {
      width: 100%;
      margin-top: 1rem;
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      background: #6366f1 !important;
      color: #fff !important;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      &:disabled { opacity: 0.6; }
    }

    .footer-link {
      text-align: center;
      margin: 1.5rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
      a { color: #818cf8; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
    }

    ::ng-deep {
      .mat-mdc-form-field-subscript-wrapper { margin-bottom: 4px; }
      .mdc-text-field--outlined .mdc-notched-outline__leading,
      .mdc-text-field--outlined .mdc-notched-outline__notch,
      .mdc-text-field--outlined .mdc-notched-outline__trailing {
        border-color: #1e2235 !important;
      }
      .mdc-text-field--focused .mdc-notched-outline__leading,
      .mdc-text-field--focused .mdc-notched-outline__notch,
      .mdc-text-field--focused .mdc-notched-outline__trailing {
        border-color: #6366f1 !important;
      }
      .mat-mdc-input-element { color: #e2e8f0 !important; }
      .mat-mdc-form-field-label { color: #64748b !important; }
    }
  `]
})
export class LoginComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  loading      = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Login failed. Please check your credentials.');
      }
    });
  }
}
