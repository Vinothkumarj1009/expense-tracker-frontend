import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRequest, AuthResponse, RegisterRequest, User } from '../models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http         = inject(HttpClient);
  private router       = inject(Router);
  private tokenService = inject(TokenService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(this.tokenService.getUser());

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        this.tokenService.setToken(res.token);
        this.tokenService.setUser(res.user);
        this.currentUser.set(res.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(res => {
        this.tokenService.setToken(res.token);
        this.tokenService.setUser(res.user);
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }
}
