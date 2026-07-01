import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY  = 'user';

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }

    return token;
  }

  setToken(token: string): void {
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem(this.TOKEN_KEY);
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  setUser(user: object | null): void {
    if (!user) {
      localStorage.removeItem(this.USER_KEY);
      return;
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);

    if (!user || user === 'undefined') {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }
}
