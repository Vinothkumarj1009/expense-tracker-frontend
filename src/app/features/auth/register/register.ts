import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <div class="register-card">
        <div class="card-header">
          <h2>Create account</h2>
          <p>Start tracking your expenses today</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="name-row">
            <mat-form-field appearance="outline" class="name-field">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" placeholder="John" autocomplete="given-name" />
              <mat-icon matPrefix>person_outline</mat-icon>
              @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
                <mat-error>First name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="name-field">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" placeholder="Doe" autocomplete="family-name" />
              <mat-icon matPrefix>person_outline</mat-icon>
              @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
                <mat-error>Last name is required</mat-error>
              }
            </mat-form-field>
          </div>

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
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <mat-error>Password must be at least 6 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
            @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <button
            mat-flat-button
            type="submit"
            class="submit-btn"
            [disabled]="loading() || form.invalid">
            @if (loading()) {
              <mat-spinner diameter="20" />
              <span>Creating account…</span>
            } @else {
              <span>Create Account</span>
            }
          </button>
        </form>

        <p class="footer-link">
          Already have an account?
          <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      width: 100%;
      max-width: 420px;
    }

    .register-card {
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

    .name-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .name-field {
      flex: 1;
      min-width: 0;
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

    @media (max-width: 480px) {
      .name-row {
        flex-direction: column;
        gap: 0;
      }
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
export class RegisterComponent {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  loading      = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    const { firstName, lastName, email, password } = this.form.value;
    this.authService.register({ firstName: firstName!, lastName: lastName!, email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
      }
    });
  }
}
