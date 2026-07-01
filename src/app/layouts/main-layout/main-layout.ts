import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">

      <!-- ─── Sidebar ─────────────────────────────────────────── -->
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="sidenav">

        <div class="sidenav-inner">
          <!-- Brand -->
          <div class="brand">
            <span class="brand-icon">💰</span>
            <span class="brand-name">ExpenseTracker</span>
          </div>

          <!-- Nav groups -->
          <nav class="nav">
            @for (group of navGroups; track group.title) {
              <div class="nav-group">
                <span class="nav-group-label">{{ group.title }}</span>
                @for (item of group.items; track item.route) {
                  <a
                    class="nav-item"
                    [routerLink]="item.route"
                    routerLinkActive="nav-item--active"
                    [routerLinkActiveOptions]="{ exact: !!item.exact }"
                    (click)="isMobile() && sidenav.close()">
                    <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                    <span class="nav-label">{{ item.label }}</span>
                  </a>
                }
              </div>
            }
          </nav>

          <!-- User footer -->
          <div class="sidenav-footer">
            <mat-divider class="footer-divider" />
            <div class="user-row" [matMenuTriggerFor]="userMenu">
              <div class="user-avatar">{{ userInitial() }}</div>
              <div class="user-info">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-email">{{ userEmail() }}</span>
              </div>
              <mat-icon class="chevron">expand_more</mat-icon>
            </div>
            <mat-menu #userMenu="matMenu" class="user-menu">
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                Sign out
              </button>
            </mat-menu>
          </div>
        </div>
      </mat-sidenav>

      <!-- ─── Main content ────────────────────────────────────── -->
      <mat-sidenav-content class="main-content">
        <!-- Top toolbar (mobile only) -->
        @if (isMobile()) {
          <mat-toolbar class="mobile-toolbar">
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="toolbar-title">ExpenseTracker</span>
          </mat-toolbar>
        }

        <div class="page-wrapper">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    /* ── Layout shell ── */
    .sidenav-container {
      height: 100vh;
      background: #0f1117;
    }

    /* ── Sidebar ── */
    .sidenav {
      width: 240px;
      background: #13162b;
      border-right: 1px solid #1e2235 !important;
    }

    .sidenav-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 1.25rem 1rem;
      border-bottom: 1px solid #1e2235;
    }
    .brand-icon { font-size: 1.5rem; }
    .brand-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: -0.01em;
    }

    /* Nav */
    .nav {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .nav-group { display: flex; flex-direction: column; gap: 2px; }

    .nav-group-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
      padding: 0 0.5rem;
      margin-bottom: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
      cursor: pointer;

      &:hover {
        background: rgba(99, 102, 241, 0.08);
        color: #c7d2fe;
      }

      &.nav-item--active {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        .nav-icon { color: #818cf8; }
      }
    }

    .nav-icon {
      font-size: 1.15rem;
      width: 1.15rem;
      height: 1.15rem;
      color: #475569;
      transition: color 0.15s;
    }

    /* Footer */
    .sidenav-footer { padding: 0.75rem; }
    .footer-divider { border-color: #1e2235 !important; margin-bottom: 0.75rem; }

    .user-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: rgba(99,102,241,0.08); }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-email {
      font-size: 0.7rem;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chevron { font-size: 1rem; width: 1rem; color: #475569; }

    /* ── Main content ── */
    .main-content { background: #0f1117; }

    .mobile-toolbar {
      background: #13162b !important;
      border-bottom: 1px solid #1e2235;
      color: #e2e8f0;
    }
    .toolbar-title { font-weight: 600; margin-left: 0.5rem; }

    .page-wrapper {
      padding: 2rem;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 768px) {
      .page-wrapper { padding: 1rem; }
    }

    /* Material overrides */
    ::ng-deep .mat-drawer-inner-container { overflow: hidden !important; }
  `]
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private bp          = inject(BreakpointObserver);

  isMobile = toSignal(
    this.bp.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  userName    = computed(() => this.authService.currentUser()?.name  ?? 'User');
  userEmail   = computed(() => this.authService.currentUser()?.email ?? '');
  userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard',   icon: 'dashboard',        route: '/dashboard',  exact: true }
      ]
    },
    {
      title: 'Finance',
      items: [
        { label: 'Expenses',    icon: 'receipt_long',     route: '/expenses'   },
        { label: 'Categories',  icon: 'label_outline',    route: '/categories' },
        { label: 'Budgets',     icon: 'account_balance_wallet', route: '/budgets' }
      ]
    },
    {
      title: 'Insights',
      items: [
        { label: 'Reports',     icon: 'bar_chart',        route: '/reports'    },
        { label: 'Analytics',   icon: 'insights',         route: '/analytics'  }
      ]
    }
  ];

  logout(): void {
    this.authService.logout();
  }
}
